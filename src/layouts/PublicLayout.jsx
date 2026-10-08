import { Outlet } from 'react-router-dom';
import Header from '@components/Custom/Header';
import Footer from "@components/Custom/Footer";
import { SupportChatWidget } from '@features/support';
import MobileBottomBar from '@components/Custom/MobileBottomBar';
import { RouteErrorBoundary } from '@components/common/ErrorBoundary';
import { ambianceGridStyle } from '@lib/surface';
import { useHashScroll } from '@hooks/useHashScroll';

const BG_IMAGE_URL =
  'https://res.cloudinary.com/dhuhvbzpj/image/upload/f_auto,q_auto/v1767681117/Homepagebg_bsz1et.jpg';

const AMBIANCE_STYLE = ambianceGridStyle();

const PublicLayout = () => {
  useHashScroll();

  return (
    <div
      className="min-h-screen w-full bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: `url('${BG_IMAGE_URL}')` }}
    >
      <div aria-hidden="true" style={AMBIANCE_STYLE} />

      <div className="relative" style={{ zIndex: 1 }}>
        <Header />

        <main className="mx-auto py-8 pb-[7.5rem] md:pb-8">
          <RouteErrorBoundary>
            <Outlet />
          </RouteErrorBoundary>
        </main>

        <Footer/>

        <SupportChatWidget />

        <MobileBottomBar />
      </div>
    </div>
  );
};

export default PublicLayout;

