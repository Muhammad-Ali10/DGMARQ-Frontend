import { Globe } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@components/ui/tooltip';
import { describeOfferAvailability, countryFlag, countryName } from '@lib/regionCompat';
import { cn } from '@lib/utils';

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
