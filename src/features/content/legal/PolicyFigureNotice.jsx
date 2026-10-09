import { CircleAlert, ExternalLink, ScrollText } from 'lucide-react';
import { cn } from '@lib/utils';
import { formatFigure, formatLiveValue, PUBLISHED_FIGURES } from './publishedFigures';

const PolicyFigureNotice = ({ figure, live, absent = false, className }) => {
  const fig = PUBLISHED_FIGURES[figure];
  const published = formatFigure(fig);
  const source = `${fig.document} ${fig.clause}`;

  const liveNum = Number(live);
  const known = !absent && live !== null && live !== undefined && live !== '' && Number.isFinite(liveNum);
  const matches = known && Math.abs(liveNum - fig.value) < 0.005;
  const quiet = matches || (!known && !absent);

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 text-xs',
        quiet ? 'border-border bg-surface-sunken/60 text-fg-muted' : 'border-warning/40 bg-warning-soft text-fg',
        className,
      )}
    >
      <p className="flex items-start gap-2">
        {quiet ? (
          <ScrollText className="mt-0.5 size-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
        ) : (
          <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
        )}
        <span>
          {absent
            ? `${source} states ${published}, and no platform setting corresponds to it.`
            : matches || !known
              ? `Published live in ${source}, which was drafted as ${published}.`
              : `Published live in ${source}: that page now reads ${formatLiveValue(fig, liveNum)}, not the ${published} it was drafted with — have the change approved if that is not intended.`}
          {fig.caveat && <span className="block opacity-80">{fig.caveat}</span>}
        </span>
      </p>
      <a
        href={fig.path}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 ml-5.5 inline-flex items-center gap-1 font-medium text-accent-on-dark underline-offset-4 hover:underline"
      >
        Read the clause
        <ExternalLink className="size-3" aria-hidden="true" />
      </a>
    </div>
  );
};

export default PolicyFigureNotice;
