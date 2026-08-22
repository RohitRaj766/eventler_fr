'use client';

import { useState } from 'react';
import { ArrowRight, GitBranch, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { removeDependency } from '@/features/dependency/dependencySlice';
import { fetchProgramTree } from '@/features/program/programSlice';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Can } from '@/components/auth/Can';
import { useToast } from '@/hooks/useToast';
import { formatDuration, humanizeEnum } from '@/utils/formatters';
import type { EventNode, NodeDependency } from '@/types';

/**
 * Execution relationships for the selected node.
 *
 * Predecessors and successors are shown as two directed lists so the reading
 * order matches the direction of the arrow — "X must finish before this" above,
 * "this must finish before Y" below.
 */
export function DependencyPanel({
  node,
  programId,
  onAddDependency,
}: {
  node: EventNode;
  programId: string;
  onAddDependency: () => void;
}) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const flatNodes = useAppSelector((state) => state.program.flatNodes);
  const [pendingRemoval, setPendingRemoval] = useState<NodeDependency | null>(null);

  const nameOf = (nodeId: string) =>
    flatNodes.find((candidate) => candidate.id === nodeId)?.name ?? 'Unknown node';

  const predecessors = node.predecessors ?? [];
  const successors = node.successors ?? [];
  const isEmpty = !predecessors.length && !successors.length;

  const handleRemove = async (dependency: NodeDependency) => {
    const result = await dispatch(
      removeDependency({
        predecessorId: dependency.predecessorId,
        successorId: dependency.successorId,
      }),
    );
    if (removeDependency.rejected.match(result)) {
      toast.error('Could not remove the dependency', (result.payload as { message: string })?.message);
      return;
    }
    toast.success('Dependency removed');
    void dispatch(fetchProgramTree(programId));
  };

  const renderRow = (dependency: NodeDependency, direction: 'in' | 'out') => {
    const otherId = direction === 'in' ? dependency.predecessorId : dependency.successorId;
    return (
      <li
        key={dependency.id}
        className="flex items-start justify-between gap-2 rounded-lg border border-border px-3 py-2.5"
      >
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            {direction === 'in' && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />}
            <span className="truncate">{nameOf(otherId)}</span>
            {direction === 'out' && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {humanizeEnum(dependency.type)}
            {dependency.lagMinutes > 0 && ` · ${formatDuration(dependency.lagMinutes)} lag`}
          </p>
        </div>
        <Can action="node.update">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => setPendingRemoval(dependency)}
            aria-label={`Remove dependency with ${nameOf(otherId)}`}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </Can>
      </li>
    );
  };

  return (
    <div className="space-y-4">
      {isEmpty ? (
        <EmptyState
          icon={GitBranch}
          title="No dependencies"
          description="Link this node to another so a delay here shifts what comes after it."
          action={
            <Can action="node.update">
              <Button size="sm" onClick={onAddDependency}>
                Add dependency
              </Button>
            </Can>
          }
          className="py-8"
        />
      ) : (
        <>
          {predecessors.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Must run before this
              </h3>
              <ul className="space-y-2">{predecessors.map((dep) => renderRow(dep, 'in'))}</ul>
            </section>
          )}

          {successors.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Waits on this
              </h3>
              <ul className="space-y-2">{successors.map((dep) => renderRow(dep, 'out'))}</ul>
            </section>
          )}

          <Can action="node.update">
            <Button variant="outline" size="sm" className="w-full" onClick={onAddDependency}>
              <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
              Add another dependency
            </Button>
          </Can>
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
        title="Remove this dependency?"
        description="The two nodes will no longer be linked, and a delay in one will stop shifting the other. You can add the link back later."
        confirmLabel="Remove dependency"
        onConfirm={async () => {
          if (pendingRemoval) await handleRemove(pendingRemoval);
        }}
      />
    </div>
  );
}
