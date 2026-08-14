'use client';

import { useAppSelector } from '@/app/hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  FolderTree,
  Radio,
  CheckSquare,
  Building2,
  ShieldCheck,
  Users,
  History,
  ChevronsUpDown,
  MoreVertical,
  Sparkles,
} from 'lucide-react';
import { SidebarNavGroup } from './sidebar/SidebarNavGroup';
import { NavItemProps } from './sidebar/SidebarNavItem';

interface NavGroupDef {
  groupName: string;
  items: (NavItemProps & { requiredAction?: string; adminOnly?: boolean; superAdminOnly?: boolean })[];
}

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, activeOrg } = useAppSelector((state) => state.auth);

  const userName = user ? `${user.firstName} ${user.lastName}` : 'Alex Rivera';
  const userEmail = user?.email || 'user@gmail.com';
  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'AR';

  const userPermissions = user?.permissions || [];
  const activeOrgObj = activeOrg || (user?.organizations && user.organizations[0]);

  const currentUserRoleName =
    activeOrgObj?.role ||
    user?.organizations?.find((o: any) => o.id === activeOrgObj?.id)?.role ||
    user?.role ||
    '';

  const isSuperAdmin =
    currentUserRoleName === 'Organization Super Admin' ||
    currentUserRoleName === 'ORG_SUPER_ADMIN' ||
    userPermissions.includes('*');

  const isAdmin =
    isSuperAdmin ||
    currentUserRoleName === 'Organization Admin' ||
    currentUserRoleName === 'ORG_ADMIN' ||
    userPermissions.includes('org.read') ||
    userPermissions.includes('role.manage');

  const canAccess = (item: NavItemProps & { requiredAction?: string; adminOnly?: boolean; superAdminOnly?: boolean }) => {
    if (isSuperAdmin) return true;
    if (item.superAdminOnly) return false;
    if (item.adminOnly && !isAdmin) return false;
    if (item.requiredAction) {
      return (
        isAdmin ||
        userPermissions.includes(item.requiredAction) ||
        userPermissions.includes('*')
      );
    }
    return true;
  };

  const rawNavGroups: NavGroupDef[] = [
    {
      groupName: 'Analytics',
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
          title: 'Event Schedule Builder',
          href: '/programs/root',
          icon: FolderTree,
          adminOnly: true,
          requiredAction: 'program.create',
          subItems: [
            { title: 'Active Event Schedule', href: '/programs/root' },
          ],
        },
        {
          title: 'Live Stage Tracker',
          href: '/live-engine',
          icon: Radio,
          adminOnly: true,
          requiredAction: 'timeline.update',
          subItems: [
            { title: 'Live Stage Control Room', href: '/live-engine' },
          ],
        },
        {
          title: 'Task Board',
          href: '/tasks',
          icon: CheckSquare,
          subItems: [
            { title: 'Readiness & Kanban', href: '/tasks' },
          ],
        },
        {
          title: 'Venues & Equipment',
          href: '/venues',
          icon: Building2,
          adminOnly: true,
          requiredAction: 'venue.manage',
          subItems: [
            { title: 'Resource Inventory', href: '/venues' },
          ],
        },
      ],
    },
    {
      groupName: 'Governance',
      items: [
        {
          title: 'Roles & Permissions',
          href: '/roles',
          icon: ShieldCheck,
          adminOnly: true,
          requiredAction: 'role.manage',
          subItems: [
            { title: 'Role Category Pools', href: '/roles' },
          ],
        },
        {
          title: 'University Members',
          href: '/members',
          icon: Users,
          subItems: [
            { title: 'Member Roster & Roles', href: '/members' },
          ],
        },
        {
          title: 'Activity Logs',
          href: '/audit-logs',
          icon: History,
          superAdminOnly: true,
          requiredAction: 'audit.read',
          subItems: [
            { title: 'Audit Trail Stream', href: '/audit-logs' },
          ],
        },
      ],
    },
  ];

  const navGroups = rawNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(canAccess),
    }))
    .filter((group) => group.items.length > 0);

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

      {/* Modular Navigation Collapsible Sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {navGroups.map((group) => (
          <SidebarNavGroup
            key={group.groupName}
            groupName={group.groupName}
            items={group.items}
            onNavigate={onNavigate}
          />
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
