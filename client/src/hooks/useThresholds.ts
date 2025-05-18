import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Threshold } from '@shared/schema';

export function useThresholds() {
  const queryClient = useQueryClient();
  
  const { data: thresholds, isLoading, isError, error } = useQuery<Threshold[]>({
    queryKey: ['/api/thresholds'],
  });
  
  // Get thresholds for a specific database
  const getDatabaseThresholds = (databaseId: number) => {
    return thresholds?.filter(threshold => threshold.databaseId === databaseId) || [];
  };
  
  // Get thresholds for a specific group
  const getGroupThresholds = (groupId: number) => {
    return thresholds?.filter(threshold => threshold.groupId === groupId) || [];
  };
  
  const refreshThresholds = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/thresholds'] });
  };
  
  return {
    thresholds,
    getDatabaseThresholds,
    getGroupThresholds,
    isLoading,
    isError,
    error,
    refreshThresholds
  };
}
