'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { SidebarNavItem, NavItemProps } from './SidebarNavItem';

export interface SidebarNavGroupProps {
  groupName: string;
  items: NavItemProps[];
  onNavigate?: () => void;
}

export function SidebarNavGroup({ groupName, items, onNavigate }: SidebarNavGroupProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-900 transition-colors rounded-md hover:bg-slate-50 cursor-pointer select-none"
      >
        <span>{groupName}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-slate-400 transition-transform duration-200',
            isOpen ? 'transform rotate-0' : 'transform -rotate-90'
          )}
        />
      </button>

      {isOpen && (
        <div className="space-y-1 pt-0.5">
          {items.map((item) => (
            <SidebarNavItem key={item.title} {...item} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}
