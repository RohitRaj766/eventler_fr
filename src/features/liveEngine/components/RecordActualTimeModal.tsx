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
      <DialogContent className="sm:max-w-md bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Radio className="h-4 w-4 animate-pulse" />
            </div>
            Record Live Timestamp: {node?.name}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-500">
            Log actual start/end timestamps. The topological propagation engine will recalculate all downstream node schedule impacts in real time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          <input type="hidden" {...register('nodeId')} />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Actual Start Time</label>
            <Input
              {...register('actualStartTime')}
              type="datetime-local"
              className="h-10 text-xs bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Actual End Time (Optional)</label>
            <Input
              {...register('actualEndTime')}
              type="datetime-local"
              className="h-10 text-xs bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Reason for Live Update</label>
            <Input
              {...register('reason')}
              placeholder="e.g. VIP Speaker delayed by 25 mins due to traffic"
              className="h-10 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
            />
            {errors.reason && <p className="text-xs text-red-500 font-medium">{errors.reason.message}</p>}
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
              {isSubmitting ? 'Propagating...' : 'Log & Recalculate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
