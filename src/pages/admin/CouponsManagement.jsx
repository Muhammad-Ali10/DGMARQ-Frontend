import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponAPI } from '@services/api';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { TableEmptyRow } from '@components/common/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@components/ui/dialog';
import { Badge } from '@components/ui/badge';
import { Loading, ErrorMessage } from '@components/ui/loading';
import { Pagination } from '@components/common/Pagination';
import ConfirmationModal from '@components/common/ConfirmationModal';
import { showSuccess, showApiError } from '@utils/toast';
import { Plus, Edit, Trash2, Power } from 'lucide-react';

const PAGE_SIZE = 20;

const EMPTY_FORM = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxDiscountAmount: '',
  startDate: '',
  endDate: '',
  usageLimit: '',
  isActive: true,
};

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

const CouponFields = ({ formData, setFormData, idPrefix, codeReadOnly = false }) => {
  const field = (key) => ({
    id: `${idPrefix}${key}`,
    value: formData[key],
    onChange: (e) => setFormData((prev) => ({ ...prev, [key]: e.target.value })),
    className: 'bg-secondary border-gray-700 text-white',
  });

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}code`} className="text-gray-300">Coupon Code *</Label>
        <Input
          {...field('code')}
          onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
          readOnly={codeReadOnly}
          disabled={codeReadOnly}
          required
        />
        {codeReadOnly && <p className="text-xs text-gray-500">The code can&apos;t be changed after creation.</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}discountType`} className="text-gray-300">Discount Type *</Label>
          <select
            {...field('discountType')}
            className="w-full px-3 py-2 bg-secondary border border-gray-700 rounded-md text-white"
            required
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}discountValue`} className="text-gray-300">Discount Value *</Label>
          <Input {...field('discountValue')} type="number" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}minOrderAmount`} className="text-gray-300">Min order ($)</Label>
          <Input {...field('minOrderAmount')} type="number" min="0" step="0.01" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}maxDiscountAmount`} className="text-gray-300">Max discount ($)</Label>
          <Input {...field('maxDiscountAmount')} type="number" min="0" step="0.01" placeholder="No cap" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}startDate`} className="text-gray-300">Valid from</Label>
          <Input {...field('startDate')} type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}endDate`} className="text-gray-300">Valid until</Label>
          <Input {...field('endDate')} type="date" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}usageLimit`} className="text-gray-300">Usage Limit</Label>
        <Input {...field('usageLimit')} type="number" />
      </div>
    </>
  );
};

const CouponsManagement = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['coupons', page],
    queryFn: () => couponAPI.getAllCoupons({ page, limit: PAGE_SIZE }).then((res) => res.data.data),
    placeholderData: keepPreviousData,
  });

  const coupons = data?.coupons || [];
  const totalPages = data?.pagination?.pages || 1;

  const createMutation = useMutation({
    mutationFn: (payload) => couponAPI.createCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsCreateOpen(false);
      setFormData(EMPTY_FORM);
      setPage(1);
      showSuccess('Coupon created');
    },
    onError: (err) => showApiError(err, 'Failed to create coupon'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ couponId, data: payload }) => couponAPI.updateCoupon(couponId, payload),
    onSuccess: (_, { data: payload }) => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsEditOpen(false);
      setSelectedCoupon(null);
      if (Object.keys(payload).length === 1 && 'isActive' in payload) {
        showSuccess(payload.isActive ? 'Coupon activated' : 'Coupon deactivated');
        return;
      }
      showSuccess('Coupon updated');
    },
    onError: (err) => showApiError(err, 'Failed to update coupon'),
  });

  const deleteMutation = useMutation({
    mutationFn: (couponId) => couponAPI.deleteCoupon(couponId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      if (coupons.length === 1 && page > 1) setPage(page - 1);
      showSuccess('Coupon deleted');
    },
    onError: (err) => showApiError(err, 'Failed to delete coupon'),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const { code: _code, ...rest } = formData;
    updateMutation.mutate({ couponId: selectedCoupon._id, data: rest });
  };

  const openEdit = (coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || '',
      maxDiscountAmount: coupon.maxDiscountAmount || '',
      startDate: toDateInput(coupon.startDate),
      endDate: toDateInput(coupon.endDate),
      usageLimit: coupon.usageLimit || '',
      isActive: coupon.isActive,
    });
    setIsEditOpen(true);
  };

  if (isLoading && !data) return <Loading message="Loading coupons..." />;
  if (isError) return <ErrorMessage message={error?.response?.data?.message || 'Error loading coupons'} />;

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Coupons Management</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">Manage discount coupons</p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (open) setFormData(EMPTY_FORM);
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent size="lg" className="">
            <DialogHeader>
              <DialogTitle className="text-white">Create Coupon</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <CouponFields formData={formData} setFormData={setFormData} idPrefix="" />
              <Button type="submit" disabled={createMutation.isPending} className="w-full bg-accent hover:bg-blue-700">
                {createMutation.isPending ? 'Creating...' : 'Create Coupon'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card variant="hud">
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table variant="hud">
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
                {coupons.length > 0 ? (
                  coupons.map((coupon) => (
                    <TableRow key={coupon._id} className="border-gray-700">
                      <TableCell className="text-white font-mono font-semibold">{coupon.code}</TableCell>
                      <TableCell className="text-white">
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}%`
                          : `$${coupon.discountValue}`}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {coupon.minOrderAmount ? `$${coupon.minOrderAmount}` : '-'}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {coupon.endDate ? new Date(coupon.endDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : '-'}
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
                          <Button size="sm" variant="outline" title="Edit coupon" onClick={() => openEdit(coupon)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            title={coupon.isActive ? 'Deactivate' : 'Activate'}
                            disabled={updateMutation.isPending}
                            onClick={() => updateMutation.mutate({ couponId: coupon._id, data: { isActive: !coupon.isActive } })}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" title="Delete coupon" onClick={() => setPendingDelete(coupon)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmptyRow colSpan={7}>No coupons found</TableEmptyRow>
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination variant="numbered" page={page} totalPages={totalPages} onPageChange={setPage} />
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent size="lg" className="">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Coupon</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <CouponFields formData={formData} setFormData={setFormData} idPrefix="edit-" codeReadOnly />
            <Button type="submit" disabled={updateMutation.isPending} className="w-full bg-accent hover:bg-blue-700">
              {updateMutation.isPending ? 'Updating...' : 'Update Coupon'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={!!pendingDelete}
        onOpenChange={(open) => { if (!open) setPendingDelete(null); }}
        title="Delete coupon?"
        description={`Coupon ${pendingDelete?.code || ''} will be permanently deleted. This cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={() => deleteMutation.mutate(pendingDelete._id)}
      />
    </div>
  );
};

export default CouponsManagement;
