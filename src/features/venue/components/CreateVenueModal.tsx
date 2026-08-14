'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createVenueSchema, CreateVenueInput } from '@/utils/validationSchemas';
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
import { Building2 } from 'lucide-react';

interface CreateVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVenueInput) => Promise<void>;
}

export function CreateVenueModal({ isOpen, onClose, onSubmit }: CreateVenueModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createVenueSchema),
  });

  const handleFormSubmit = async (data: CreateVenueInput) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Add Institutional Venue
          </DialogTitle>
          <DialogDescription>
            Register auditoriums, seminar halls, grounds, or lab rooms.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => handleFormSubmit(d as CreateVenueInput))} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Venue Name</label>
            <Input {...register('name')} placeholder="e.g. Main Auditorium A" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Building Block (Optional)</label>
            <Input {...register('building')} placeholder="e.g. Science Block 3rd Floor" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Seating Capacity</label>
            <Input {...register('capacity')} type="number" placeholder="500" />
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add Venue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
