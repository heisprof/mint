import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertThresholdSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

// Extend the threshold schema for the form
const formSchema = insertThresholdSchema.extend({
  metricType: z.enum(['cpu', 'memory', 'disk', 'connection_time', 'connections', 'tablespace']),
  tablespaceOrPath: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SetThresholdFormProps {
  databaseId?: number;
  groupId?: number;
  onSuccess?: () => void;
  initialValues?: Partial<FormValues>;
  isEdit?: boolean;
  thresholdId?: number;
}

export default function SetThresholdForm({ 
  databaseId, 
  groupId, 
  onSuccess, 
  initialValues, 
  isEdit = false,
  thresholdId
}: SetThresholdFormProps) {
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      databaseId,
      groupId,
      metricName: initialValues?.metricName || 'cpu',
      warningThreshold: initialValues?.warningThreshold || 70,
      criticalThreshold: initialValues?.criticalThreshold || 90,
      enabled: initialValues?.enabled ?? true,
      metricType: (initialValues?.metricName?.startsWith('tablespace_') 
        ? 'tablespace'
        : initialValues?.metricName as any) || 'cpu',
      tablespaceOrPath: initialValues?.metricName?.startsWith('tablespace_') 
        ? initialValues.metricName.substring('tablespace_'.length)
        : initialValues?.metricName?.startsWith('disk_')
          ? initialValues.metricName.substring('disk_'.length)
          : '',
    }
  });
  
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Transform metric name based on type
      let metricName = data.metricType;
      if (data.metricType === 'tablespace' && data.tablespaceOrPath) {
        metricName = `tablespace_${data.tablespaceOrPath}`;
      } else if (data.metricType === 'disk' && data.tablespaceOrPath) {
        metricName = `disk_${data.tablespaceOrPath}`;
      }
      
      // Create payload
      const payload = {
        ...data,
        metricName,
        createdBy: 1, // TODO: Replace with current user ID
      };
      
      // Remove non-schema fields
      delete (payload as any).metricType;
      delete (payload as any).tablespaceOrPath;
      
      if (isEdit && thresholdId) {
        const res = await apiRequest('PUT', `/api/thresholds/${thresholdId}`, payload);
        return res.json();
      } else {
        const res = await apiRequest('POST', '/api/thresholds', payload);
        return res.json();
      }
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/thresholds'] });
      if (databaseId) {
        queryClient.invalidateQueries({ queryKey: [`/api/databases/${databaseId}/thresholds`] });
      }
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/thresholds`] });
      }
      
      toast({
        title: isEdit ? 'Threshold Updated' : 'Threshold Created',
        description: isEdit 
          ? 'The threshold has been successfully updated.' 
          : 'A new threshold has been successfully created.',
      });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to ${isEdit ? 'update' : 'create'} threshold: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Watch metric type to conditionally display fields
  const metricType = form.watch('metricType');
  
  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="metricType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Metric Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cpu">CPU Utilization</SelectItem>
                  <SelectItem value="memory">Memory Usage</SelectItem>
                  <SelectItem value="disk">Disk Usage</SelectItem>
                  <SelectItem value="connection_time">Connection Response Time</SelectItem>
                  <SelectItem value="connections">Active Connections</SelectItem>
                  <SelectItem value="tablespace">Tablespace Usage</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The type of metric to monitor
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {(metricType === 'tablespace' || metricType === 'disk') && (
          <FormField
            control={form.control}
            name="tablespaceOrPath"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {metricType === 'tablespace' ? 'Tablespace Name' : 'Filesystem Path'}
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder={metricType === 'tablespace' ? 'SYSTEM' : '/oracle/data'} 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  {metricType === 'tablespace' 
                    ? 'The name of the tablespace to monitor' 
                    : 'The filesystem path to monitor'
                  }
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <FormField
          control={form.control}
          name="warningThreshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Warning Threshold (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={0} 
                  max={100} 
                  {...field} 
                  onChange={e => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Alert when metric exceeds this value
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="criticalThreshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Critical Threshold (%)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={0} 
                  max={100} 
                  {...field} 
                  onChange={e => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Create ticket and send alert when metric exceeds this value
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Enabled
                </FormLabel>
                <FormDescription>
                  Disable to temporarily stop monitoring this metric
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending 
            ? (isEdit ? 'Updating...' : 'Creating...') 
            : (isEdit ? 'Update Threshold' : 'Create Threshold')
          }
        </Button>
      </form>
    </Form>
  );
}
