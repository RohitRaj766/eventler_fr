'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchProgramTree, updateTreeRealtime } from '@/features/program/programSlice';
import { createNode, moveNode, deleteNode } from '@/features/node/nodeSlice';
import { recordActualTime } from '@/features/liveEngine/liveEngineSlice';
import { createDependency } from '@/features/dependency/dependencySlice';
import { socketService } from '@/services/socket';
import { Node } from '@/types';
import { NodeTreeContainer } from '@/features/node/components/NodeTreeContainer';
import { CreateNodeModal } from '@/features/node/components/CreateNodeModal';
import { RecordActualTimeModal } from '@/features/liveEngine/components/RecordActualTimeModal';
import { CreateDependencyModal } from '@/features/dependency/components/CreateDependencyModal';
import { CreateNodeInput, RecordActualTimeInput, CreateDependencyInput } from '@/utils/validationSchemas';

export default function ProgramTreePage() {
  const params = useParams();
  const programId = (params?.id as string) || 'root';
  const dispatch = useAppDispatch();
  const { activeProgramTree } = useAppSelector((state) => state.program);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedParentNode, setSelectedParentNode] = useState<Node | null>(null);

  const [actualTimeModalOpen, setActualTimeModalOpen] = useState(false);
  const [targetTimeNode, setTargetTimeNode] = useState<Node | null>(null);

  const [depModalOpen, setDepModalOpen] = useState(false);
  const [predecessorNode, setPredecessorNode] = useState<Node | null>(null);

  useEffect(() => {
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
