'use client';

import { Node } from '@/types';
import { TreeNodeRow } from './TreeNodeRow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderTree, Plus } from 'lucide-react';

interface NodeTreeContainerProps {
  rootTree: Node | null;
  onAddChild?: (node: Node) => void;
  onRecordTime?: (node: Node) => void;
  onAddDependency?: (node: Node) => void;
  onMove?: (node: Node) => void;
  onDelete?: (node: Node) => void;
  onCreateRootNode?: () => void;
}

export function NodeTreeContainer({
  rootTree,
  onAddChild,
  onRecordTime,
  onAddDependency,
  onMove,
  onDelete,
  onCreateRootNode,
}: NodeTreeContainerProps) {
  if (!rootTree) {
    return (
      <Card className="border-dashed p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
          <FolderTree className="h-6 w-6" />
        </div>
        <CardTitle className="text-lg font-bold">No Event Program Loaded</CardTitle>
        <CardDescription className="max-w-md mx-auto mt-1 mb-4">
          Initialize a root program tree node or select an existing program to construct your execution hierarchy.
        </CardDescription>
        <Button onClick={onCreateRootNode}>
          <Plus className="mr-2 h-4 w-4" /> Create Root Program
        </Button>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-indigo-400" />
            {rootTree.name} Hierarchy Tree
          </CardTitle>
          <CardDescription>
            Generic node structure with live actual start/end logging and topological schedule propagation.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => onAddChild?.(rootTree)}>
          <Plus className="mr-2 h-4 w-4" /> Add Sub-Node
        </Button>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-3">
        <TreeNodeRow
          node={rootTree}
          depth={0}
          onAddChild={onAddChild}
          onRecordTime={onRecordTime}
          onAddDependency={onAddDependency}
          onMove={onMove}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  );
}
