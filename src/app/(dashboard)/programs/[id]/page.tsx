'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, PanelRightClose, Radio } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchProgramTree, selectNode } from '@/features/program/programSlice';
import { createNode, deleteNode, moveNode, updateNode } from '@/features/node/nodeSlice';
import { createTask, fetchTasksByNode } from '@/features/task/taskSlice';
import { fetchOrgMembers } from '@/features/org/orgSlice';
import { NodeTreeContainer } from '@/features/node/components/NodeTreeContainer';
import { NodeInspector } from '@/features/node/components/NodeInspector';
import { NodeForm, type NodeFormValues } from '@/features/node/components/NodeForm';
import { CreateDependencyModal } from '@/features/dependency/components/CreateDependencyModal';
import { TaskFormModal, type TaskSubmitValues } from '@/features/task/components/TaskFormModal';
import { RecordActualTimeModal } from '@/features/liveEngine/components/RecordActualTimeModal';
import { ProgramStatusControl } from '@/features/program/components/ProgramStatusControl';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { Can } from '@/components/auth/Can';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ErrorState, LoadingState } from '@/components/ui/states';
import { useToast } from '@/hooks/useToast';
import { useRealtimeChannel, roomFor } from '@/hooks/useRealtime';
import { flattenForest, findNodeInForest } from '@/utils/nodeTreeHelpers';
import type { EventNode } from '@/types';

type DialogState =
  | { kind: 'none' }
  | { kind: 'create'; parent: EventNode }
  | { kind: 'edit'; node: EventNode }
  | { kind: 'delete'; node: EventNode }
  | { kind: 'dependency'; node: EventNode }
  | { kind: 'task'; node: EventNode }
  | { kind: 'time'; node: EventNode };

/**
 * The program workspace — the app's central screen.
 *
 * Three panels on desktop: the tree on the left, the selected node's detail in
 * the middle, and its tasks and dependencies alongside. Below `lg` the detail
 * panel becomes a sheet, so the tree keeps the full width instead of both
 * panels being squeezed into an unusable column.
 */
