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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/states';
import {
  createResourceSchema,
  type CreateResourceFormInput,
  type CreateResourceInput,
} from '@/utils/validationSchemas';
import type { Venue } from '@/types';

const UNASSIGNED = '__none__';

/**
 * Resource types are free text server-side (no enum endpoint covers them), so
 * these are offered as suggestions while still allowing anything to be typed.
 */
const COMMON_TYPES = ['AUDIO', 'VIDEO', 'PROJECTOR', 'LIGHTING', 'FURNITURE', 'COMPUTING', 'OTHER'];

export function CreateResourceModal({
  open,
  onOpenChange,
  venues,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venues: Venue[];
  onSubmit: (values: CreateResourceInput) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateResourceFormInput, unknown, CreateResourceInput>({
    resolver: zodResolver(createResourceSchema),
    defaultValues: { name: '', type: 'AUDIO', quantity: 1, venueId: '' },
  });

  const venueId = watch('venueId');

  const submit = async (values: CreateResourceInput) => {
    await onSubmit(values);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register a resource</DialogTitle>
          <DialogDescription>
            Track the equipment your events depend on — projectors, microphones, podiums, laptops.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <FormField label="Resource name" error={errors.name?.message} required>
            {(field) => (
              <Input
                {...field}
                {...register('name')}
                placeholder="Wireless microphone unit"
                autoFocus
              />
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Type"
              error={errors.type?.message}
              required
              hint="Any label works — these are just common ones."
            >
              {(field) => (
                <Input {...field} {...register('type')} list="resource-types" placeholder="AUDIO" />
              )}
            </FormField>

            <FormField label="Quantity" error={errors.quantity?.message} required>
              {(field) => <Input {...field} {...register('quantity')} type="number" min={1} />}
            </FormField>
          </div>

          <datalist id="resource-types">
            {COMMON_TYPES.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>

          <FormField
            label="Home venue"
            error={errors.venueId?.message}
            hint={venues.length ? 'Optional.' : 'Add a venue first to assign one.'}
          >
            {(field) => (
              <Select
                value={venueId || UNASSIGNED}
                onValueChange={(value) => setValue('venueId', value === UNASSIGNED ? '' : value)}
                disabled={!venues.length}
              >
                <SelectTrigger id={field.id}>
                  <SelectValue placeholder="Not assigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Not assigned</SelectItem>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {isSubmitting ? 'Registering…' : 'Register resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
