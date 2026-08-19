/**
 * The glass surface recipe — ONE definition, shared by the Card `hud` variant
 * and the HUD table row.
 *
 * It lives here rather than in either component because "cards should visually
 * match the table rows" is the requirement, and two copies of a gradient are two
 * things that drift. It is deliberately a set of ordinary Tailwind class strings
 * rather than a custom `@utility`: a utility that sets `background-image`,
 * `border-color` or `box-shadow` cannot be deduped by tailwind-merge against
 * `bg-*`/`border-*`/`shadow-*`, so a call site trying to override one would be
 * left to stylesheet order. As plain classes, `cn()` still resolves them last.
 *
 * Every value resolves through the design tokens in index.css. The brief's
 * palette (#0C1835 navy, #00BFFF cyan, rgba(0,191,255,.25) border glow) is the
 * same hue family as those tokens — `--surface-base` is #041536, `--surface-1`
 * is #0B2455, `--brand-cyan` is #0E9FE2 — and the tokens are the versions whose
 * contrast has actually been measured, so they are what gets used. Introducing
 * the literal hexes would fork the palette and invalidate that measurement.
 */

/** Fill + rim. The gradient is deep navy at the top fading to dark blue at the
 *  bottom, both at low alpha so the backdrop reads through and the glass is real
 *  rather than painted on. The rim is the brief's ~22% cyan. */
export const GLASS_FILL =
  'bg-linear-180 from-surface-1/45 to-surface-base/55 border-brand-cyan/22';

/** The frost. 18px per the brief.
 *
 *  Kept SEPARATE from the fill because a table row and a card apply it to
 *  different elements: a card blurs itself, but a row's fill sits on its cells
 *  (see table.jsx) while the blur belongs on the `<tr>`. One blur region per row
 *  instead of one per cell is a 5x reduction in backdrop-filter regions on the
 *  most repeated surface in the app, and it removes the seams that per-cell
 *  regions would leave at every column boundary. */
export const GLASS_BLUR = 'backdrop-blur-[18px]';

/** Layered resting shadow: soft dark drop, low-opacity cyan glow, near-invisible
 *  inner highlight. Defined as `--elevation-hud` in index.css. */
export const GLASS_SHADOW = 'shadow-hud';

/** Corner radius. ONE value for cards and rows — the brief allows 16-18px for
 *  rows and 18-20px for cards, and 18px is the overlap, which is also the
 *  existing `--radius-2xl` token. Two different radii would be the same drift
 *  the shared recipe exists to prevent. */
export const GLASS_RADIUS = 'rounded-2xl';

/**
 * The ambiance grid — the faint "boxes" texture behind every public page, and
 * the same 48px lattice the v74 mockup draws behind the auth cards.
 *
 * A style OBJECT rather than Tailwind classes (the exception to this file's rule
 * above): it is four comma-separated gradient layers at two different
 * background-sizes, which an arbitrary-value class cannot express without the
 * commas tripping the parser.
 *
 * Shared because the auth pages sit OUTSIDE PublicLayout (they are full-screen,
 * per the mockup) and so cannot inherit its backdrop. Two hand-copied lattices
 * would drift the moment either is tuned.
 *
 * @param {boolean} masked  Fade the lattice out toward the edges. The mockup does
 *   this on the auth pages, where the grid frames a single centred card; the
 *   full-page layout wants it edge-to-edge behind scrolling content.
 */
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
