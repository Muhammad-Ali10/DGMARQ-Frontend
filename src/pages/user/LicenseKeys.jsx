import { useQuery, useMutation } from '@tanstack/react-query';
import { licenseKeyAPI } from '@services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { LicenseKeysModal } from '@features/seller';
import { Key, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '@components/common/Pagination';
import { EmptyState, TableEmptyRow } from '@components/common/EmptyState';
import SafeImage from '@components/ui/safe-image';

const buildLicenseDetailsFromReveal = (data) => {
  if (!data) return [];

  const isAccount =
    data.keyType === 'account' ||
    (typeof data.keyData === 'object' && data.keyData !== null) ||
    (typeof data.keyData === 'string' && data.keyData.trim().startsWith('{'));

  let keyEntry = '';
  if (typeof data.keyData === 'object' && data.keyData !== null) {
    keyEntry = JSON.stringify(data.keyData);
  } else {
    keyEntry = String(data.keyData ?? data.key ?? '');
  }

  return [
    {
      productName: data.productName || 'Product',
      productType: isAccount ? 'ACCOUNT_BASED' : 'LICENSE_KEY',
      keys: keyEntry ? [keyEntry] : [],
      refunded: false,
    },
  ];
};

const LicenseKeys = () => {
  const [revealDetails, setRevealDetails] = useState(null);
  const [isRevealOpen, setIsRevealOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { data: licenseKeysData, isLoading, isError, error } = useQuery({
    queryKey: ['license-keys', page],
    queryFn: () => licenseKeyAPI.getMyLicenseKeys({ page, limit: 10 }).then(res => res.data.data),
    retry: 2,
  });

  const licenseKeys = Array.isArray(licenseKeysData?.keys)
    ? licenseKeysData.keys.filter((key) => key && typeof key === 'object')
    : [];
  const pagination = licenseKeysData?.pagination || {};

  const revealMutation = useMutation({
    mutationFn: async (keyId) => {
      const response = await licenseKeyAPI.revealLicenseKey(keyId);
      return response.data.data;
    },
    onSuccess: (data) => {
      setRevealDetails(buildLicenseDetailsFromReveal(data));
      setIsRevealOpen(true);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reveal license key');
    },
  });

  const handleReveal = (keyId) => {
    revealMutation.mutate(keyId);
  };

  const getDisplayOrderId = (key) => {
    const orderNumber = typeof key?.orderNumber === 'string' ? key.orderNumber.trim() : '';
    if (orderNumber) return `#${orderNumber}`;

    const rawOrderId = key?.orderId?.toString?.() || '';
    return rawOrderId ? `#${rawOrderId.slice(-8).toUpperCase()}` : '-';
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
                  licenseKeys.map((key, index) => (
                    <TableRow key={key.keyId || key._id || `license-key-${index}`} className="border-gray-700">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {key.productImage && (
                            <SafeImage
                              src={key.productImage}
                              alt={key.productName || 'Product'}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium text-white">{key.productName || 'Product'}</p>
                            {/* Was a second copy of keyType, which the "Type" column
                                already shows — reused for seller attribution. */}
                            <p className="text-sm text-gray-400">Sold by {key.sellerName || 'Seller'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {getDisplayOrderId(key)}
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
                          onClick={() => handleReveal(key?.keyId || key?._id)}
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
                  <TableEmptyRow colSpan={5}>
                    <EmptyState icon={Key} title="No license keys found" className="py-0" />
                  </TableEmptyRow>
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination page={page} totalPages={pagination.pages || 1} onPageChange={setPage} total={pagination.total || 0} totalNoun="keys" />
        </CardContent>
      </Card>

      <LicenseKeysModal
        open={isRevealOpen}
        onOpenChange={(open) => {
          setIsRevealOpen(open);
          if (!open) setRevealDetails(null);
        }}
        licenseDetails={revealDetails}
        loading={revealMutation.isPending}
        footerNote="Please save this key or account information securely. It may not be shown again."
      />
    </div>
  );
};

export default LicenseKeys;

