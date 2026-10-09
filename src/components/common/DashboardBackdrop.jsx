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
    <div
      className="absolute inset-0 bg-cover bg-top bg-no-repeat opacity-40"
      style={{ backgroundImage: `url('${BG_IMAGE_URL}')` }}
    />

    <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/92 to-background" />

    <div className="absolute -top-1/4 -left-1/4 size-[60vw] rounded-full bg-accent/10 blur-[120px] animate-aurora" />
    <div
      className="absolute -right-1/4 -bottom-1/4 size-[55vw] rounded-full bg-info/10 blur-[120px] animate-aurora"
      style={{ animationDelay: '-12s' }}
    />

    <div className="absolute inset-0" style={GRID_STYLE} />
  </div>
);

export default DashboardBackdrop;
