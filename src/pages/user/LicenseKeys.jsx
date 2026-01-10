import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { licenseKeyAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Key, Eye, Copy, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const LicenseKeys = () => {
  const [revealedKey, setRevealedKey] = useState(null);
  const [isRevealOpen, setIsRevealOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: licenseKeysData, isLoading, isError, error } = useQuery({
    queryKey: ['license-keys', page],
    queryFn: () => licenseKeyAPI.getMyLicenseKeys({ page, limit: 20 }).then(res => res.data.data),
    retry: 2,
  });

  const licenseKeys = licenseKeysData?.keys || [];
  const pagination = licenseKeysData?.pagination || {};

  const revealMutation = useMutation({
    mutationFn: async (keyId) => {
      const response = await licenseKeyAPI.revealLicenseKey(keyId);
      return response.data.data;
    },
    onSuccess: (data) => {
      setRevealedKey(data);
      setIsRevealOpen(true);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reveal license key');
    },
  });

  const handleReveal = (keyId) => {
    revealMutation.mutate(keyId);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) return <Loading message="Loading license keys..." />;
  if (isError) {
    const errorMessage = error?.response?.data?.message || error?.message || "Error loading license keys";
    return <ErrorMessage message={errorMessage} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My License Keys</h1>
        <p className="text-gray-400 mt-1">View and manage your license keys</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">License Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Product</TableHead>
                  <TableHead className="text-gray-300">Order</TableHead>
                  <TableHead className="text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-300">Purchased</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenseKeys && Array.isArray(licenseKeys) && licenseKeys.length > 0 ? (
                  licenseKeys.map((key) => (
                    <TableRow key={key._id} className="border-gray-700">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {key.productImage && (
                            <img
                              src={key.productImage}
                              alt={key.productName || 'Product'}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium text-white">{key.productName || 'Product'}</p>
                            <p className="text-sm text-gray-400">{key.keyType || 'License Key'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {key.orderId ? `#${key.orderId.toString().slice(-8)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-600 text-white capitalize">
                          {key.keyType || 'License Key'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {key.purchaseDate || key.orderDate ? new Date(key.purchaseDate || key.orderDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReveal(key.keyId || key._id)}
                          disabled={revealMutation.isPending}
                          className="border-gray-700 text-gray-300"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Reveal
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                      <Key className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                      <p>No license keys found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">
                Page {pagination.page || page} of {pagination.pages || 1} 
                ({pagination.total || 0} total keys)
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-gray-700 text-gray-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(p => Math.min(pagination.pages || 1, p + 1))}
                  disabled={page >= (pagination.pages || 1)}
                  className="border-gray-700 text-gray-300"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reveal Dialog */}
      <Dialog open={isRevealOpen} onOpenChange={setIsRevealOpen}>
        <DialogContent className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">License Key</DialogTitle>
          </DialogHeader>
          {revealedKey && (
            <div className="space-y-4">
              <div className="bg-secondary p-4 rounded-lg">
                <p className="text-gray-300 mb-2 text-sm">
                  {typeof revealedKey.keyData === 'object' ? 'Account Credentials:' : 'Your License Key:'}
                </p>
                <div className="space-y-2">
                  {typeof revealedKey.keyData === 'object' ? (
                    // Account credentials display
                    <div className="space-y-2">
                      {revealedKey.keyData.email && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Email:</p>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-mono text-sm flex-1 break-all">{revealedKey.keyData.email}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopy(revealedKey.keyData.email)}
                              className="border-gray-700 text-gray-300"
                            >
                              {copied ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      {revealedKey.keyData.password && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Password:</p>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-mono text-sm flex-1 break-all">{revealedKey.keyData.password}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopy(revealedKey.keyData.password)}
                              className="border-gray-700 text-gray-300"
                            >
                              {copied ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      {revealedKey.keyData.username && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Username:</p>
                          <p className="text-white font-mono text-sm">{revealedKey.keyData.username}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    // License key display
                    <div className="flex items-center gap-2">
                      <p className="text-white font-mono text-lg flex-1 break-all">{revealedKey.keyData || revealedKey.key}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(revealedKey.keyData || revealedKey.key)}
                        className="border-gray-700 text-gray-300"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400">
                ⚠️ Please save this {typeof revealedKey.keyData === 'object' ? 'information' : 'key'} securely. It will not be shown again.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LicenseKeys;

