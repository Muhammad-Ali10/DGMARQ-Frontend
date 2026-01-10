import { useQuery } from '@tanstack/react-query';
import { disputeAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Eye, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';

const SellerDisputes = () => {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);

  const { data: disputes, isLoading, isError } = useQuery({
    queryKey: ['seller-disputes'],
    queryFn: () => disputeAPI.getSellerDisputes().then(res => res.data.data),
  });

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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Disputes</h1>
        <p className="text-gray-400 mt-1">View disputes related to your products</p>
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
                        {dispute.orderId ? `#${dispute.orderId.slice(-8)}` : '-'}
                      </TableCell>
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
                    <TableCell colSpan={6} className="text-center text-gray-400 py-8">
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

export default SellerDisputes;

