import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { cn } from '@lib/utils';
import { HUD_LABEL, HUD_VALUE } from '@lib/surface';

/**
 * Dashboard KPI tile.
 *
 * A tile earns its place only if the number drives a decision — see the KPI
 * discipline note on each dashboard. It shows a value and, where one genuinely
 * exists, a supporting line. It does NOT show a trend delta or a sparkline:
 * no endpoint on this platform returns a prior-period figure or a time series,
 * and a fabricated trend is worse than no trend.
 *
 * Interactivity is a real control, not a click handler on a div:
 *   - `href`    -> renders an <a> (via <Link>) wrapping the card
 *   - `onClick` -> renders a <button>
 * Both are keyboard reachable and take the shared focus ring. The previous
 * `<div onClick>` was neither, and accounted for two of the dashboard's
 * jsx-a11y warnings.
 *
 * @param {string} title
 * @param {string|number} value
 * @param {React.ElementType} icon - a lucide icon component
 * @param {string} [tone] - semantic tint for the icon: accent|success|warning|danger|info
 * @param {string} [description] - supporting line under the value
 * @param {string} [href] - if set, the tile links here
 * @param {() => void} [onClick] - if set (and no href), the tile is a button
 */
/**
 * Tone styling, all Tailwind — no companion stylesheet to keep in sync.
 *
 * `panel` is the product page's panel gradient
 *   linear-gradient(135deg, rgba(23,42,164,.18), rgba(14,159,226,.08))
 * written as utilities: `from-accent-deep/18` IS rgba(23,42,164,.18) and
 * `to-brand-cyan/8` IS rgba(14,159,226,.08), so the dashboard and the product
 * page share one value instead of two copies that can drift. Each tone swaps
 * only the first stop, which is what lets a tile read as its own status while
 * staying the same material.
 *
 * `bg-linear-135`, not `bg-linear-to-br`: 135deg is exact, whereas "to bottom
 * right" only equals it on a square — and these tiles are wide.
 *
 * The gradient is a background-IMAGE, so the Card's own `bg-card/90` stays
 * underneath as the background-COLOR. Text contrast never rests on the
 * gradient alone, and the same is true of the chip's opaque `bg-*-soft` base.
 */
/**
 * HUD chrome, shared by every tile. Hoisted to consts because these strings are
 * long and are the definition of the look — not something to retype per tile.
 *
 * `hud-corners` draws the hover brackets on ::after, `hud-spot` is the menu's
 * active treatment reused as the hover response (accent wash, inset ring, glowing
 * beam on ::before), and `shadow-hud` is the resting cyan bloom. See the HUD
 * blocks in index.css. `hud-spot` is unlayered CSS on purpose, so it wins over
 * the Card's own `interactive` hover shadow rather than racing it; the lift and
 * the border change still come from `interactive`.
 *
 * `bg-card/50` thins the tile to the product page's `.of-shell` transparency,
 * overriding the Card's own `bg-card/70` (tailwind-merge keeps the last one).
 * The tone tint on top of it is a background-IMAGE, so it survives. See the
 * contrast note on the Card `hud` variant for why sub-0.9 alpha is safe on the
 * dashboard backdrop and nowhere else.
 */
const HUD_TILE = 'hud-corners hud-spot shadow-hud bg-card/50';

const TONES = {
  // `panel` sets only variables — panel-tile switches the fill to the tile's
  // flat 6% and the rim to 18%, panel-tone-* picks the colour. No border class
  // here: panel-rim already follows the tone.
  accent: {
    panel: 'panel-tile panel-tone-accent-on-dark',
    chip: 'bg-accent-on-dark/12 text-accent-on-dark border border-accent-on-dark/25',
  },
  success: {
    panel: 'panel-tile panel-tone-success',
    chip: 'bg-success/12 text-success border border-success/25',
  },
  warning: {
    panel: 'panel-tile panel-tone-warning',
    chip: 'bg-warning/12 text-warning border border-warning/25',
  },
  danger: {
    panel: 'panel-tile panel-tone-danger',
    chip: 'bg-danger/12 text-danger border border-danger/25',
  },
  info: {
    panel: 'panel-tile panel-tone-info',
    chip: 'bg-info/12 text-info border border-info/25',
  },
  neutral: {
    // No panel-tone-: falls back to --accent-deep, the panel's own stop.
    panel: 'panel-tile',
    chip: 'bg-info/12 text-fg-muted border border-info/25',
  },
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  tone = 'neutral',
  description,
  href,
  onClick,
  className,
}) => {
  const interactive = Boolean(href || onClick);
  const t = TONES[tone] ?? TONES.neutral;

  const card = (
    <Card
      interactive={interactive}
      className={cn('h-full', t.panel, HUD_TILE, className)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={HUD_LABEL}>{title}</CardTitle>
        {Icon && (
          <div
            className={cn(
              'flex size-9 items-center justify-center rounded-md transition-transform duration-200 ease-out',
              interactive && 'group-hover/card:scale-110',
              t.chip
            )}
          >
            <Icon aria-hidden="true" className="size-5" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn('text-xl font-semibold tabular-nums', HUD_VALUE)}>{value}</div>
        {description && <p className="mt-1 text-xs text-fg-subtle">{description}</p>}
      </CardContent>
    </Card>
  );

  const focus =
    'block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

  if (href) {
    return (
      <Link to={href} className={focus}>
        {card}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(focus, 'w-full text-left')}>
        {card}
      </button>
    );
  }
  return card;
};

/**
 * Responsive grid wrapper for the KPI row. Four tiles is the ceiling.
 *
 * `stagger` animates the tiles in on MOUNT. It is safe here because the tiles
 * are swapped for a skeleton while loading, so this plays once when the numbers
 * first appear — never again on a refetch, and never on a row inside a list.
 */
export const StatCardGrid = ({ children, className }) => (
  <div className={cn('stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
    {children}
  </div>
);

export default StatCard;
