'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema, CreateTaskInput } from '@/utils/validationSchemas';
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
  onSubmit: (data: CreateTaskInput) => Promise<void>;
}

export function CreateTaskModal({ isOpen, onClose, nodeId = '', onSubmit }: CreateTaskModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
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

  const handleFormSubmit = async (data: CreateTaskInput) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-indigo-600" />
            Create Node Readiness Task
          </DialogTitle>
          <DialogDescription>
            Attach a operational readiness task (e.g. Mic Setup, Stage Prep, Speaker Confirmation).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => handleFormSubmit(d as CreateTaskInput))} className="space-y-4">
          <input type="hidden" {...register('nodeId')} value={nodeId} />

          <div className="space-y-1">
            <label className="text-xs font-semibold">Task Title</label>
            <Input {...register('title')} placeholder="e.g. Test Main Hall Projector & Audio" />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Description</label>
            <Input {...register('description')} placeholder="Ensure HDMI cable & cordless mic battery are checked" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Priority</label>
              <Select onValueChange={(v) => setValue('priority', v as any)} defaultValue="MEDIUM">
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Initial Status</label>
              <Select onValueChange={(v) => setValue('status', v as any)} defaultValue="PENDING">
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="READY">Ready</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Deadline (Optional)</label>
            <Input {...register('deadline')} type="datetime-local" />
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
