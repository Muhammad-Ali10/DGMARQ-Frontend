import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { currencyAPI } from "@services/api";
import { updateUser } from "@store/slices/authSlice";
import useCurrency from "./useCurrency";
import { ME_QUERY_KEY } from "./useMe";

export const useCurrencySync = () => {
  const { currency, isResolved } = useCurrency();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
  const savedCurrency = useSelector((state) => state.auth?.user?.displayCurrency);
  const inFlight = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !currency || !isResolved) return;
    if (currency === savedCurrency || currency === inFlight.current) return;
    inFlight.current = currency;
    currencyAPI
      .setDisplayCurrency(currency)
      .then(() => {
        queryClient.setQueryData(ME_QUERY_KEY, (prev) => (prev ? { ...prev, displayCurrency: currency } : prev));
        dispatch(updateUser({ displayCurrency: currency }));
      })
      .catch(() => {})
      .finally(() => {
        if (inFlight.current === currency) inFlight.current = null;
      });
  }, [isAuthenticated, currency, isResolved, savedCurrency, dispatch, queryClient]);
};

export default useCurrencySync;
