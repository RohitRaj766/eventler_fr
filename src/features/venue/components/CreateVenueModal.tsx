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
import { FormField } from '@/components/ui/form-field';
import { Spinner } from '@/components/ui/states';
import {
  createVenueSchema,
  type CreateVenueFormInput,
  type CreateVenueInput,
} from '@/utils/validationSchemas';

export function CreateVenueModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateVenueInput) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    // Three generics: raw form values, context, resolver output.
  } = useForm<CreateVenueFormInput, unknown, CreateVenueInput>({
    resolver: zodResolver(createVenueSchema),
    defaultValues: { name: '', building: '', capacity: undefined },
  });

  const submit = async (values: CreateVenueInput) => {
    await onSubmit(values);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a venue</DialogTitle>
          <DialogDescription>
            Venues can be assigned to any node, so people know where to be.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <FormField label="Venue name" error={errors.name?.message} required>
            {(field) => (
              <Input {...field} {...register('name')} placeholder="Main Auditorium" autoFocus />
            )}
          </FormField>

          <FormField label="Building" error={errors.building?.message}>
            {(field) => (
              <Input
                {...field}
                {...register('building')}
                placeholder="Science & Engineering Building"
              />
            )}
          </FormField>

          <FormField label="Capacity" error={errors.capacity?.message} hint="Seats, if known.">
            {(field) => (
              <Input {...field} {...register('capacity')} type="number" min={0} placeholder="500" />
            )}
          </FormField>

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
              {isSubmitting ? 'Adding…' : 'Add venue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
