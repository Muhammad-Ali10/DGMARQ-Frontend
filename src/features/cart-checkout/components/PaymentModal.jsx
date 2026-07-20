import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Loader2, X, Lock, CreditCard, Wallet } from 'lucide-react';
import { Card, CardContent } from '@components/ui/card';
import { getPayPalSDK } from '@utils/paypalSDK';
import { getGooglePaySDK, getGooglePayEnvironment } from '@utils/googlePaySDK';
import { paypalAPI, checkoutAPI } from '@services/api';
import { toast } from 'sonner';
import SafeImage from '@components/ui/safe-image';

/**
 * Payment modal using PayPal CardFields and Buttons. No card data in React state.
 */
const PaymentModal = ({ 
  open, 
  onOpenChange, 
  checkoutId, 
  totalAmount, 
  currency = 'USD', 
  onSuccess,
  walletBalance = 0,
  paymentMethod = 'PayPal',
}) => {
  const [selectedMethod, setSelectedMethod] = useState(
    paymentMethod === 'Wallet' ? 'wallet' : 
    paymentMethod === 'Card' ? 'card' : 'paypal'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [paypalSDK, setPaypalSDK] = useState(null);
  const [cardFields, setCardFields] = useState(null);
  const cardFieldsRef = useRef(null);
  const paypalButtonsContainerRef = useRef(null);
  const [isCardFieldsEligible, setIsCardFieldsEligible] = useState(false);
  const paymentAttemptRef = useRef({ id: 0, isHandled: false });
  const pendingCardErrorTimerRef = useRef(null);
  // Google Pay (fulfilled through PayPal's `googlepay` component). The tile only
  // appears once the device + merchant are confirmed eligible.
  const [isGooglePayEligible, setIsGooglePayEligible] = useState(false);
  const googlePayContainerRef = useRef(null);
  const googlePayRef = useRef({ client: null, config: null });
  const googlePayHandlerRef = useRef(null);

  const clearPaymentToasts = () => {
    toast.dismiss();
  };

  const beginPaymentAttempt = () => {
    if (pendingCardErrorTimerRef.current) {
      clearTimeout(pendingCardErrorTimerRef.current);
      pendingCardErrorTimerRef.current = null;
    }
    const attemptId = Date.now();
    paymentAttemptRef.current = { id: attemptId, isHandled: false };
    return attemptId;
  };

  const resolvePaymentAttempt = ({
    attemptId,
    success,
    errorMessage = 'Payment processing error. Please try again.',
    payload,
  }) => {
    const activeAttempt = paymentAttemptRef.current;
    if (!activeAttempt.id || activeAttempt.id !== attemptId || activeAttempt.isHandled) {
      return false;
    }

    paymentAttemptRef.current = { ...activeAttempt, isHandled: true };
    clearPaymentToasts();

    if (success) {
      toast.success('Payment successful!');
      if (onSuccess) {
        onSuccess(payload);
      }
      setTimeout(() => onOpenChange(false), 100);
    } else {
      toast.error(errorMessage);
    }

    setIsLoading(false);
    return true;
  };

  // Google Pay authorization → PayPal order → confirm → capture. Google calls
  // this from its payment sheet and expects a transactionState back.
  const handleGooglePayAuthorized = async (paymentData) => {
    const attemptId = beginPaymentAttempt();
    try {
      setIsLoading(true);
      if (!checkoutId) throw new Error('Checkout ID is missing. Please try again.');

      const response = await paypalAPI.createOrder({ checkoutId });
      const orderId = response.data?.orderId || response.data?.data?.orderId;
      if (!orderId) throw new Error(response.data?.message || 'Order ID not returned from server');

      const confirmation = await paypalSDK.Googlepay().confirmOrder({
        orderId,
        paymentMethodData: paymentData?.paymentMethodData,
      });
      if (confirmation?.status !== 'APPROVED') {
        throw new Error(
          confirmation?.status === 'PAYER_ACTION_REQUIRED'
            ? 'This card needs extra verification. Please use PayPal or a card instead.'
            : 'Google Pay could not authorize this payment.'
        );
      }

      const captureResponse = await paypalAPI.captureOrder(orderId, checkoutId);
      const responseData = captureResponse.data || captureResponse;
      const captureStatus = responseData?.status || responseData?.data?.status;
      if (responseData?.ok === false || (captureStatus && captureStatus !== 'COMPLETED')) {
        throw new Error(responseData?.message || `Payment capture failed. Status: ${captureStatus || 'unknown'}`);
      }

      resolvePaymentAttempt({ attemptId, success: true, payload: responseData });
      return { transactionState: 'SUCCESS' };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Google Pay payment failed';
      resolvePaymentAttempt({ attemptId, success: false, errorMessage });
      return {
        transactionState: 'ERROR',
        error: { intent: 'PAYMENT_AUTHORIZATION', message: errorMessage, reason: 'PAYMENT_DATA_INVALID' },
      };
    }
  };
  // Keep the callback the Google client holds pointing at the latest closure
  // (checkoutId/totalAmount change between renders; the client is built once).
  googlePayHandlerRef.current = handleGooglePayAuthorized;

  // Eligibility: merchant onboarded (PayPal config) AND device can pay (Google).
  // Any failure just leaves the tile hidden — never blocks the other methods.
  useEffect(() => {
    if (!open || !paypalSDK) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const googleApi = await getGooglePaySDK();
        const config = await paypalSDK.Googlepay().config();
        if (cancelled || !config?.allowedPaymentMethods) return;
        const client = new googleApi.PaymentsClient({
          environment: getGooglePayEnvironment(),
          paymentDataCallbacks: {
            onPaymentAuthorized: (pd) => googlePayHandlerRef.current(pd),
          },
        });
        const ready = await client.isReadyToPay({
          apiVersion: 2,
          apiVersionMinor: 0,
          allowedPaymentMethods: config.allowedPaymentMethods,
        });
        if (cancelled) return;
        if (ready?.result) {
          googlePayRef.current = { client, config };
          setIsGooglePayEligible(true);
        }
      } catch {
        // Not eligible, blocked, or Google Pay not enabled on the PayPal account.
        if (!cancelled) setIsGooglePayEligible(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, paypalSDK]);

  // Render Google's own branded button (their API owns the markup).
  useEffect(() => {
    if (!open || selectedMethod !== 'googlepay' || !isGooglePayEligible) return undefined;
    const container = googlePayContainerRef.current;
    const { client, config } = googlePayRef.current;
    if (!container || !client || !config) return undefined;

    container.innerHTML = '';
    const button = client.createButton({
      buttonColor: 'white',
      buttonType: 'pay',
      buttonSizeMode: 'fill',
      onClick: () => {
        client
          .loadPaymentData({
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: config.allowedPaymentMethods,
            merchantInfo: config.merchantInfo,
            transactionInfo: {
              countryCode: config.countryCode || 'US',
              currencyCode: currency,
              totalPriceStatus: 'FINAL',
              totalPrice: Number(totalAmount || 0).toFixed(2),
            },
            callbackIntents: ['PAYMENT_AUTHORIZATION'],
          })
          .catch(() => {
            // Buyer dismissed the sheet — onPaymentAuthorized already reported
            // any real failure, so there's nothing to surface here.
          });
      },
    });
    container.appendChild(button);
    return () => { container.innerHTML = ''; };
  }, [open, selectedMethod, isGooglePayEligible, currency, totalAmount]);

  useEffect(() => {
    if (!open) return;

    const loadPayPalSDK = async () => {
      try {
        setIsLoading(true);
        const sdk = await getPayPalSDK();

        setPaypalSDK(sdk);
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
                if (!checkoutId) {
                  throw new Error('Checkout ID is missing. Please try again.');
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
              },
              onApprove: async (data) => {
                const attemptId = paymentAttemptRef.current.id || beginPaymentAttempt();
                try {
                  setIsLoading(true);
                  await new Promise(resolve => setTimeout(resolve, 500));
                  const captureResponse = await paypalAPI.captureOrder(data.orderID, checkoutId);
                  const responseData = captureResponse.data || captureResponse;
                  const captureStatus = responseData?.status || responseData?.data?.status;
                  const isOk = responseData?.ok !== false; // Default to true if not explicitly false
                  
                  if (!isOk || (captureStatus && captureStatus !== 'COMPLETED')) {
                    const errorMessage = responseData?.message || 
                                      responseData?.data?.message || 
                                      `Payment capture failed. Status: ${captureStatus || 'unknown'}`;
                    resolvePaymentAttempt({ attemptId, success: false, errorMessage });
                    return;
                  }
                  resolvePaymentAttempt({ attemptId, success: true, payload: responseData });
                } catch (error) {
                  let errorMessage = 'Payment capture failed';
                  if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                  } else if (error.message) {
                    errorMessage = error.message;
                  }
                  resolvePaymentAttempt({ attemptId, success: false, errorMessage });
                } finally {
                  setIsLoading(false);
                }
              },
              onError: (err) => {
                const attemptId = paymentAttemptRef.current.id || beginPaymentAttempt();
                let errorMessage = 'Payment processing error. Please try again.';
                if (err?.message) {
                  errorMessage = err.message;
                } else if (err?.details) {
                  errorMessage = `Payment error: ${err.details}`;
                }
                
                resolvePaymentAttempt({ attemptId, success: false, errorMessage });
              },
            });

            const eligible = fields.isEligible();
            setIsCardFieldsEligible(eligible);
            setCardFields(fields);
            cardFieldsRef.current = fields; // Store in ref for submit()
          } catch {
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
    // resolvePaymentAttempt is recreated every render; adding it would re-run
    // the whole PayPal SDK load on every render. Intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, checkoutId, onSuccess, onOpenChange]);

  useEffect(() => {
    if (open) {
      beginPaymentAttempt();
      return;
    }

    if (pendingCardErrorTimerRef.current) {
      clearTimeout(pendingCardErrorTimerRef.current);
      pendingCardErrorTimerRef.current = null;
    }
    paymentAttemptRef.current = { id: 0, isHandled: false };
  }, [open]);

  useEffect(() => {
    if (!open || selectedMethod !== 'card' || !cardFields || !isCardFieldsEligible) {
      return;
    }

    let retryTimer = null;
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
        const cardNumberEl = document.getElementById('card-number');
        const cardExpiryEl = document.getElementById('card-expiry');
        const cardCvvEl = document.getElementById('card-cvv');
        const cardNameEl = document.getElementById('card-name');
        
        if (!cardNumberEl || !cardExpiryEl || !cardCvvEl || !cardNameEl) return;

        // Ensure containers are empty before rendering
        cardNumberEl.innerHTML = '';
        cardExpiryEl.innerHTML = '';
        cardCvvEl.innerHTML = '';
        cardNameEl.innerHTML = '';
        
        // Render fields with responsive styles
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
        // FIX (FQ2): was `logger.error` but no logger exists in this file — the
        // line itself threw a ReferenceError, masking the real PayPal error.
        // console.* is stripped from production builds by vite config.
        console.error('Failed to render card fields', renderError);
        // Don't show toast here as it might be noisy during re-renders,
        // instead just allow the user to retry or switch methods.
      }
    };
    checkContainersAndRender(false);
    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [open, selectedMethod, cardFields, isCardFieldsEligible]);

  useEffect(() => {
    if (!open) {
      const fields = cardFieldsRef.current || cardFields;
      if (fields) {
        try {
          fields.close();
        } catch {
          /* hosted fields may already be torn down — non-fatal */
        }
        cardFieldsRef.current = null;
      }
    }
  }, [open, cardFields]);

  useEffect(() => {
    const container = paypalButtonsContainerRef.current;
    
    if (!paypalSDK || !open || selectedMethod !== 'paypal') {
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
        container.innerHTML = '';

        const buttons = paypalSDK.Buttons({
          createOrder: async () => {
            try {
              setIsLoading(true);
              if (!checkoutId) {
                throw new Error('Checkout ID is missing. Please try again.');
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
            } finally {
              setIsLoading(false);
            }
          },
          onApprove: async (data) => {
            const attemptId = paymentAttemptRef.current.id || beginPaymentAttempt();
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
                resolvePaymentAttempt({ attemptId, success: false, errorMessage });
                return;
              }
              resolvePaymentAttempt({ attemptId, success: true, payload: responseData });
            } catch (error) {
              let errorMessage = 'Payment capture failed';
              if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
              } else if (error.message) {
                errorMessage = error.message;
              }
              resolvePaymentAttempt({ attemptId, success: false, errorMessage });
            } finally {
              setIsLoading(false);
            }
          },
          onError: (err) => {
            const attemptId = paymentAttemptRef.current.id || beginPaymentAttempt();
            let errorMessage = 'Payment processing error. Please try again.';
            if (err?.message) {
              errorMessage = err.message;
            } else if (err?.details) {
              errorMessage = `Payment error: ${err.details}`;
            }
            
            resolvePaymentAttempt({ attemptId, success: false, errorMessage });
          },
          disableFunding: 'paylater',
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'paypal',
          },
        });

        buttons.render(container);
      } catch {
        toast.error('Failed to initialize PayPal payment.');
      }
    };
    const timer = setTimeout(initializePayPalButtons, 100);
    return () => {
      clearTimeout(timer);
      if (container) {
        container.innerHTML = '';
      }
    };
    // resolvePaymentAttempt/beginPaymentAttempt are recreated every render;
    // adding them would re-render the PayPal buttons on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paypalSDK, open, selectedMethod, checkoutId, onSuccess, onOpenChange]);

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    const fields = cardFieldsRef.current || cardFields;
    
    if (!fields) {
      toast.error('Card payment form not ready. Please wait.');
      return;
    }

    const attemptId = beginPaymentAttempt();
    try {
      setIsLoading(true);
      await fields.submit();
    } catch (error) {
      // Card submit can throw intermediate/non-fatal SDK errors before onApprove resolves.
      // Delay showing an error to avoid conflicting success + error toasts.
      pendingCardErrorTimerRef.current = setTimeout(() => {
        resolvePaymentAttempt({
          attemptId,
          success: false,
          errorMessage: error?.message || 'Failed to process card payment.',
        });
        pendingCardErrorTimerRef.current = null;
      }, 1200);
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
            min-height: 48px !important;
            display: flex !important;
            align-items: center !important;
          }
          .paypal-card-field-container iframe {
            pointer-events: auto !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 48px !important;
            border: none !important;
            background: transparent !important;
            position: relative !important;
            z-index: 5 !important;
          }
          #card-number,
          #card-expiry,
          #card-cvv,
          #card-name {
            pointer-events: auto !important;
            overflow: visible !important;
            display: flex !important;
            align-items: center !important;
          }
        `}</style>
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold">Payment Methods</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4 overflow-y-auto">
          {/* Payment Method Selection — tile count varies with wallet balance and
              Google Pay eligibility; classes stay static so Tailwind keeps them. */}
          <div className={`grid gap-3 ${
            { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-2 md:grid-cols-4' }[
              2 + (walletBalance >= totalAmount ? 1 : 0) + (isGooglePayEligible ? 1 : 0)
            ] || 'grid-cols-2'
          }`}>
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
            {isGooglePayEligible && (
              <Button
                type="button"
                onClick={() => setSelectedMethod('googlepay')}
                variant={selectedMethod === 'googlepay' ? 'default' : 'outline'}
                className={`h-auto py-4 ${
                  selectedMethod === 'googlepay'
                    ? 'bg-accent hover:bg-accent/90 text-white'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-800'
                }`}
                disabled={isLoading}
              >
                <div className="flex flex-col items-center gap-2">
                  <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.5 12.2c0-.7-.06-1.4-.18-2H12v3.8h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.8z" />
                    <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0 0 12 23z" />
                    <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2a11 11 0 0 0 0 9.8z" />
                    <path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.2 1.6l3.1-3.1A11 11 0 0 0 2 7.1l3.7 2.8C6.6 7.4 9.1 5.4 12 5.4z" />
                  </svg>
                  <span className="text-xs font-medium">Google Pay</span>
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
                <SafeImage
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

          {/* Google Pay — Google renders its own branded button into this slot. */}
          {selectedMethod === 'googlepay' && isGooglePayEligible && (
            <div className="space-y-3">
              <div ref={googlePayContainerRef} className="min-h-[48px]" />
              <p className="text-xs text-gray-400 text-center">
                Google Pay is processed securely through PayPal. You&apos;ll be charged ${Number(totalAmount || 0).toFixed(2)} {currency}.
              </p>
            </div>
          )}

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
                        const attemptId = beginPaymentAttempt();
                        if (!checkoutId) {
                          resolvePaymentAttempt({
                            attemptId,
                            success: false,
                            errorMessage: 'Checkout session not found',
                          });
                          return;
                        }
                        setIsLoading(true);
                        try {
                          const response = await checkoutAPI.payWithWallet(checkoutId);
                          resolvePaymentAttempt({
                            attemptId,
                            success: true,
                            payload: response.data.data,
                          });
                        } catch (error) {
                          resolvePaymentAttempt({
                            attemptId,
                            success: false,
                            errorMessage: error.response?.data?.message || 'Wallet payment failed',
                          });
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
                        className="paypal-card-field-container"
                        style={{ position: 'relative', zIndex: 1 }}
                      ></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">
                          Expiration Date*
                        </label>
                        <div
                          id="card-expiry"
                          className="paypal-card-field-container"
                          style={{ position: 'relative', zIndex: 1 }}
                        ></div>
                      </div>

                      <div>
                        <label className="text-white text-sm font-medium mb-2 block">
                          CVV*
                        </label>
                        <div
                          id="card-cvv"
                          className="paypal-card-field-container"
                          style={{ position: 'relative', zIndex: 1 }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <label className="text-white text-sm font-medium mb-2 block">
                        Cardholder Name*
                      </label>
                      <div
                        id="card-name"
                        className="paypal-card-field-container"
                        style={{ position: 'relative', zIndex: 1 }}
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
