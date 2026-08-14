'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateNodeSchema } from '@/utils/validationSchemas';
import { Node } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
import { Pencil } from 'lucide-react';

interface EditNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node | null;
  onSubmit: (id: string, updates: any) => Promise<void>;
}

export function EditNodeModal({ isOpen, onClose, node, onSubmit }: EditNodeModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(updateNodeSchema),
  });

  useEffect(() => {
    if (node) {
      setValue('name', node.name);
      setValue('description', node.description || '');
      setValue('type', node.type);
      setValue('customTypeName', node.customTypeName || '');
      setValue('status', node.status);
      setValue('version', node.version || 1);
      if (node.plannedStartTime) {
        setValue('plannedStartTime', new Date(node.plannedStartTime).toISOString().slice(0, 16));
      }
      if (node.plannedEndTime) {
        setValue('plannedEndTime', new Date(node.plannedEndTime).toISOString().slice(0, 16));
      }
    }
  }, [node, setValue]);

  const handleFormSubmit = async (data: any) => {
    if (!node) return;
    const formattedData = {
      ...data,
      plannedStartTime: data.plannedStartTime ? new Date(data.plannedStartTime).toISOString() : undefined,
      plannedEndTime: data.plannedEndTime ? new Date(data.plannedEndTime).toISOString() : undefined,
      version: node.version || 1,
    };
    await onSubmit(node.id, formattedData);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Pencil className="h-4 w-4" />
            </div>
            Edit / Rename Activity
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-500">
            Update title, description, and schedule timing for <strong className="text-slate-900">{node?.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Activity / Session Title</label>
            <Input
              {...register('name')}
              placeholder="e.g. Keynote Presentation"
              className="h-10 text-xs bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500"
            />
            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message as string}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Description</label>
            <Textarea
              {...register('description')}
              placeholder="Brief description of this session..."
              className="min-h-[70px] text-xs bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Planned Start Time</label>
              <Input
                {...register('plannedStartTime')}
                type="datetime-local"
                className="h-10 text-xs bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Planned End Time</label>
              <Input
                {...register('plannedEndTime')}
                type="datetime-local"
                className="h-10 text-xs bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500"
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              className="h-9 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
