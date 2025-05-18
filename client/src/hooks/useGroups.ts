import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Group } from '@shared/schema';
import { useDatabases } from './useDatabases';

// Define the enhanced group type with additional properties
interface GroupWithStats extends Group {
  databaseCount: number;
  healthyCounts: {
    healthy: number;
    warning: number;
    critical: number;
  };
}

export function useGroups() {
  const queryClient = useQueryClient();
  const { databases } = useDatabases();
  
  const { data: rawGroups, isLoading, isError, error } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
  });
  
  // Add statistics to groups
  const groups: GroupWithStats[] | undefined = rawGroups?.map(group => {
    const groupDatabases = databases?.filter(db => db.groupId === group.id) || [];
    
    return {
      ...group,
      databaseCount: groupDatabases.length,
      healthyCounts: {
        healthy: groupDatabases.filter(db => db.status === 'healthy').length,
        warning: groupDatabases.filter(db => db.status === 'warning').length,
        critical: groupDatabases.filter(db => db.status === 'critical').length
      }
    };
  });
  
  const refreshGroups = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
  };
  
  return {
    groups,
    isLoading,
    isError,
    error,
    refreshGroups
  };
}
