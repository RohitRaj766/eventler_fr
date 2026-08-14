'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { metaService } from '@/services/api';
import { Loader2 } from 'lucide-react';

export interface EnumOptionItem {
  value: string;
  label: string;
  icon?: string;
}

interface AsyncEnumSelectProps {
  enumName: string; // e.g. "ProgramStatus", "NodeStatus", "NodeTypeCategory"
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

export function AsyncEnumSelect({
  enumName,
  value,
  onValueChange,
  placeholder = 'Select option...',
  triggerClassName,
}: AsyncEnumSelectProps) {
  const [options, setOptions] = useState<EnumOptionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenChange = async (open: boolean) => {
    if (open) {
      setIsLoading(true);
      try {
        const res: any = await metaService.getEnumByName(enumName);
        if (Array.isArray(res)) {
          const parsedOptions: EnumOptionItem[] = res.map((item: any) =>
            typeof item === 'string'
              ? { value: item, label: item }
              : { value: item.value, label: item.label, icon: item.icon }
          );
          setOptions(parsedOptions);
        }
      } catch (err) {
        console.error(`Failed to load enum '${enumName}' from backend:`, err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange} onOpenChange={handleOpenChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
        {isLoading ? (
          <div className="flex items-center justify-center p-3 text-slate-400 gap-2 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" /> Fetching from backend...
          </div>
        ) : options.length > 0 ? (
          options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))
        ) : (
          <SelectItem value={value || 'DRAFT'}>
            {value || 'DRAFT'}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
