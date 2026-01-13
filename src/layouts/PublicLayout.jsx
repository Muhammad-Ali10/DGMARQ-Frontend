import { Outlet } from 'react-router-dom';
import Header from '../components/Custom/Header';
import Footer from "../components/Custom/Footer";
import SupportChatWidget from '../components/SupportChatWidget';
import MobileBottomBar from '../components/Custom/MobileBottomBar';

const PublicLayout = () => {
  return (
    <div className="min-h-screen w-full bg-cover bg-top bg-no-repeat bg-[url('https://res.cloudinary.com/dhuhvbzpj/image/upload/v1767681117/Homepagebg_bsz1et.jpg')]" >
      {/* Header - Now fully contained in Header component */}
      <Header />

      {/* Main Content - Add bottom padding on mobile to avoid overlap with bottom bar */}
      <main className="mx-auto py-8 pb-20 md:pb-8">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer/>

      {/* Support Chat Widget - Floating Icon */}
      <SupportChatWidget />

      {/* Mobile Bottom Navigation Bar - Only visible on mobile */}
      <MobileBottomBar />
    </div>
  );
};

export default PublicLayout;

