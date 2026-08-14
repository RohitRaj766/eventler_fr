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
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Node to {parentNode?.name || 'Program'}</DialogTitle>
          <DialogDescription>
            Create an arbitrary depth child node in your hierarchy execution tree.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Node Name</label>
            <Input {...register('name')} placeholder="e.g. Keynote Session 1" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Node Type Category</label>
            <Select
              onValueChange={(val) => setValue('type', val as any)}
              defaultValue="ACTIVITY"
            >
              <SelectTrigger>
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
            <div className="space-y-1">
              <label className="text-xs font-semibold">Custom Type Name</label>
              <Input {...register('customTypeName')} placeholder="e.g. Hackathon Track" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">Planned Start Time</label>
              <Input {...register('plannedStartTime')} type="datetime-local" />
              {errors.plannedStartTime && (
                <p className="text-xs text-red-500">{errors.plannedStartTime.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">Planned End Time</label>
              <Input {...register('plannedEndTime')} type="datetime-local" />
              {errors.plannedEndTime && (
                <p className="text-xs text-red-500">{errors.plannedEndTime.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create Node'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
