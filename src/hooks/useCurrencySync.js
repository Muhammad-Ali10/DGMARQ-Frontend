import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { currencyAPI } from "@services/api";
import { updateUser } from "@store/slices/authSlice";
import useCurrency from "./useCurrency";

/**
 * M10: mirror the signed-in buyer's display currency to their account.
 *
 * Emails are rendered on the SERVER, which cannot read this tab's localStorage —
 * so without this copy every email falls back to USD no matter what the buyer is
 * reading the site in. What is mirrored is the EFFECTIVE currency (their explicit
 * pick, or the one detected from their country), because that is the one they
 * actually see prices in.
 *
 * Guests are skipped: they have no account to write to, and their currency
 * instead travels with the checkout session (Checkout.displayCurrency).
 *
 * Mounted ONCE, at the app root — not inside `useCurrency`, which renders in
 * dozens of components and must stay a pure display helper.
 */
export const useCurrencySync = () => {
  const { currency } = useCurrency();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
  // The account's saved value: login returns it and a successful mirror below
  // writes it back into the (persisted) auth user, so across reloads the write
  // happens once per real change rather than once per page load for every
  // signed-in user — and twice when geo-detection resolved after mount.
  const savedCurrency = useSelector((state) => state.auth?.user?.displayCurrency);
  const inFlight = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !currency) return;
    if (currency === savedCurrency || currency === inFlight.current) return;
    inFlight.current = currency;
    // Fire-and-forget: a failed mirror only costs an email its localisation, so
    // it must never surface to the buyer or block anything.
    currencyAPI
      .setDisplayCurrency(currency)
      .then(() => dispatch(updateUser({ displayCurrency: currency })))
      .catch(() => {})
      .finally(() => {
        if (inFlight.current === currency) inFlight.current = null;
      });
  }, [isAuthenticated, currency, savedCurrency, dispatch]);
};

export default useCurrencySync;
