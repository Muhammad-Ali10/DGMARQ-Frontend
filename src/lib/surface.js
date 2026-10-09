export const GLASS_FILL =
  'bg-linear-180 from-surface-1/45 to-surface-base/55 border-brand-cyan/22';

export const GLASS_BLUR = 'backdrop-blur-[18px]';

export const GLASS_SHADOW = 'shadow-hud';

export const GLASS_RADIUS = 'rounded-2xl';

export const ambianceGridStyle = (masked = false) => ({
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  pointerEvents: 'none',
  overflow: 'hidden',
  backgroundImage: [
    'linear-gradient(rgba(123,159,255,0.035) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(123,159,255,0.035) 1px, transparent 1px)',
    'linear-gradient(rgba(123,159,255,0.014) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(123,159,255,0.014) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: '48px 48px, 48px 48px, 12px 12px, 12px 12px',
  ...(masked
    ? {
        maskImage: 'radial-gradient(ellipse 85% 80% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 85% 80% at 50% 50%, black 40%, transparent 100%)',
      }
    : {}),
});

export const HUD_LABEL = 'text-[0.6875rem] font-extrabold uppercase tracking-[0.13em] text-info';

export const HUD_VALUE = [
  'bg-linear-180 from-fg via-info to-accent-on-dark bg-clip-text text-transparent',
  'forced-colors:bg-none forced-colors:text-fg',
].join(' ');
