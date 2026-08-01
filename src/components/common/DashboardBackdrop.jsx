/**
 * The dashboard backdrop — the same visual language as the public storefront,
 * tuned down for a work surface.
 *
 * Three fixed, non-interactive layers behind all content:
 *   1. the storefront background image (same Cloudinary URL, so it is already
 *      in cache for anyone who arrived via a public page — no new download)
 *   2. a scrim, which is the important one: a dashboard is read for minutes at
 *      a time, so the image is pushed well back and the navy surface stays
 *      dominant. This is also what keeps the glass-card contrast maths valid.
 *   3. the ambiance grid, identical to PublicLayout, plus two very slow aurora
 *      blooms in the brand hues.
 *
 * All of it is `pointer-events: none` and `aria-hidden`, and the aurora drift
 * is switched off by the global prefers-reduced-motion rule.
 */
const BG_IMAGE_URL =
  'https://res.cloudinary.com/dhuhvbzpj/image/upload/f_auto,q_auto/v1767681117/Homepagebg_bsz1et.jpg';

const GRID_STYLE = {
  backgroundImage: [
    'linear-gradient(rgba(123,159,255,0.035) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(123,159,255,0.035) 1px, transparent 1px)',
    'linear-gradient(rgba(123,159,255,0.014) 1px, transparent 1px)',
    'linear-gradient(90deg, rgba(123,159,255,0.014) 1px, transparent 1px)',
  ].join(', '),
  backgroundSize: '48px 48px, 48px 48px, 12px 12px, 12px 12px',
};

export const DashboardBackdrop = () => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    {/* 1 — storefront image, heavily dimmed */}
    <div
      className="absolute inset-0 bg-cover bg-top bg-no-repeat opacity-40"
      style={{ backgroundImage: `url('${BG_IMAGE_URL}')` }}
    />

    {/* 2 — scrim: keeps the navy dominant so long reading sessions stay calm
            and the glass contrast budget holds */}
    <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/92 to-background" />

    {/* 3 — aurora blooms, brand hues, very low contrast and very slow */}
    <div className="absolute -top-1/4 -left-1/4 size-[60vw] rounded-full bg-accent/10 blur-[120px] animate-aurora" />
    <div
      className="absolute -right-1/4 -bottom-1/4 size-[55vw] rounded-full bg-info/10 blur-[120px] animate-aurora"
      style={{ animationDelay: '-12s' }}
    />

    {/* 4 — ambiance grid, identical to the public layout */}
    <div className="absolute inset-0" style={GRID_STYLE} />
  </div>
);

export default DashboardBackdrop;
