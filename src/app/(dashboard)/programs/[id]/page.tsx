'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchProgramTree, updateTreeRealtime, createProgram, updateProgramStatus } from '@/features/program/programSlice';
import { fetchMyOrganizations, createOrganization } from '@/features/org/orgSlice';
import { createNode, deleteNode, moveNode, updateNode } from '@/features/node/nodeSlice';
import { recordActualTime } from '@/features/liveEngine/liveEngineSlice';
import { createDependency } from '@/features/dependency/dependencySlice';
import { socketService } from '@/services/socket';
import { getApiActiveOrgId, programService } from '@/services/api';
import { Node } from '@/types';
import { NodeTreeContainer } from '@/features/node/components/NodeTreeContainer';
import { CreateNodeModal } from '@/features/node/components/CreateNodeModal';
import { RecordActualTimeModal } from '@/features/liveEngine/components/RecordActualTimeModal';
import { CreateDependencyModal } from '@/features/dependency/components/CreateDependencyModal';
import { MoveNodeModal } from '@/features/node/components/MoveNodeModal';
import { EditNodeModal } from '@/features/node/components/EditNodeModal';
import { CreateProgramModal } from '@/features/program/components/CreateProgramModal';
import { AsyncEnumSelect } from '@/components/ui/AsyncEnumSelect';
import { PROGRAM_STATUS_OPTIONS, fetchBackendProgramStatusOptions, EnumOption } from '@/constants/enums';
import { ProgramStatus } from '@/types';
import { CreateNodeInput, RecordActualTimeInput, CreateDependencyInput, CreateProgramInput } from '@/utils/validationSchemas';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, ArrowLeft, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatters';

