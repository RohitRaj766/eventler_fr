'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchTasksByNode, createTask, updateTask } from '@/features/task/taskSlice';
import { TaskBoard } from '@/features/task/components/TaskBoard';
import { CreateTaskModal } from '@/features/task/components/CreateTaskModal';
import { TaskStatus } from '@/types';
import { CreateTaskInput } from '@/utils/validationSchemas';

export default function TasksPage() {
  const dispatch = useAppDispatch();
  const { nodeTasks } = useAppSelector((state) => state.task);
  const { activeProgramTree } = useAppSelector((state) => state.program);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  useEffect(() => {
    if (activeProgramTree?.id) {
      dispatch(fetchTasksByNode(activeProgramTree.id));
    }
  }, [dispatch, activeProgramTree]);

  const handleUpdateStatus = (taskId: string, status: TaskStatus) => {
    dispatch(updateTask({ id: taskId, updates: { status } }));
  };

  const handleCreateTask = async (data: CreateTaskInput) => {
    await dispatch(createTask({ ...data, nodeId: activeProgramTree?.id || '' }));
  };

  return (
    <div className="space-y-6">
      <TaskBoard
        tasks={nodeTasks}
        onAddTask={() => setTaskModalOpen(true)}
        onUpdateStatus={handleUpdateStatus}
      />

      <CreateTaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        nodeId={activeProgramTree?.id}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}
