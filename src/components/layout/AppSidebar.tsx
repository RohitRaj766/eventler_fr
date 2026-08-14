'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/app/hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  FolderTree,
  Radio,
  CheckSquare,
  Building2,
  ShieldCheck,
  History,
  ChevronsUpDown,
  MoreVertical,
  Sparkles,
} from 'lucide-react';

interface NavGroup {
  groupName?: string;
  items: {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);

  const userName = user ? `${user.firstName} ${user.lastName}` : 'Alex Rivera';
  const userEmail = user?.email || 'user@gmail.com';
  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'AR';

  const navGroups: NavGroup[] = [
    {
      groupName: 'Dashboards',
      items: [
        {
          title: 'Dashboard Overview',
          href: '/dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      groupName: 'Event Operations',
      items: [
        {
          title: 'Program Tree Builder',
          href: '/programs/root',
          icon: FolderTree,
        },
        {
          title: 'Live Engine Control',
          href: '/live-engine',
          icon: Radio,
        },
        {
          title: 'Task Readiness Board',
          href: '/tasks',
          icon: CheckSquare,
        },
        {
          title: 'Venues & Equipment',
          href: '/venues',
          icon: Building2,
        },
        {
          title: 'RBAC Scope Matrix',
          href: '/roles',
          icon: ShieldCheck,
        },
        {
          title: 'System Audit Stream',
          href: '/audit-logs',
          icon: History,
        },
      ],
    },
  ];

  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200/80 w-64 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm text-slate-900 tracking-tight">Eventler</span>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronsUpDown className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {group.groupName && (
              <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {group.groupName}
              </p>
            )}
            {group.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors group',
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                    <span>{item.title}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Account Card Footer */}
      <div className="p-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-8 w-8 border shrink-0">
            <AvatarImage src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} />
            <AvatarFallback className="bg-slate-900 text-white font-bold text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{userName}</p>
            <p className="text-[11px] text-slate-400 truncate leading-tight">{userEmail}</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 p-1">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
