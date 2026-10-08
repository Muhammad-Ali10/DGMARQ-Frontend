import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@components/Custom/sidebar';
import TopBar from '@components/Custom/TopBar';
import DashboardBackdrop from '@components/common/DashboardBackdrop';
import { RouteErrorBoundary } from '@components/common/ErrorBoundary';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@components/ui/sheet';
import { Button } from '@components/ui/button';
import { Menu } from 'lucide-react';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen bg-background">
      <DashboardBackdrop />

      <div className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <AdminSidebar />
      </div>

      <div className="relative flex min-h-screen flex-col lg:ml-64">
        <header className="fixed inset-x-0 top-0 z-40 flex items-center border-b border-border/60 bg-gradient-to-b from-surface-base/90 to-surface-base/70 backdrop-blur-md lg:left-64">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
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
            <RouteErrorBoundary>
              <Outlet />
            </RouteErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
