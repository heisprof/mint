import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Database } from '@shared/schema';

// Define the enhanced database type with metric properties
interface DatabaseWithMetrics extends Database {
  cpu: number;
  memory: number;
  diskUsage: number;
  connections: {
    active: number;
    max: number;
  };
  alerts: Array<{
    id: number;
    severity: 'critical' | 'warning';
    metricName: string;
    message: string;
    timeAgo: string;
  }>;
}

export function useDatabases() {
  const queryClient = useQueryClient();
  
  const { data: databases, isLoading, isError, error } = useQuery<Database[]>({
    queryKey: ['/api/databases'],
  });
  
  // Function to generate realistic-looking metrics based on database status
  const getDatabaseMetrics = (database: Database): DatabaseWithMetrics => {
    // Base values
    let cpu = 0;
    let memory = 0;
    let diskUsage = 0;
    let connections = { active: 0, max: 0 };
    let alerts = [];
    
    if (database.status === 'healthy') {
      cpu = Math.floor(Math.random() * 30) + 20; // 20-50%
      memory = Math.floor(Math.random() * 30) + 20; // 20-50%
      diskUsage = Math.floor(Math.random() * 30) + 20; // 20-50%
      connections = { 
        active: Math.floor(Math.random() * 80) + 20, // 20-100
        max: 200 
      };
    } else if (database.status === 'warning') {
      cpu = Math.floor(Math.random() * 15) + 65; // 65-80%
      memory = Math.floor(Math.random() * 15) + 65; // 65-80%
      diskUsage = Math.floor(Math.random() * 15) + 65; // 65-80%
      connections = { 
        active: Math.floor(Math.random() * 50) + 100, // 100-150
        max: 200 
      };
      
      // Add warning alerts
      alerts = [
        {
          id: Date.now(),
          severity: 'warning',
          metricName: 'disk',
          message: `${database.name} disk usage at ${diskUsage}% exceeds warning threshold (65%)`,
          timeAgo: '1h ago'
        }
      ];
    } else if (database.status === 'critical') {
      cpu = Math.floor(Math.random() * 10) + 85; // 85-95%
      memory = Math.floor(Math.random() * 15) + 70; // 70-85%
      diskUsage = Math.floor(Math.random() * 10) + 85; // 85-95%
      
      // For critical databases, either show high connections or connection error
      const hasConnectionError = Math.random() > 0.5;
      if (hasConnectionError) {
        connections = { active: 0, max: 150 };
      } else {
        connections = { 
          active: Math.floor(Math.random() * 30) + 170, // 170-200
          max: 200 
        };
      }
      
      // Add critical alerts
      alerts = [
        {
          id: Date.now() + 1,
          severity: 'critical',
          metricName: 'disk',
          message: `${database.name} disk usage at ${diskUsage}% exceeds critical threshold (85%)`,
          timeAgo: '30m ago'
        },
        {
          id: Date.now() + 2,
          severity: 'critical',
          metricName: 'cpu',
          message: `${database.name} CPU usage at ${cpu}% exceeds critical threshold (85%)`,
          timeAgo: '45m ago'
        }
      ];
      
      if (hasConnectionError) {
        alerts.push({
          id: Date.now() + 3,
          severity: 'critical',
          metricName: 'connection',
          message: `${database.name} is unreachable. Connection timeout after 30s.`,
          timeAgo: '15m ago'
        });
      }
    } else {
      // Unknown status
      cpu = 0;
      memory = 0;
      diskUsage = 0;
      connections = { active: 0, max: 200 };
    }
    
    return {
      ...database,
      cpu,
      memory,
      diskUsage,
      connections,
      alerts
    };
  };
  
  // Add metrics to databases
  const databasesWithMetrics = databases?.map(getDatabaseMetrics);
  
  // Calculate statistics
  const stats = {
    total: databases?.length || 0,
    healthy: databases?.filter(db => db.status === 'healthy').length || 0,
    warnings: databases?.filter(db => db.status === 'warning').length || 0,
    criticalIssues: databases?.filter(db => db.status === 'critical').length || 0
  };
  
  const refreshDatabases = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/databases'] });
  };
  
  return {
    databases,
    databasesWithMetrics,
    stats,
    isLoading,
    isError,
    error,
    refreshDatabases
  };
}
