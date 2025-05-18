import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from '@shared/schema';
import { useDatabases } from './useDatabases';

// Define the ticket interface
interface Ticket {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo: string;
  time: string;
}

export function useTickets() {
  const queryClient = useQueryClient();
  const { databases } = useDatabases();
  
  // Get alerts with tickets
  const { data: alerts } = useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
  });
  
  // Filter alerts that have tickets
  const alertsWithTickets = alerts?.filter(alert => alert.ticketId) || [];
  
  // Convert alerts with tickets to ticket objects
  const tickets: Ticket[] = alertsWithTickets.map(alert => {
    const database = databases?.find(db => db.id === alert.databaseId);
    const dateCreated = alert.createdAt ? new Date(alert.createdAt) : new Date();
    const dateAcknowledged = alert.acknowledgedAt ? new Date(alert.acknowledgedAt) : null;
    
    // Determine status based on acknowledgment
    let status: 'open' | 'in_progress' | 'resolved' | 'closed';
    if (!dateAcknowledged) {
      status = 'open';
    } else {
      // If acknowledged within last 24 hours, it's in progress
      const now = new Date();
      const diff = now.getTime() - dateAcknowledged.getTime();
      const hours = diff / (1000 * 60 * 60);
      
      if (hours < 24) {
        status = 'in_progress';
      } else {
        status = 'resolved';
      }
    }
    
    // Generate a title based on the alert
    const title = `${alert.severity === 'critical' ? 'Critical' : 'Warning'}: ${database?.name || 'Unknown Database'}`;
    
    return {
      id: alert.ticketId || `INC${Math.floor(Math.random() * 1000000).toString().padStart(9, '0')}`,
      title: `${alert.metricName}: ${database?.name || 'Unknown Database'}`,
      status,
      assignedTo: status === 'open' ? 'Unassigned' : status === 'in_progress' ? 'L2 Support' : 'System Admin',
      time: dateCreated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + 
            (dateCreated.toDateString() === new Date().toDateString() ? 'Today' : 'Yesterday')
    };
  });
  
  // Sort tickets by status (open first, then in_progress, then resolved)
  tickets.sort((a, b) => {
    const statusOrder = { open: 0, in_progress: 1, resolved: 2, closed: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });
  
  const refreshTickets = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
  };
  
  return {
    tickets,
    refreshTickets
  };
}
