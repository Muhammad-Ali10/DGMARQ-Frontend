import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '@store/slices/authSlice';
import { authAPI } from '@services/api';
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

// Header session control: the v74 mockup's Register popup when signed out, the
// account menu when signed in.
//
// Both live in a Radix DropdownMenu. This used to be a hand-rolled `absolute`
// panel with its own isOpen state and a mousedown/touchstart listener for
// click-outside — which had no Escape key, no focus return to the trigger, and no
// focus trapping. The primitive gives all three, and CLAUDE.md asks that every
// popup be a shadcn component rather than a custom one.
const SessionMenu = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
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

  const logoutMutation = useMutation({
    mutationFn: () => authAPI.logout(),
    // Same handling either way: the server may already consider the session gone,
    // and the local session must not survive a failed call.
    onSettled: () => {
      dispatch(logout());
      queryClient.clear();
      setIsOpen(false);
      navigate('/');
    },
  });

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
        // The register popup is a PANEL, not a list of menu items, so the content
        // gets the card padding and width the mockup specifies (340px) and no
        // DropdownMenuItem semantics.
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

          {/* Admins and sellers can also shop, so they get every dashboard they
              hold a role for rather than only the highest one. */}
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
              <DropdownMenuItem onSelect={() => navigate('/user/dashboard')}>
                <LayoutDashboard className="w-5 h-5" />
                Customer Dashboard
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onSelect={() => navigate(getDashboardRoute())}>
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </DropdownMenuItem>
          )}

          {/* Sellers have their own orders and keys views in the seller area. */}
          {!hasSeller && (
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
            // preventDefault so the menu stays put while the request is in
            // flight; onSettled closes it once the session is actually gone.
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
