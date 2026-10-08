import { Check, CircleX } from 'lucide-react';
import {
  resolveOfferAvailability,
  describeOfferAvailability,
  isBuyerCompatible,
  countryName,
} from '@lib/regionCompat';

const PILL_BASE =
  'inline-flex items-center gap-[3px] whitespace-nowrap rounded-[20px] px-[9px] py-[2.5px] text-[10.5px] font-bold';
const PILL_TONE = {
  buyer: 'border border-[rgba(46,207,176,0.4)] bg-[rgba(46,207,176,0.15)] text-[#2ecfb0]',
  other: 'border border-white/[0.12] bg-white/[0.06] text-fg/[0.62]',
  more: 'border border-[rgba(14,159,226,0.3)] bg-[rgba(14,159,226,0.15)] text-[#0e9fe2]',
  global: 'border border-[rgba(46,207,176,0.4)] bg-[rgba(46,207,176,0.15)] text-[#2ecfb0]',
};

export const ActivationLine = ({ offer, country }) => {
  if (!offer || !country) return null;
  const verdict = isBuyerCompatible(resolveOfferAvailability(offer), country);
  if (verdict === null) return null;

  return (
    <span className="flex items-center gap-[5px] text-[11.5px] text-fg/60">
      {verdict ? (
        <>
          <Check className="h-3.5 w-3.5 shrink-0 text-[#22c55e]" strokeWidth={2.5} />
          <span className="font-semibold text-[#22c55e]">
            Can activate in <b className="font-semibold text-[#34d399]">{countryName(country)}</b>
          </span>
        </>
      ) : (
        <>
          <CircleX className="h-3.5 w-3.5 shrink-0 text-[#f87171]" strokeWidth={2.5} />
          <span className="font-semibold text-[#f87171]">
            Cannot activate in <b className="font-semibold">{countryName(country)}</b>
          </span>
        </>
      )}
    </span>
  );
};

const RegionPills = ({ offer, country, max = 3 }) => {
  if (!offer) return null;

  const availability = resolveOfferAvailability(offer);
  const detail = describeOfferAvailability(offer);

  if (availability.unrestricted || availability.global) {
    return <span className={`${PILL_BASE} ${PILL_TONE.global}`}>GLOBAL</span>;
  }

  const buyer = country ? String(country).toUpperCase() : null;
  const buyerAllowed = buyer ? availability.allowed.has(buyer) : false;

  const codes = [
    ...(buyerAllowed ? [buyer] : []),
    ...detail.includedCountries.filter((c) => c !== buyer),
    ...detail.regionNames.map((n) => n.toUpperCase()),
  ];

  const shown = codes.slice(0, max);
  const extra = codes.length - shown.length;

  return (
    <>
      {shown.map((code) => {
        const isBuyer = code === buyer && buyerAllowed;
        return (
          <span key={code} className={`${PILL_BASE} ${isBuyer ? PILL_TONE.buyer : PILL_TONE.other}`}>
            {isBuyer ? `${code} ✓` : code}
          </span>
        );
      })}
      {extra > 0 && <span className={`${PILL_BASE} ${PILL_TONE.more}`}>+{extra}</span>}
    </>
  );
};

export default RegionPills;
