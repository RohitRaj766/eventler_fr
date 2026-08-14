'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchProgramTree, updateTreeRealtime, createProgram } from '@/features/program/programSlice';
import { fetchMyOrganizations, createOrganization } from '@/features/org/orgSlice';
import { createNode, deleteNode } from '@/features/node/nodeSlice';
import { recordActualTime } from '@/features/liveEngine/liveEngineSlice';
import { createDependency } from '@/features/dependency/dependencySlice';
import { socketService } from '@/services/socket';
import { getApiActiveOrgId } from '@/services/api';
import { Node } from '@/types';
import { NodeTreeContainer } from '@/features/node/components/NodeTreeContainer';
import { CreateNodeModal } from '@/features/node/components/CreateNodeModal';
import { RecordActualTimeModal } from '@/features/liveEngine/components/RecordActualTimeModal';
import { CreateDependencyModal } from '@/features/dependency/components/CreateDependencyModal';
import { CreateProgramModal } from '@/features/program/components/CreateProgramModal';
import { CreateNodeInput, RecordActualTimeInput, CreateDependencyInput, CreateProgramInput } from '@/utils/validationSchemas';

export default function ProgramTreePage() {
  const params = useParams();
  const programId = (params?.id as string) || 'root';
  const dispatch = useAppDispatch();
  const { activeProgramTree } = useAppSelector((state) => state.program);

  const [createProgramModalOpen, setCreateProgramModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedParentNode, setSelectedParentNode] = useState<Node | null>(null);

  const [actualTimeModalOpen, setActualTimeModalOpen] = useState(false);
  const [targetTimeNode, setTargetTimeNode] = useState<Node | null>(null);

  const [depModalOpen, setDepModalOpen] = useState(false);
  const [predecessorNode, setPredecessorNode] = useState<Node | null>(null);

  useEffect(() => {
    dispatch(fetchMyOrganizations());
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
  }, [dispatch, programId]);

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
        dispatch(fetchProgramTree(newProg.id));
      }
    } catch (err: any) {
      console.error('Failed to create program:', err);
    }
  };

  const handleCreateNodeSubmit = async (data: CreateNodeInput) => {
    await dispatch(
      createNode({
        programId: activeProgramTree?.programId || programId,
        parentId: selectedParentNode?.id,
        data,
      })
    );
    if (activeProgramTree?.programId) {
      dispatch(fetchProgramTree(activeProgramTree.programId));
    }
  };

  const handleRecordTimeSubmit = async (data: RecordActualTimeInput) => {
    await dispatch(recordActualTime(data));
    if (activeProgramTree?.programId) {
      dispatch(fetchProgramTree(activeProgramTree.programId));
    }
  };

  const handleDependencySubmit = async (data: CreateDependencyInput) => {
    await dispatch(createDependency(data));
    if (activeProgramTree?.programId) {
      dispatch(fetchProgramTree(activeProgramTree.programId));
    }
  };

  const handleDeleteNode = async (node: Node) => {
    if (confirm(`Are you sure you want to delete node "${node.name}"?`)) {
      await dispatch(deleteNode(node.id));
      if (activeProgramTree?.programId) {
        dispatch(fetchProgramTree(activeProgramTree.programId));
      }
    }
  };

  return (
    <div className="space-y-6">
      <NodeTreeContainer
        rootTree={activeProgramTree}
        onAddChild={handleAddChild}
        onRecordTime={handleRecordTime}
        onAddDependency={handleAddDependency}
        onDelete={handleDeleteNode}
        onCreateRootNode={() => setCreateProgramModalOpen(true)}
      />

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
    </div>
  );
}
