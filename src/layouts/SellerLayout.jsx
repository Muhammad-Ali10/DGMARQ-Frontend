import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SellerSidebar } from '@components/Custom/sidebar';
import TopBar from '@components/Custom/TopBar';
import DashboardBottomNav from '@components/Custom/DashboardBottomNav';
import DashboardBackdrop from '@components/common/DashboardBackdrop';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@components/ui/sheet';
import { Button } from '@components/ui/button';
import { Menu } from 'lucide-react';

/**
 * Seller dashboard shell.
 *
 * The mobile drawer is a Radix-backed <Sheet>, which brings the focus trap,
 * Escape-to-close, scroll lock and `aria-modal` that the previous hand-rolled
 * `fixed + translate-x` div had none of. Remounting it on the pathname closes
 * the drawer after navigation.
 *
 * The layout owns page padding. Pages must not add their own — that was the
 * source of the `px-4 sm:px-0` drift across the seller screens.
 */
const SellerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative min-h-screen bg-background">
      <DashboardBackdrop />

      {/* Desktop sidebar — always present, never a dialog. */}
      <div className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SellerSidebar />
      </div>

      <div className="relative flex min-h-screen flex-col lg:ml-64">
        <header className="fixed inset-x-0 top-0 z-40 flex items-center border-b border-border/60 bg-gradient-to-b from-surface-base/90 to-surface-base/70 backdrop-blur-md lg:left-64">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen} key={location.pathname}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2 lg:hidden" aria-label="Open menu">
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Seller navigation</SheetTitle>
              <SellerSidebar />
            </SheetContent>
          </Sheet>
          <div className="flex-1">
            <TopBar />
          </div>
        </header>

        {/* pb-20 clears the mobile bottom nav; dropped again at lg. */}
        <main className="relative flex-1 px-4 pt-20 pb-20 md:px-6 lg:px-8 lg:pt-24 lg:pb-8">
          <div key={location.pathname} className="animate-dash-in">
            <Outlet />
          </div>
        </main>
      </div>

      <DashboardBottomNav role="seller" />
    </div>
  );
};

export default SellerLayout;
