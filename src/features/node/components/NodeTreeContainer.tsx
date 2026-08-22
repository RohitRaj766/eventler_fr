'use client';

import { useCallback, useMemo, useState } from 'react';
import { FolderTree, Plus, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import type { EventNode } from '@/types';
import { TreeNodeRow, type DropPosition } from './TreeNodeRow';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import { Can } from '@/components/auth/Can';
import { flattenForest, isDescendant } from '@/utils/nodeTreeHelpers';

interface NodeTreeContainerProps {
  tree: EventNode[];
  selectedNodeId: string | null;
  onSelect: (nodeId: string) => void;
  onAddChild: (parent: EventNode) => void;
  onEdit: (node: EventNode) => void;
  onDelete: (node: EventNode) => void;
  onAddDependency: (node: EventNode) => void;
  /** Called with the resolved parent and index once a drop is validated. */
  onMove: (nodeId: string, newParentId: string | null, newPosition: number) => void;
  onCreateRoot?: () => void;
}

/**
 * The event hierarchy.
 *
 * Drops are validated here before any request goes out: a node can never be
 * dropped into its own subtree, and the program root cannot be re-parented.
 * That keeps the tree well-formed rather than relying on the server to reject
 * a structure the UI already knows is invalid.
 */
export function NodeTreeContainer({
  tree,
  selectedNodeId,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
  onAddDependency,
  onMove,
  onCreateRoot,
}: NodeTreeContainerProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const allNodes = useMemo(() => flattenForest(tree), [tree]);
  const rootIds = useMemo(() => new Set(tree.map((node) => node.id)), [tree]);

  const toggle = useCallback((nodeId: string) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const expandAll = () => setCollapsed(new Set());
  const collapseAll = () =>
    setCollapsed(new Set(allNodes.filter((node) => node.children?.length).map((node) => node.id)));

  const canDropInto = useCallback(
    (targetId: string) => {
      if (!draggingId || draggingId === targetId) return false;
      // Moving a branch under its own descendant would detach it from the tree.
      return !isDescendant(tree, draggingId, targetId);
    },
    [draggingId, tree],
  );

  const handleDrop = useCallback(
    (targetId: string, position: DropPosition) => {
      const dragged = draggingId;
      setDraggingId(null);
      if (!dragged || dragged === targetId) return;
      if (rootIds.has(dragged)) return; // the program root stays put
      if (!canDropInto(targetId)) return;

      const target = allNodes.find((node) => node.id === targetId);
      if (!target) return;

      if (position === 'inside') {
        onMove(dragged, targetId, target.children?.length ?? 0);
        // Reveal the branch the node just landed in.
        setCollapsed((current) => {
          const next = new Set(current);
          next.delete(targetId);
          return next;
        });
        return;
      }

      // Sibling reorder: drop next to the target under the target's parent.
      if (!target.parentId) return; // cannot create a second root
      const siblings =
        allNodes.find((node) => node.id === target.parentId)?.children ?? [];
      const targetIndex = siblings.findIndex((node) => node.id === targetId);
      const insertAt = position === 'before' ? targetIndex : targetIndex + 1;
      onMove(dragged, target.parentId, Math.max(0, insertAt));
    },
    [draggingId, allNodes, canDropInto, onMove, rootIds],
  );

  const renderNodes = (nodes: EventNode[], depth: number) =>
    nodes.map((node) => {
      const hasChildren = Boolean(node.children?.length);
      const isExpanded = hasChildren && !collapsed.has(node.id);

      return (
        <li key={node.id}>
          <TreeNodeRow
            node={node}
            depth={depth}
            isSelected={selectedNodeId === node.id}
            isExpanded={isExpanded}
            hasChildren={hasChildren}
            draggingId={draggingId}
            canDropInto={canDropInto}
            onToggle={() => toggle(node.id)}
            onSelect={() => onSelect(node.id)}
            onAddChild={() => onAddChild(node)}
            onEdit={() => onEdit(node)}
            onDelete={() => onDelete(node)}
            onAddDependency={() => onAddDependency(node)}
            onDragStart={setDraggingId}
            onDragEnd={() => setDraggingId(null)}
            onDrop={handleDrop}
          />
          {isExpanded && (
            <ul role="group" className="space-y-0.5">
              {renderNodes(node.children!, depth + 1)}
            </ul>
          )}
        </li>
      );
    });

  if (!tree.length) {
    return (
      <EmptyState
        icon={FolderTree}
        title="This program has no nodes yet"
        description="Add an activity or session to start building the run of show."
        action={
          onCreateRoot && (
            <Can action="node.create">
              <Button onClick={onCreateRoot}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add the first node
              </Button>
            </Can>
          )
        }
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold text-foreground">Event tree</h2>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={expandAll} aria-label="Expand all">
            <ChevronsUpDown className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={collapseAll} aria-label="Collapse all">
            <ChevronsDownUp className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-2">
        <ul role="tree" aria-label="Event hierarchy" className="space-y-0.5">
          {renderNodes(tree, 0)}
        </ul>
      </div>

      <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
        Drag a node onto another to re-parent it, or to its top or bottom edge to reorder.
      </p>
    </div>
  );
}
