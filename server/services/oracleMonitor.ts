import oracledb from 'oracledb';
import { Database, Threshold } from '@shared/schema';
import { storage } from '../storage';
import { emailService } from './emailService';
import { itsdService } from './itsdService';

interface OracleMetrics {
  cpu: number;
  memory: number;
  connections: {
    active: number;
    max: number;
  };
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  responseTime: number;
  tablespaceUsage?: Record<string, {
    total: number;
    used: number;
    percentUsed: number;
  }>;
}

export class OracleMonitor {
  async checkDatabase(database: Database): Promise<OracleMetrics | null> {
    let connection: oracledb.Connection | null = null;
    const startTime = Date.now();
    
    try {
      // Set up connection
      const connectionConfig: oracledb.ConnectionAttributes = {
        user: database.username,
        password: database.password,
        connectString: `${database.host}:${database.port}/${database.sid || ''}`
      };
      
      // Connect to the database
      connection = await oracledb.getConnection(connectionConfig);
      const responseTime = Date.now() - startTime;
      
      // Get CPU usage
      const cpuResult = await connection.execute(
        `SELECT value FROM v$sysmetric WHERE metric_name = 'CPU Usage Per Sec' AND group_id = 2`
      );
      const cpu = cpuResult.rows && cpuResult.rows.length > 0 ? Number(cpuResult.rows[0][0]) : 0;
      
      // Get memory usage
      const memoryResult = await connection.execute(
        `SELECT round((total_pga_allocated/(1024*1024*1024)),2) FROM v$pgastat WHERE name = 'total PGA allocated'`
      );
      const memory = memoryResult.rows && memoryResult.rows.length > 0 ? Number(memoryResult.rows[0][0]) : 0;
      
      // Get connection info
      const connectionsResult = await connection.execute(
        `SELECT count(*) FROM v$session WHERE type = 'USER'`
      );
      const maxConnectionsResult = await connection.execute(
        `SELECT value FROM v$parameter WHERE name = 'processes'`
      );
      
      const active = connectionsResult.rows && connectionsResult.rows.length > 0 ? Number(connectionsResult.rows[0][0]) : 0;
      const max = maxConnectionsResult.rows && maxConnectionsResult.rows.length > 0 ? Number(maxConnectionsResult.rows[0][0]) : 0;
      
      // Get tablespace usage
      const tablespaceResult = await connection.execute(
        `SELECT 
          df.tablespace_name,
          df.bytes / (1024 * 1024) total_mb,
          (df.bytes - fs.bytes) / (1024 * 1024) used_mb,
          ROUND(((df.bytes - fs.bytes) / df.bytes) * 100, 2) percent_used
        FROM 
          (SELECT tablespace_name, SUM(bytes) bytes FROM dba_data_files GROUP BY tablespace_name) df,
          (SELECT tablespace_name, SUM(bytes) bytes FROM dba_free_space GROUP BY tablespace_name) fs
        WHERE 
          df.tablespace_name = fs.tablespace_name`
      );
      
      const tablespaceUsage: Record<string, { total: number; used: number; percentUsed: number; }> = {};
      
      if (tablespaceResult.rows) {
        for (const row of tablespaceResult.rows) {
          const name = String(row[0]);
          const total = Number(row[1]);
          const used = Number(row[2]);
          const percentUsed = Number(row[3]);
          
          tablespaceUsage[name] = { total, used, percentUsed };
        }
      }
      
      // Calculate overall status based on thresholds
      const metrics: OracleMetrics = {
        cpu,
        memory,
        connections: { active, max },
        status: 'healthy',
        responseTime,
        tablespaceUsage
      };
      
      // Check status based on thresholds
      const databaseThresholds = await storage.getThresholdsForDatabase(database.id);
      let groupThresholds: Threshold[] = [];
      
      if (database.groupId) {
        groupThresholds = await storage.getThresholdsForGroup(database.groupId);
      }
      
      // Combine database-specific and group thresholds
      const allThresholds = [...databaseThresholds, ...groupThresholds];
      
      // Process the metrics against thresholds
      await this.processThresholds(database, metrics, allThresholds);
      
      return metrics;
    } catch (error) {
      console.error(`Error monitoring database ${database.name}:`, error);
      
      // Create critical alert for connection failure
      const alert = await storage.createAlert({
        databaseId: database.id,
        metricName: 'connection',
        metricValue: 0,
        severity: 'critical',
        message: `Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`
      });
      
      // Update database status
      await storage.updateDatabaseStatus(database.id, 'critical');
      
      // Send email alert
      await emailService.sendAlertEmail(alert, database);
      
      // Create ITSD ticket for critical alert
      if (await itsdService.isConfigured()) {
        const ticketId = await itsdService.createTicketForAlert(alert, database);
        if (ticketId) {
          await storage.updateAlertTicket(alert.id, ticketId);
        }
      }
      
      return null;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error('Error closing Oracle connection:', err);
        }
      }
    }
  }
  
  private async processThresholds(database: Database, metrics: OracleMetrics, thresholds: Threshold[]): Promise<void> {
    let criticalFound = false;
    let warningFound = false;
    
    for (const threshold of thresholds) {
      let currentValue: number | undefined;
      let message = '';
      
      // Get current value based on metric name
      switch (threshold.metricName) {
        case 'cpu':
          currentValue = metrics.cpu;
          message = `CPU usage at ${currentValue}%`;
          break;
        case 'memory':
          currentValue = metrics.memory;
          message = `Memory usage at ${currentValue} GB`;
          break;
        case 'connections':
          currentValue = metrics.connections.active / metrics.connections.max * 100;
          message = `${metrics.connections.active} active connections out of ${metrics.connections.max} (${currentValue.toFixed(1)}%)`;
          break;
        case 'response_time':
          currentValue = metrics.responseTime;
          message = `Database response time: ${currentValue}ms`;
          break;
        default:
          // Check if it's a tablespace metric
          if (threshold.metricName.startsWith('tablespace_') && metrics.tablespaceUsage) {
            const tablespaceName = threshold.metricName.substring('tablespace_'.length);
            if (metrics.tablespaceUsage[tablespaceName]) {
              currentValue = metrics.tablespaceUsage[tablespaceName].percentUsed;
              message = `Tablespace ${tablespaceName} usage at ${currentValue}%`;
            }
          }
      }
      
      if (currentValue === undefined) continue;
      
      // Check if we exceed critical threshold
      if (threshold.criticalThreshold !== null && currentValue >= threshold.criticalThreshold) {
        criticalFound = true;
        
        // Create critical alert
        const alert = await storage.createAlert({
          databaseId: database.id,
          metricName: threshold.metricName,
          metricValue: currentValue,
          thresholdId: threshold.id,
          severity: 'critical',
          message: `${message} exceeds critical threshold (${threshold.criticalThreshold})`
        });
        
        // Send email alert
        await emailService.sendAlertEmail(alert, database);
        
        // Create ITSD ticket for critical alert
        if (await itsdService.isConfigured()) {
          const ticketId = await itsdService.createTicketForAlert(alert, database);
          if (ticketId) {
            await storage.updateAlertTicket(alert.id, ticketId);
          }
        }
      }
      // Check if we exceed warning threshold
      else if (threshold.warningThreshold !== null && currentValue >= threshold.warningThreshold) {
        warningFound = true;
        
        // Create warning alert
        const alert = await storage.createAlert({
          databaseId: database.id,
          metricName: threshold.metricName,
          metricValue: currentValue,
          thresholdId: threshold.id,
          severity: 'warning',
          message: `${message} exceeds warning threshold (${threshold.warningThreshold})`
        });
        
        // Send email alert
        await emailService.sendAlertEmail(alert, database);
      }
    }
    
    // Update database status based on threshold checks
    let status = 'healthy';
    if (criticalFound) {
      status = 'critical';
    } else if (warningFound) {
      status = 'warning';
    }
    
    metrics.status = status as any;
    await storage.updateDatabaseStatus(database.id, status, metrics.responseTime);
  }
  
  async monitorAllDatabases(): Promise<void> {
    const databases = await storage.listDatabases();
    
    for (const database of databases) {
      if (database.monitoringEnabled) {
        try {
          await this.checkDatabase(database);
        } catch (error) {
          console.error(`Error monitoring database ${database.name}:`, error);
        }
      }
    }
  }
}

export const oracleMonitor = new OracleMonitor();
