import { Client } from 'ssh2';
import { FileSystem, Database, Threshold } from '@shared/schema';
import { storage } from '../storage';
import { emailService } from './emailService';
import { itsdService } from './itsdService';

interface FilesystemMetrics {
  totalSpace: number; // in MB
  usedSpace: number; // in MB
  availableSpace: number; // in MB
  usedPercent: number;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
}

export class FilesystemMonitor {
  async checkFileSystem(filesystem: FileSystem): Promise<FilesystemMetrics | null> {
    const database = await storage.getDatabase(filesystem.databaseId);
    if (!database) {
      console.error(`Database not found for filesystem ${filesystem.id}`);
      return null;
    }
    
    const conn = new Client();
    
    return new Promise<FilesystemMetrics | null>((resolve, reject) => {
      conn.on('ready', () => {
        // Run df command to get filesystem usage
        conn.exec(`df -m ${filesystem.path} | tail -n 1`, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          
          let data = '';
          stream.on('data', (chunk) => {
            data += chunk;
          });
          
          stream.on('end', async () => {
            conn.end();
            
            try {
              // Parse the df output
              // Expected format: Filesystem 1M-blocks Used Available Use% Mounted on
              const parts = data.trim().split(/\s+/);
              if (parts.length < 5) {
                throw new Error(`Invalid df output: ${data}`);
              }
              
              const totalSpace = parseInt(parts[1], 10);
              const usedSpace = parseInt(parts[2], 10);
              const availableSpace = parseInt(parts[3], 10);
              const usedPercent = parseInt(parts[4].replace('%', ''), 10);
              
              const metrics: FilesystemMetrics = {
                totalSpace,
                usedSpace,
                availableSpace,
                usedPercent,
                status: 'healthy'
              };
              
              // Check thresholds
              const databaseThresholds = await storage.getThresholdsForDatabase(database.id);
              let groupThresholds: Threshold[] = [];
              
              if (database.groupId) {
                groupThresholds = await storage.getThresholdsForGroup(database.groupId);
              }
              
              // Combine database-specific and group thresholds
              const allThresholds = [...databaseThresholds, ...groupThresholds]
                .filter(t => t.metricName === 'disk' || t.metricName === `disk_${filesystem.path}`);
              
              // Check against thresholds
              for (const threshold of allThresholds) {
                // Check critical threshold
                if (threshold.criticalThreshold !== null && usedPercent >= threshold.criticalThreshold) {
                  metrics.status = 'critical';
                  
                  // Create critical alert
                  const alert = await storage.createAlert({
                    databaseId: database.id,
                    fileSystemId: filesystem.id,
                    metricName: 'disk',
                    metricValue: usedPercent,
                    thresholdId: threshold.id,
                    severity: 'critical',
                    message: `Filesystem ${filesystem.path} usage at ${usedPercent}% exceeds critical threshold (${threshold.criticalThreshold}%)`
                  });
                  
                  // Send email alert
                  await emailService.sendAlertEmail(alert, database, filesystem);
                  
                  // Create ITSD ticket for critical alert
                  if (await itsdService.isConfigured()) {
                    const ticketId = await itsdService.createTicketForAlert(alert, database, filesystem);
                    if (ticketId) {
                      await storage.updateAlertTicket(alert.id, ticketId);
                    }
                  }
                }
                // Check warning threshold
                else if (threshold.warningThreshold !== null && usedPercent >= threshold.warningThreshold) {
                  if (metrics.status !== 'critical') {
                    metrics.status = 'warning';
                  }
                  
                  // Create warning alert
                  const alert = await storage.createAlert({
                    databaseId: database.id,
                    fileSystemId: filesystem.id,
                    metricName: 'disk',
                    metricValue: usedPercent,
                    thresholdId: threshold.id,
                    severity: 'warning',
                    message: `Filesystem ${filesystem.path} usage at ${usedPercent}% exceeds warning threshold (${threshold.warningThreshold}%)`
                  });
                  
                  // Send email alert
                  await emailService.sendAlertEmail(alert, database, filesystem);
                }
              }
              
              // Update filesystem status in the database
              await storage.updateFileSystemStatus(
                filesystem.id,
                totalSpace,
                usedSpace,
                metrics.status
              );
              
              resolve(metrics);
            } catch (error) {
              console.error(`Error processing filesystem data for ${filesystem.path}:`, error);
              reject(error);
            }
          });
          
          stream.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
          });
        });
      });
      
      conn.on('error', (err) => {
        console.error(`SSH connection error for ${database.host}:`, err);
        reject(err);
      });
      
      // Connect to the server using SSH
      conn.connect({
        host: database.host,
        port: 22, // Standard SSH port
        username: database.username,
        password: database.password,
        // Could also support key-based auth here
      });
    });
  }
  
  async monitorAllFilesystems(): Promise<void> {
    const filesystems = await storage.listFileSystems();
    
    for (const filesystem of filesystems) {
      try {
        await this.checkFileSystem(filesystem);
      } catch (error) {
        console.error(`Error monitoring filesystem ${filesystem.path}:`, error);
        
        // Update filesystem status to unknown on error
        await storage.updateFileSystemStatus(
          filesystem.id,
          filesystem.totalSpace || 0,
          filesystem.usedSpace || 0,
          'unknown'
        );
      }
    }
  }
}

export const filesystemMonitor = new FilesystemMonitor();
