import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, insertUserSchema } from '@shared/schema';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Plus, UserPlus, UserCog, Edit, Trash2, MoreHorizontal, CheckCircle, Key } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Extended schema for the user form
const userFormSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type UserFormValues = z.infer<typeof userFormSchema>;

// Password reset schema
const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function UserManagement() {
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const queryClient = useQueryClient();
  
  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Form setup for adding new user
  const addUserForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      fullName: '',
      role: 'user',
    },
  });
  
  // Form setup for editing user
  const editUserForm = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      email: '',
      fullName: '',
      role: 'user',
    },
  });
  
  // Set up edit form when selected user changes
  React.useEffect(() => {
    if (selectedUser && editUserDialogOpen) {
      editUserForm.reset({
        username: selectedUser.username,
        password: '',
        confirmPassword: '',
        email: selectedUser.email,
        fullName: selectedUser.fullName,
        role: selectedUser.role,
      });
    }
  }, [selectedUser, editUserDialogOpen, editUserForm]);
  
  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (data: Omit<UserFormValues, 'confirmPassword'>) => {
      const { confirmPassword, ...userData } = data;
      const response = await apiRequest('POST', '/api/users', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setAddUserDialogOpen(false);
      addUserForm.reset();
      toast({
        title: 'User Added',
        description: 'The user has been successfully added.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: Partial<Omit<UserFormValues, 'confirmPassword'>> }) => {
      const { id, userData } = data;
      const response = await apiRequest('PUT', `/api/users/${id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setEditUserDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: 'User Updated',
        description: 'The user has been successfully updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/users/${id}`);
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setDeleteUserDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: 'User Deleted',
        description: 'The user has been successfully deleted.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  // Reset Password Form
  const resetPasswordForm = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { userId: number, newPassword: string }) => {
      const response = await apiRequest('POST', `/api/users/${data.userId}/reset-password`, { 
        newPassword: data.newPassword 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setResetPasswordDialogOpen(false);
      setSelectedUser(null);
      resetPasswordForm.reset();
      toast({
        title: 'Password Reset',
        description: 'The user password has been successfully reset.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to reset password: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });
  
  const onAddUserSubmit = (data: UserFormValues) => {
    const { confirmPassword, ...userData } = data;
    addUserMutation.mutate(userData);
  };
  
  const onEditUserSubmit = (data: UserFormValues) => {
    if (!selectedUser) return;
    
    const { confirmPassword, ...userData } = data;
    
    // Only include fields that have changed
    const changedData: Partial<typeof userData> = {};
    if (userData.username !== selectedUser.username) changedData.username = userData.username;
    if (userData.email !== selectedUser.email) changedData.email = userData.email;
    if (userData.fullName !== selectedUser.fullName) changedData.fullName = userData.fullName;
    if (userData.role !== selectedUser.role) changedData.role = userData.role;
    
    // Only include password if it's not empty
    if (userData.password) changedData.password = userData.password;
    
    // Don't send empty update
    if (Object.keys(changedData).length === 0) {
      setEditUserDialogOpen(false);
      return;
    }
    
    editUserMutation.mutate({ id: selectedUser.id, userData: changedData });
  };
  
  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };
  
  const handleResetPassword = (data: z.infer<typeof resetPasswordSchema>) => {
    if (selectedUser) {
      resetPasswordMutation.mutate({ 
        userId: selectedUser.id, 
        newPassword: data.newPassword 
      });
    }
  };
  
  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="User Management" />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage users with access to the monitoring system</p>
          </div>
          <Button onClick={() => setAddUserDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              Manage user accounts and their permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users?.length ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {user.role === 'admin' ? (
                            <span className="bg-primary/20 text-primary text-xs rounded-full px-2 py-1 font-medium">
                              Administrator
                            </span>
                          ) : (
                            <span className="bg-muted text-muted-foreground text-xs rounded-full px-2 py-1 font-medium">
                              User
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
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
                                setSelectedUser(user);
                                setEditUserDialogOpen(true);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setResetPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setSelectedUser(user);
                                setDeleteUserDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with appropriate permissions.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addUserForm}>
            <form onSubmit={addUserForm.handleSubmit(onAddUserSubmit)} className="space-y-4">
              <FormField
                control={addUserForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addUserForm.control}
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
                  control={addUserForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={addUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Administrators have full access to all features.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={addUserMutation.isPending}>
                  {addUserMutation.isPending ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(onEditUserSubmit)} className="space-y-4">
              <FormField
                control={editUserForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editUserForm.control}
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
                control={editUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editUserForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} placeholder="Leave blank to keep current" />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Leave blank to keep current password
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editUserForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} placeholder="Leave blank to keep current" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editUserForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Administrators have full access to all features.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={editUserMutation.isPending}>
                  {editUserMutation.isPending ? 'Updating...' : 'Update User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="py-4">
              <p><strong>Name:</strong> {selectedUser.fullName}</p>
              <p><strong>Username:</strong> {selectedUser.username}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset User Password</DialogTitle>
            <DialogDescription>
              Set a new password for user {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...resetPasswordForm}>
            <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4 py-4">
              <FormField
                control={resetPasswordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={resetPasswordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => {
                  resetPasswordForm.reset();
                  setResetPasswordDialogOpen(false);
                }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={resetPasswordMutation.isPending}
                >
                  {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
