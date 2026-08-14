'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchTasksByNode, updateTask } from '@/features/task/taskSlice';
import { TaskBoard } from '@/features/task/components/TaskBoard';
import { TaskStatus } from '@/types';

export default function TasksPage() {
  const dispatch = useAppDispatch();
  const { nodeTasks } = useAppSelector((state) => state.task);
  const { activeProgramTree } = useAppSelector((state) => state.program);

  useEffect(() => {
    if (activeProgramTree?.id) {
      dispatch(fetchTasksByNode(activeProgramTree.id));
    }
  }, [dispatch, activeProgramTree]);

  const handleUpdateStatus = (taskId: string, status: TaskStatus) => {
    dispatch(updateTask({ id: taskId, updates: { status } }));
  };

  return (
    <div className="space-y-6">
      <TaskBoard
        tasks={nodeTasks}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
