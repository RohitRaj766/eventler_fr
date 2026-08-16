'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema, CreateTaskInput } from '@/utils/validationSchemas';
import { programService, taskService } from '@/services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId?: string;
  nodes?: Array<{ id: string; name: string; type?: string }>;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
}

export function CreateTaskModal({ isOpen, onClose, nodeId = '', nodes = [], onSubmit }: CreateTaskModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      nodeId,
      priority: 'MEDIUM',
      status: 'PENDING',
    },
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [enumPriorities, setEnumPriorities] = useState<string[]>(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
  const [enumStatuses, setEnumStatuses] = useState<string[]>(['PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED', 'BLOCKED']);

  useEffect(() => {
    if (isOpen) {
      taskService.getTaskEnums().then((data: any) => {
        if (data?.priorities && Array.isArray(data.priorities)) setEnumPriorities(data.priorities);
        if (data?.statuses && Array.isArray(data.statuses)) setEnumStatuses(data.statuses);
      }).catch((err: any) => console.error('Failed to load task enums in modal:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && (!nodes || nodes.length === 0)) {
      programService.getUserPrograms().then((progs) => {
        if (Array.isArray(progs) && progs.length > 0) {
          programService.getProgramById(progs[0].id).then((p) => {
            if (p?.nodes && Array.isArray(p.nodes)) {
              if (p.nodes.length > 0) {
                setValue('nodeId', p.nodes[0].id);
              }
            }
          });
        }
      });
    } else if (isOpen && nodes.length > 0) {
      setValue('nodeId', nodeId || nodes[0].id);
    }
  }, [isOpen, nodeId, nodes, setValue]);

  const handleFormSubmit = async (data: CreateTaskInput) => {
    setFormError(null);
    const finalNodeId = data.nodeId || nodeId || (nodes[0]?.id || '');
    if (!finalNodeId) {
      setFormError('No session node found. Please create an Event Program or Session first.');
      return;
    }

    // Convert local datetime to ISO string format for backend Zod validation
    let isoDeadline: string | undefined = undefined;
    if (data.deadline && data.deadline.trim() !== '') {
      isoDeadline = new Date(data.deadline).toISOString();
    }

    try {
      await onSubmit({
        ...data,
        nodeId: finalNodeId,
        deadline: isoDeadline,
      });
      reset();
      onClose();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create task');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border border-slate-800 text-white shadow-2xl rounded-2xl p-6">
        <DialogHeader className="space-y-1 pb-2 border-b border-slate-800">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
            <CheckSquare className="h-5 w-5 text-indigo-400" />
            Create Stage & Session Readiness Task
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            Attach an operational readiness task (e.g. Mic Setup, Stage Prep, Speaker Confirmation).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => handleFormSubmit(d as CreateTaskInput))} className="space-y-4 pt-2">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
              {formError}
            </div>
          )}

          {nodes.length > 0 ? (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Target Session / Stage Node <span className="text-rose-400">*</span></label>
              <Select
                value={watch('nodeId') || nodeId || nodes[0]?.id}
                onValueChange={(val) => setValue('nodeId', val)}
              >
                <SelectTrigger className="h-10 text-xs bg-slate-950 border-slate-800 text-white focus:ring-indigo-500">
                  <SelectValue placeholder="Select target session node" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  {nodes.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name} {n.type ? `(${n.type})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.nodeId && <p className="text-[11px] text-rose-400 font-semibold">{errors.nodeId.message}</p>}
            </div>
          ) : (
            <input type="hidden" {...register('nodeId')} value={nodeId || ''} />
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Task Title <span className="text-rose-400">*</span></label>
            <Input
              {...register('title')}
              placeholder="e.g. Test Main Hall Projector & Audio (min 3 chars)"
              className={`h-10 text-xs bg-slate-950 border text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 ${errors.title ? 'border-rose-500/80 bg-rose-500/5' : 'border-slate-800'}`}
            />
            {errors.title && <p className="text-[11px] text-rose-400 font-semibold">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Description (Optional)</label>
            <Input
              {...register('description')}
              placeholder="Ensure HDMI cable & cordless mic battery are checked"
              className={`h-10 text-xs bg-slate-950 border text-white placeholder:text-slate-500 focus-visible:ring-indigo-500 ${errors.description ? 'border-rose-500/80 bg-rose-500/5' : 'border-slate-800'}`}
            />
            {errors.description && <p className="text-[11px] text-rose-400 font-semibold">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Priority</label>
              <Select onValueChange={(v) => setValue('priority', v as any)} defaultValue="MEDIUM">
                <SelectTrigger className="h-10 text-xs bg-slate-950 border-slate-800 text-white">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  {enumPriorities.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Initial Status</label>
              <Select onValueChange={(v) => setValue('status', v as any)} defaultValue="PENDING">
                <SelectTrigger className="h-10 text-xs bg-slate-950 border-slate-800 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  {enumStatuses.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Deadline (Optional)</label>
            <Input
              {...register('deadline')}
              type="datetime-local"
              className={`h-10 text-xs bg-slate-950 border text-white focus-visible:ring-indigo-500 ${errors.deadline ? 'border-rose-500/80 bg-rose-500/5' : 'border-slate-800'}`}
            />
            {errors.deadline && <p className="text-[11px] text-rose-400 font-semibold">{errors.deadline.message}</p>}
          </div>

          <DialogFooter className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              className="h-9 text-xs border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
