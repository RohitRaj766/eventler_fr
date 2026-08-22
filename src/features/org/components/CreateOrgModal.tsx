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
import { createOrgSchema, type CreateOrgInput } from '@/utils/validationSchemas';

interface CreateOrgModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateOrgInput) => Promise<void>;
}

export function CreateOrgModal({ open, onOpenChange, onSubmit }: CreateOrgModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrgInput>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: { name: '', code: '', logoUrl: '' },
  });

  const code = watch('code');

  const submit = async (values: CreateOrgInput) => {
    await onSubmit(values);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isSubmitting) {
          onOpenChange(next);
          if (!next) reset();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an organization</DialogTitle>
          <DialogDescription>
            You&apos;ll become its Super Admin, with full control over programs, members and roles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <FormField label="Organization name" error={errors.name?.message} required>
            {(field) => (
              <Input {...field} {...register('name')} placeholder="Arka Jain University" autoFocus />
            )}
          </FormField>

          <FormField
            label="Institution code"
            error={errors.code?.message}
            required
            hint={
              code
                ? `Members will register with the code “${code.toLowerCase()}”.`
                : 'A short, unique slug your members type when they sign up.'
            }
          >
            {(field) => (
              <Input
                {...field}
                {...register('code')}
                placeholder="arkajain"
                autoCapitalize="none"
                autoCorrect="off"
              />
            )}
          </FormField>

          <FormField label="Logo URL" error={errors.logoUrl?.message} hint="Optional.">
            {(field) => (
              <Input {...field} {...register('logoUrl')} placeholder="https://example.com/logo.png" />
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
              {isSubmitting ? 'Creating…' : 'Create organization'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
