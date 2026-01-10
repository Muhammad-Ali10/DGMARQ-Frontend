import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnRefundAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Eye, DollarSign } from 'lucide-react';

const ReturnRefundManagement = () => {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [statusData, setStatusData] = useState({ status: '', adminNotes: '' });
  const queryClient = useQueryClient();

  const { data: refunds, isLoading, isError } = useQuery({
    queryKey: ['admin-refunds'],
    queryFn: () => returnRefundAPI.getAllRefunds().then(res => res.data.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ refundId, data }) => returnRefundAPI.updateRefundStatus(refundId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-refunds']);
      setIsUpdateOpen(false);
      setSelectedRefund(null);
    },
  });

  const handleUpdate = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      refundId: selectedRefund._id,
      data: statusData,
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      rejected: 'destructive',
      processed: 'default',
      cancelled: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (isLoading) return <Loading message="Loading refunds..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading refunds"} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Return/Refund Management</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Manage return and refund requests</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Refund Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">ID</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">User</TableHead>
                  <TableHead className="text-gray-300">Order</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {refunds?.refunds?.length > 0 ? (
                  refunds.refunds.map((refund) => (
                    <TableRow key={refund._id} className="border-gray-700">
                      <TableCell className="text-white font-mono text-sm">
                        {refund._id.slice(-8)}
                      </TableCell>
                      <TableCell className="text-gray-400">{refund.type || 'Refund'}</TableCell>
                      <TableCell className="text-gray-400">
                        {refund.userId?.name || refund.userId?.email || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {refund.orderId ? `#${refund.orderId.slice(-8)}` : '-'}
                      </TableCell>
                      <TableCell className="text-white font-semibold">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        {refund.amount?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell>{getStatusBadge(refund.status)}</TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setIsViewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRefund(refund);
                              setStatusData({ status: refund.status, adminNotes: refund.adminNotes || '' });
                              setIsUpdateOpen(true);
                            }}
                          >
                            Update
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                      No refund requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="bg-primary border-gray-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Refund Details</DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Reason</Label>
                <p className="text-white mt-1">{selectedRefund.reason || 'No reason provided'}</p>
              </div>
              <div>
                <Label className="text-gray-300">Amount</Label>
                <p className="text-white mt-1 font-semibold text-lg">
                  ${selectedRefund.amount?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <Label className="text-gray-300">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedRefund.status)}</div>
              </div>
              {selectedRefund.adminNotes && (
                <div>
                  <Label className="text-gray-300">Admin Notes</Label>
                  <p className="text-white mt-1">{selectedRefund.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Update Refund Status</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-300">Status</Label>
              <select
                id="status"
                value={statusData.status}
                onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white"
                required
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="processed">Processed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminNotes" className="text-gray-300">Admin Notes</Label>
              <Input
                id="adminNotes"
                value={statusData.adminNotes}
                onChange={(e) => setStatusData({ ...statusData, adminNotes: e.target.value })}
                className="bg-secondary border-gray-700 text-white"
                placeholder="Enter admin notes"
              />
            </div>
            <Button type="submit" disabled={updateMutation.isPending} className="w-full bg-accent hover:bg-blue-700">
              {updateMutation.isPending ? 'Updating...' : 'Update Refund'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReturnRefundManagement;

