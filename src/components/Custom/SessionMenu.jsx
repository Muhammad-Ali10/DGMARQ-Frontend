import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '@hooks/useLogout';
import { Button } from '@components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import RegisterPanel from '@components/common/RegisterPanel';
import { User, LogOut, LayoutDashboard, ShoppingBag, Key } from 'lucide-react';
import { cn } from '@lib/utils';
import SafeImage from '@components/ui/safe-image';

const SessionMenu = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const { isAuthenticated, user, roles } = useSelector((state) => state.auth);

  const normalizedRoles =
    Array.isArray(roles) && roles.length > 0 ? roles.map((r) => String(r).toLowerCase().trim()) : [];
  const hasAdmin = normalizedRoles.includes('admin');
  const hasSeller = normalizedRoles.includes('seller');

  const getDashboardRoute = () => {
    if (hasAdmin) return '/admin/dashboard';
    if (hasSeller) return '/seller/dashboard';
    return '/user/dashboard';
  };

  const logoutMutation = useLogout({ onDone: () => setIsOpen(false) });

  const getUserDisplay = () => {
    if (user?.profileImage) {
      return (
        <SafeImage
          src={user.profileImage}
          alt={user.name || 'User'}
          className="w-8 h-8 rounded-full object-cover border-2 border-accent/50"
        />
      );
    }

    const initials = user?.name
      ? user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U';

    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-fg text-sm font-semibold border-0 border-accent/50">
        {initials}
      </div>
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'border-accent text-fg hover:bg-accent/10 rounded-lg h-10 mt-1 transition-colors',
            isAuthenticated && 'p-1.5'
          )}
        >
          {isAuthenticated ? (
            getUserDisplay()
          ) : (
            <>
              <User className="h-4 w-4 mr-2" />
              Register
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      {!isAuthenticated ? (
        <DropdownMenuContent
          align="end"
          sideOffset={12}
          className="w-[340px] rounded-xl border-accent/35 bg-surface-2 p-5 shadow-hud"
        >
          <RegisterPanel onNavigate={() => setIsOpen(false)} />
        </DropdownMenuContent>
      ) : (
        <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-1">
          <div className="border-b border-border px-3 py-3">
            <div className="flex items-center gap-3">
              {getUserDisplay()}
              <div className="flex-1 min-w-0">
                <p className="text-fg font-medium truncate">{user?.name || 'User'}</p>
                <p className="text-fg-muted text-sm truncate">{user?.email || ''}</p>
              </div>
            </div>
          </div>

          {hasAdmin || hasSeller ? (
            <>
              {hasAdmin && (
                <DropdownMenuItem onSelect={() => navigate('/admin/dashboard')}>
                  <LayoutDashboard className="w-5 h-5" />
                  Admin Dashboard
                </DropdownMenuItem>
              )}
              {hasSeller && (
                <DropdownMenuItem onSelect={() => navigate('/seller/dashboard')}>
                  <LayoutDashboard className="w-5 h-5" />
                  Seller Dashboard
                </DropdownMenuItem>
              )}
              {!hasAdmin && (
                <DropdownMenuItem
                  onSelect={() => {
                    sessionStorage.setItem('allowCustomerAccess', 'true');
                    navigate('/user/dashboard');
                  }}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Customer Dashboard
                </DropdownMenuItem>
              )}
            </>
          ) : (
            <DropdownMenuItem onSelect={() => navigate(getDashboardRoute())}>
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </DropdownMenuItem>
          )}

          {!hasSeller && !hasAdmin && (
            <>
              <DropdownMenuItem onSelect={() => navigate('/user/orders')}>
                <ShoppingBag className="w-5 h-5" />
                Orders
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/user/license-keys')}>
                <Key className="w-5 h-5" />
                License Keys
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            disabled={logoutMutation.isPending}
            onSelect={(e) => {
              e.preventDefault();
              logoutMutation.mutate();
            }}
          >
            <LogOut className="w-5 h-5" />
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  );
};

export default SessionMenu;
