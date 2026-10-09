import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLogout } from '@hooks/useLogout';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@components/ui/dropdown-menu';
import { NotificationBell } from '@features/notifications';
import SafeImage from '@components/ui/safe-image';
import { User, LogOut, Settings } from 'lucide-react';

const initialsOf = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const routesFor = (user) => {
  const roles = Array.isArray(user?.roles) ? user.roles.map((r) => String(r).toLowerCase()) : [];
  if (roles.includes('admin')) return { dashboard: '/admin/dashboard', profile: '/admin/settings' };
  if (roles.includes('seller')) return { dashboard: '/seller/dashboard', profile: '/seller/profile' };
  return { dashboard: '/user/dashboard', profile: '/user/profile' };
};

const AccountMenu = ({ user }) => {
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  const name = user?.name || user?.username || 'User';
  const avatar = user?.profileImage || user?.avatar || null;
  const { dashboard, profile } = routesFor(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
        aria-label="Account menu"
      >
        {avatar ? (
          <SafeImage
            src={avatar}
            alt=""
            w={40}
            className="size-10 rounded-full border border-border-interactive object-cover"
          />
        ) : (
          <span className="flex size-10 items-center justify-center rounded-full border border-border-interactive bg-accent-soft text-sm font-semibold text-accent-on-dark">
            {initialsOf(name)}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-fg">{name}</span>
          {user?.email && (
            <span className="truncate text-xs font-normal text-fg-muted">{user.email}</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate(dashboard)}>
          <User aria-hidden="true" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate(profile)}>
          <Settings aria-hidden="true" />
          Profile &amp; settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={logoutMutation.isPending}
          onSelect={(e) => {
            e.preventDefault();
            logoutMutation.mutate();
          }}
        >
          <LogOut aria-hidden="true" />
          {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const TopBar = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="flex h-16 items-center justify-end gap-3 px-4 md:px-6">
      <NotificationBell />
      <AccountMenu user={user} />
    </div>
  );
};

export default TopBar;
