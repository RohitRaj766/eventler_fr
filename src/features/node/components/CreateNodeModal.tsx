'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createNodeSchema, CreateNodeInput } from '@/utils/validationSchemas';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface CreateNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentNode?: Node | null;
  onSubmit: (data: CreateNodeInput) => Promise<void>;
}

export function CreateNodeModal({ isOpen, onClose, parentNode, onSubmit }: CreateNodeModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateNodeInput>({
    resolver: zodResolver(createNodeSchema),
    defaultValues: {
      type: 'ACTIVITY',
      plannedStartTime: new Date().toISOString().slice(0, 16),
      plannedEndTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    },
  });

  const selectedType = watch('type');

  const handleFormSubmit = async (data: CreateNodeInput) => {
    const formattedData = {
      ...data,
      plannedStartTime: data.plannedStartTime ? new Date(data.plannedStartTime).toISOString() : new Date().toISOString(),
      plannedEndTime: data.plannedEndTime ? new Date(data.plannedEndTime).toISOString() : new Date().toISOString(),
    };
    await onSubmit(formattedData);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Plus className="h-4 w-4" />
            </div>
            Add Activity to {parentNode?.name || 'Event'}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-500">
            Add a new session, track, or sub-activity under {parentNode?.name || 'this event'}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Activity / Session Name</label>
            <Input
              {...register('name')}
              placeholder="e.g. Keynote Session 1"
              className="h-10 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
            />
            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Node Type Category</label>
            <Select
              onValueChange={(val) => setValue('type', val as any)}
              defaultValue="ACTIVITY"
            >
              <SelectTrigger className="h-10 text-xs bg-white border-slate-200 text-slate-900">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROGRAM">Program Root</SelectItem>
                <SelectItem value="ACTIVITY">Activity</SelectItem>
                <SelectItem value="SESSION">Session</SelectItem>
                <SelectItem value="ROUND">Round</SelectItem>
                <SelectItem value="CEREMONY">Ceremony</SelectItem>
                <SelectItem value="COMPETITION">Competition</SelectItem>
                <SelectItem value="WORKSHOP">Workshop</SelectItem>
                <SelectItem value="PRESENTATION">Presentation</SelectItem>
                <SelectItem value="BREAK">Break</SelectItem>
                <SelectItem value="TASK">Task Node</SelectItem>
                <SelectItem value="CUSTOM">Custom Type</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedType === 'CUSTOM' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Custom Type Name</label>
              <Input
                {...register('customTypeName')}
                placeholder="e.g. Hackathon Track"
                className="h-10 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
              />
            </div>
          )}

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
              {isSubmitting ? 'Saving...' : 'Add Node'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
