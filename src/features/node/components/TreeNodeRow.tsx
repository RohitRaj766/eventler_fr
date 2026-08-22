'use client';

import { useState, type DragEvent, type KeyboardEvent } from 'react';
import {
  ChevronRight,
  Clock,
  MapPin,
  MoreVertical,
  Plus,
  Trash2,
  Pencil,
  GitBranch,
  ListChecks,
  GripVertical,
} from 'lucide-react';
import type { EventNode } from '@/types';
import { StatusDot } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Can } from '@/components/auth/Can';
import { formatDuration, formatTimeOnly, getNodeTypeLabel, nodeDelayMinutes } from '@/utils/formatters';
import { cn } from '@/lib/utils';

export type DropPosition = 'inside' | 'before' | 'after';

export interface TreeNodeRowProps {
  node: EventNode;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  /** Ids currently being dragged, so a node cannot be dropped into itself. */
  draggingId: string | null;
  canDropInto: (targetId: string) => boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAddChild: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddDependency: () => void;
  onDragStart: (nodeId: string) => void;
  onDragEnd: () => void;
  onDrop: (targetId: string, position: DropPosition) => void;
}

/**
 * One row of the event tree.
 *
 * The row is a real button so the tree is fully keyboard-navigable, and drag
 * and drop is layered on top rather than being the only way to reorder — the
 * kebab menu offers the same moves for anyone not using a pointer.
 */
export function TreeNodeRow({
  node,
  depth,
  isSelected,
  isExpanded,
  hasChildren,
  draggingId,
  canDropInto,
  onToggle,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
  onAddDependency,
  onDragStart,
  onDragEnd,
  onDrop,
}: TreeNodeRowProps) {
  const [dropTarget, setDropTarget] = useState<DropPosition | null>(null);

  const delay = nodeDelayMinutes(node);
  const isDragging = draggingId === node.id;
  const droppable = Boolean(draggingId) && draggingId !== node.id && canDropInto(node.id);
  const taskCount = node.tasks?.length ?? 0;
  const depCount = (node.predecessors?.length ?? 0) + (node.successors?.length ?? 0);

  /** Top/bottom eighth reorders as a sibling; the middle re-parents. */
  const positionFromPointer = (event: DragEvent<HTMLDivElement>): DropPosition => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = (event.clientY - rect.top) / rect.height;
    if (offset < 0.25) return 'before';
    if (offset > 0.75) return 'after';
    return 'inside';
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!droppable) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDropTarget(positionFromPointer(event));
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!droppable) return;
    event.preventDefault();
    const position = positionFromPointer(event);
    setDropTarget(null);
    onDrop(node.id, position);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' && hasChildren && !isExpanded) {
      event.preventDefault();
      onToggle();
    }
    if (event.key === 'ArrowLeft' && hasChildren && isExpanded) {
      event.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setDropTarget(null)}
      onDrop={handleDrop}
      className={cn(
        'relative rounded-lg border transition-colors',
        isSelected ? 'border-primary bg-accent/50' : 'border-transparent hover:bg-muted/50',
        isDragging && 'opacity-40',
        dropTarget === 'inside' && 'border-primary bg-primary/10 ring-1 ring-primary',
      )}
    >
      {/* Sibling drop indicators */}
      {dropTarget === 'before' && (
        <span className="absolute -top-px left-0 right-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />
      )}
      {dropTarget === 'after' && (
        <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />
      )}

      <div
        className="flex items-center gap-1 py-1 pr-1"
        style={{ paddingLeft: `${depth * 1.1 + 0.25}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={onToggle}
            aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
            aria-expanded={isExpanded}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight
              className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')}
              aria-hidden="true"
            />
          </button>
        ) : (
          <span className="h-6 w-6 shrink-0" />
        )}

        <span
          draggable={depth > 0}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', node.id);
            onDragStart(node.id);
          }}
          onDragEnd={onDragEnd}
          className={cn(
            'hidden h-6 w-5 shrink-0 items-center justify-center text-muted-foreground/50 sm:flex',
            depth > 0 ? 'cursor-grab active:cursor-grabbing hover:text-muted-foreground' : 'opacity-0',
          )}
          aria-hidden="true"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>

        <button
          type="button"
          onClick={onSelect}
          onKeyDown={handleKeyDown}
          aria-current={isSelected ? 'true' : undefined}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left"
        >
          <StatusDot value={node.status} />

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="truncate text-sm font-medium text-foreground">{node.name}</span>
              <span className="rounded border border-border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {getNodeTypeLabel(node.type, node.customTypeName)}
              </span>
              {delay > 0 && (
                <span className="rounded bg-amber-500/15 px-1.5 py-px text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                  +{formatDuration(delay)} late
                </span>
              )}
            </span>

            <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {formatTimeOnly(node.projectedStartTime)} – {formatTimeOnly(node.projectedEndTime)}
              </span>
              {node.venue?.name && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {node.venue.name}
                </span>
              )}
              {taskCount > 0 && (
                <span className="flex items-center gap-1">
                  <ListChecks className="h-3 w-3" aria-hidden="true" />
                  {taskCount}
                </span>
              )}
              {depCount > 0 && (
                <span className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" aria-hidden="true" />
                  {depCount}
                </span>
              )}
            </span>
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              aria-label={`Actions for ${node.name}`}
            >
              <MoreVertical className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <Can action="node.create">
              <DropdownMenuItem onSelect={onAddChild}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add child node
              </DropdownMenuItem>
            </Can>
            <Can action="node.update">
              <DropdownMenuItem onSelect={onEdit}>
                <Pencil className="h-4 w-4" aria-hidden="true" /> Edit node
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onAddDependency}>
                <GitBranch className="h-4 w-4" aria-hidden="true" /> Add dependency
              </DropdownMenuItem>
            </Can>
            {depth > 0 && (
              <Can action="node.delete">
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete node
                </DropdownMenuItem>
              </Can>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
