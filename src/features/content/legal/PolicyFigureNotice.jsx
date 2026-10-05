import { CircleAlert, ExternalLink, ScrollText } from 'lucide-react';
import { cn } from '@lib/utils';
import { formatFigure, formatLiveValue, PUBLISHED_FIGURES } from './publishedFigures';

/**
 * Tells an admin that the setting they are editing is published verbatim in a legal
 * document, and flags when it has moved away from the figure that document was
 * drafted with — the point at which the wording may need re-approving.
 *
 * `live` is the field's CURRENT value (draft included), so the line tracks what the
 * public page will say the moment this is saved. A value that is not a number yet —
 * an input just cleared — reads as "unknown" and keeps the plain reminder rather
 * than flashing a warning mid-keystroke. Pass `absent` when no platform setting
 * corresponds to the clause at all.
 *
 * The clause opens in a new tab on purpose: the Settings page holds unsaved drafts
 * in component state, and navigating away inside the SPA would discard them.
 */
const PolicyFigureNotice = ({ figure, live, absent = false, className }) => {
  const fig = PUBLISHED_FIGURES[figure];
  const published = formatFigure(fig);
  const source = `${fig.document} ${fig.clause}`;

  const liveNum = Number(live);
  const known = !absent && live !== null && live !== undefined && live !== '' && Number.isFinite(liveNum);
  // Tolerance, not equality: a rate stored as 0.07 becomes 7.000000000000001 the
  // moment a call site converts it to a percentage.
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
