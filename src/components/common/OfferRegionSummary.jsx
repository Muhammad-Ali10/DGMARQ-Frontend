import { Globe } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';
import { describeOfferAvailability, countryFlag, countryName } from '@lib/regionCompat';
import { cn } from '@lib/utils';

/**
 * Where an offer's keys can be activated, for a DASHBOARD table.
 *
 * The buyer's `RegionBadges` cannot be reused here: it carries the viewer's own
 * country, a compatibility verdict and a country picker, none of which mean
 * anything to an admin looking at someone else's listing. Both read the same
 * `describeOfferAvailability`, so the two views can never disagree about what
 * an offer covers — only about what they do with it.
 *
 * A staff member has to be able to see the WHOLE answer. Before this, the admin
 * table printed the region names and then summarised the seller's individual
 * countries as "(+3 extra)" / "(−1 excl.)" — a count, with no way to find out
 * which three. Everything is now in the tooltip, in full, by name.
 *
 * The details live in a tooltip rather than a popup div because these tables sit
 * inside `overflow-x-auto`, which clips absolutely-positioned children; Radix
 * portals the content out, and hover + keyboard focus both open it.
 *
 * @param {object} offer - needs regionCodes / countries / excludedCountries
 * @param {number} [maxChips] - chips shown inline before the rest fold into "+N"
 */
const CHIP = 'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap';
const TONE = {
  global: 'border-success/45 bg-success/10 text-success',
  region: 'border-info/35 bg-info/10 text-info',
  country: 'border-border-interactive bg-surface-2/60 text-fg-muted',
  danger: 'border-danger/40 bg-danger/10 text-danger',
};

const countryList = (codes) => codes.map((c) => `${countryFlag(c)} ${countryName(c)}`).join(', ');

const OfferRegionSummary = ({ offer, maxChips = 2 }) => {
  const detail = describeOfferAvailability(offer);

  // "Seller picked Global" and "seller picked nothing" sell to exactly the same
  // buyers, so they read as one thing. They used to be worded differently on
  // every surface ("Global", "All regions", "Worldwide", "No restriction").
  if (detail.global || detail.unrestricted) {
    return (
      <span className={cn(CHIP, TONE.global)}>
        <Globe className="size-3" aria-hidden="true" />
        Global
      </span>
    );
  }

  const chips = [
    ...detail.regionNames.map((name) => ({ key: `r-${name}`, label: name, tone: 'region' })),
    ...detail.includedCountries.map((c) => ({ key: `c-${c}`, label: `${countryFlag(c)} ${c}`, tone: 'country' })),
  ];

  // Exclusions with nothing included leaves an offer no buyers at all. That is
  // worth saying out loud on an admin screen rather than rendering blank.
  if (chips.length === 0) {
    return <span className={cn(CHIP, TONE.danger)}>No region set</span>;
  }

  const visible = chips.slice(0, maxChips);
  const hidden = chips.length - visible.length;
  const excluded = detail.excludedCountries.length;

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {visible.map((c) => (
        <span key={c.key} className={cn(CHIP, TONE[c.tone])}>{c.label}</span>
      ))}

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Show every region and country for this offer"
            className={cn(
              CHIP,
              'border-border-interactive bg-transparent text-fg-subtle',
              'outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            {hidden > 0 ? `+${hidden}` : 'Details'}
            {excluded > 0 && <span className="text-danger">−{excluded}</span>}
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm text-wrap text-left">
          <div className="space-y-2">
            {detail.regionNames.length > 0 && (
              <div>
                <p className="text-fg-subtle">Regions</p>
                <p className="text-fg">{detail.regionNames.join(', ')}</p>
              </div>
            )}
            {detail.includedCountries.length > 0 && (
              <div>
                <p className="text-fg-subtle">Also available in</p>
                <p className="text-fg">{countryList(detail.includedCountries)}</p>
              </div>
            )}
            {detail.excludedCountries.length > 0 && (
              <div>
                <p className="text-danger">Excluded</p>
                <p className="text-danger">{countryList(detail.excludedCountries)}</p>
              </div>
            )}
            {detail.countryCount != null && (
              <p className="text-fg-subtle">
                Sells to {detail.countryCount} countr{detail.countryCount === 1 ? 'y' : 'ies'}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </span>
  );
};

export default OfferRegionSummary;
