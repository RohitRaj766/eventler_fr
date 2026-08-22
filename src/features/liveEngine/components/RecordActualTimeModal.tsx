'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { recordActualTime } from '@/features/liveEngine/liveEngineSlice';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Spinner } from '@/components/ui/states';
import { useToast } from '@/hooks/useToast';
import {
  formatDuration,
  formatTimeOnly,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from '@/utils/formatters';
import { recordActualTimeSchema, type RecordActualTimeInput } from '@/utils/validationSchemas';
import type { EventNode } from '@/types';

interface RecordActualTimeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: EventNode | null;
  programId: string;
  onRecorded: () => void;
}

/**
 * Records what actually happened, which is what drives schedule propagation.
 *
 * The reason is mandatory server-side and lands in the audit trail, so the
 * copy says why it is being asked for. The node's `version` is sent as
 * `expectedVersion`: if someone else recorded a time first, the update is
 * refused rather than silently overwriting their entry.
 */
export function RecordActualTimeModal({
  open,
  onOpenChange,
  node,
  programId,
  onRecorded,
}: RecordActualTimeModalProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const isRecording = useAppSelector((state) => state.liveEngine.isRecording);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecordActualTimeInput>({
    resolver: zodResolver(recordActualTimeSchema),
    defaultValues: { actualStartTime: '', actualEndTime: '', reason: '' },
  });

  useEffect(() => {
    if (!open || !node) return;
    // Pre-fill the field the operator is most likely to need: the start if the
    // node has not begun, otherwise "now" as the end.
    const now = toDateTimeLocalValue(new Date());
    reset({
      actualStartTime: toDateTimeLocalValue(node.actualStartTime) || (node.actualStartTime ? '' : now),
      actualEndTime: node.actualStartTime && !node.actualEndTime ? now : toDateTimeLocalValue(node.actualEndTime),
      reason: '',
    });
  }, [open, node, reset]);

  const submit = async (values: RecordActualTimeInput) => {
    if (!node) return;

    const result = await dispatch(
      recordActualTime({
        programId,
        nodeId: node.id,
        actualStartTime: fromDateTimeLocalValue(values.actualStartTime),
        actualEndTime: fromDateTimeLocalValue(values.actualEndTime),
        reason: values.reason,
        expectedVersion: node.version,
      }),
    );

    if (recordActualTime.rejected.match(result)) {
      toast.error('Could not record the time', result.payload as string);
      return;
    }

    const { delayMinutes, affectedNodes } = result.payload;
    toast.success(
      delayMinutes > 0
        ? `Recorded — running ${formatDuration(delayMinutes)} behind`
        : 'Time recorded',
      affectedNodes.length
        ? `${affectedNodes.length} downstream ${affectedNodes.length === 1 ? 'node was' : 'nodes were'} rescheduled.`
        : 'Nothing downstream needed to move.',
    );

    onRecorded();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isRecording && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record actual time</DialogTitle>
          <DialogDescription>
            {node ? (
              <>
                <span className="font-medium text-foreground">{node.name}</span> is scheduled for{' '}
                {formatTimeOnly(node.projectedStartTime)} – {formatTimeOnly(node.projectedEndTime)}.
                Recording a different time reschedules everything that depends on it.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Actual start" error={errors.actualStartTime?.message}>
              {(field) => <Input {...field} {...register('actualStartTime')} type="datetime-local" />}
            </FormField>
            <FormField label="Actual end" error={errors.actualEndTime?.message}>
              {(field) => <Input {...field} {...register('actualEndTime')} type="datetime-local" />}
            </FormField>
          </div>

          <FormField
            label="Reason"
            error={errors.reason?.message}
            required
            hint="Recorded in the audit trail so the team can see why the schedule moved."
          >
            {(field) => (
              <Textarea
                {...field}
                {...register('reason')}
                rows={2}
                placeholder="Guest speaker's Q&A ran 30 minutes over"
              />
            )}
          </FormField>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isRecording}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isRecording}>
              {isRecording && <Spinner />}
              {isRecording ? 'Propagating…' : 'Record & propagate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
