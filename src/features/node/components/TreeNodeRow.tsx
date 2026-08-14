'use client';

import { useState } from 'react';
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
} from 'lucide-react';

interface TreeNodeRowProps {
  node: Node;
  depth?: number;
  onAddChild?: (node: Node) => void;
  onRecordTime?: (node: Node) => void;
  onAddDependency?: (node: Node) => void;
  onMove?: (node: Node) => void;
  onDelete?: (node: Node) => void;
}

export function TreeNodeRow({
  node,
  depth = 0,
  onAddChild,
  onRecordTime,
  onAddDependency,
  onMove,
  onDelete,
}: TreeNodeRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="space-y-2">
      {/* Node Container Box */}
      <div
        className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-card/60 p-3 shadow-xs hover:border-primary/50 transition-all duration-200 backdrop-blur-xs"
        style={{ marginLeft: `${depth * 24}px` }}
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
            title="Log Real-world Execution Time"
          >
            <Clock className="mr-1 h-3.5 w-3.5" />
            <span className="hidden lg:inline">Actual Time</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs hover:bg-indigo-500/10 hover:text-indigo-400"
            onClick={() => onAddChild?.(node)}
            title="Add Child Sub-node"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            <span className="hidden lg:inline">Child</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs hover:bg-cyan-500/10 hover:text-cyan-400"
            onClick={() => onAddDependency?.(node)}
            title="Link Node Dependency"
          >
            <LinkIcon className="mr-1 h-3.5 w-3.5" />
            <span className="hidden lg:inline">Link</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-amber-500/10 hover:text-amber-400"
            onClick={() => onMove?.(node)}
            title="Move Node Parent/Position"
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
        <div className="space-y-2">
          {node.children!.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              onAddChild={onAddChild}
              onRecordTime={onRecordTime}
              onAddDependency={onAddDependency}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
