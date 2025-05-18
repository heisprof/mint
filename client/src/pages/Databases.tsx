import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useLocation, useRoute } from 'wouter';
import { useDatabases } from '@/hooks/useDatabases';
import { useGroups } from '@/hooks/useGroups';
import { useThresholds } from '@/hooks/useThresholds';
import { Database } from '@shared/schema';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import AddDatabaseForm from '@/components/forms/AddDatabaseForm';
import SetThresholdForm from '@/components/forms/SetThresholdForm';
import StatusBadge from '@/components/common/StatusBadge';
import {
  MoreHorizontal,
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  AlertCircle,
  Database as DatabaseIcon,
  HardDrive,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import DatabaseDetailsDialog from '@/components/dashboard/DatabaseDetailsDialog';

export default function Databases() {
  const [, params] = useRoute('/databases');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { 
    databases, 
    databasesWithMetrics, 
    isLoading, 
    refreshDatabases 
  } = useDatabases();
  
  const { groups } = useGroups();
  const { thresholds } = useThresholds();
  
  // Check if we should open edit dialog from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    
    if (editId && databases) {
      const dbToEdit = databases.find(db => db.id === parseInt(editId));
      if (dbToEdit) {
        setSelectedDatabase(dbToEdit);
        setEditDialogOpen(true);
      }
    }
  }, [databases]);
  
  // Filter databases based on search and tabs
  const filteredDatabases = databasesWithMetrics?.filter(db => {
    // Search filter
    const matchesSearch = 
      searchQuery === '' || 
      db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      db.host.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tab filter
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'critical' && db.status === 'critical') ||
      (activeTab === 'warning' && db.status === 'warning') ||
      (activeTab === 'healthy' && db.status === 'healthy');
    
    return matchesSearch && matchesTab;
  });
  
  // Delete database mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/databases/${id}`);
      if (!res.ok) {
        throw new Error('Failed to delete database');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/databases'] });
      toast({
        title: 'Database Deleted',
        description: 'The database has been successfully removed from monitoring.',
      });
      setConfirmDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete database: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  const handleDelete = () => {
    if (selectedDatabase) {
      deleteMutation.mutate(selectedDatabase.id);
    }
  };
  
  const handleStatusCheck = async (database: Database) => {
    try {
      toast({
        title: 'Checking Status',
        description: `Checking connection to ${database.name}...`,
      });
      
      await apiRequest('POST', `/api/databases/${database.id}/check`);
      
      // Refresh the databases list
      refreshDatabases();
      
      toast({
        title: 'Status Check Complete',
        description: 'Database status has been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to check database status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };
  
  const getDetailsForDatabase = (database: Database) => {
    return databasesWithMetrics?.find(db => db.id === database.id) || null;
  };
  
  const handleViewDetails = (database: Database) => {
    const dbWithMetrics = getDetailsForDatabase(database);
    if (dbWithMetrics) {
      setSelectedDatabase(dbWithMetrics);
      setDetailsDialogOpen(true);
    }
  };
  
  const handleEditDatabase = (database: Database) => {
    setSelectedDatabase(database);
    setEditDialogOpen(true);
  };
  
  const handleThresholds = (database: Database) => {
    setSelectedDatabase(database);
    setThresholdDialogOpen(true);
  };
  
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Database Management" />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Databases</h1>
          <div className="flex space-x-2">
            <div className="relative">
              <Input
                placeholder="Search databases..."
                className="w-64 pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            <Button onClick={() => refreshDatabases()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Database
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Databases</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="warning">Warning</TabsTrigger>
            <TabsTrigger value="healthy">Healthy</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Database</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Last Checked</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading databases...
                        </TableCell>
                      </TableRow>
                    ) : filteredDatabases && filteredDatabases.length > 0 ? (
                      filteredDatabases.map((database) => {
                        const group = groups?.find(g => g.id === database.groupId);
                        return (
                          <TableRow key={database.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <DatabaseIcon className="mr-2 h-4 w-4 text-primary" />
                                <div>
                                  <div className="font-medium">{database.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    SID: {database.sid || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-sm">
                                {database.host}:{database.port}
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={database.status as any} />
                            </TableCell>
                            <TableCell>
                              {group ? (
                                <Badge variant="outline" className="bg-primary/10">
                                  {group.name}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">No group</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {database.lastCheckAt ? (
                                <div className="text-sm">
                                  {new Date(database.lastCheckAt).toLocaleString()}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">Never checked</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleViewDetails(database)}>
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditDatabase(database)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleThresholds(database)}>
                                    <HardDrive className="mr-2 h-4 w-4" />
                                    Set Thresholds
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleStatusCheck(database)}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Check Status Now
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedDatabase(database);
                                      setConfirmDeleteDialogOpen(true);
                                    }}
                                    className="text-error"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No databases found.
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
      
      {/* Add Database Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Database</DialogTitle>
          </DialogHeader>
          <AddDatabaseForm 
            databaseTypes={[
              { id: 1, name: 'Oracle', defaultPort: 1521 },
              { id: 2, name: 'MySQL', defaultPort: 3306 },
              { id: 3, name: 'PostgreSQL', defaultPort: 5432 },
              { id: 4, name: 'MSSQL', defaultPort: 1433 }
            ]}
            groups={groups?.map(g => ({ id: g.id, name: g.name })) || []}
            onSuccess={() => setAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Edit Database Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Database: {selectedDatabase?.name}</DialogTitle>
          </DialogHeader>
          {selectedDatabase && (
            <AddDatabaseForm 
              databaseTypes={[
                { id: 1, name: 'Oracle', defaultPort: 1521 },
                { id: 2, name: 'MySQL', defaultPort: 3306 },
                { id: 3, name: 'PostgreSQL', defaultPort: 5432 },
                { id: 4, name: 'MSSQL', defaultPort: 1433 }
              ]}
              groups={groups?.map(g => ({ id: g.id, name: g.name })) || []}
              onSuccess={() => setEditDialogOpen(false)}
              initialValues={selectedDatabase}
              isEdit={true}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Set Thresholds Dialog */}
      <Dialog open={thresholdDialogOpen} onOpenChange={setThresholdDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Set Thresholds: {selectedDatabase?.name}</DialogTitle>
          </DialogHeader>
          {selectedDatabase && (
            <SetThresholdForm 
              databaseId={selectedDatabase.id}
              onSuccess={() => setThresholdDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Are you sure you want to delete the database <strong>{selectedDatabase?.name}</strong>?
            This action cannot be undone.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Database'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Database Details Dialog */}
      <DatabaseDetailsDialog 
        database={getDetailsForDatabase(selectedDatabase)}
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        onEdit={handleEditDatabase}
        onViewReports={(db) => {
          setDetailsDialogOpen(false);
          window.location.href = `/system-health?database=${db.id}`;
        }}
      />
    </div>
  );
}
