'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createResourceSchema, CreateResourceInput } from '@/utils/validationSchemas';
import { Venue } from '@/types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cpu } from 'lucide-react';

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  venues: Venue[];
  onSubmit: (data: CreateResourceInput) => Promise<void>;
}

export function CreateResourceModal({ isOpen, onClose, venues, onSubmit }: CreateResourceModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createResourceSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  const handleFormSubmit = async (data: CreateResourceInput) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-600" />
            Add Technical Equipment Resource
          </DialogTitle>
          <DialogDescription>
            Register technical equipment inventory (Microphones, Projectors, Podium, Vehicles).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => handleFormSubmit(d as CreateResourceInput))} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Assign Venue (Optional)</label>
            <Select onValueChange={(val) => setValue('venueId', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Resource Name</label>
            <Input {...register('name')} placeholder="e.g. Cordless Lapel Microphone" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Type Category</label>
            <Input {...register('type')} placeholder="e.g. Audio Equipment" />
            {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Quantity</label>
            <Input {...register('quantity')} type="number" placeholder="1" />
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add Resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
