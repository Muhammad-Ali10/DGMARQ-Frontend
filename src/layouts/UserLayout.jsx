import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { UserSidebar } from '@components/Custom/sidebar';
import TopBar from '@components/Custom/TopBar';
import DashboardBottomNav from '@components/Custom/DashboardBottomNav';
import DashboardBackdrop from '@components/common/DashboardBackdrop';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@components/ui/sheet';
import { Button } from '@components/ui/button';
import { Menu } from 'lucide-react';

/**
 * Buyer dashboard shell.
 *
 * The mobile drawer is a Radix-backed <Sheet>: focus trap, Escape-to-close,
 * scroll lock and `aria-modal`, none of which the previous hand-rolled
 * `fixed + translate-x` div had.
 *
 * The seller-redirect effect below is routing behaviour, left exactly as it was.
 */
const UserLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { roles } = useSelector((state) => state.auth);

  useEffect(() => {
    const normalizedRoles =
      Array.isArray(roles) && roles.length > 0 ? roles.map((r) => String(r).toLowerCase()) : [];
    const explicitAccess = sessionStorage.getItem('allowCustomerAccess') === 'true';

    if (normalizedRoles.includes('seller') && !explicitAccess) {
      const isInitialLoad = !sessionStorage.getItem('hasNavigated');
      if (isInitialLoad) {
        navigate('/seller/dashboard', { replace: true });
      }
    }
    sessionStorage.setItem('hasNavigated', 'true');
  }, [roles, navigate]);

  return (
    <div className="relative min-h-screen bg-background">
      <DashboardBackdrop />

      <div className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <UserSidebar />
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
              <SheetTitle className="sr-only">Account navigation</SheetTitle>
              <UserSidebar />
            </SheetContent>
          </Sheet>
          <div className="flex-1">
            <TopBar />
          </div>
        </header>

        <main className="relative flex-1 px-4 pt-20 pb-20 md:px-6 lg:px-8 lg:pt-24 lg:pb-8">
          <div key={location.pathname} className="animate-dash-in">
            <Outlet />
          </div>
        </main>
      </div>

      <DashboardBottomNav role="buyer" />
    </div>
  );
};

export default UserLayout;
