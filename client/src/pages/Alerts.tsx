import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useLocation } from 'wouter';
import { useAlerts } from '@/hooks/useAlerts';
import { useDatabases } from '@/hooks/useDatabases';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import {
  AlertOctagon, 
  AlertTriangle,
  CheckCircle,
  Bell,
  Filter,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert as AlertType } from '@shared/schema';
import { toast } from '@/hooks/use-toast';

function AlertSeverityIcon({ severity }: { severity: string }) {
  if (severity === 'critical') {
    return <AlertOctagon className="h-5 w-5 text-error" />;
  } else if (severity === 'warning') {
    return <AlertTriangle className="h-5 w-5 text-warning" />;
  }
  return null;
}

export default function Alerts() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDatabase, setSelectedDatabase] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  
  const queryClient = useQueryClient();
  const { alerts, refreshAlerts, isLoading } = useAlerts();
  const { databases } = useDatabases();
  
  // Filter alerts based on active tab and filters
  const filteredAlerts = alerts?.filter(alert => {
    // Tab filter
    if (activeTab === 'active' && alert.acknowledgedAt) return false;
    if (activeTab === 'acknowledged' && !alert.acknowledgedAt) return false;
    
    // Database filter
    if (selectedDatabase !== 'all' && alert.databaseId !== parseInt(selectedDatabase)) return false;
    
    // Severity filter
    if (selectedSeverity !== 'all' && alert.severity !== selectedSeverity) return false;
    
    return true;
  });
  
  const criticalCount = alerts?.filter(alert => alert.severity === 'critical' && !alert.acknowledgedAt).length || 0;
  const warningCount = alerts?.filter(alert => alert.severity === 'warning' && !alert.acknowledgedAt).length || 0;
  const acknowledgedCount = alerts?.filter(alert => alert.acknowledgedAt).length || 0;
  
  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const res = await apiRequest('POST', `/api/alerts/${alertId}/acknowledge`, {
        userId: 1 // TODO: Replace with current user ID
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/active'] });
      toast({
        title: 'Alert Acknowledged',
        description: 'The alert has been acknowledged successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to acknowledge alert: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  const handleAcknowledge = (alert: AlertType) => {
    acknowledgeMutation.mutate(alert.id);
  };
  
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Alert Management" />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Alerts</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage system alerts</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={refreshAlerts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => navigate('/settings?tab=notifications')}>
              <Bell className="h-4 w-4 mr-2" />
              Configure Notifications
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className={cn(
            "bg-card border-l-4",
            criticalCount > 0 ? "border-l-error" : "border-l-muted"
          )}>
            <CardContent className="flex items-center p-4">
              <div className="rounded-full p-2 bg-error/10 mr-4">
                <AlertOctagon className="h-6 w-6 text-error" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold">{criticalCount}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "bg-card border-l-4",
            warningCount > 0 ? "border-l-warning" : "border-l-muted"
          )}>
            <CardContent className="flex items-center p-4">
              <div className="rounded-full p-2 bg-warning/10 mr-4">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Warning Alerts</p>
                <p className="text-2xl font-bold">{warningCount}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-l-4 border-l-muted">
            <CardContent className="flex items-center p-4">
              <div className="rounded-full p-2 bg-success/10 mr-4">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Acknowledged</p>
                <p className="text-2xl font-bold">{acknowledgedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {criticalCount > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertOctagon className="h-4 w-4" />
            <AlertTitle>Critical Alerts Require Attention</AlertTitle>
            <AlertDescription>
              There are {criticalCount} critical alerts that need immediate attention. 
              Critical alerts may indicate serious system issues.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All Alerts</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              
              <Select
                value={selectedDatabase}
                onValueChange={setSelectedDatabase}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Databases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Databases</SelectItem>
                  {databases?.map(db => (
                    <SelectItem key={db.id} value={db.id.toString()}>
                      {db.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={selectedSeverity}
                onValueChange={setSelectedSeverity}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Alert History</CardTitle>
            <CardDescription>
              All alerts generated by the monitoring system
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severity</TableHead>
                  <TableHead>Database</TableHead>
                  <TableHead>Metric</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading alerts...
                    </TableCell>
                  </TableRow>
                ) : filteredAlerts && filteredAlerts.length > 0 ? (
                  filteredAlerts.map((alert) => {
                    const database = databases?.find(db => db.id === alert.databaseId);
                    return (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <AlertSeverityIcon severity={alert.severity} />
                            <span className="ml-2 capitalize">{alert.severity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {database ? (
                            <div className="font-medium">{database.name}</div>
                          ) : (
                            <span className="text-muted-foreground">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{alert.metricName.replace('_', ' ')}</span>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={alert.message}>
                            {alert.message}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(alert.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {alert.ticketId ? (
                            <div className="flex items-center">
                              <span className="mr-1">{alert.ticketId}</span>
                              <Button variant="ghost" size="icon" className="h-5 w-5">
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No ticket</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {alert.acknowledgedAt ? (
                            <span className="text-success">Acknowledged</span>
                          ) : (
                            <span className="text-warning">Active</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!alert.acknowledgedAt && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleAcknowledge(alert)}
                              disabled={acknowledgeMutation.isPending}
                            >
                              Acknowledge
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No alerts found matching the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
