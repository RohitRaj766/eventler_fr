'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recordActualTimeSchema, RecordActualTimeInput } from '@/utils/validationSchemas';
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
import { Radio } from 'lucide-react';

interface RecordActualTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node | null;
  onSubmit: (data: RecordActualTimeInput) => Promise<void>;
}

export function RecordActualTimeModal({ isOpen, onClose, node, onSubmit }: RecordActualTimeModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecordActualTimeInput>({
    resolver: zodResolver(recordActualTimeSchema),
  });

  useEffect(() => {
    if (node) {
      setValue('nodeId', node.id);
      setValue(
        'actualStartTime',
        node.actualStartTime
          ? new Date(node.actualStartTime).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16)
      );
      if (node.actualEndTime) {
        setValue('actualEndTime', new Date(node.actualEndTime).toISOString().slice(0, 16));
      }
    }
  }, [node, setValue]);

  const handleFormSubmit = async (data: RecordActualTimeInput) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-400">
            <Radio className="h-5 w-5 animate-pulse" />
            Record Real-World Actual Time: {node?.name}
          </DialogTitle>
          <DialogDescription>
            Log actual start/end timestamps. The topological propagation engine will recalculate all downstream node schedule impacts in real time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <input type="hidden" {...register('nodeId')} />

          <div className="space-y-1">
            <label className="text-xs font-semibold">Actual Start Time</label>
            <Input {...register('actualStartTime')} type="datetime-local" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Actual End Time (Optional)</label>
            <Input {...register('actualEndTime')} type="datetime-local" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Reason for Live Update</label>
            <Input
              {...register('reason')}
              placeholder="e.g. VIP Speaker delayed by 25 mins due to traffic"
            />
            {errors.reason && <p className="text-xs text-red-500">{errors.reason.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-md shadow-indigo-500/20"
            >
              {isSubmitting ? 'Propagating Schedule...' : 'Log & Propagate Impact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
