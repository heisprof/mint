import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useGroups } from '@/hooks/useGroups';
import { useDatabases } from '@/hooks/useDatabases';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Group, User, insertGroupSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Plus, FolderClosed, Edit, Trash2, MoreHorizontal, Users, Database } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type GroupFormValues = z.infer<typeof insertGroupSchema>;

export default function Groups() {
  const [addGroupDialogOpen, setAddGroupDialogOpen] = useState(false);
  const [editGroupDialogOpen, setEditGroupDialogOpen] = useState(false);
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [manageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<string>('members');
  
  const queryClient = useQueryClient();
  const { groups, isLoading: isLoadingGroups } = useGroups();
  const { databases } = useDatabases();
  
  // Fetch users for group membership
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Fetch group members
  const { data: groupMembers, isLoading: isLoadingMembers } = useQuery<User[]>({
    queryKey: ['/api/groups', selectedGroup?.id, 'members'],
    enabled: !!selectedGroup,
  });
  
  // Form setup for adding/editing group
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(insertGroupSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });
  
  // Set up edit form when selected group changes
  React.useEffect(() => {
    if (selectedGroup && editGroupDialogOpen) {
      form.reset({
        name: selectedGroup.name,
        description: selectedGroup.description || '',
      });
    }
  }, [selectedGroup, editGroupDialogOpen, form]);
  
  // Reset form when adding a new group
  React.useEffect(() => {
    if (addGroupDialogOpen) {
      form.reset({
        name: '',
        description: '',
      });
    }
  }, [addGroupDialogOpen, form]);
  
  // Add group mutation
  const addGroupMutation = useMutation({
    mutationFn: async (data: GroupFormValues) => {
      const response = await apiRequest('POST', '/api/groups', {
        ...data,
        createdBy: 1, // TODO: Replace with current user ID
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      setAddGroupDialogOpen(false);
      form.reset();
      toast({
        title: 'Group Added',
        description: 'The group has been successfully created.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Edit group mutation
  const editGroupMutation = useMutation({
    mutationFn: async (data: { id: number; groupData: GroupFormValues }) => {
      const { id, groupData } = data;
      const response = await apiRequest('PUT', `/api/groups/${id}`, groupData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      setEditGroupDialogOpen(false);
      setSelectedGroup(null);
      toast({
        title: 'Group Updated',
        description: 'The group has been successfully updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update group: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/groups/${id}`);
      if (!response.ok) {
        throw new Error('Failed to delete group');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      setDeleteGroupDialogOpen(false);
      setSelectedGroup(null);
      toast({
        title: 'Group Deleted',
        description: 'The group has been successfully deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete group: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Add user to group mutation
  const addUserToGroupMutation = useMutation({
    mutationFn: async (data: { groupId: number; userId: number }) => {
      const response = await apiRequest('POST', `/api/groups/${data.groupId}/members`, {
        userId: data.userId,
      });
      return response.json();
    },
    onSuccess: () => {
      if (selectedGroup) {
        queryClient.invalidateQueries({ queryKey: ['/api/groups', selectedGroup.id, 'members'] });
      }
      toast({
        title: 'Member Added',
        description: 'The user has been successfully added to the group.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add member: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Remove user from group mutation
  const removeUserFromGroupMutation = useMutation({
    mutationFn: async (data: { groupId: number; userId: number }) => {
      const response = await apiRequest('DELETE', `/api/groups/${data.groupId}/members/${data.userId}`);
      if (!response.ok) {
        throw new Error('Failed to remove member');
      }
      return data;
    },
    onSuccess: () => {
      if (selectedGroup) {
        queryClient.invalidateQueries({ queryKey: ['/api/groups', selectedGroup.id, 'members'] });
      }
      toast({
        title: 'Member Removed',
        description: 'The user has been successfully removed from the group.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to remove member: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (data: GroupFormValues) => {
    if (editGroupDialogOpen && selectedGroup) {
      editGroupMutation.mutate({ id: selectedGroup.id, groupData: data });
    } else {
      addGroupMutation.mutate(data);
    }
  };
  
  const handleDeleteGroup = () => {
    if (selectedGroup) {
      deleteGroupMutation.mutate(selectedGroup.id);
    }
  };
  
  const handleAddUserToGroup = (userId: number) => {
    if (selectedGroup) {
      addUserToGroupMutation.mutate({ groupId: selectedGroup.id, userId });
    }
  };
  
  const handleRemoveUserFromGroup = (userId: number) => {
    if (selectedGroup) {
      removeUserFromGroupMutation.mutate({ groupId: selectedGroup.id, userId });
    }
  };
  
  const getDatabasesInGroup = (groupId: number) => {
    return databases?.filter(db => db.groupId === groupId) || [];
  };
  
  // Check if URL has a new=true parameter
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
      setAddGroupDialogOpen(true);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Group Management" />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Database Groups</h1>
            <p className="text-muted-foreground mt-1">Organize databases into logical groups for monitoring and alerting</p>
          </div>
          <Button onClick={() => setAddGroupDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Groups</CardTitle>
            <CardDescription>
              Organize databases and set group-level thresholds and alerts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Databases</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingGroups ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Loading groups...
                    </TableCell>
                  </TableRow>
                ) : groups?.length ? (
                  groups.map((group) => {
                    const groupDatabases = getDatabasesInGroup(group.id);
                    const hasIssues = groupDatabases.some(db => db.status === 'critical' || db.status === 'warning');
                    
                    return (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <FolderClosed className="h-4 w-4 text-primary mr-2" />
                            {group.name}
                          </div>
                        </TableCell>
                        <TableCell>{group.description}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Database className="h-4 w-4 text-muted-foreground mr-2" />
                            <span>{group.databaseCount} databases</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-secondary/50">
                            <Users className="h-3 w-3 mr-1" />
                            <span>{Math.floor(Math.random() * 5) + 1} members</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {hasIssues ? (
                            <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/20">
                              Issues Detected
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-success/20 text-success border-success/20">
                              Healthy
                            </Badge>
                          )}
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
                                  setSelectedGroup(group);
                                  setEditGroupDialogOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Group
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setManageMembersDialogOpen(true);
                                }}
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Manage Members
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setDeleteGroupDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Group
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No groups found. Create your first group to organize databases.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Add/Edit Group Dialog */}
      <Dialog 
        open={addGroupDialogOpen || editGroupDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setAddGroupDialogOpen(false);
            setEditGroupDialogOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editGroupDialogOpen ? 'Edit Group' : 'Create Group'}
            </DialogTitle>
            <DialogDescription>
              {editGroupDialogOpen 
                ? 'Update group details and settings.' 
                : 'Create a new group to organize databases and users.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Production Databases" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Production databases that require high availability monitoring."
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={addGroupMutation.isPending || editGroupMutation.isPending}
                >
                  {addGroupMutation.isPending || editGroupMutation.isPending 
                    ? 'Saving...' 
                    : editGroupDialogOpen ? 'Update Group' : 'Create Group'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Group Confirmation Dialog */}
      <Dialog open={deleteGroupDialogOpen} onOpenChange={setDeleteGroupDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this group? This won't delete the databases, but they will be ungrouped.
            </DialogDescription>
          </DialogHeader>
          
          {selectedGroup && (
            <div className="py-4">
              <p><strong>Group:</strong> {selectedGroup.name}</p>
              {selectedGroup.description && (
                <p><strong>Description:</strong> {selectedGroup.description}</p>
              )}
              <div className="mt-2 text-amber-500">
                <p>This group contains {getDatabasesInGroup(selectedGroup.id).length} databases which will be ungrouped.</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteGroupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteGroup}
              disabled={deleteGroupMutation.isPending}
            >
              {deleteGroupMutation.isPending ? 'Deleting...' : 'Delete Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Manage Members Dialog */}
      <Dialog open={manageMembersDialogOpen} onOpenChange={setManageMembersDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Group Members</DialogTitle>
            <DialogDescription>
              {selectedGroup && `Add or remove members from ${selectedGroup.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="members" className="w-full" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="members">Group Members</TabsTrigger>
              <TabsTrigger value="databases">Group Databases</TabsTrigger>
            </TabsList>
            
            <TabsContent value="members" className="space-y-4 mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold">Current Members</h3>
                
                <Select onValueChange={(value) => handleAddUserToGroup(parseInt(value))}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Add user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.filter(user => 
                      !groupMembers?.some(member => member.id === user.id)
                    ).map(user => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {isLoadingMembers ? (
                <div className="text-center py-4">Loading members...</div>
              ) : groupMembers?.length ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupMembers.map(member => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.fullName}</TableCell>
                          <TableCell>{member.username}</TableCell>
                          <TableCell>{member.role}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveUserFromGroup(member.id)}
                              className="h-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4 border rounded-md">
                  No members in this group. Add members using the dropdown above.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="databases" className="space-y-4 mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold">Databases in Group</h3>
              </div>
              
              {selectedGroup && (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Database</TableHead>
                        <TableHead>Host</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getDatabasesInGroup(selectedGroup.id).length > 0 ? (
                        getDatabasesInGroup(selectedGroup.id).map(db => (
                          <TableRow key={db.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <Database className="h-4 w-4 text-primary mr-2" />
                                {db.name}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{db.host}:{db.port}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  db.status === 'healthy' 
                                    ? 'bg-success/20 text-success border-success/20'
                                    : db.status === 'warning'
                                    ? 'bg-warning/20 text-warning border-warning/20'
                                    : 'bg-error/20 text-error border-error/20'
                                }
                              >
                                {db.status.charAt(0).toUpperCase() + db.status.slice(1)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4">
                            No databases in this group. Add databases to this group from the Databases page.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="text-right mt-4">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/databases'}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Manage Databases
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setManageMembersDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
