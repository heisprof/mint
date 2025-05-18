import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertDatabaseSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const formSchema = insertDatabaseSchema.extend({
  databaseType: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddDatabaseFormProps {
  databaseTypes: Array<{ id: number; name: string; defaultPort: number }>;
  groups: Array<{ id: number; name: string }>;
}

export default function AddDatabaseForm({ databaseTypes, groups }: AddDatabaseFormProps) {
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      host: '',
      port: 1521,
      username: '',
      password: '',
      sid: '',
      databaseType: '1', // Oracle default
    }
  });
  
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Transform data for API
      const payload = {
        ...data,
        typeId: parseInt(data.databaseType),
        groupId: data.groupId ? parseInt(data.groupId.toString()) : undefined,
        createdBy: 1, // TODO: Replace with current user ID
      };
      
      // Remove databaseType as it's not in the schema
      delete (payload as any).databaseType;
      
      const res = await apiRequest('POST', '/api/databases', payload);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/databases'] });
      toast({
        title: 'Database Added',
        description: 'The database has been successfully added for monitoring.',
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add database: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };
  
  // Auto-fill port when database type changes
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'databaseType') {
        const selectedType = databaseTypes.find(type => type.id.toString() === value.databaseType);
        if (selectedType && selectedType.defaultPort) {
          form.setValue('port', selectedType.defaultPort);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, databaseTypes]);
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Database Name</FormLabel>
              <FormControl>
                <Input placeholder="PROD_CRM" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="databaseType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Database Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select database type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {databaseTypes.map(type => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="host"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Host/IP Address</FormLabel>
              <FormControl>
                <Input placeholder="192.168.1.100" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="port"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Port</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  onChange={e => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="sid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SID/Service Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="groupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Database Group</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">Create New Group...</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button
          type="submit"
          className="w-full"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Adding...' : 'Add Database'}
        </Button>
      </form>
    </Form>
  );
}
