import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputeAPI, userAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Plus, Eye, AlertTriangle } from 'lucide-react';
import { showSuccess, showApiError } from '../../utils/toast';

const UserDisputes = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [formData, setFormData] = useState({
    orderId: '',
    type: '',
    reason: '',
    evidence: [],
  });
  const queryClient = useQueryClient();

  const { data: disputes, isLoading, isError } = useQuery({
    queryKey: ['user-disputes'],
    queryFn: () => disputeAPI.getMyDisputes().then(res => res.data.data),
  });

  // Fetch user's orders for the dropdown
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['user-orders-for-dispute'],
    queryFn: async () => {
      // Fetch all completed/paid orders that can have disputes
      const response = await userAPI.getMyOrders({ page: 1, limit: 1000, status: '' });
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => disputeAPI.createDispute(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-disputes']);
      setIsCreateOpen(false);
      setFormData({ orderId: '', type: '', reason: '', evidence: [] });
      showSuccess('Dispute created successfully');
    },
    onError: (error) => {
      showApiError(error, 'Failed to create dispute');
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: 'warning',
      resolved: 'success',
      closed: 'default',
      rejected: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (isLoading) return <Loading message="Loading disputes..." />;
  if (isError) return <ErrorMessage message="Error loading disputes" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">My Disputes</h1>
          <p className="text-gray-400 mt-1">Manage your order disputes</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Dispute
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-primary border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create Dispute</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderId" className="text-gray-300">Select Order *</Label>
                {ordersLoading ? (
                  <div className="text-gray-400 text-sm">Loading orders...</div>
                ) : (
                  <Select
                    value={formData.orderId}
                    onValueChange={(value) => setFormData({ ...formData, orderId: value })}
                    required
                  >
                    <SelectTrigger className="bg-secondary border-gray-700 text-white">
                      <SelectValue placeholder="Select an order" />
                    </SelectTrigger>
                    <SelectContent className="bg-primary border-gray-700">
                      {ordersData?.orders && ordersData.orders.length > 0 ? (
                        ordersData.orders
                          .filter(order => {
                            // Only show orders that don't already have a dispute
                            const hasDispute = disputes?.disputes?.some(
                              d => d.orderId?._id?.toString() === order._id?.toString() || 
                                   d.orderId?.toString() === order._id?.toString()
                            );
                            return !hasDispute && (order.orderStatus === 'completed' || order.orderStatus === 'processing');
                          })
                          .map((order) => {
                            const orderIdStr = order._id?.toString() || order._id;
                            return (
                              <SelectItem 
                                key={orderIdStr} 
                                value={orderIdStr}
                                className="text-white hover:bg-gray-700 focus:bg-gray-700"
                              >
                                <div className="flex flex-col">
                                  <span className="font-semibold">
                                    Order #{orderIdStr.slice(-8)}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(order.createdAt).toLocaleDateString()} • ${order.totalAmount?.toFixed(2) || '0.00'} • {order.orderStatus}
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })
                      ) : (
                        <SelectItem value="no-orders" disabled className="text-gray-400">
                          No orders available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
                {ordersData?.orders && ordersData.orders.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    You don't have any orders yet. Orders will appear here after you make a purchase.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-300">Type *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white"
                  required
                >
                  <option value="">Select type</option>
                  <option value="defective_product">Defective Product</option>
                  <option value="wrong_product">Wrong Product</option>
                  <option value="not_received">Not Received</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-gray-300">Reason *</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="bg-secondary border-gray-700 text-white"
                  required
                />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full bg-accent hover:bg-blue-700">
                {createMutation.isPending ? 'Creating...' : 'Create Dispute'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Disputes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">ID</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes?.disputes?.length > 0 ? (
                  disputes.disputes.map((dispute) => (
                    <TableRow key={dispute._id} className="border-gray-700">
                      <TableCell className="text-white font-mono text-sm">
                        {dispute._id.slice(-8)}
                      </TableCell>
                      <TableCell className="text-gray-400">{dispute.type || '-'}</TableCell>
                      <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setIsViewOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                      No disputes found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="bg-primary border-gray-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Dispute Details</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Description</Label>
                <p className="text-white mt-1">{selectedDispute.description || selectedDispute.reason || 'No description'}</p>
              </div>
              <div>
                <Label className="text-gray-300">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedDispute.status)}</div>
              </div>
              {selectedDispute.resolution && (
                <div>
                  <Label className="text-gray-300">Resolution</Label>
                  <p className="text-white mt-1">{selectedDispute.resolution}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDisputes;

