'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/app/hooks';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard Overview',
  programs: 'Event Schedule Builder',
  root: 'All Events',
  'live-engine': 'Live Stage Tracker',
  tasks: 'Task Board',
  venues: 'Venues & Equipment',
  roles: 'Roles & Permissions',
  members: 'University Members',
  'audit-logs': 'Activity Logs',
};

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const { activeProgramTree } = useAppSelector((state) => state.program);
  const rawSegments = pathname.split('/').filter(Boolean);

  let segments = [...rawSegments];
  if (segments[0] === 'programs') {
    if (!segments[1] || segments[1] === 'root') {
      segments = ['programs', 'root'];
    } else {
      segments = ['programs', 'root', segments[1]];
    }
  }

  return (
    <Breadcrumb className="flex items-center text-xs font-medium text-slate-500">
      <BreadcrumbList className="gap-1 sm:gap-1.5 text-xs">
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors lowercase">
              home
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          if (segment === 'dashboard') {
            return (
              <React.Fragment key={segment}>
                <BreadcrumbSeparator className="text-slate-400 text-[10px]">{`>`}</BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-slate-900">
                    Dashboard Overview
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </React.Fragment>
            );
          }

          let href = '/' + rawSegments.slice(0, index + 1).join('/');
          if (segment === 'programs') href = '/programs/root';
          if (segment === 'root') href = '/programs/root';

          const isLast = index === segments.length - 1;

          let label = routeLabels[segment] || segment;
          if (activeProgramTree && (activeProgramTree.programId === segment || activeProgramTree.id === segment)) {
            label = activeProgramTree.name;
          }

          return (
            <React.Fragment key={`${segment}-${index}`}>
              <BreadcrumbSeparator className="text-slate-400 text-[10px]">{`>`}</BreadcrumbSeparator>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="font-semibold text-slate-900">
                    {label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href} className="hover:text-slate-900 transition-colors">
                      {label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
