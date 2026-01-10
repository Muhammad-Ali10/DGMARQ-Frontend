import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SellerSidebar } from '../components/ui/sidebar';
import TopBar from '../components/ui/TopBar';
import { Menu, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

const SellerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-primary overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 bottom-0 w-64 z-50 lg:z-30 transform transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-full bg-secondary border-r border-border">
          {/* Mobile Close Button */}
          <div className="lg:hidden flex justify-end p-4 border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <SellerSidebar />
        </div>
      </div>
      
      {/* Main Content Area with TopBar */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64 w-full">
        {/* Fixed Top Bar */}
        <div className="fixed top-0 lg:left-64 left-0 right-0 z-40">
          <div className="flex items-center">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-white ml-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <TopBar />
            </div>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-hidden bg-primary pt-16">
          <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;