export default function ProgramWorkspacePage() {
  const params = useParams<{ id: string }>();
  const programId = params?.id ?? '';
  const dispatch = useAppDispatch();
  const toast = useToast();

  const { current, tree, selectedNodeId, isLoadingTree, treeError } = useAppSelector(
    (state) => state.program,
  );
  const members = useAppSelector((state) => state.org.members);

  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' });
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);

  const refresh = useCallback(() => {
    if (programId) void dispatch(fetchProgramTree(programId));
  }, [dispatch, programId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Assignee pickers need the member roster.
  useEffect(() => {
    if (!members.length) void dispatch(fetchOrgMembers());
  }, [dispatch, members.length]);

  // Keeps the tree current: realtime when the socket delivers, polling otherwise.
  useRealtimeChannel({
    room: programId ? roomFor.program(programId) : null,
    refresh,
    intervalMs: 45_000,
    enabled: Boolean(programId),
  });

  const selectedNode = useMemo(
    () => (selectedNodeId ? findNodeInForest(tree, selectedNodeId) : null),
    [tree, selectedNodeId],
  );

  const allNodes = useMemo(() => flattenForest(tree), [tree]);

  const handleSelect = (nodeId: string) => {
    dispatch(selectNode(nodeId));
    setMobileInspectorOpen(true);
  };

  const handleCreateNode = async (parent: EventNode, values: NodeFormValues) => {
    const result = await dispatch(
      createNode({
        programId,
        parentId: parent.id,
        type: values.type,
        name: values.name,
        description: values.description,
        plannedStartTime: values.plannedStartTime,
        plannedEndTime: values.plannedEndTime,
        venueId: values.venueId ?? undefined,
        customTypeName: values.customTypeName,
      }),
    );
    if (createNode.rejected.match(result)) {
      toast.error('Could not add the node', result.payload as string);
      return;
    }
    setDialog({ kind: 'none' });
    toast.success('Node added', `${values.name} is now under ${parent.name}.`);
  };

  const handleUpdateNode = async (node: EventNode, values: NodeFormValues) => {
    const result = await dispatch(
      updateNode({
        id: node.id,
        payload: {
          name: values.name,
          description: values.description ?? null,
          type: values.type,
          customTypeName: values.customTypeName ?? null,
          status: values.status,
          plannedStartTime: values.plannedStartTime,
          plannedEndTime: values.plannedEndTime,
          venueId: values.venueId,
          // Optimistic lock — a stale version is rejected, not overwritten.
          version: node.version,
        },
      }),
    );
    if (updateNode.rejected.match(result)) {
      toast.error('Could not save the node', result.payload as string);
      // A version conflict means our copy is behind; pull the current tree.
      if (/changed by someone else/i.test(String(result.payload))) refresh();
      return;
    }
    setDialog({ kind: 'none' });
    toast.success('Node updated');
  };

  const handleDeleteNode = async (node: EventNode) => {
    const result = await dispatch(deleteNode(node.id));
    if (deleteNode.rejected.match(result)) {
      toast.error('Could not delete the node', result.payload as string);
      return;
    }
    toast.success('Node deleted', `${node.name} and everything beneath it was removed.`);
  };

  const handleMove = async (nodeId: string, newParentId: string | null, newPosition: number) => {
    const result = await dispatch(moveNode({ id: nodeId, newParentId, newPosition }));
    if (moveNode.rejected.match(result)) {
      toast.error('Could not move the node', result.payload as string);
      // The optimistic reshape in the reducer never ran, but the server may
      // have partially applied — reload so the tree matches reality.
      refresh();
      return;
    }
    // Sibling order is recomputed server-side, so re-read rather than guess.
    refresh();
  };

  const handleCreateTask = async (values: TaskSubmitValues) => {
    const result = await dispatch(
      createTask({
        nodeId: values.nodeId,
        title: values.title,
        description: values.description,
        priority: values.priority,
        deadline: values.deadline,
        assigneeUserIds: values.assigneeUserIds,
      }),
    );
    if (createTask.rejected.match(result)) {
      toast.error('Could not create the task', result.payload as string);
      return;
    }
    setDialog({ kind: 'none' });
    void dispatch(fetchTasksByNode(values.nodeId));
    toast.success('Task created');
  };

  if (isLoadingTree && !current) {
    return <LoadingState label="Loading program…" />;
  }

  if (treeError && !current) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/programs">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All programs
          </Link>
        </Button>
        <ErrorState title="Could not load this program" message={treeError} onRetry={refresh} />
      </div>
    );
  }

  const inspector = (
    <NodeInspector
      node={selectedNode}
      programId={programId}
      onEdit={(node) => setDialog({ kind: 'edit', node })}
      onDelete={(node) => setDialog({ kind: 'delete', node })}
      onAddChild={(node) => setDialog({ kind: 'create', parent: node })}
      onAddDependency={(node) => setDialog({ kind: 'dependency', node })}
      onAddTask={(node) => setDialog({ kind: 'task', node })}
      onRecordTime={(node) => setDialog({ kind: 'time', node })}
    />
  );

  return (
    <RequirePermission action={['program.read', 'node.read']} title="this program">
      <div className="space-y-4">
        <PageHeader
          title={current?.name ?? 'Program'}
          description={current?.description ?? undefined}
          meta={
            current && (
              <ProgramStatusControl programId={programId} status={current.status} />
            )
          }
          actions={
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/programs">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  All programs
                </Link>
              </Button>
              <Can action="timeline.read">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/programs/${programId}/live`}>
                    <Radio className="h-4 w-4" aria-hidden="true" />
                    Live mode
                  </Link>
                </Button>
              </Can>
            </>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <section
            className="min-h-[26rem] overflow-hidden rounded-xl border border-border bg-card lg:h-[calc(100dvh-16rem)]"
            aria-label="Event tree"
          >
            <NodeTreeContainer
              tree={tree}
              selectedNodeId={selectedNodeId}
              onSelect={handleSelect}
              onAddChild={(parent) => setDialog({ kind: 'create', parent })}
              onEdit={(node) => setDialog({ kind: 'edit', node })}
              onDelete={(node) => setDialog({ kind: 'delete', node })}
              onAddDependency={(node) => setDialog({ kind: 'dependency', node })}
              onMove={handleMove}
              onCreateRoot={
                tree[0] ? () => setDialog({ kind: 'create', parent: tree[0] }) : undefined
              }
            />
          </section>

          {/* Desktop: the inspector sits beside the tree. */}
          <section
            className="hidden overflow-hidden rounded-xl border border-border bg-card lg:block lg:h-[calc(100dvh-16rem)]"
            aria-label="Node details"
          >
            {inspector}
          </section>
        </div>

        {/* Below lg the inspector becomes a sheet so the tree keeps full width. */}
        <Sheet open={mobileInspectorOpen && Boolean(selectedNode)} onOpenChange={setMobileInspectorOpen}>
          <SheetContent side="right" className="w-full p-0 sm:max-w-md lg:hidden">
            <SheetTitle className="sr-only">Node details</SheetTitle>
            <div className="flex h-full flex-col">
              <div className="flex justify-end p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileInspectorOpen(false)}
                  aria-label="Close details"
                >
                  <PanelRightClose className="h-4 w-4" aria-hidden="true" />
                  Close
                </Button>
              </div>
              <div className="min-h-0 flex-1">{inspector}</div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Create / edit node */}
        <Dialog
          open={dialog.kind === 'create' || dialog.kind === 'edit'}
          onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {dialog.kind === 'edit' ? 'Edit node' : 'Add a node'}
              </DialogTitle>
              <DialogDescription>
                {dialog.kind === 'create'
                  ? `This will be added under ${dialog.parent.name}.`
                  : 'Changes apply to this node only — its children keep their own timings.'}
              </DialogDescription>
            </DialogHeader>

            {dialog.kind === 'create' && (
              <NodeForm
                parent={dialog.parent}
                onSubmit={(values) => handleCreateNode(dialog.parent, values)}
                onCancel={() => setDialog({ kind: 'none' })}
              />
            )}
            {dialog.kind === 'edit' && (
              <NodeForm
                node={dialog.node}
                onSubmit={(values) => handleUpdateNode(dialog.node, values)}
                onCancel={() => setDialog({ kind: 'none' })}
              />
            )}
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={dialog.kind === 'delete'}
          onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
          title="Delete this node?"
          description={
            dialog.kind === 'delete' ? (
              <>
                <span className="font-medium text-foreground">{dialog.node.name}</span> and every
                node beneath it will be permanently deleted, along with their tasks and
                dependencies. This cannot be undone.
              </>
            ) : (
              ''
            )
          }
          confirmLabel="Delete node"
          onConfirm={async () => {
            if (dialog.kind === 'delete') await handleDeleteNode(dialog.node);
          }}
        />

        <CreateDependencyModal
          open={dialog.kind === 'dependency'}
          onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
          node={dialog.kind === 'dependency' ? dialog.node : null}
          candidates={allNodes}
          onCreated={refresh}
        />

        <TaskFormModal
          open={dialog.kind === 'task'}
          onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
          defaultNodeId={dialog.kind === 'task' ? dialog.node.id : undefined}
          nodes={allNodes}
          onSubmit={handleCreateTask}
        />

        <RecordActualTimeModal
          open={dialog.kind === 'time'}
          onOpenChange={(open) => !open && setDialog({ kind: 'none' })}
          node={dialog.kind === 'time' ? dialog.node : null}
          programId={programId}
          onRecorded={refresh}
        />
      </div>
    </RequirePermission>
  );
}
