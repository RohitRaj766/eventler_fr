'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { clearDependencyError, createDependency } from '@/features/dependency/dependencySlice';
import { selectDependencyTypeOptions } from '@/features/meta/metaSlice';
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
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InlineError, Spinner } from '@/components/ui/states';
import { humanizeEnum } from '@/utils/formatters';
import {
  createDependencySchema,
  type CreateDependencyFormInput,
  type CreateDependencyInput,
} from '@/utils/validationSchemas';
import type { DependencyType, EventNode } from '@/types';

interface CreateDependencyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The node the dialog was opened from — pre-selected as the successor. */
  node: EventNode | null;
  candidates: EventNode[];
  onCreated: () => void;
}

/**
 * Creates a DAG edge between two nodes.
 *
 * The backend runs a DFS cycle check and refuses edges that would close a
 * loop; that rejection is caught in the slice and surfaced here as a plain
 * explanation rather than a 400.
 */
export function CreateDependencyModal({
  open,
  onOpenChange,
  node,
  candidates,
  onCreated,
}: CreateDependencyModalProps) {
  const dispatch = useAppDispatch();
  const { isMutating, error } = useAppSelector((state) => state.dependency);
  const dependencyTypes = useAppSelector(selectDependencyTypeOptions);

  const {
    handleSubmit,
    watch,
    setValue,
    register,
    reset,
    formState: { errors },
  } = useForm<CreateDependencyFormInput, unknown, CreateDependencyInput>({
    resolver: zodResolver(createDependencySchema),
    defaultValues: {
      predecessorId: '',
      successorId: node?.id ?? '',
      type: 'FINISH_TO_START',
      lagMinutes: 0,
    },
  });

  useEffect(() => {
    if (open) {
      dispatch(clearDependencyError());
      reset({
        predecessorId: '',
        successorId: node?.id ?? '',
        type: 'FINISH_TO_START',
        lagMinutes: 0,
      });
    }
  }, [open, node, reset, dispatch]);

  const predecessorId = watch('predecessorId');
  const successorId = watch('successorId');
  const type = watch('type');

  const submit = async (values: CreateDependencyInput) => {
    const result = await dispatch(
      createDependency({
        predecessorId: values.predecessorId,
        successorId: values.successorId,
        type: values.type,
        lagMinutes: values.lagMinutes ?? 0,
      }),
    );
    if (createDependency.rejected.match(result)) return;
    onCreated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isMutating && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a dependency</DialogTitle>
          <DialogDescription>
            Link two nodes so the live engine shifts the later one whenever the earlier one runs
            over.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          {error && <InlineError message={error} />}

          <FormField label="Runs first (predecessor)" error={errors.predecessorId?.message} required>
            {(field) => (
              <Select
                value={predecessorId}
                onValueChange={(value) => setValue('predecessorId', value, { shouldValidate: true })}
              >
                <SelectTrigger id={field.id}>
                  <SelectValue placeholder="Choose a node" />
                </SelectTrigger>
                <SelectContent>
                  {candidates
                    .filter((candidate) => candidate.id !== successorId)
                    .map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          <FormField label="Runs after (successor)" error={errors.successorId?.message} required>
            {(field) => (
              <Select
                value={successorId}
                onValueChange={(value) => setValue('successorId', value, { shouldValidate: true })}
              >
                <SelectTrigger id={field.id}>
                  <SelectValue placeholder="Choose a node" />
                </SelectTrigger>
                <SelectContent>
                  {candidates
                    .filter((candidate) => candidate.id !== predecessorId)
                    .map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Relationship" error={errors.type?.message} required>
              {(field) => (
                <Select
                  value={type}
                  onValueChange={(value) => setValue('type', value as DependencyType, { shouldValidate: true })}
                >
                  <SelectTrigger id={field.id}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dependencyTypes.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {humanizeEnum(option.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <FormField
              label="Lag (minutes)"
              error={errors.lagMinutes?.message}
              hint="Buffer between the two."
            >
              {(field) => (
                <Input {...field} {...register('lagMinutes')} type="number" min={0} max={1440} />
              )}
            </FormField>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isMutating}>
              {isMutating && <Spinner />}
              {isMutating ? 'Linking…' : 'Add dependency'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
