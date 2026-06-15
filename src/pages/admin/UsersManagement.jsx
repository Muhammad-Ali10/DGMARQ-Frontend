import { useState, useRef, useMemo, useCallback, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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

// Pure helpers hoisted to module scope so they keep a stable identity and can be
// shared with the memoized row component below (avoids re-creating per render).
const isUserActive = (user) => user.isActive !== false;
const getUserRoles = (user) => (Array.isArray(user.roles) ? user.roles : []);
const isAdminUser = (user) => getUserRoles(user).includes('admin');
const getUserId = (user) => user._id || user.id;

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

// Memoized row so unrelated state changes (filters, dialogs, pagination) don't
// force every visible row to re-render. Only re-renders when its `user` or the
// pending flags actually change.
const UserRow = memo(function UserRow({
  user,
  onBanClick,
  onUnbanClick,
  banPending,
  unbanPending,
}) {
  const active = isUserActive(user);
  const userId = getUserId(user);
  return (
    <TableRow key={userId} className="border-gray-700 hover:bg-gray-800">
      <TableCell className="text-white font-medium">{user.name || 'N/A'}</TableCell>
      <TableCell className="text-gray-300">{user.email}</TableCell>
      <TableCell>{getRoleBadges(user.roles)}</TableCell>
      <TableCell>
        <Badge variant={active ? 'success' : 'destructive'}>
          {active ? 'Active' : 'Banned'}
        </Badge>
      </TableCell>
      <TableCell className="text-gray-300">
        {new Date(user.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {active ? (
            isAdminUser(user) ? (
              <span className="text-xs text-gray-500 self-center">Protected</span>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onBanClick(userId)}
                disabled={banPending}
              >
                <UserX className="h-4 w-4 mr-1" />
                Ban
              </Button>
            )
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => onUnbanClick(userId)}
              disabled={unbanPending}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Unban
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

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
      const response = await adminAPI.getAllUsers({ 
        page, 
        limit: 10, 
        role: roleFilter || undefined,
        isActive: statusFilter || undefined,
      });
      return response.data.data;
    },
    retry: 1,
  });

  const banMutation = useMutation({
    mutationFn: ({ userId, reason }) => adminAPI.banUser(userId, { action: 'ban', reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setUnbanDialogOpen(false);
      setSelectedUserId(null);
      showSuccess('User unbanned successfully');
    },
    onError: (err) => {
      showApiError(err, 'Failed to unban user');
    },
  });

  const handleBanClick = useCallback((userId) => {
    setSelectedUserId(userId);
    setBanDialogOpen(true);
  }, []);

  const handleUnbanClick = useCallback((userId) => {
    setSelectedUserId(userId);
    setUnbanDialogOpen(true);
  }, []);

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

  // Derived data memoized so it isn't recomputed on every unrelated re-render.
  const users = useMemo(() => usersData?.users || [], [usersData]);
  const pagination = usersData?.pagination || {};
  const totalItems = pagination.total ?? users.length;
  const totalPages = pagination.pages ?? 1;
  const showPagination = totalItems > 0;

  // Windowed (virtualized) rendering of the rows. The scroll container only
  // mounts the rows in/near the viewport; spacer <tr>s above and below reserve
  // the height of the off-screen rows so scroll position and column widths stay
  // identical to a plain table (same columns, ordering, filtering, actions).
  // NOTE: rows are server-paginated (limit 10), so today only a small window is
  // ever fetched — virtualization is in place so larger page sizes scale.
  const scrollContainerRef = useRef(null);
  const ROW_HEIGHT = 57; // approximate height of a data row (px)
  const rowVirtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0;

  if (isLoading) return <Loading message="Loading users..." />;
  if (isError) return <ErrorMessage message={`Error loading users: ${error.message}`} />;

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
              <div
                ref={scrollContainerRef}
                className="overflow-auto max-h-[70vh]"
              >
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
                    {paddingTop > 0 && (
                      <tr aria-hidden="true">
                        <td colSpan={6} style={{ height: `${paddingTop}px`, padding: 0, border: 0 }} />
                      </tr>
                    )}
                    {virtualRows.map((virtualRow) => {
                      const user = users[virtualRow.index];
                      return (
                        <UserRow
                          key={getUserId(user)}
                          user={user}
                          onBanClick={handleBanClick}
                          onUnbanClick={handleUnbanClick}
                          banPending={banMutation.isPending}
                          unbanPending={unbanMutation.isPending}
                        />
                      );
                    })}
                    {paddingBottom > 0 && (
                      <tr aria-hidden="true">
                        <td colSpan={6} style={{ height: `${paddingBottom}px`, padding: 0, border: 0 }} />
                      </tr>
                    )}
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
