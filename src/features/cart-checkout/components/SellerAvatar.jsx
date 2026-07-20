// Deterministic seller avatar. The v74 mockup used dicebear-generated images,
// but that would be one external image request per cart line — this derives the
// same "always has an avatar" effect locally from the shop name (initials + a
// stable colour), which is what the mockup's own initials() fallback did.

const PALETTES = [
  ['#1e3a8a', '#3730a3'],
  ['#0e7490', '#065f46'],
  ['#7c3aed', '#b45309'],
  ['#be123c', '#7f1d1d'],
  ['#0f766e', '#134e4a'],
  ['#c2410c', '#7c2d12'],
];

const hash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const sellerInitials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

/** Small round avatar derived from the seller's shop name. */
const SellerAvatar = ({ name, size = 18, className = '' }) => {
  const [from, to] = PALETTES[hash(String(name || '')) % PALETTES.length];
  return (
    <span
      className={className}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${from}, ${to})`,
        border: '1px solid rgba(255,255,255,0.18)',
        boxShadow: '0 0 0 1.5px rgba(58,116,240,0.35)',
        color: '#fff',
        fontSize: Math.max(7, Math.round(size * 0.42)),
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '-0.2px',
      }}
    >
      {sellerInitials(name)}
    </span>
  );
};

export default SellerAvatar;
