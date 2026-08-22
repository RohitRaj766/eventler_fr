'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';

/** Path segments that read better as something other than a title-cased slug. */
const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  programs: 'Programs',
  tasks: 'Tasks',
  venues: 'Venues',
  resources: 'Resources',
  notifications: 'Notifications',
  organization: 'Organization',
  members: 'Members',
  roles: 'Roles & permissions',
  settings: 'Settings',
  profile: 'Profile',
  password: 'Change password',
  audit: 'Audit log',
  live: 'Live mode',
  onboarding: 'Get started',
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Trail derived from the URL, with one substitution: a program id is replaced
 * by that program's name, so the crumb reads "Programs / TECHNOVA 2027" rather
 * than a raw UUID.
 */
export function DynamicBreadcrumb() {
  const pathname = usePathname() ?? '';
  const currentProgram = useAppSelector((state) => state.program.current);

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) return null;

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    let label = LABELS[segment];

    if (!label && UUID.test(segment)) {
      label = currentProgram?.id === segment ? currentProgram.name : 'Details';
    }
    if (!label) {
      label = segment.replace(/-/g, ' ').replace(/^./, (char) => char.toUpperCase());
    }

    return { href, label, isLast: index === segments.length - 1 };
  });

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((crumb) => (
          <Fragment key={crumb.href}>
            <li className="flex items-center gap-1">
              {crumb.isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="transition-colors hover:text-foreground">
                  {crumb.label}
                </Link>
              )}
            </li>
            {!crumb.isLast && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
