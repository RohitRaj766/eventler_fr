'use client';

import { useState, useEffect } from 'react';
import { Node } from '@/types';
import { flattenNodeTree } from '@/utils/nodeTreeHelpers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Move } from 'lucide-react';

interface MoveNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetNode: Node | null;
  rootTree: Node | null;
  onSubmit: (newParentId: string | null, newSortOrder: number) => Promise<void>;
}

export function MoveNodeModal({
  isOpen,
  onClose,
  targetNode,
  rootTree,
  onSubmit,
}: MoveNodeModalProps) {
  const allNodes = rootTree ? flattenNodeTree(rootTree) : [];

  const currentParentNode = targetNode?.parentId
    ? allNodes.find((n) => n.id === targetNode.parentId)
    : null;

  const currentParentName = currentParentNode ? currentParentNode.name : 'Main Level';
  const currentOrder = (targetNode?.sortOrder ?? 0) + 1;

  const [selectedParentId, setSelectedParentId] = useState<string | null>(
    targetNode?.parentId || rootTree?.id || null
  );
  const [selectedSortOrder, setSelectedSortOrder] = useState<number>(
    targetNode?.sortOrder ?? 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (targetNode) {
      setSelectedParentId(targetNode.parentId || rootTree?.id || null);
      setSelectedSortOrder(targetNode.sortOrder ?? 0);
    }
  }, [targetNode, rootTree]);

  const isRootProgramNode = targetNode?.type === 'PROGRAM' || targetNode?.id === rootTree?.id;

  const isDescendant = (nodeId: string, ancestorId: string): boolean => {
    let curr = allNodes.find((n) => n.id === nodeId);
    while (curr && curr.parentId) {
      if (curr.parentId === ancestorId) return true;
      curr = allNodes.find((n) => n.id === curr!.parentId);
    }
    return false;
  };

  const validParentOptions = allNodes.filter((n) => {
    if (n.id === targetNode?.id) return false;
    if (targetNode && isDescendant(n.id, targetNode.id)) return false;
    return true;
  });

  const targetParentChildren = selectedParentId
    ? allNodes.filter((n) => n.parentId === selectedParentId && n.id !== targetNode?.id)
    : allNodes.filter((n) => !n.parentId && n.id !== targetNode?.id);

  const positionCount = Math.max(targetParentChildren.length + 1, 1);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(selectedParentId, selectedSortOrder);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Move className="h-4 w-4" />
            </div>
            Move / Reorder Activity
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-500">
            Shuffle position or move <strong className="text-slate-900">{targetNode?.name}</strong> under a parent session.
          </DialogDescription>
        </DialogHeader>

        {isRootProgramNode ? (
          <div className="py-4 text-center space-y-2">
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold">
              ⚠️ The main root event cannot be re-parented or moved under another session.
            </div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
            {/* Current Parent & Position Info */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span>Current Parent Session:</span>
                <span className="font-bold text-slate-900">{currentParentName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span>Current Position Order:</span>
                <span className="font-bold text-indigo-600">Position #{currentOrder}</span>
              </div>
            </div>

            {/* Target Parent Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Target Parent Session</label>
              <Select
                value={selectedParentId || rootTree?.id || ''}
                onValueChange={(val) => {
                  setSelectedParentId(val);
                  setSelectedSortOrder(0);
                }}
              >
                <SelectTrigger className="h-10 text-xs bg-white border-slate-200 text-slate-900">
                  <SelectValue placeholder="Select parent session..." />
                </SelectTrigger>
                <SelectContent>
                  {validParentOptions.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.id === rootTree?.id ? `🏆 ${node.name} (Main Event)` : node.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Sort Order Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Target Position Order (Shuffle)</label>
              <Select
                value={String(selectedSortOrder)}
                onValueChange={(val) => setSelectedSortOrder(Number(val))}
              >
                <SelectTrigger className="h-10 text-xs bg-white border-slate-200 text-slate-900">
                  <SelectValue placeholder="Select position order..." />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: positionCount }).map((_, idx) => (
                    <SelectItem key={idx} value={String(idx)}>
                      Position #{idx + 1} {idx === currentOrder - 1 && selectedParentId === targetNode?.parentId ? '(Current)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
                className="h-9 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
              >
                {isSubmitting ? 'Saving...' : 'Save New Position'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
