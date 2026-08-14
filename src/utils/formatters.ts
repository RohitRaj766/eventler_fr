import { NodeStatus, NodeTypeCategory, TaskPriority } from '@/types';

export function formatDate(dateString?: string | Date | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeOnly(dateString?: string | Date | null): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusBadgeVariant(status: NodeStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'IN_PROGRESS':
      return 'default';
    case 'COMPLETED':
      return 'secondary';
    case 'DELAYED':
    case 'CANCELLED':
      return 'destructive';
    case 'READY':
      return 'outline';
    default:
      return 'outline';
  }
}

export function getStatusColorClass(status: NodeStatus): string {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-slate-500/10 text-slate-400 border-slate-700';
    case 'READY':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-700';
    case 'IN_PROGRESS':
      return 'bg-blue-500/10 text-blue-400 border-blue-600 animate-pulse';
    case 'DELAYED':
      return 'bg-amber-500/10 text-amber-400 border-amber-600';
    case 'COMPLETED':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-600';
    case 'CANCELLED':
      return 'bg-red-500/10 text-red-400 border-red-600';
    case 'SKIPPED':
      return 'bg-gray-500/10 text-gray-400 border-gray-600';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-700';
  }
}

export function getPriorityBadgeColor(priority: TaskPriority): string {
  switch (priority) {
    case 'LOW':
      return 'bg-slate-500/10 text-slate-400 border-slate-700';
    case 'MEDIUM':
      return 'bg-blue-500/10 text-blue-400 border-blue-600';
    case 'HIGH':
      return 'bg-amber-500/10 text-amber-400 border-amber-600';
    case 'URGENT':
      return 'bg-red-500/10 text-red-400 border-red-600';
  }
}

export function getNodeTypeLabel(type: NodeTypeCategory, customName?: string | null): string {
  if (type === 'CUSTOM' && customName) return customName;
  return type.charAt(0) + type.slice(1).toLowerCase();
}
