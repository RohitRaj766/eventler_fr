'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SubNavItem {
  title: string;
  href: string;
}

export interface NavItemProps {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  subItems?: SubNavItem[];
  onNavigate?: () => void;
}

export function SidebarNavItem({ title, href, icon: Icon, subItems, onNavigate }: NavItemProps) {
  const pathname = usePathname();
  const isProgramRoute = href.startsWith('/programs') && pathname.startsWith('/programs');
  const isActive = isProgramRoute || pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  const hasSubItems = Boolean(subItems && subItems.length > 0);
  const [isOpen, setIsOpen] = useState(isActive);

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all group cursor-pointer select-none',
          isActive
            ? 'bg-indigo-50/80 text-indigo-700 font-semibold'
            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
        )}
        onClick={() => {
          if (hasSubItems) {
            setIsOpen(!isOpen);
          }
        }}
      >
        <Link
          href={href}
          onClick={onNavigate}
          className="flex items-center gap-2.5 flex-1 min-w-0"
        >
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
            )}
          />
          <span className="truncate">{title}</span>
        </Link>

        {hasSubItems && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                isOpen ? 'transform rotate-0' : 'transform -rotate-90'
              )}
            />
          </button>
        )}
      </div>

      {hasSubItems && isOpen && (
        <div className="ml-4 pl-3 border-l border-slate-200 space-y-1 py-1">
          {subItems!.map((sub) => {
            const isSubActive =
              pathname === sub.href ||
              (sub.href.startsWith('/programs') && pathname.startsWith('/programs'));
            return (
              <Link
                key={sub.title}
                href={sub.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                  isSubActive
                    ? 'text-indigo-600 font-semibold bg-indigo-50/60'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', isSubActive ? 'bg-indigo-600' : 'bg-slate-300')} />
                <span className="truncate">{sub.title}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
