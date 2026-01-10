import { useQuery, useMutation } from '@tanstack/react-query';
import { checkoutAPI } from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

const Checkout = () => {
  const { checkoutId } = useParams();
  const navigate = useNavigate();

  const { data: checkout, isLoading, isError } = useQuery({
    queryKey: ['checkout', checkoutId],
    queryFn: () => checkoutAPI.getCheckoutStatus(checkoutId).then(res => res.data.data),
    enabled: !!checkoutId,
  });

  const cancelMutation = useMutation({
    mutationFn: () => checkoutAPI.cancelCheckout(checkoutId),
    onSuccess: () => {
      navigate('/user/cart');
    },
  });

  if (isLoading) return <Loading message="Loading checkout..." />;
  if (isError) return <ErrorMessage message="Error loading checkout" />;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-8 h-8 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Clock className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'success',
      pending: 'warning',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Checkout</h1>
        <p className="text-gray-400 mt-1">Review your checkout status</p>
      </div>

      <Card className="bg-primary border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Checkout Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center">
            {getStatusIcon(checkout?.status)}
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-2">Checkout {checkout?.status}</p>
            {getStatusBadge(checkout?.status)}
          </div>

          {checkout?.orderId && (
            <div className="bg-secondary p-4 rounded-lg">
              <p className="text-gray-300 mb-1">Order ID</p>
              <p className="text-white font-mono">{checkout.orderId}</p>
            </div>
          )}

          {checkout?.totalAmount && (
            <div className="bg-secondary p-4 rounded-lg">
              <p className="text-gray-300 mb-1">Total Amount</p>
              <p className="text-white text-2xl font-bold">${checkout.totalAmount.toFixed(2)}</p>
            </div>
          )}

          {checkout?.status === 'pending' && (
            <Button
              onClick={() => cancelMutation.mutate()}
              variant="destructive"
              className="w-full"
            >
              Cancel Checkout
            </Button>
          )}

          {checkout?.status === 'completed' && (
            <Button
              onClick={() => navigate(`/user/orders/${checkout.orderId}`)}
              className="w-full bg-accent hover:bg-blue-700"
            >
              View Order
            </Button>
          )}

          <Button
            onClick={() => navigate('/user/orders')}
            variant="outline"
            className="w-full"
          >
            View All Orders
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Checkout;

