import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@components/Custom/sidebar';
import TopBar from '@components/Custom/TopBar';
import DashboardBackdrop from '@components/common/DashboardBackdrop';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@components/ui/sheet';
import { Button } from '@components/ui/button';
import { Menu } from 'lucide-react';

/**
 * Admin shell — brought in line with the buyer and seller layouts.
 *
 * The mobile drawer was the last hand-rolled `fixed + translate-x` div in the
 * app: no focus trap, no Escape, no scroll lock, no `aria-modal`, and its close
 * button was reachable only by tabbing through the whole page behind it. It is
 * now the same Radix-backed <Sheet> the other two use.
 *
 * No bottom nav here on purpose: admin work is desktop work, and the sidebar has
 * ~30 destinations that will not reduce to five.
 */
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative min-h-screen bg-background">
      <DashboardBackdrop />

      <div className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <AdminSidebar />
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
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              <AdminSidebar />
            </SheetContent>
          </Sheet>
          <div className="flex-1">
            <TopBar />
          </div>
        </header>

        <main className="relative flex-1 px-4 pt-20 pb-8 md:px-6 lg:px-8 lg:pt-24">
          <div key={location.pathname} className="animate-dash-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
