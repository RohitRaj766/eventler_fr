'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProgramSchema, CreateProgramInput } from '@/utils/validationSchemas';
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
import { FolderTree } from 'lucide-react';

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProgramInput) => Promise<void>;
}

export function CreateProgramModal({ isOpen, onClose, onSubmit }: CreateProgramModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProgramInput>({
    resolver: zodResolver(createProgramSchema),
    defaultValues: {
      plannedStartTime: new Date().toISOString().slice(0, 16),
      plannedEndTime: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    },
  });

  const handleFormSubmit = async (data: CreateProgramInput) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <FolderTree className="h-4 w-4" />
            </div>
            Create Root Event Program
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-500">
            Initialize a new root event program (e.g. Annual TechFest 2026, Research Conference).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Program Title</label>
            <Input
              {...register('name')}
              placeholder="e.g. Annual Tech Fest 2026"
              className="h-10 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
            />
            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Description</label>
            <Input
              {...register('description')}
              placeholder="Main annual engineering symposium"
              className="h-10 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
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
              {errors.plannedStartTime && (
                <p className="text-xs text-red-500 font-medium">{errors.plannedStartTime.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Planned End Time</label>
              <Input
                {...register('plannedEndTime')}
                type="datetime-local"
                className="h-10 text-xs bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500"
              />
              {errors.plannedEndTime && (
                <p className="text-xs text-red-500 font-medium">{errors.plannedEndTime.message}</p>
              )}
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
              {isSubmitting ? 'Initializing...' : 'Create Program'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
