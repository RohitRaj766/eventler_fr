'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchAllTasks, createTask, updateTask } from '@/features/task/taskSlice';
import { TaskBoard } from '@/features/task/components/TaskBoard';
import { CreateTaskModal } from '@/features/task/components/CreateTaskModal';
import { TaskStatus } from '@/types';
import { CreateTaskInput } from '@/utils/validationSchemas';
import { programService } from '@/services/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderTree, Calendar, Filter } from 'lucide-react';

export default function TasksPage() {
  const dispatch = useAppDispatch();
  const { allOrgTasks, isLoading } = useAppSelector((state) => state.task);

  const [programs, setPrograms] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | undefined>(undefined);
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(undefined);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // 1. Fetch all user programs on mount
  useEffect(() => {
    programService
      .getUserPrograms()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setPrograms(list);
          setSelectedProgramId(list[0].id);
        }
      })
      .catch((err) => console.error('Failed to load user programs:', err));
  }, []);

  // 2. Fetch program nodes and all tasks when selectedProgramId changes
  useEffect(() => {
    dispatch(fetchAllTasks(selectedProgramId));

    if (selectedProgramId) {
      programService
        .getProgramById(selectedProgramId)
        .then((prog) => {
          if (prog?.nodes && Array.isArray(prog.nodes)) {
            setNodes(prog.nodes);
            setSelectedNodeId(undefined); // All nodes view
          }
        })
        .catch((err) => console.error('Failed to load program nodes:', err));
    }
  }, [dispatch, selectedProgramId]);

  const handleUpdateStatus = (taskId: string, status: TaskStatus, version?: number) => {
    dispatch(updateTask({ id: taskId, updates: { status, version } }));
  };

  const handleCreateTask = async (data: CreateTaskInput) => {
    await dispatch(createTask(data));
    dispatch(fetchAllTasks(selectedProgramId));
  };

  // Filter tasks by selected node if specified
  const filteredTasks = selectedNodeId
    ? allOrgTasks.filter((t: any) => t.nodeId === selectedNodeId || t.node?.id === selectedNodeId)
    : allOrgTasks;

  return (
    <div className="space-y-6">
      {/* Header & Program/Node Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-indigo-400" />
            Node Task & Readiness Kanban Board
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Ensure stage equipment, speakers, and venue resources are marked READY before starting node execution.
          </p>
        </div>

        {/* Dynamic Selectors */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Program Select */}
          {programs.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-400" />
              <Select
                value={selectedProgramId}
                onValueChange={(val) => setSelectedProgramId(val)}
              >
                <SelectTrigger className="h-9 text-xs bg-slate-950 border-slate-800 text-white w-44">
                  <SelectValue placeholder="Select Event Program" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Node / Stage Select */}
          {nodes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select
                value={selectedNodeId || 'all'}
                onValueChange={(val) => setSelectedNodeId(val === 'all' ? undefined : val)}
              >
                <SelectTrigger className="h-9 text-xs bg-slate-950 border-slate-800 text-white w-48">
                  <SelectValue placeholder="All Program Sessions" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="all">All Program Sessions ({nodes.length})</SelectItem>
                  {nodes.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name} ({n.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <TaskBoard
        tasks={filteredTasks}
        onAddTask={() => setTaskModalOpen(true)}
        onUpdateStatus={handleUpdateStatus}
      />

      <CreateTaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        nodeId={selectedNodeId || nodes[0]?.id}
        nodes={nodes}
        onSubmit={handleCreateTask}
      />
    </div>
  );
}
