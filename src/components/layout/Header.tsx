'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  KeyRound,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Sun,
  User as UserIcon,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logoutUser } from '@/features/auth/authSlice';
import { setTheme } from '@/features/ui/uiSlice';
import { resetNotifications } from '@/features/notification/notificationSlice';
import { resetPrograms } from '@/features/program/programSlice';
import { resetTasks } from '@/features/task/taskSlice';
import { resetMetadata } from '@/features/meta/metaSlice';
import { realtimeClient } from '@/services/socket';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppSidebar } from './AppSidebar';
import { OrgSwitcher } from '@/features/org/components/OrgSwitcher';
import { NotificationBell } from '@/features/notification/components/NotificationBell';
import { fullName, initialsOf } from '@/utils/formatters';
import { useRealtimeStatus } from '@/hooks/useRealtime';
import { cn } from '@/lib/utils';

export function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const user = useAppSelector((state) => state.auth.user);
  const theme = useAppSelector((state) => state.ui.theme);
  const realtimeStatus = useRealtimeStatus();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    // Drop every cached collection so nothing survives into the next session.
    dispatch(resetNotifications());
    dispatch(resetPrograms());
    dispatch(resetTasks());
    dispatch(resetMetadata());
    realtimeClient.disconnect();
    router.replace('/login');
  };

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <AppSidebar onNavigate={() => setMobileNavOpen(false)} />
          </SheetContent>
        </Sheet>

        <OrgSwitcher />
      </div>

      <div className="flex items-center gap-1">
        {/* Realtime health, so an operator running a live event can tell at a
            glance whether pushes are arriving or the app is polling. */}
        <span
          title={
            realtimeStatus === 'connected'
              ? 'Realtime connected'
              : 'Realtime unavailable — refreshing on a timer instead'
          }
          className={cn(
            'hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium sm:flex',
            realtimeStatus === 'connected'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-muted-foreground',
          )}
        >
          {realtimeStatus === 'connected' ? (
            <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span className="sr-only">Realtime status: </span>
          {realtimeStatus === 'connected' ? 'Live' : 'Polling'}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Theme: ${theme}. Change theme`}>
              <ThemeIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onSelect={() => dispatch(setTheme('light'))}>
              <Sun className="h-4 w-4" aria-hidden="true" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => dispatch(setTheme('dark'))}>
              <Moon className="h-4 w-4" aria-hidden="true" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => dispatch(setTheme('system'))}>
              <Monitor className="h-4 w-4" aria-hidden="true" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 w-9 rounded-full p-0" aria-label="Account menu">
              <Avatar className="h-8 w-8">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {initialsOf(user)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-semibold">{fullName(user)}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">
                <UserIcon className="h-4 w-4" aria-hidden="true" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/password">
                <KeyRound className="h-4 w-4" aria-hidden="true" /> Change password
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => void handleLogout()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
