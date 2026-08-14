'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOrgSchema, CreateOrgInput } from '@/utils/validationSchemas';
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
import { Building } from 'lucide-react';

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOrgInput) => Promise<void>;
}

export function CreateOrgModal({ isOpen, onClose, onSubmit }: CreateOrgModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrgInput>({
    resolver: zodResolver(createOrgSchema),
  });

  const handleFormSubmit = async (data: CreateOrgInput) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-indigo-600" />
            Create New Institution Organization
          </DialogTitle>
          <DialogDescription>
            Establish an isolated multi-tenant organization context for your university, school, or college.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Organization Name</label>
            <Input {...register('name')} placeholder="e.g. Stanford University" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Unique Code / Prefix</label>
            <Input {...register('code')} placeholder="e.g. STANFORD-ENG" />
            {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Organization'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
