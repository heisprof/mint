import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTickets } from '@/hooks/useTickets';
import {
  Cable,
  Mail,
  ExternalLink,
  Check,
  X,
  ArrowRight,
  RefreshCcw,
  TestTube2,
  LifeBuoy,
  FileEdit as Edit
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const itsdIntegrationSchema = z.object({
  endpoint: z.string().url({ message: "Please enter a valid URL" }),
  apiKey: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  enabled: z.boolean().default(false),
  settings: z.record(z.string(), z.any()).optional(),
});

const emailSettingsSchema = z.object({
  email_host: z.string().min(1, { message: "SMTP server is required" }),
  email_port: z.string().regex(/^\d+$/, { message: "Port must be a number" }),
  email_user: z.string().min(1, { message: "Username is required" }),
  email_password: z.string().min(1, { message: "Password is required" }),
  email_from: z.string().email({ message: "Please enter a valid email address" }),
  email_ssl: z.boolean().default(true),
  alert_recipients: z.string().min(1, { message: "At least one recipient is required" }),
});

export default function Integrations() {
  const [activeTab, setActiveTab] = useState<string>('itsd');
  const [testingItsd, setTestingItsd] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  
  const queryClient = useQueryClient();
  const { tickets } = useTickets();
  
  // Check URL for active tab parameter
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['itsd', 'email', 'tickets'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);
  
  // ITSD Integration
  const { data: itsdIntegration, isLoading: isLoadingItsd } = useQuery({
    queryKey: ['/api/itsd-integration'],
  });
  
  const itsdForm = useForm({
    resolver: zodResolver(itsdIntegrationSchema),
    defaultValues: {
      endpoint: '',
      apiKey: '',
      username: '',
      password: '',
      enabled: false,
      settings: {},
    },
  });
  
  // Update form when ITSD integration data is loaded
  React.useEffect(() => {
    if (itsdIntegration) {
      itsdForm.reset({
        endpoint: itsdIntegration.endpoint || '',
        apiKey: itsdIntegration.apiKey || '',
        username: itsdIntegration.username || '',
        password: '',
        enabled: itsdIntegration.enabled || false,
        settings: itsdIntegration.settings || {},
      });
    }
  }, [itsdIntegration, itsdForm]);
  
  // Email Settings
  const { data: emailSettings, isLoading: isLoadingEmail } = useQuery({
    queryKey: ['/api/settings/email_settings'],
  });
  
  const emailForm = useForm({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      email_host: '',
      email_port: '587',
      email_user: '',
      email_password: '',
      email_from: '',
      email_ssl: true,
      alert_recipients: '',
    },
  });
  
  // Update form when email settings are loaded
  React.useEffect(() => {
    if (emailSettings) {
      emailForm.reset({
        email_host: emailSettings.email_host || '',
        email_port: emailSettings.email_port || '587',
        email_user: emailSettings.email_user || '',
        email_password: '',
        email_from: emailSettings.email_from || '',
        email_ssl: emailSettings.email_ssl !== 'false',
        alert_recipients: emailSettings.alert_recipients || '',
      });
    }
  }, [emailSettings, emailForm]);
  
  // Update ITSD Integration
  const updateItsdMutation = useMutation({
    mutationFn: async (data: z.infer<typeof itsdIntegrationSchema>) => {
      const response = await apiRequest('POST', '/api/itsd-integration', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/itsd-integration'] });
      toast({
        title: 'Integration Updated',
        description: 'ITSD integration settings have been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update ITSD integration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Update Email Settings
  const updateEmailMutation = useMutation({
    mutationFn: async (data: z.infer<typeof emailSettingsSchema>) => {
      // Update each setting individually
      const promises = Object.entries(data).map(([key, value]) => 
        apiRequest('POST', `/api/settings/${key}`, { value: String(value) })
      );
      
      await Promise.all(promises);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/email_settings'] });
      toast({
        title: 'Email Settings Updated',
        description: 'Email configuration has been saved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update email settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Test ITSD Integration
  const testItsdMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/itsd-integration/test', {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Test Successful',
        description: data.message || 'Connection to CA ITSD was successful.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Test Failed',
        description: `Failed to connect to CA ITSD: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setTestingItsd(false);
    },
  });
  
  // Test Email Configuration
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/email/test', {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Test Email Sent',
        description: data.message || 'A test email has been sent successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Test Failed',
        description: `Failed to send test email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setTestingEmail(false);
    },
  });
  
  const onItsdSubmit = (data: z.infer<typeof itsdIntegrationSchema>) => {
    updateItsdMutation.mutate(data);
  };
  
  const onEmailSubmit = (data: z.infer<typeof emailSettingsSchema>) => {
    updateEmailMutation.mutate(data);
  };
  
  const handleTestItsd = () => {
    setTestingItsd(true);
    testItsdMutation.mutate();
  };
  
  const handleTestEmail = () => {
    setTestingEmail(true);
    testEmailMutation.mutate();
  };
  
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Integrations" />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Integrations & Notifications</h1>
            <p className="text-muted-foreground mt-1">Configure integrations with external systems for alerts and tickets</p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="itsd" className="flex items-center">
              <Cable className="h-4 w-4 mr-2" />
              CA ITSD Integration
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Email Notifications
            </TabsTrigger>
            <TabsTrigger value="tickets" className="flex items-center">
              <LifeBuoy className="h-4 w-4 mr-2" />
              Ticket History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="itsd">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>CA IT Service Desk Integration</CardTitle>
                <CardDescription>
                  Configure the integration with CA ITSD to automatically create tickets for critical alerts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingItsd ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Form {...itsdForm}>
                    <form onSubmit={itsdForm.handleSubmit(onItsdSubmit)} className="space-y-6">
                      <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                        <div>
                          <h3 className="text-lg font-medium">Enable Integration</h3>
                          <p className="text-sm text-muted-foreground">
                            Turn on the integration to automatically create tickets in CA ITSD.
                          </p>
                        </div>
                        <FormField
                          control={itsdForm.control}
                          name="enabled"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid gap-4">
                        <FormField
                          control={itsdForm.control}
                          name="endpoint"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ITSD API Endpoint</FormLabel>
                              <FormControl>
                                <Input placeholder="https://servicedeskapi.example.com/api/v1/incidents" {...field} />
                              </FormControl>
                              <FormDescription>
                                The REST API endpoint for creating incidents in CA ITSD.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="border rounded-md p-4 bg-muted/20">
                          <h4 className="font-medium mb-2">Authentication</h4>
                          <div className="space-y-4">
                            <FormField
                              control={itsdForm.control}
                              name="apiKey"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>API Key</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter API key" type="password" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    If using API key authentication, enter the key here. Leave blank to use username/password.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={itsdForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                      <Input placeholder="service_account" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={itsdForm.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={itsdIntegration?.password ? "••••••••" : "Enter password"}
                                        type="password"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Leave blank to keep current password.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Separator className="my-6" />
                      
                      <div className="flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTestItsd}
                          disabled={testingItsd || !itsdForm.getValues().endpoint}
                        >
                          {testingItsd ? (
                            <>
                              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>
                              <TestTube2 className="mr-2 h-4 w-4" />
                              Test Connection
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          type="submit" 
                          disabled={updateItsdMutation.isPending || !itsdForm.formState.isDirty}
                        >
                          {updateItsdMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>ITSD Integration Settings</CardTitle>
                <CardDescription>
                  Additional settings for the CA ITSD integration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Ticket Categories</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure the default categories for tickets created in CA ITSD.
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Category</span>
                          <span className="text-sm font-medium">Infrastructure</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Subcategory</span>
                          <span className="text-sm font-medium">Database</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Type</span>
                          <span className="text-sm font-medium">Incident</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Default Assignment</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Configure the default assignment for tickets.
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Group</span>
                          <span className="text-sm font-medium">Database Team</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Priority</span>
                          <span className="text-sm font-medium">Based on alert severity</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Urgency</span>
                          <span className="text-sm font-medium">Based on alert severity</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="email">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Email Notification Settings</CardTitle>
                <CardDescription>
                  Configure email notifications for alerts and system events.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEmail ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                      <div className="border rounded-md p-4 bg-muted/20">
                        <h4 className="font-medium mb-2">SMTP Server Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={emailForm.control}
                            name="email_host"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SMTP Server</FormLabel>
                                <FormControl>
                                  <Input placeholder="smtp.example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={emailForm.control}
                            name="email_port"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Port</FormLabel>
                                <FormControl>
                                  <Input placeholder="587" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={emailForm.control}
                            name="email_user"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input placeholder="user@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={emailForm.control}
                            name="email_password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={emailSettings?.email_password ? "••••••••" : "Enter password"}
                                    type="password"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Leave blank to keep current password.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="mt-4 flex items-center space-x-2">
                          <FormField
                            control={emailForm.control}
                            name="email_ssl"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Use SSL/TLS
                                  </FormLabel>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <FormField
                          control={emailForm.control}
                          name="email_from"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>From Email Address</FormLabel>
                              <FormControl>
                                <Input placeholder="monitoring@example.com" {...field} />
                              </FormControl>
                              <FormDescription>
                                The email address that will be used as the sender for all notifications.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={emailForm.control}
                          name="alert_recipients"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Alert Recipients</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="admin@example.com, dba@example.com" 
                                  className="min-h-[80px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Comma-separated list of email addresses that will receive alert notifications.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <Separator className="my-6" />
                      
                      <div className="flex justify-between">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleTestEmail}
                          disabled={testingEmail || !emailForm.getValues().email_host}
                        >
                          {testingEmail ? (
                            <>
                              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Test Email
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          type="submit" 
                          disabled={updateEmailMutation.isPending || !emailForm.formState.isDirty}
                        >
                          {updateEmailMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>
                  Configure email templates for different types of notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Critical Alert Template</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-error/20 text-error border-0">Critical</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Template used for critical alerts that require immediate attention.
                    </p>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Template
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Warning Alert Template</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-warning/20 text-warning border-0">Warning</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Template used for warning alerts that should be monitored.
                    </p>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Template
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">System Status Report</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-success/20 text-success border-0">Daily</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Template used for daily system status reports.
                    </p>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Template
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>ITSD Ticket History</CardTitle>
                <CardDescription>
                  View tickets created in CA ITSD through the integration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets?.length ? (
                      tickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.id}</TableCell>
                          <TableCell>{ticket.title}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                ticket.status === 'open' 
                                  ? 'bg-blue-500/20 text-blue-500 border-blue-500/20'
                                  : ticket.status === 'in_progress'
                                  ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/20'
                                  : 'bg-green-500/20 text-green-500 border-green-500/20'
                              }
                            >
                              {ticket.status === 'open' 
                                ? 'Open' 
                                : ticket.status === 'in_progress'
                                ? 'In Progress'
                                : 'Resolved'}
                            </Badge>
                          </TableCell>
                          <TableCell>{ticket.time}</TableCell>
                          <TableCell>{ticket.assignedTo}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <ExternalLink className="h-4 w-4" />
                              <span className="sr-only">View in ITSD</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          No tickets found. Tickets will appear here when they are created through the integration.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
