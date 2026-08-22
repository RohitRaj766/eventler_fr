'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { createProgramSchema, type CreateProgramInput } from '@/utils/validationSchemas';
import { fromDateTimeLocalValue, toDateTimeLocalValue } from '@/utils/formatters';

interface CreateProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    name: string;
    description?: string;
    plannedStartTime: string;
    plannedEndTime: string;
  }) => Promise<void>;
}

/** Sensible default window: tomorrow, 9am to 6pm local. */
function defaultWindow() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const end = new Date(start);
  end.setHours(18, 0, 0, 0);
  return {
    plannedStartTime: toDateTimeLocalValue(start),
    plannedEndTime: toDateTimeLocalValue(end),
  };
}

export function CreateProgramModal({ open, onOpenChange, onSubmit }: CreateProgramModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProgramInput>({
    resolver: zodResolver(createProgramSchema),
    defaultValues: { name: '', description: '', ...defaultWindow() },
  });

  const submit = async (values: CreateProgramInput) => {
    await onSubmit({
      name: values.name,
      description: values.description || undefined,
      plannedStartTime: fromDateTimeLocalValue(values.plannedStartTime)!,
      plannedEndTime: fromDateTimeLocalValue(values.plannedEndTime)!,
    });
    reset({ name: '', description: '', ...defaultWindow() });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isSubmitting) onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a program</DialogTitle>
          <DialogDescription>
            A program is the root of an event hierarchy. You&apos;ll add activities, sessions and
            rounds beneath it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <FormField label="Program name" error={errors.name?.message} required>
            {(field) => (
              <Input
                {...field}
                {...register('name')}
                placeholder="TECHNOVA 2027 Annual Fest"
                autoFocus
              />
            )}
          </FormField>

          <FormField label="Description" error={errors.description?.message}>
            {(field) => (
              <Textarea
                {...field}
                {...register('description')}
                rows={3}
                placeholder="3-day annual technical symposium"
              />
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Planned start" error={errors.plannedStartTime?.message} required>
              {(field) => (
                <Input {...field} {...register('plannedStartTime')} type="datetime-local" />
              )}
            </FormField>
            <FormField label="Planned end" error={errors.plannedEndTime?.message} required>
              {(field) => (
                <Input {...field} {...register('plannedEndTime')} type="datetime-local" />
              )}
            </FormField>
          </div>

          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Note: this server creates the root node with a default 8-hour window rather than the
            dates above. Adjust the root node&apos;s timing in the program workspace after
            creating it.
          </p>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              {isSubmitting ? 'Creating…' : 'Create program'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
