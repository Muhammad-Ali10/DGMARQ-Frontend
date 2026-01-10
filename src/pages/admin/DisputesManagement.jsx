import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputeAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Eye, CheckCircle2, XCircle } from 'lucide-react';

const DisputesManagement = () => {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [statusData, setStatusData] = useState({ status: '', resolution: '' });
  const queryClient = useQueryClient();

  const { data: disputes, isLoading, isError, error } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      try {
        const response = await disputeAPI.getAllDisputes();
        return response.data.data;
      } catch (err) {
        console.error('Disputes error:', err);
        throw err;
      }
    },
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: ({ disputeId, data }) => disputeAPI.updateDispute(disputeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-disputes']);
      setIsUpdateOpen(false);
      setSelectedDispute(null);
    },
  });

  const handleUpdate = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      disputeId: selectedDispute._id,
      data: statusData,
    });
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
  if (isError) return <ErrorMessage message={error?.response?.data?.message || "Error loading disputes"} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Disputes Management</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Manage customer and seller disputes</p>
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
                  <TableHead className="text-gray-300">User</TableHead>
                  <TableHead className="text-gray-300">Order</TableHead>
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
                      <TableCell className="text-gray-400">
                        {dispute.userId?.name || dispute.userId?.email || 'N/A'}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {dispute.orderId ? `#${dispute.orderId.slice(-8)}` : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                      <TableCell className="text-gray-400">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setStatusData({ status: dispute.status, resolution: dispute.resolution || '' });
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
                    <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                      No disputes found
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
            <DialogTitle className="text-white">Dispute Details</DialogTitle>
          </DialogHeader>
          {selectedDispute && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Description</Label>
                <p className="text-white mt-1">{selectedDispute.description || 'No description'}</p>
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

      {/* Update Dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Update Dispute Status</DialogTitle>
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
                <option value="open">Open</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolution" className="text-gray-300">Resolution</Label>
              <Input
                id="resolution"
                value={statusData.resolution}
                onChange={(e) => setStatusData({ ...statusData, resolution: e.target.value })}
                className="bg-secondary border-gray-700 text-white"
                placeholder="Enter resolution details"
              />
            </div>
            <Button type="submit" disabled={updateMutation.isPending} className="w-full bg-accent hover:bg-blue-700">
              {updateMutation.isPending ? 'Updating...' : 'Update Dispute'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisputesManagement;

