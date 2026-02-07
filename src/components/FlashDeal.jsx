import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flashDealAPI, cartAPI } from '../services/api';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Loading } from './ui/loading';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { addToGuestCart } from '../utils/guestCart';

const FlashDeal = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState({
    status: 'Active',
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const previousDataRef = useRef(null);

  // Fetch active flash deals
  const { data: flashDealsData, isLoading } = useQuery({
    queryKey: ['flash-deals'],
    queryFn: () => flashDealAPI.getFlashDeals().then(res => res.data.data),
    refetchInterval: 60000, // Refetch every minute
  });


  // Memoize activeDeal to prevent unnecessary re-renders
  const activeDeal = useMemo(() => {
    return flashDealsData && flashDealsData.length > 0 ? flashDealsData[0] : null;
  }, [flashDealsData]);

  // Track data changes
  useEffect(() => {
    if (flashDealsData && flashDealsData !== previousDataRef.current) {
      previousDataRef.current = flashDealsData;
    }
  }, [flashDealsData]);

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, qty }) => {
      return await cartAPI.addItem({ productId, qty });
    },
    onSuccess: () => {
      toast.success('Product added to cart successfully!');
      queryClient.invalidateQueries(['cart']);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || 'Failed to add product to cart');
    },
  });

  // Update countdown timer - use stable dependency (activeDeal.id) instead of whole object
  useEffect(() => {
    if (!activeDeal) return;

    const updateCountdown = () => {
      const now = new Date();
      const startDate = new Date(activeDeal.startDate);
      const endDate = new Date(activeDeal.endDate);

      let status = 'Active';
      let targetDate = endDate;

      if (now < startDate) {
        status = 'Coming Soon';
        targetDate = startDate;
      } else if (now > endDate) {
        status = 'Ended';
        setTimeLeft({
          status,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      const diff = targetDate - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        status,
        hours: Math.max(0, hours),
        minutes: Math.max(0, minutes),
        seconds: Math.max(0, seconds),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [activeDeal]); // activeDeal is memoized, so this is stable

  // Don't render if no active deal
  if (isLoading) {
    return null; // Or show loading state if preferred
  }

  if (!activeDeal || timeLeft.status === 'Ended') {
    return null; // Hide section if no active deal or deal ended
  }

  const {
    id,
    title,
    image,
    actualPrice,
    discountPrice,
    left,
    sold,
  } = activeDeal;

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      addToGuestCart({
        productId: id,
        qty: 1,
        price: discountPrice ?? actualPrice,
        sellerId: activeDeal.sellerId,
        name: title,
        image: image,
      });
      toast.success('Product added to cart');
      return;
    }
    addToCartMutation.mutate({
      productId: id,
      qty: 1,
    });
  };

  return (
    <div className="bg-blue  rounded-lg p-6 flex flex-col items-center justify-center gap-4 max-w-md mx-auto">
      {/* Banner Image */}
      {activeDeal?.banner && (
        <div className="w-full mb-2">
          <img
            src={activeDeal.banner}
            alt="Flash Deal Banner"
            className="w-full h-auto object-contain rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      
      <h2 className="text-2xl font-bold font-poppins text-center text-white">
        Flash Deal{" "}
        {timeLeft.status === "Coming Soon"
          ? "Starts in"
          : timeLeft.status === "Active"
            ? "Ends in"
            : "Deal Ended"}
      </h2>
      
      {/* Countdown Timer */}
      <div className="flex justify-between items-center w-full">
        {["hours", "minutes", "seconds"].map((key, i) => (
          <React.Fragment key={key}>
            <div className="w-[90px] h-[78px] bg-white/10 text-white px-1 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold font-poppins">
                {String(timeLeft[key]).padStart(2, "0")}
              </div>
              <div className="text-sm font-poppins font-normal tracking-tight">
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </div>
            </div>
            {i < 2 && (
              <div className="text-white text-2xl sm:text-4xl font-bold">:</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Product Image + Discount */}
      <div className="flex flex-col justify-center items-center w-full relative">
        <div className="max-w-[308px]">
          <img
            src={image || '/placeholder-image.png'}
            alt="Flash Deal"
            className="w-full h-[169px] rounded-3xl z-0"
            onError={(e) => {
              e.target.src = '/placeholder-image.png';
            }}
          />
          <div className="text-base font-normal font-poppins flex flex-col -mt-12 ml-2.5 absolute z-50 text-white rounded-lg bg-blue  w-[99px] h-[70px] px-3.5 py-1">
            Save{" "}
            <span className="text-2xl font-bold font-poppins text-center">
              $ {(parseFloat(actualPrice) - parseFloat(discountPrice)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Product Title & Info */}
      <div className="flex flex-col w-full mt-6 text-white font-poppins">
        <h3 className="text-[22px] leading-[26px] font-semibold">{title}</h3>
        <div className="flex justify-between items-center mt-1">
          <div className="text-white text-sm font-normal">
            Left: <span className="font-bold">{left || 0}</span>
          </div>
          <div className="bg-orange text-white px-4 py-2 rounded-21 border-[#D55603] border">
            Sold {sold || 0}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="mt-auto pt-4 bg-white/10 text-center font-poppins p-3 w-full">
        <div className="text-white text-2xl font-semibold">
          $ {parseFloat(discountPrice).toFixed(2)}
        </div>
        <del className="text-white/60 text-xs font-normal p-3">
          $ {parseFloat(actualPrice).toFixed(2)}
        </del>
      </div>

      {/* Buy Button */}
      <button
        className="w-full bg-orange flex items-center justify-center gap-2 p-3 rounded-21 border border-[#D55603] text-white font-medium font-poppins cursor-pointer hover:bg-[#D55603] transition-colors"
        onClick={handleBuyNow}
      >
        <ShoppingCart />
        Buy Now
      </button>
    </div>
  );
};

export default FlashDeal;