export default function ProgramTreePage() {
  const params = useParams();
  const router = useRouter();
  const programId = (params?.id as string) || 'root';
  const dispatch = useAppDispatch();
  const { activeProgramTree } = useAppSelector((state) => state.program);

  const [allPrograms, setAllPrograms] = useState<any[]>([]);
  const [statusOptions, setStatusOptions] = useState<EnumOption<ProgramStatus>[]>(PROGRAM_STATUS_OPTIONS);

  useEffect(() => {
    fetchBackendProgramStatusOptions().then(setStatusOptions);
  }, []);
  const [createProgramModalOpen, setCreateProgramModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedParentNode, setSelectedParentNode] = useState<Node | null>(null);

  const [actualTimeModalOpen, setActualTimeModalOpen] = useState(false);
  const [targetTimeNode, setTargetTimeNode] = useState<Node | null>(null);

  const [depModalOpen, setDepModalOpen] = useState(false);
  const [predecessorNode, setPredecessorNode] = useState<Node | null>(null);

  useEffect(() => {
    dispatch(fetchMyOrganizations());

    programService
      .getOrgPrograms()
      .then((progs) => {
        setAllPrograms(progs || []);
      })
      .catch(console.error);

    if (programId && programId !== 'root') {
      dispatch(fetchProgramTree(programId));
      socketService.connect();
      socketService.joinProgramRoom(programId);

      socketService.onTimelineUpdated((payload) => {
        if (payload?.tree) {
          dispatch(updateTreeRealtime(payload.tree));
        }
      });

      return () => {
        socketService.leaveProgramRoom(programId);
      };
    }
  }, [dispatch, programId, router]);

  const handleAddChild = (node: Node) => {
    setSelectedParentNode(node);
    setCreateModalOpen(true);
  };

  const handleRecordTime = (node: Node) => {
    setTargetTimeNode(node);
    setActualTimeModalOpen(true);
  };

  const handleAddDependency = (node: Node) => {
    setPredecessorNode(node);
    setDepModalOpen(true);
  };

  const handleCreateProgramSubmit = async (data: CreateProgramInput) => {
    try {
      let currentOrgId = getApiActiveOrgId();
      if (!currentOrgId) {
        const orgs = await dispatch(fetchMyOrganizations()).unwrap();
        if (!orgs || orgs.length === 0) {
          const newOrg = await dispatch(
            createOrganization({ name: 'Default Institution Org', code: 'DEFAULT-ORG' })
          ).unwrap();
          currentOrgId = newOrg?.id;
        } else {
          currentOrgId = orgs[0].id;
        }
      }

      const newProg = await dispatch(createProgram(data)).unwrap();
      if (newProg?.id) {
        setAllPrograms((prev) => [newProg, ...prev]);
        router.push(`/programs/${newProg.id}`);
      }
    } catch (err: any) {
      console.error('Failed to create program:', err);
    }
  };

  const getTargetProgramId = () => {
    if (programId && programId !== 'root') return programId;
    return activeProgramTree?.programId || (activeProgramTree as any)?.id || 'root';
  };

  const handleCreateNodeSubmit = async (data: CreateNodeInput) => {
    const targetProgId = getTargetProgramId();
    await dispatch(
      createNode({
        programId: targetProgId,
        parentId: selectedParentNode?.id,
        data,
      })
    );
    dispatch(fetchProgramTree(targetProgId));
  };

  const handleRecordTimeSubmit = async (data: RecordActualTimeInput) => {
    const targetProgId = getTargetProgramId();
    await dispatch(recordActualTime(data));
    dispatch(fetchProgramTree(targetProgId));
  };

  const handleDependencySubmit = async (data: CreateDependencyInput) => {
    const targetProgId = getTargetProgramId();
    await dispatch(createDependency(data));
    dispatch(fetchProgramTree(targetProgId));
  };

  const handleDeleteNode = async (node: Node) => {
    if (confirm(`Are you sure you want to delete session/activity "${node.name}"?`)) {
      const targetProgId = getTargetProgramId();
      await dispatch(deleteNode(node.id));
      dispatch(fetchProgramTree(targetProgId));
    }
  };

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [targetMoveNode, setTargetMoveNode] = useState<Node | null>(null);

  const handleMoveNode = (node: Node) => {
    setTargetMoveNode(node);
    setMoveModalOpen(true);
  };

  const handleMoveSubmit = async (newParentId: string | null, newSortOrder: number) => {
    if (targetMoveNode) {
      const targetProgId = getTargetProgramId();
      await dispatch(moveNode({ id: targetMoveNode.id, newParentId, newSortOrder }));
      dispatch(fetchProgramTree(targetProgId));
    }
  };

  const handleDropMove = async (draggedId: string, newParentId: string) => {
    const targetProgId = getTargetProgramId();
    await dispatch(moveNode({ id: draggedId, newParentId }));
    dispatch(fetchProgramTree(targetProgId));
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [targetEditNode, setTargetEditNode] = useState<Node | null>(null);

  const handleEditNode = (node: Node) => {
    setTargetEditNode(node);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (id: string, updates: any) => {
    const targetProgId = getTargetProgramId();
    await dispatch(updateNode({ id, updates }));
    dispatch(fetchProgramTree(targetProgId));
  };

  const isRootView = programId === 'root';

  return (
    <div className="space-y-6">
      {/* 1. ROOT VIEW: Tabular Data Table of All University Events */}
      {isRootView ? (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                <Calendar className="h-5 w-5 text-indigo-400" />
                All University Events ({allPrograms.length})
              </h2>
              <p className="text-xs text-slate-400">
                Tabular overview of all event programs created in your institution. Click any event to open its live schedule builder.
              </p>
            </div>
            <Button
              onClick={() => setCreateProgramModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold h-9 px-4 rounded-xl shadow-lg transition-all self-start sm:self-auto"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create New Event
            </Button>
          </div>

          {allPrograms.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs space-y-3">
              <p className="font-medium">No event programs found for this university.</p>
              <Button
                onClick={() => setCreateProgramModalOpen(true)}
                size="sm"
                variant="outline"
                className="text-xs border-slate-700 text-slate-300"
              >
                + Create First Event
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Event Title</th>
                    <th className="py-3.5 px-4 font-bold">Description</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold">Version</th>
                    <th className="py-3.5 px-4 font-bold">Created Date</th>
                    <th className="py-3.5 px-4 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allPrograms.map((prog) => (
                    <tr
                      key={prog.id}
                      onClick={() => router.push(`/programs/${prog.id}`)}
                      className="hover:bg-slate-900/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-bold text-white group-hover:text-indigo-400 transition-colors">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-indigo-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{prog.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-[280px] truncate">
                        {prog.description || 'University event program schedule'}
                      </td>
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <AsyncEnumSelect
                          enumName="ProgramStatus"
                          value={prog.status || 'DRAFT'}
                          onValueChange={async (newStatus) => {
                            await dispatch(updateProgramStatus({ programId: prog.id, status: newStatus as any }));
                            programService.getOrgPrograms().then((progs) => setAllPrograms(progs || []));
                          }}
                          triggerClassName="h-6 text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20 px-2 rounded-full cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        v{prog.version || 1}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {formatDate(prog.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-2.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/programs/${prog.id}`);
                          }}
                        >
                          Open Schedule <ExternalLink className="ml-1.5 h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* 2. DEDICATED EVENT DETAIL VIEW: Active Schedule Tree */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/programs/root')}
                className="h-8 text-xs border-slate-700 bg-slate-950 text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> All Events
              </Button>
              <div className="h-4 w-[1px] bg-slate-800" />
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  {activeProgramTree?.name || 'Event Schedule'}
                  <AsyncEnumSelect
                    enumName="ProgramStatus"
                    value={(activeProgramTree as any)?.programStatus || 'DRAFT'}
                    onValueChange={async (newStatus) => {
                      const targetProgId = getTargetProgramId();
                      await dispatch(updateProgramStatus({ programId: targetProgId, status: newStatus as any }));
                      dispatch(fetchProgramTree(targetProgId));
                    }}
                    triggerClassName="h-6 text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 px-2 rounded-full cursor-pointer focus:ring-0 focus:outline-none"
                  />
                </h2>
                {activeProgramTree?.description && (
                  <p className="text-xs text-slate-400 font-normal">
                    {activeProgramTree.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <NodeTreeContainer
            rootTree={activeProgramTree}
            onAddChild={handleAddChild}
            onRecordTime={handleRecordTime}
            onAddDependency={handleAddDependency}
            onEdit={handleEditNode}
            onMove={handleMoveNode}
            onDropMove={handleDropMove}
            onDelete={handleDeleteNode}
            onCreateRootNode={() => setCreateProgramModalOpen(true)}
          />
        </div>
      )}

      <CreateProgramModal
        isOpen={createProgramModalOpen}
        onClose={() => setCreateProgramModalOpen(false)}
        onSubmit={handleCreateProgramSubmit}
      />

      <CreateNodeModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        parentNode={selectedParentNode}
        onSubmit={handleCreateNodeSubmit}
      />

      <RecordActualTimeModal
        isOpen={actualTimeModalOpen}
        onClose={() => setActualTimeModalOpen(false)}
        node={targetTimeNode}
        onSubmit={handleRecordTimeSubmit}
      />

      <CreateDependencyModal
        isOpen={depModalOpen}
        onClose={() => setDepModalOpen(false)}
        predecessorNode={predecessorNode}
        rootTree={activeProgramTree}
        onSubmit={handleDependencySubmit}
      />

      <MoveNodeModal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        targetNode={targetMoveNode}
        rootTree={activeProgramTree}
        onSubmit={handleMoveSubmit}
      />

      <EditNodeModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        node={targetEditNode}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
