import { useMemo } from "react";
import useBuyerCountry from "./useBuyerCountry";
import { resolveOfferAvailability, isBuyerCompatible } from "@lib/regionCompat";

const LIST_SEPARATOR = ",";
const PART_SEPARATOR = "|";

const regionKeyOf = (offer) =>
  offer
    ? [offer.regionCodes, offer.countries, offer.excludedCountries]
        .map((list) => (Array.isArray(list) ? list.join(LIST_SEPARATOR) : ""))
        .join(PART_SEPARATOR)
    : null;

const splitList = (part) => (part ? part.split(LIST_SEPARATOR) : []);

export const useOfferVerdict = (offer) => {
  const { country } = useBuyerCountry();
  const regionKey = regionKeyOf(offer);

  const availability = useMemo(() => {
    if (regionKey === null) return null;
    const [regionCodes, countries, excludedCountries] = regionKey.split(PART_SEPARATOR).map(splitList);
    return resolveOfferAvailability({ regionCodes, countries, excludedCountries });
  }, [regionKey]);
  const verdict = useMemo(
    () => (availability ? isBuyerCompatible(availability, country) : null),
    [availability, country]
  );

  return { availability, verdict, country };
};

export default useOfferVerdict;
