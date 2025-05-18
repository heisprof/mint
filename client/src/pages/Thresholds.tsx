import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useThresholds } from '@/hooks/useThresholds';
import { useDatabases } from '@/hooks/useDatabases';
import { useGroups } from '@/hooks/useGroups';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Threshold } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Sliders, Edit, Trash2, MoreHorizontal, Database, FolderClosed, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SetThresholdForm from '@/components/forms/SetThresholdForm';

export default function Thresholds() {
  const [activeTab, setActiveTab] = useState('database');
  const [addThresholdDialogOpen, setAddThresholdDialogOpen] = useState(false);
  const [editThresholdDialogOpen, setEditThresholdDialogOpen] = useState(false);
  const [deleteThresholdDialogOpen, setDeleteThresholdDialogOpen] = useState(false);
  const [selectedThreshold, setSelectedThreshold] = useState<Threshold | null>(null);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  const queryClient = useQueryClient();
  const { thresholds, isLoading } = useThresholds();
  const { databases } = useDatabases();
  const { groups } = useGroups();
  
  // Delete threshold mutation
  const deleteThresholdMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/thresholds/${id}`);
      if (!response.ok) {
        throw new Error('Failed to delete threshold');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/thresholds'] });
      setDeleteThresholdDialogOpen(false);
      setSelectedThreshold(null);
      toast({
        title: 'Threshold Deleted',
        description: 'The threshold has been successfully deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete threshold: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Enable/disable threshold mutation
  const toggleThresholdMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const response = await apiRequest('PUT', `/api/thresholds/${id}`, { enabled });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/thresholds'] });
      toast({
        title: 'Threshold Updated',
        description: 'The threshold status has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update threshold: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  const handleDeleteThreshold = () => {
    if (selectedThreshold) {
      deleteThresholdMutation.mutate(selectedThreshold.id);
    }
  };
  
  const handleToggleThreshold = (threshold: Threshold) => {
    toggleThresholdMutation.mutate({ 
      id: threshold.id, 
      enabled: !threshold.enabled 
    });
  };
  
  // Filter thresholds based on active tab and selection
  const getFilteredThresholds = () => {
    if (!thresholds) return [];
    
    if (activeTab === 'database') {
      if (!selectedDatabaseId) return [];
      return thresholds.filter(t => t.databaseId === parseInt(selectedDatabaseId));
    } else {
      if (!selectedGroupId) return [];
      return thresholds.filter(t => t.groupId === parseInt(selectedGroupId));
    }
  };
  
  // Get the entity (database or group) name
  const getEntityName = () => {
    if (activeTab === 'database' && selectedDatabaseId) {
      return databases?.find(db => db.id === parseInt(selectedDatabaseId))?.name || '';
    } else if (activeTab === 'group' && selectedGroupId) {
      return groups?.find(g => g.id === parseInt(selectedGroupId))?.name || '';
    }
    return '';
  };
  
  // Get readable metric name
  const getMetricName = (metricName: string) => {
    if (metricName.startsWith('tablespace_')) {
      return `Tablespace (${metricName.substring('tablespace_'.length)})`;
    } else if (metricName.startsWith('disk_')) {
      return `Filesystem (${metricName.substring('disk_'.length)})`;
    } else {
      return metricName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  };
  
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Threshold Management" />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Alert Thresholds</h1>
            <p className="text-muted-foreground mt-1">Configure thresholds for database metrics to trigger alerts</p>
          </div>
          <Button 
            onClick={() => {
              if ((activeTab === 'database' && !selectedDatabaseId) || 
                  (activeTab === 'group' && !selectedGroupId)) {
                toast({
                  title: 'Selection Required',
                  description: `Please select a ${activeTab} first.`,
                  variant: 'destructive',
                });
                return;
              }
              setAddThresholdDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Threshold
          </Button>
        </div>
        
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="database" className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Database Thresholds
              </TabsTrigger>
              <TabsTrigger value="group" className="flex items-center">
                <FolderClosed className="h-4 w-4 mr-2" />
                Group Thresholds
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
              <TabsContent value="database" className="mt-0 w-full md:w-64">
                <Select 
                  value={selectedDatabaseId} 
                  onValueChange={setSelectedDatabaseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a database" />
                  </SelectTrigger>
                  <SelectContent>
                    {databases?.map(database => (
                      <SelectItem key={database.id} value={database.id.toString()}>
                        {database.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
              
              <TabsContent value="group" className="mt-0 w-full md:w-64">
                <Select 
                  value={selectedGroupId} 
                  onValueChange={setSelectedGroupId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups?.map(group => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
              
              {(activeTab === 'database' && selectedDatabaseId) || (activeTab === 'group' && selectedGroupId) ? (
                <div className="text-sm text-muted-foreground">
                  Showing thresholds for: <span className="font-medium text-foreground">{getEntityName()}</span>
                </div>
              ) : null}
            </div>
          </Tabs>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Threshold Configurations</CardTitle>
            <CardDescription>
              Set warning and critical thresholds for metrics to generate alerts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Warning</TableHead>
                  <TableHead>Critical</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Loading thresholds...
                    </TableCell>
                  </TableRow>
                ) : getFilteredThresholds().length > 0 ? (
                  getFilteredThresholds().map((threshold) => (
                    <TableRow key={threshold.id}>
                      <TableCell className="font-medium">
                        {getMetricName(threshold.metricName)}
                      </TableCell>
                      <TableCell>
                        {threshold.warningThreshold !== null ? (
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/10">
                            {threshold.warningThreshold}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {threshold.criticalThreshold !== null ? (
                          <Badge variant="outline" className="bg-error/10 text-error border-error/10">
                            {threshold.criticalThreshold}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={threshold.enabled}
                            onCheckedChange={() => handleToggleThreshold(threshold)}
                          />
                          <span className={threshold.enabled ? "text-foreground" : "text-muted-foreground"}>
                            {threshold.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedThreshold(threshold);
                                setEditThresholdDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Threshold
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedThreshold(threshold);
                                setDeleteThresholdDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Threshold
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      {(activeTab === 'database' && selectedDatabaseId) || 
                       (activeTab === 'group' && selectedGroupId) ? (
                        <>
                          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p>No thresholds configured for this {activeTab}.</p>
                          <Button 
                            variant="outline"
                            className="mt-4"
                            onClick={() => setAddThresholdDialogOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add your first threshold
                          </Button>
                        </>
                      ) : (
                        <p>Please select a {activeTab} to view its thresholds.</p>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Add Threshold Dialog */}
      <Dialog open={addThresholdDialogOpen} onOpenChange={setAddThresholdDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Threshold</DialogTitle>
            <DialogDescription>
              Set thresholds for specific metrics to trigger alerts.
            </DialogDescription>
          </DialogHeader>
          
          <SetThresholdForm
            databaseId={activeTab === 'database' && selectedDatabaseId ? parseInt(selectedDatabaseId) : undefined}
            groupId={activeTab === 'group' && selectedGroupId ? parseInt(selectedGroupId) : undefined}
            onSuccess={() => setAddThresholdDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Threshold Dialog */}
      <Dialog open={editThresholdDialogOpen} onOpenChange={setEditThresholdDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Threshold</DialogTitle>
            <DialogDescription>
              Update threshold values and settings.
            </DialogDescription>
          </DialogHeader>
          
          {selectedThreshold && (
            <SetThresholdForm
              databaseId={selectedThreshold.databaseId || undefined}
              groupId={selectedThreshold.groupId || undefined}
              initialValues={selectedThreshold}
              onSuccess={() => setEditThresholdDialogOpen(false)}
              isEdit={true}
              thresholdId={selectedThreshold.id}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Threshold Confirmation Dialog */}
      <Dialog open={deleteThresholdDialogOpen} onOpenChange={setDeleteThresholdDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this threshold? This will remove alert triggers for this metric.
            </DialogDescription>
          </DialogHeader>
          
          {selectedThreshold && (
            <div className="py-4">
              <p><strong>Metric:</strong> {getMetricName(selectedThreshold.metricName)}</p>
              <p><strong>Warning Threshold:</strong> {selectedThreshold.warningThreshold ? `${selectedThreshold.warningThreshold}%` : 'Not set'}</p>
              <p><strong>Critical Threshold:</strong> {selectedThreshold.criticalThreshold ? `${selectedThreshold.criticalThreshold}%` : 'Not set'}</p>
              
              <div className="mt-2 text-amber-500">
                <p>Deleting this threshold will stop alerts for this metric.</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteThresholdDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteThreshold}
              disabled={deleteThresholdMutation.isPending}
            >
              {deleteThresholdMutation.isPending ? 'Deleting...' : 'Delete Threshold'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
