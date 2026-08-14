'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Node } from '@/types';
import { getStatusColorClass, formatTimeOnly, getNodeTypeLabel } from '@/utils/formatters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Clock,
  Link as LinkIcon,
  Move,
  Trash2,
  Calendar,
  Layers,
  Pencil,
} from 'lucide-react';

export interface TreeNodeRowProps {
  node: Node;
  depth?: number;
  onAddChild?: (node: Node) => void;
  onRecordTime?: (node: Node) => void;
  onAddDependency?: (node: Node) => void;
  onEdit?: (node: Node) => void;
  onMove?: (node: Node) => void;
  onDropMove?: (draggedId: string, targetId: string) => void;
  onDelete?: (node: Node) => void;
}

export function TreeNodeRow({
  node,
  depth = 0,
  onAddChild,
  onRecordTime,
  onAddDependency,
  onEdit,
  onMove,
  onDropMove,
  onDelete,
}: TreeNodeRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const childrenList = node.children || (node as any).tree || [];
  const hasChildren = childrenList.length > 0;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== node.id) {
      onDropMove?.(draggedId, node.id);
    }
  };

  return (
    <div className="space-y-2">
      {/* Node Container Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-card/60 p-3 shadow-xs hover:border-primary/50 transition-all duration-200 backdrop-blur-xs",
          isDragOver && "border-2 border-amber-500 bg-amber-500/10 shadow-lg ring-2 ring-amber-500/30"
        )}
      >
        {/* Left Side: Type, Expand Toggle, Title & Times */}
        <div className="flex items-start sm:items-center gap-3">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <span className="h-6 w-6 shrink-0" />
          )}

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                <Layers className="mr-1 h-2.5 w-2.5" />
                {getNodeTypeLabel(node.type, node.customTypeName)}
              </Badge>
              <h4 className="font-semibold text-sm tracking-tight text-foreground">
                {node.name}
              </h4>
              <Badge className={`text-[10px] font-bold border ${getStatusColorClass(node.status)}`}>
                {node.status}
              </Badge>
            </div>

            {node.description && (
              <p className="text-xs text-muted-foreground font-normal line-clamp-1">
                {node.description}
              </p>
            )}

            {/* Timelines Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-indigo-400" />
                Planned: {formatTimeOnly(node.plannedStartTime)} - {formatTimeOnly(node.plannedEndTime)}
              </span>
              <span className="flex items-center gap-1 font-mono text-violet-400">
                <Clock className="h-3 w-3" />
                Projected: {formatTimeOnly(node.projectedStartTime)} - {formatTimeOnly(node.projectedEndTime)}
              </span>
              {node.actualStartTime && (
                <span className="flex items-center gap-1 font-mono text-emerald-400 font-semibold">
                  Actual: {formatTimeOnly(node.actualStartTime)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Toolbar */}
        <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs hover:bg-emerald-500/10 hover:text-emerald-400"
            onClick={() => onRecordTime?.(node)}
            title="Record Live Stage Execution Time"
          >
            <Clock className="mr-1 h-3.5 w-3.5" />
            <span className="hidden lg:inline">Record Time</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs hover:bg-indigo-500/10 hover:text-indigo-400 font-semibold"
            onClick={() => onAddChild?.(node)}
            title="Add Sub-Activity to this session"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            <span>+ Sub-Activity</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs hover:bg-cyan-500/10 hover:text-cyan-400 font-semibold"
            onClick={() => onAddDependency?.(node)}
            title="Set Activity Dependency (Depends On)"
          >
            <LinkIcon className="mr-1 h-3.5 w-3.5" />
            <span>Depends On</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-400"
            onClick={() => onEdit?.(node)}
            title="Edit / Rename Session or Activity"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', node.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            className="h-8 w-8 hover:bg-amber-500/10 hover:text-amber-400 cursor-grab active:cursor-grabbing"
            onClick={() => onMove?.(node)}
            title="Hold & Drag to Move Activity or Click to Reorder"
          >
            <Move className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-red-500/10 hover:text-red-400"
            onClick={() => onDelete?.(node)}
            title="Delete Node"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Children Recursion */}
      {hasChildren && isExpanded && (
        <div className="space-y-2 pl-4 border-l border-indigo-500/30 ml-4 py-1">
          {childrenList.map((child: any) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              onAddChild={onAddChild}
              onRecordTime={onRecordTime}
              onAddDependency={onAddDependency}
              onEdit={onEdit}
              onMove={onMove}
              onDropMove={onDropMove}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
