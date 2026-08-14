'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { logoutUser, switchOrganization } from '@/features/auth/authSlice';
import { createOrganization } from '@/features/org/orgSlice';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppSidebar } from './AppSidebar';
import { CreateOrgModal } from '@/features/org/components/CreateOrgModal';
import { CreateOrgInput } from '@/utils/validationSchemas';
import {
  Menu,
  Bell,
  Search,
  Moon,
  PanelLeft,
  Building,
  Plus,
  LogOut,
  User as UserIcon,
  Shield,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, activeOrg, activeOrgId } = useAppSelector((state) => state.auth);
  const { myOrganizations } = useAppSelector((state) => state.org);
  const { toasts } = useAppSelector((state) => state.notification);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [orgModalOpen, setOrgModalOpen] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/login');
  };

  const handleOrgSwitch = (orgId: string) => {
    dispatch(switchOrganization(orgId));
  };

  const handleCreateOrg = async (data: CreateOrgInput) => {
    await dispatch(createOrganization(data));
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'AR';

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-6">
      {/* Left: Sidebar Collapse Icon & Search Input */}
      <div className="flex items-center gap-3">
        {/* Mobile Nav Trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5 text-slate-600" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <AppSidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Sidebar Toggle Icon [||] */}
        <button className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors">
          <PanelLeft className="h-4 w-4" />
        </button>

        {/* Global Search Bar (⌘K) */}
        <div className="relative hidden sm:flex items-center w-64 md:w-80">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search..."
            className="pl-9 pr-10 h-9 text-xs bg-slate-50 border-slate-200 rounded-lg focus-visible:ring-slate-400"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-2 inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions Toolbar */}
      <div className="flex items-center gap-2.5">
        {/* Notifications Bell Icon */}
        <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900 rounded-lg">
          <Bell className="h-4 w-4" />
          {toasts.length > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
          )}
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Dark Mode Icon */}
        <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 rounded-lg">
          <Moon className="h-4 w-4" />
        </Button>

        {/* Tenant Switcher Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 max-w-[180px] h-8 text-xs border-slate-200">
              <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{activeOrg?.name || 'Institutional Org'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="text-xs font-medium text-slate-400">
              Active Organization Context
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {myOrganizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleOrgSwitch(org.id)}
                className="flex items-center justify-between cursor-pointer text-xs"
              >
                <span className="truncate">{org.name}</span>
                {org.id === activeOrgId && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8 border border-slate-200">
                <AvatarImage src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} alt={user?.firstName} />
                <AvatarFallback className="bg-slate-900 text-white font-bold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-semibold leading-none">{user?.firstName || 'Alex'} {user?.lastName || 'Rivera'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'user@gmail.com'}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs cursor-pointer">
              <UserIcon className="mr-2 h-3.5 w-3.5" /> Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs cursor-pointer">
              <Shield className="mr-2 h-3.5 w-3.5" /> Security & Roles
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-xs text-red-500 focus:text-red-500 cursor-pointer">
              <LogOut className="mr-2 h-3.5 w-3.5" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CreateOrgModal
        isOpen={orgModalOpen}
        onClose={() => setOrgModalOpen(false)}
        onSubmit={handleCreateOrg}
      />
    </header>
  );
}
