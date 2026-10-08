import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { cn } from '@lib/utils';
import { HUD_LABEL, HUD_VALUE } from '@lib/surface';

const HUD_TILE = 'hud-corners hud-spot shadow-hud bg-card/50';

const TONES = {
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

export const StatCardGrid = ({ children, className }) => (
  <div className={cn('stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4', className)}>
    {children}
  </div>
);

export default StatCard;
