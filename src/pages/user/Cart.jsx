import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartAPI, checkoutAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Loading, ErrorMessage } from '../../components/ui/loading';
import { Trash2, ShoppingCart, Plus, Minus } from 'lucide-react';

const Cart = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cart, isLoading, isError } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartAPI.getCart().then(res => res.data.data),
  });

  const removeItemMutation = useMutation({
    mutationFn: (data) => cartAPI.removeItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });

  const updateCartMutation = useMutation({
    mutationFn: (data) => cartAPI.updateCart(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: () => cartAPI.clearCart(),
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (data) => checkoutAPI.createCheckoutSession(data),
    onSuccess: (data) => {
      const checkoutUrl = data.data.data?.approvalUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    },
  });

  const handleRemoveItem = (productId) => {
    removeItemMutation.mutate({ productId });
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    updateCartMutation.mutate({ productId, quantity: newQuantity });
  };

  const handleCheckout = () => {
    if (cart?.items?.length > 0) {
      checkoutMutation.mutate({
        items: cart.items.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity,
        })),
      });
    }
  };

  if (isLoading) return <Loading message="Loading cart..." />;
  if (isError) return <ErrorMessage message="Error loading cart" />;

  const total = cart?.items?.reduce((sum, item) => sum + (item.productId?.price || 0) * item.quantity, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Shopping Cart</h1>
        <p className="text-gray-400 mt-1">Review your items before checkout</p>
      </div>

      {cart?.items?.length > 0 ? (
        <>
          <Card className="bg-primary border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Cart Items</CardTitle>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                    clearCartMutation.mutate();
                }}
              >
                Clear Cart
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-gray-300">Product</TableHead>
                      <TableHead className="text-gray-300">Price</TableHead>
                      <TableHead className="text-gray-300">Quantity</TableHead>
                      <TableHead className="text-gray-300">Subtotal</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.items.map((item) => (
                      <TableRow key={item.productId._id} className="border-gray-700">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.productId.images?.[0] && (
                              <img
                                src={item.productId.images[0]}
                                alt={item.productId.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium text-white">{item.productId.name}</p>
                              <p className="text-sm text-gray-400">{item.productId.category?.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white">${item.productId.price?.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(item.productId._id, item.quantity - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-white w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateQuantity(item.productId._id, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-white font-semibold">
                          ${((item.productId.price || 0) * item.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemoveItem(item.productId._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-gray-300">
                <span>Subtotal</span>
                <span className="text-white">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Tax</span>
                <span className="text-white">$0.00</span>
              </div>
              <div className="border-t border-gray-700 pt-4 flex justify-between">
                <span className="text-lg font-semibold text-white">Total</span>
                <span className="text-lg font-bold text-white">${total.toFixed(2)}</span>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={checkoutMutation.isPending}
                className="w-full bg-accent hover:bg-blue-700"
                size="lg"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {checkoutMutation.isPending ? 'Processing...' : 'Proceed to Checkout'}
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="bg-primary border-gray-700">
          <CardContent className="py-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400 text-lg mb-4">Your cart is empty</p>
            <Button onClick={() => navigate('/')} className="bg-accent hover:bg-blue-700">
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Cart;

