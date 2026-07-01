import { Outlet } from 'react-router-dom';
import Header from '@components/Custom/Header';
import Footer from "@components/Custom/Footer";
import { SupportChatWidget } from '@features/support';
import MobileBottomBar from '@components/Custom/MobileBottomBar';

// PERF FIX (FP1): the original upload shipped untransformed (4.4 MB) on every
// public page. f_auto,q_auto serves WebP at auto quality (~95 KB, verified) —
// same image, ~98% fewer bytes. NOTE: w_ resize transforms are NOT possible on
// this asset — the source is 29.57 MP, over the account's 25 MP processing
// limit (Cloudinary returns 400). Inline style (not a Tailwind arbitrary
// class) so the comma-separated transform can't trip the parser.
const BG_IMAGE_URL =
  'https://res.cloudinary.com/dhuhvbzpj/image/upload/f_auto,q_auto/v1767681117/Homepagebg_bsz1et.jpg';

// Futuristic ambiance grid overlay (the faint "boxes" pattern from the design
// mockup). Fixed, non-interactive, sits above the bg image and below content.
const AMBIANCE_STYLE = {
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
};

const PublicLayout = () => {
  return (
    <div
      className="min-h-screen w-full bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: `url('${BG_IMAGE_URL}')` }}
    >
      {/* Ambiance grid overlay (boxes) */}
      <div aria-hidden="true" style={AMBIANCE_STYLE} />

      {/* Content sits above the ambiance overlay */}
      <div className="relative" style={{ zIndex: 1 }}>
        {/* Header - Now fully contained in Header component */}
        <Header />

        {/* Main Content - Add bottom padding on mobile to avoid overlap with bottom bar */}
        <main className="mx-auto py-8 pb-[7.5rem] md:pb-8">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer/>

        {/* Support Chat Widget - Floating Icon */}
        <SupportChatWidget />

        {/* Mobile Bottom Navigation Bar - Only visible on mobile */}
        <MobileBottomBar />
      </div>
    </div>
  );
};

export default PublicLayout;

