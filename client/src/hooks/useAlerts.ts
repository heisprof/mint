import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from '@shared/schema';
import { useDatabases } from './useDatabases';

// Define the enhanced alert type with additional properties
interface AlertWithExtras extends Alert {
  databaseName?: string;
  timeAgo: string;
}

export function useAlerts() {
  const queryClient = useQueryClient();
  const { databases } = useDatabases();
  
  const { data: rawAlerts, isLoading, isError, error } = useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
  });
  
  // Calculate time ago
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };
  
  // Add database names and time ago to alerts
  const alerts: AlertWithExtras[] | undefined = rawAlerts?.map(alert => {
    const database = databases?.find(db => db.id === alert.databaseId);
    const createdAt = alert.createdAt ? new Date(alert.createdAt) : new Date();
    
    return {
      ...alert,
      databaseName: database?.name,
      timeAgo: getTimeAgo(createdAt)
    };
  });
  
  // Sort alerts by created date (newest first)
  alerts?.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date();
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date();
    return dateB.getTime() - dateA.getTime();
  });
  
  const refreshAlerts = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
  };
  
  return {
    alerts,
    isLoading,
    isError,
    error,
    refreshAlerts
  };
}
