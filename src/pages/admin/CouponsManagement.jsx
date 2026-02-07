import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponAPI } from '../../services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Plus, Edit, Trash2 } from 'lucide-react';

const CouponsManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minPurchase: '',
    maxDiscount: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    isActive: true,
  });
  const queryClient = useQueryClient();

  const { data: coupons, isLoading, isError } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => couponAPI.getAllCoupons().then(res => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => couponAPI.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coupons']);
      setIsCreateOpen(false);
      setFormData({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minPurchase: '',
        maxDiscount: '',
        validFrom: '',
        validUntil: '',
        usageLimit: '',
        isActive: true,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ couponId, data }) => couponAPI.updateCoupon(couponId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['coupons']);
      setIsEditOpen(false);
      setSelectedCoupon(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (couponId) => couponAPI.deleteCoupon(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries(['coupons']);
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      couponId: selectedCoupon._id,
      data: formData,
    });
  };

  if (isLoading) return <Loading message="Loading coupons..." />;
  if (isError) return <ErrorMessage message="Error loading coupons" />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Coupons Management</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Manage discount coupons</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent size="lg" className="bg-primary border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create Coupon</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-gray-300">Coupon Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="bg-secondary border-gray-700 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType" className="text-gray-300">Discount Type *</Label>
                  <select
                    id="discountType"
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white"
                    required
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue" className="text-gray-300">Discount Value *</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="bg-secondary border-gray-700 text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPurchase" className="text-gray-300">Min Purchase</Label>
                  <Input
                    id="minPurchase"
                    type="number"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    className="bg-secondary border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDiscount" className="text-gray-300">Max Discount</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="bg-secondary border-gray-700 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validFrom" className="text-gray-300">Valid From</Label>
                  <Input
                    id="validFrom"
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="bg-secondary border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil" className="text-gray-300">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="bg-secondary border-gray-700 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="usageLimit" className="text-gray-300">Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  className="bg-secondary border-gray-700 text-white"
                />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full bg-accent hover:bg-blue-700">
                {createMutation.isPending ? 'Creating...' : 'Create Coupon'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Code</TableHead>
                  <TableHead className="text-gray-300">Discount</TableHead>
                  <TableHead className="text-gray-300">Min Purchase</TableHead>
                  <TableHead className="text-gray-300">Valid Until</TableHead>
                  <TableHead className="text-gray-300">Usage</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons?.coupons?.length > 0 ? (
                  coupons.coupons.map((coupon) => (
                    <TableRow key={coupon._id} className="border-gray-700">
                      <TableCell className="text-white font-mono font-semibold">{coupon.code}</TableCell>
                      <TableCell className="text-white">
                        {coupon.discountType === 'percentage' 
                          ? `${coupon.discountValue}%` 
                          : `$${coupon.discountValue}`}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {coupon.minPurchase ? `$${coupon.minPurchase}` : '-'}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.isActive ? 'success' : 'destructive'}>
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCoupon(coupon);
                              setFormData({
                                code: coupon.code,
                                discountType: coupon.discountType,
                                discountValue: coupon.discountValue,
                                minPurchase: coupon.minPurchase || '',
                                maxDiscount: coupon.maxDiscount || '',
                                validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : '',
                                validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 16) : '',
                                usageLimit: coupon.usageLimit || '',
                                isActive: coupon.isActive,
                              });
                              setIsEditOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                                deleteMutation.mutate(coupon._id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                      No coupons found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent size="lg" className="bg-primary border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Coupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code" className="text-gray-300">Coupon Code *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="bg-secondary border-gray-700 text-white"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-discountType" className="text-gray-300">Discount Type *</Label>
                <select
                  id="edit-discountType"
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white"
                  required
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-discountValue" className="text-gray-300">Discount Value *</Label>
                <Input
                  id="edit-discountValue"
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="bg-secondary border-gray-700 text-white"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={updateMutation.isPending} className="w-full bg-accent hover:bg-blue-700">
              {updateMutation.isPending ? 'Updating...' : 'Update Coupon'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsManagement;

