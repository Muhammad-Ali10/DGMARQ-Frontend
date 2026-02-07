import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Loader2, X, Lock, CreditCard, Wallet } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { getPayPalSDK } from '../utils/paypalSDK';
import { paypalAPI, checkoutAPI } from '../services/api';
import { toast } from 'sonner';

/**
 * PaymentModal Component
 * 
 * SECURITY:
 * - Uses PayPal-hosted CardFields (no card data in React state)
 * - Uses PayPal Buttons for PayPal wallet payments
 * - All card data handled by PayPal SDK (never touches our servers)
 * 
 * FLOW:
 * 1. User selects payment method (PayPal or Card)
 * 2. For Card: PayPal CardFields component renders
 * 3. For PayPal: PayPal Buttons component renders
 * 4. Both call backend /api/v1/paypal/orders with checkoutId
 * 5. Backend recalculates amount from DB (secure)
 * 6. After approval, capture via /api/v1/paypal/orders/:orderId/capture
 */
const PaymentModal = ({ 
  open, 
  onOpenChange, 
  checkoutId, 
  totalAmount, 
  currency = 'USD', 
  onSuccess,
  walletBalance = 0,
  walletAmount = 0,
  cardAmount = 0,
  paymentMethod = 'PayPal',
}) => {
  const [selectedMethod, setSelectedMethod] = useState(
    paymentMethod === 'Wallet' ? 'wallet' : 
    paymentMethod === 'Card' ? 'card' : 'paypal'
  ); // 'wallet', 'paypal', or 'card'
  const [isLoading, setIsLoading] = useState(false);
  const [paypalSDK, setPaypalSDK] = useState(null);
  const [cardFields, setCardFields] = useState(null);
  const cardFieldsRef = useRef(null); // Use ref to ensure same instance for submit()
  const paypalButtonsContainerRef = useRef(null);
  const [isCardFieldsEligible, setIsCardFieldsEligible] = useState(false);

  // Load PayPal SDK (singleton - prevents double-loading)
  useEffect(() => {
    if (!open) return;

    const loadPayPalSDK = async () => {
      try {
        setIsLoading(true);
        
        // Use singleton loader (prevents double-loading)
        const sdk = await getPayPalSDK();

        setPaypalSDK(sdk);
            // Create CardFields instance immediately after SDK loads to check eligibility
            if (sdk?.CardFields) {
              try {
                const fields = sdk.CardFields({
                  style: {
                    'input': {
                      'backgroundColor': 'transparent',
                      'color': '#000000!important',
                      'fontSize': '16px',
                      'fontFamily': 'Poppins, sans-serif',
                      'border': 'none',
                      'outline': 'none',
                      '::placeholder': {
                        'color': '#000000!important',
                      },
                    },
                    '.invalid': {
                      'color': '#ef4444',
                    },
                    ':focus': {
                      'color': '#000000!important',
                      'border': 'none',
                      'outline': 'none',
                    },
                    '.paypal-card-field': {
                      'border': 'none !important',
                      'outline': 'none !important',
                    },
                  },
                  createOrder: async () => {
                try {
                  if (!checkoutId) {
                    const errorMsg = 'Checkout ID is missing. Please try again.';
                    toast.error(errorMsg);
                    throw new Error(errorMsg);
                  }
                  const response = await paypalAPI.createOrder({ checkoutId });
                  const orderId = response.data?.orderId || response.data?.data?.orderId;
                  if (!response.data?.ok && !orderId) {
                    throw new Error(response.data?.message || 'Failed to create order');
                  }
                  if (!orderId) {
                    throw new Error('Order ID not returned from server');
                  }
                  return orderId;
                } catch (error) {
                  toast.error(error.response?.data?.message || error.message || 'Failed to create payment order');
                  throw error;
                }
              },
              onApprove: async (data) => {
                try {
                  setIsLoading(true);
                  await new Promise(resolve => setTimeout(resolve, 500));
                  const captureResponse = await paypalAPI.captureOrder(data.orderID, checkoutId);
                  const responseData = captureResponse.data || captureResponse;
                  const captureStatus = responseData?.status || responseData?.data?.status;
                  const captureId = responseData?.captureId || responseData?.data?.captureId;
                  const isOk = responseData?.ok !== false; // Default to true if not explicitly false
                  
                  if (!isOk || (captureStatus && captureStatus !== 'COMPLETED')) {
                    const errorMessage = responseData?.message || 
                                      responseData?.data?.message || 
                                      `Payment capture failed. Status: ${captureStatus || 'unknown'}`;
                    throw new Error(errorMessage);
                  }
                  toast.success('Payment successful!');
                  onSuccess?.(responseData);
                  onOpenChange(false);
                } catch (error) {
                  let errorMessage = 'Payment capture failed';
                  if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                  } else if (error.message) {
                    errorMessage = error.message;
                  }
                  
                  toast.error(errorMessage);
                } finally {
                  setIsLoading(false);
                }
              },
              onError: (err) => {
                let errorMessage = 'Payment processing error. Please try again.';
                if (err?.message) {
                  errorMessage = err.message;
                } else if (err?.details) {
                  errorMessage = `Payment error: ${err.details}`;
                }
                
                toast.error(errorMessage);
                setIsLoading(false);
              },
            });

            const eligible = fields.isEligible();
            setIsCardFieldsEligible(eligible);
            setCardFields(fields);
            cardFieldsRef.current = fields; // Store in ref for submit()
          } catch (error) {
            setIsCardFieldsEligible(false);
            setCardFields(null);
            cardFieldsRef.current = null;
          }
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load payment system. Please refresh and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPayPalSDK();
  }, [open, checkoutId, onSuccess, onOpenChange]);

  // Render CardFields ONLY when modal is open, card method selected, and containers exist
  useEffect(() => {
    // Don't render if conditions not met
    if (!open || selectedMethod !== 'card' || !cardFields || !isCardFieldsEligible) {
      return;
    }

    let retryTimer = null;

    // Check if container elements exist
    const checkContainersAndRender = (isRetry = false) => {
      const cardNumberEl = document.getElementById('card-number');
      const cardExpiryEl = document.getElementById('card-expiry');
      const cardCvvEl = document.getElementById('card-cvv');
      const cardNameEl = document.getElementById('card-name');

      const containersReady = cardNumberEl && cardExpiryEl && cardCvvEl && cardNameEl;

      if (!containersReady) {
        if (!isRetry) {
          retryTimer = setTimeout(() => checkContainersAndRender(true), 200);
        }
        return;
      }

      try {
        // Clear containers first to prevent duplicate renders
        const cardNumberEl = document.getElementById('card-number');
        const cardExpiryEl = document.getElementById('card-expiry');
        const cardCvvEl = document.getElementById('card-cvv');
        const cardNameEl = document.getElementById('card-name');

        // Clear any existing content
        if (cardNumberEl) cardNumberEl.innerHTML = '';
        if (cardExpiryEl) cardExpiryEl.innerHTML = '';
        if (cardCvvEl) cardCvvEl.innerHTML = '';
        if (cardNameEl) cardNameEl.innerHTML = '';

        // Render CardFields into containers
        // Styling is inherited from CardFields initialization above
        cardFields.NumberField({
          placeholder: 'Card Number',
        }).render('#card-number');

        cardFields.ExpiryField({
          placeholder: 'MM/YY',
        }).render('#card-expiry');

        cardFields.CVVField({
          placeholder: 'CVV',
        }).render('#card-cvv');

        cardFields.NameField({
          placeholder: 'Cardholder Name',
        }).render('#card-name');

      } catch (renderError) {
        toast.error('Failed to render card payment form. Please try again.');
      }
    };

    // Initial attempt to render
    checkContainersAndRender(false);

    // Cleanup
    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [open, selectedMethod, cardFields, isCardFieldsEligible]);

  // Cleanup CardFields when modal closes
  useEffect(() => {
    if (!open) {
      const fields = cardFieldsRef.current || cardFields;
      if (fields) {
        try {
          fields.close();
        } catch {
          // Ignore cleanup errors
        }
        cardFieldsRef.current = null;
      }
    }
  }, [open, cardFields]);

  // Initialize PayPal Buttons when SDK is loaded and PayPal method is selected
  useEffect(() => {
    const container = paypalButtonsContainerRef.current;
    
    if (!paypalSDK || !open || selectedMethod !== 'paypal') {
      // Cleanup
      if (container) {
        container.innerHTML = '';
      }
      return;
    }

    if (!container) return;

    const initializePayPalButtons = () => {
      const container = paypalButtonsContainerRef.current;
      if (!container) return;
      
      try {
        // Clean up existing buttons
        container.innerHTML = '';

        const buttons = paypalSDK.Buttons({
          createOrder: async () => {
            try {
              setIsLoading(true);
              if (!checkoutId) {
                const errorMsg = 'Checkout ID is missing. Please try again.';
                toast.error(errorMsg);
                throw new Error(errorMsg);
              }
              const response = await paypalAPI.createOrder({ checkoutId });
              const orderId = response.data?.orderId || response.data?.data?.orderId;
              if (!response.data?.ok && !orderId) {
                throw new Error(response.data?.message || 'Failed to create order');
              }
              if (!orderId) {
                throw new Error('Order ID not returned from server');
              }
              return orderId;
            } catch (error) {
              toast.error(error.response?.data?.message || error.message || 'Failed to create payment order');
              throw error;
            } finally {
              setIsLoading(false);
            }
          },
          onApprove: async (data) => {
            try {
              setIsLoading(true);
              await new Promise(resolve => setTimeout(resolve, 500));
              const captureResponse = await paypalAPI.captureOrder(data.orderID, checkoutId);
              const responseData = captureResponse.data || captureResponse;
              const captureStatus = responseData?.status || responseData?.data?.status;
              const isOk = responseData?.ok !== false;
              if (!isOk || (captureStatus && captureStatus !== 'COMPLETED')) {
                const errorMessage = responseData?.message || 
                                    responseData?.data?.message || 
                                    `Payment capture failed. Status: ${captureStatus || 'unknown'}`;
                throw new Error(errorMessage);
              }
              toast.success('Payment successful!');
              onSuccess?.(responseData);
              onOpenChange(false);
            } catch (error) {
              let errorMessage = 'Payment capture failed';
              if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              toast.error(errorMessage);
            } finally {
              setIsLoading(false);
            }
          },
          onError: (err) => {
            let errorMessage = 'Payment processing error. Please try again.';
            if (err?.message) {
              errorMessage = err.message;
            } else if (err?.details) {
              errorMessage = `Payment error: ${err.details}`;
            }
            
            toast.error(errorMessage);
            setIsLoading(false);
          },
          // FIX: Disable Pay Later (PayPal wallet only - enforced at SDK level via 'disable-funding')
          disableFunding: 'paylater',
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
          },
        });

        buttons.render(container);
      } catch (error) {
        toast.error('Failed to initialize PayPal payment.');
      }
    };

    // Small delay to ensure container is ready
    const timer = setTimeout(initializePayPalButtons, 100);
    return () => {
      clearTimeout(timer);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [paypalSDK, open, selectedMethod, checkoutId, onSuccess, onOpenChange]);

  // FIX: CardFields submit() automatically triggers createOrder -> onApprove -> capture
  // Use ref to ensure we call submit() on the same instance
  const handleCardSubmit = async (e) => {
    e.preventDefault();
    
    // Use ref first, fallback to state
    const fields = cardFieldsRef.current || cardFields;
    
    if (!fields) {
      toast.error('Card payment form not ready. Please wait.');
      return;
    }

    try {
      setIsLoading(true);
      await fields.submit();
    } catch (error) {
      toast.error('Failed to process card payment.');
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" className="bg-primary border-gray-700 p-6">
        {/* Global styles to override PayPal CardFields default styling */}
        <style>{`
          .paypal-card-field-container {
            position: relative;
            pointer-events: auto !important;
            overflow: visible !important;
          }
          .paypal-card-field-container iframe {
            pointer-events: auto !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 48px !important;
            border: none !important;
            background: transparent !important;
            position: relative !important;
            z-index: 10 !important;
          }
          #card-number,
          #card-expiry,
          #card-cvv,
          #card-name {
            pointer-events: auto !important;
            overflow: visible !important;
          }
          #card-number iframe,
          #card-expiry iframe,
          #card-cvv iframe,
          #card-name iframe {
            pointer-events: auto !important;
            border: none !important;
            background: transparent !important;
            position: relative !important;
            z-index: 10 !important;
          }
        `}</style>
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold">Payment Methods</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Payment Method Selection */}
          <div className={`grid gap-3 ${walletBalance >= totalAmount ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {walletBalance >= totalAmount && (
              <Button
                type="button"
                onClick={() => setSelectedMethod('wallet')}
                variant={selectedMethod === 'wallet' ? 'default' : 'outline'}
                className={`h-auto py-4 ${
                  selectedMethod === 'wallet'
                    ? 'bg-accent hover:bg-accent/90 text-white'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                }`}
                disabled={isLoading}
              >
                <div className="flex flex-col items-center gap-2">
                  <Wallet className="w-6 h-6" />
                  <span className="text-xs font-medium">Wallet</span>
                  <span className="text-xs text-gray-400">${walletBalance.toFixed(2)}</span>
                </div>
              </Button>
            )}
            <Button
              type="button"
              onClick={() => setSelectedMethod('paypal')}
              variant={selectedMethod === 'paypal' ? 'default' : 'outline'}
              className={`h-auto py-4 ${
                selectedMethod === 'paypal'
                  ? 'bg-accent hover:bg-accent/90 text-white'
                  : 'border-gray-600 text-gray-300 hover:bg-gray-800'
              }`}
              disabled={isLoading}
            >
              <div className="flex flex-col items-center gap-2">
                <img
                  src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg"
                  alt="PayPal"
                  className="h-8 w-auto"
                />
                <span className="text-xs font-medium">PayPal</span>
              </div>
            </Button>

            <Button
              type="button"
              onClick={() => setSelectedMethod('card')}
              variant={selectedMethod === 'card' ? 'default' : 'outline'}
              className={`h-auto py-4 ${
                selectedMethod === 'card'
                  ? 'bg-accent hover:bg-accent/90 text-white'
                  : 'border-gray-600 text-gray-300 hover:bg-gray-800'
              }`}
              disabled={isLoading}
            >
              <div className="flex flex-col items-center gap-2">
                <CreditCard className="w-6 h-6" />
                <span className="text-xs font-medium">Credit Card / Debit Card</span>
              </div>
            </Button>
          </div>

          {/* Wallet Payment Option */}
          {selectedMethod === 'wallet' && walletBalance >= totalAmount && (
            <div className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg border border-accent/30">
                      <div>
                        <p className="text-sm text-gray-300">Wallet Balance</p>
                        <p className="text-2xl font-bold text-white">${walletBalance.toFixed(2)}</p>
                      </div>
                      <Wallet className="w-8 h-8 text-accent" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-300">Order Total</p>
                      <p className="text-xl font-semibold text-white">${totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                      <p className="text-sm text-gray-300">Remaining Balance</p>
                      <p className="text-xl font-bold text-green-400">${(walletBalance - totalAmount).toFixed(2)}</p>
                    </div>
                    <Button
                      onClick={async () => {
                        if (!checkoutId) {
                          toast.error('Checkout session not found');
                          return;
                        }
                        setIsLoading(true);
                        try {
                          const response = await checkoutAPI.payWithWallet(checkoutId);
                          toast.success('Payment successful!');
                          if (onSuccess) {
                            onSuccess(response.data.data);
                          }
                          onOpenChange(false);
                        } catch (error) {
                          toast.error(error.response?.data?.message || 'Wallet payment failed');
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                      className="w-full bg-accent hover:bg-accent/90 text-white"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Pay ${totalAmount.toFixed(2)} with Wallet
                          <Lock className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Divider */}
          {selectedMethod !== 'wallet' && (
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-primary px-3 text-gray-400">or</span>
              </div>
            </div>
          )}

          {/* PayPal Payment Option */}
          {selectedMethod === 'paypal' && (
            <div className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="pt-6">
                  {isLoading && !paypalSDK ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-accent" />
                      <span className="ml-2 text-gray-300">Loading payment system...</span>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-300 text-sm mb-4">
                        Click the button below to pay with your PayPal account.
                      </p>
                      <div ref={paypalButtonsContainerRef} id="paypal-buttons-container"></div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Card Payment Form */}
          {selectedMethod === 'card' && (
            <div className="space-y-4">
              {!isCardFieldsEligible ? (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-2">
                      <p className="text-gray-300 text-sm font-medium">
                        Card payments not available for this PayPal account/region.
                      </p>
                      <p className="text-gray-400 text-xs mt-2">
                        Please use PayPal wallet payment instead.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <form onSubmit={handleCardSubmit} className="space-y-5">
                  <div className="space-y-5">
                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">
                        Card Number*
                      </label>
                      <div
                        id="card-number"
                        className="h-12 bg-gray-800/50 border border-gray-600 rounded-md px-4 paypal-card-field-container"
                        style={{ minHeight: '48px', position: 'relative', zIndex: 1, display: 'contents', alignItems: 'center' }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">
                          Expiration Date*
                        </label>
                        <div
                          id="card-expiry"
                          className="h-12 bg-gray-800/50 border border-gray-600 rounded-md px-4 paypal-card-field-container"
                          style={{ minHeight: '48px', position: 'relative', zIndex: 1, display: 'contents', alignItems: 'center' }}
                        ></div>
                      </div>

                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">
                          CVV*
                        </label>
                        <div
                          id="card-cvv"
                          className="h-12 bg-gray-800/50 border border-gray-600 rounded-md px-4 paypal-card-field-container"
                          style={{ minHeight: '48px', position: 'relative', zIndex: 1, display: 'contents', alignItems: 'center', backgroundColor: 'transparent' }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">
                        Cardholder Name*
                      </label>
                      <div
                        id="card-name"
                        className="h-12 bg-gray-800/50 border border-gray-600 rounded-md px-4 paypal-card-field-container"
                        style={{ minHeight: '48px', position: 'relative', zIndex: 1, display: 'contents', alignItems: 'center' }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-400 pt-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span>Your payment information is secure and encrypted by PayPal</span>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold shadow-md"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Pay {currency} {totalAmount.toFixed(2)}
                        <Lock className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Total Amount Display */}
          <div className="border-t border-gray-700 pt-4 mt-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 font-medium text-base">Total Amount</span>
              <span className="text-xl font-bold text-blue-600">
                {currency} {totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
