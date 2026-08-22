'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Building2,
  CalendarRange,
  ClipboardList,
  CreditCard,
  History,
  LayoutDashboard,
  type LucideIcon,
  Package,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { usePermissions, type PermissionAction } from '@/hooks/usePermission';
import { useAppSelector } from '@/app/hooks';
import { selectUnreadCount } from '@/features/notification/notificationSlice';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Hidden unless the user holds one of these actions. */
  permission?: PermissionAction | PermissionAction[];
  /** Renders a count chip; only shown when greater than zero. */
  badge?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

/**
 * Primary navigation.
 *
 * Sections whose items are all denied disappear entirely, so a volunteer sees
 * a short, honest menu instead of a wall of links that would 403.
 */
export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { can } = usePermissions();
  const unread = useAppSelector(selectUnreadCount);
  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);
  const organizations = useAppSelector((state) => state.auth.organizations);
  const activeOrg = organizations.find((org) => org.id === activeOrgId);

  const sections: NavSection[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Notifications', href: '/notifications', icon: Bell, badge: unread },
      ],
    },
    {
      label: 'Event operations',
      items: [
        {
          label: 'Programs',
          href: '/programs',
          icon: CalendarRange,
          permission: ['program.read', 'program.create'],
        },
        { label: 'Tasks', href: '/tasks', icon: ClipboardList, permission: 'task.read' },
        { label: 'Venues', href: '/venues', icon: Building2, permission: 'venue.manage' },
        { label: 'Resources', href: '/resources', icon: Package, permission: 'venue.manage' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { label: 'Organization', href: '/organization', icon: Building2, permission: 'org.read' },
        { label: 'Members', href: '/organization/members', icon: Users, permission: 'org.read' },
        {
          label: 'Roles & permissions',
          href: '/organization/roles',
          icon: ShieldCheck,
          permission: 'role.manage',
        },
        {
          label: 'Billing',
          href: '/organization/billing',
          icon: CreditCard,
          permission: 'org.billing',
        },
        { label: 'Audit log', href: '/audit', icon: History, permission: 'audit.read' },
      ],
    },
  ];

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => can(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname?.startsWith(`${href}/`));

  return (
    <nav
      aria-label="Main navigation"
      className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar"
    >
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">Eventler</p>
          {activeOrg && (
            <p className="truncate text-xs text-muted-foreground">{activeOrg.name}</p>
          )}
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        {visibleSections.map((section) => (
          <div key={section.label} className="mb-5 last:mb-0">
            <p className="px-2 pb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {Boolean(item.badge) && (
                        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground tabular-nums">
                          {item.badge! > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
