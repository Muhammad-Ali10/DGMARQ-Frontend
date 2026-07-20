import { useMemo } from "react";
import useBuyerCountry from "./useBuyerCountry";
import { resolveOfferAvailability, isBuyerCompatible } from "@lib/regionCompat";

// Resolves an offer's region data + the buyer's country into the shared
// blue/red verdict (true = can activate, false = cannot, null = unknown).
// Lets the product card colour its border while RegionBadges renders the
// chips/status line — both read one consistent result from the same preset
// resolver + buyer country, so they never disagree.
export const useOfferVerdict = (offer) => {
  const { country } = useBuyerCountry();

  const availability = useMemo(
    () => (offer ? resolveOfferAvailability(offer) : null),
    [offer]
  );
  const verdict = useMemo(
    () => (availability ? isBuyerCompatible(availability, country) : null),
    [availability, country]
  );

  return { availability, verdict, country };
};

export default useOfferVerdict;
