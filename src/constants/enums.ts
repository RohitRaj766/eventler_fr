import { ProgramStatus, NodeStatus, NodeTypeCategory } from '@/types';
import { metaService } from '@/services/api';

export interface EnumOption<T> {
  value: T;
  label: string;
  icon?: string;
}

export const PROGRAM_STATUS_OPTIONS: EnumOption<ProgramStatus>[] = [
  { value: 'DRAFT', label: 'DRAFT', icon: '📝' },
  { value: 'PLANNED', label: 'PLANNED', icon: '📅' },
  { value: 'PUBLISHED', label: 'PUBLISHED', icon: '🚀' },
  { value: 'LIVE', label: 'LIVE', icon: '🔴' },
  { value: 'PAUSED', label: 'PAUSED', icon: '⏸️' },
  { value: 'COMPLETED', label: 'COMPLETED', icon: '✅' },
  { value: 'CANCELLED', label: 'CANCELLED', icon: '❌' },
];

export const NODE_STATUS_OPTIONS: EnumOption<NodeStatus>[] = [
  { value: 'SCHEDULED', label: 'SCHEDULED' },
  { value: 'READY', label: 'READY' },
  { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
  { value: 'DELAYED', label: 'DELAYED' },
  { value: 'COMPLETED', label: 'COMPLETED' },
  { value: 'SKIPPED', label: 'SKIPPED' },
  { value: 'CANCELLED', label: 'CANCELLED' },
];

export const NODE_TYPE_OPTIONS: EnumOption<NodeTypeCategory>[] = [
  { value: 'PROGRAM', label: 'Program Root' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'SESSION', label: 'Session' },
  { value: 'ROUND', label: 'Round' },
  { value: 'CEREMONY', label: 'Ceremony' },
  { value: 'COMPETITION', label: 'Competition' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'PRESENTATION', label: 'Presentation' },
  { value: 'BREAK', label: 'Break' },
  { value: 'TASK', label: 'Task Node' },
  { value: 'CUSTOM', label: 'Custom Type' },
];

export async function fetchBackendProgramStatusOptions(): Promise<EnumOption<ProgramStatus>[]> {
  try {
    const rawValues: string[] = await metaService.getEnumByName('ProgramStatus');
    const icons: Record<string, string> = {
      DRAFT: '📝',
      PLANNED: '📅',
      PUBLISHED: '🚀',
      LIVE: '🔴',
      PAUSED: '⏸️',
      COMPLETED: '✅',
      CANCELLED: '❌',
    };
    return rawValues.map((val) => ({
      value: val as ProgramStatus,
      label: val,
      icon: icons[val] || '📌',
    }));
  } catch (err) {
    return PROGRAM_STATUS_OPTIONS;
  }
}
