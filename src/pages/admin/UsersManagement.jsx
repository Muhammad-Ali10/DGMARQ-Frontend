import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../services/api';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { UserX, UserCheck, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { showSuccess, showError, showApiError } from '../../utils/toast';

const UsersManagement = () => {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [banReason, setBanReason] = useState('');
  const queryClient = useQueryClient();

  const { data: usersData, isLoading, isError, error } = useQuery({
    queryKey: ['admin-users', page, roleFilter, statusFilter],
    queryFn: async () => {
      try {
        const response = await adminAPI.getAllUsers({ 
          page, 
          limit: 10, 
          role: roleFilter || undefined,
          isActive: statusFilter || undefined,
        });
        return response.data.data;
      } catch (err) {
        throw err;
      }
    },
    retry: 1,
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, reason }) => adminAPI.banUser(userId, { action: 'ban', reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setBanDialogOpen(false);
      setBanReason('');
      setSelectedUserId(null);
      showSuccess('User banned successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to ban user');
    },
  });

  const unbanMutation = useMutation({
    mutationFn: (userId) => adminAPI.banUser(userId, { action: 'unban' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      setUnbanDialogOpen(false);
      setSelectedUserId(null);
      showSuccess('User unbanned successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to unban user');
    },
  });

  const handleBanClick = (userId) => {
    setSelectedUserId(userId);
    setBanDialogOpen(true);
  };

  const handleUnbanClick = (userId) => {
    setSelectedUserId(userId);
    setUnbanDialogOpen(true);
  };

  const handleBan = () => {
    if (banReason.trim() && selectedUserId) {
      banMutation.mutate({ userId: selectedUserId, reason: banReason });
    } else {
      showError('Please provide a reason for banning');
    }
  };

  const handleUnban = () => {
    if (selectedUserId) {
      unbanMutation.mutate(selectedUserId);
    }
  };

  if (isLoading) return <Loading message="Loading users..." />;
  if (isError) return <ErrorMessage message={`Error loading users: ${error.message}`} />;

  const users = usersData?.users || [];
  const pagination = usersData?.pagination || {};
  const totalItems = pagination.total ?? users.length;
  const totalPages = pagination.pages ?? 1;
  const showPagination = totalItems > 0;

  const getRoleBadges = (roles) => {
    if (!roles || roles.length === 0) {
      return <Badge variant="secondary" className="capitalize">Customer</Badge>;
    }
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const roleVariants = {
      admin: 'destructive',
      seller: 'default',
      customer: 'secondary',
    };

    // Show all roles, prioritizing admin > seller > customer
    const sortedRoles = roleArray.sort((a, b) => {
      const priority = { admin: 1, seller: 2, customer: 3 };
      return (priority[a] || 99) - (priority[b] || 99);
    });

    return (
      <div className="flex flex-wrap gap-1">
        {sortedRoles.map((role, index) => (
          <Badge 
            key={index} 
            variant={roleVariants[role] || 'secondary'}
            className="capitalize text-xs"
          >
            {role}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Users Management</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Manage platform users</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Users
          </CardTitle>
          <div className="flex gap-2">
            <Select value={roleFilter || "all"} onValueChange={(value) => { setRoleFilter(value === "all" ? "" : value); setPage(1); }}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter || "all"} onValueChange={(value) => { setStatusFilter(value === "all" ? "" : value); setPage(1); }}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No users found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800">
                      <TableHead className="text-gray-300">Name</TableHead>
                      <TableHead className="text-gray-300">Email</TableHead>
                      <TableHead className="text-gray-300">Role</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Joined</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user._id} className="border-gray-700 hover:bg-gray-800">
                        <TableCell className="text-white font-medium">{user.name || 'N/A'}</TableCell>
                        <TableCell className="text-gray-300">{user.email}</TableCell>
                        <TableCell>{getRoleBadges(user.roles)}</TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'success' : 'destructive'}>
                            {user.isActive ? 'Active' : 'Banned'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {user.isActive ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleBanClick(user._id)}
                                disabled={banMutation.isPending}
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Ban
                              </Button>
                            ) : (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleUnbanClick(user._id)}
                                disabled={unbanMutation.isPending}
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Unban
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {showPagination && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-700">
                  <span className="text-sm text-gray-400">
                    Page {page} of {totalPages} ({totalItems} total)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-gray-300 text-sm px-2">Page {page} of {totalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent size="sm" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Ban User
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Please provide a reason for banning this user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="banReason" className="text-gray-300">Ban Reason</Label>
              <Textarea
                id="banReason"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Enter reason for banning this user"
                className="bg-gray-800 border-gray-700 text-white"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setBanDialogOpen(false);
              setBanReason('');
              setSelectedUserId(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={!banReason.trim() || banMutation.isPending}
            >
              {banMutation.isPending ? 'Banning...' : 'Confirm Ban'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban Dialog */}
      <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
        <DialogContent size="sm" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Unban User
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to unban this user?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUnbanDialogOpen(false);
              setSelectedUserId(null);
            }}>
              Cancel
            </Button>
            <Button
              onClick={handleUnban}
              disabled={unbanMutation.isPending}
            >
              {unbanMutation.isPending ? 'Unbanning...' : 'Confirm Unban'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;
