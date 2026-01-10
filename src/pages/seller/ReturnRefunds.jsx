import { useQuery } from '@tanstack/react-query';
import { returnRefundAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Eye, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';

const SellerReturnRefunds = () => {
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);

  const { data: refunds, isLoading, isError } = useQuery({
    queryKey: ['seller-refunds'],
    queryFn: () => returnRefundAPI.getSellerRefunds().then(res => res.data.data),
  });

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
  if (isError) return <ErrorMessage message="Error loading refunds" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Return/Refund Requests</h1>
        <p className="text-gray-400 mt-1">View refund requests for your products</p>
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
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                      No refund requests found
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
    </div>
  );
};

export default SellerReturnRefunds;

