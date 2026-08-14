'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDependencySchema, CreateDependencyInput } from '@/utils/validationSchemas';
import { Node } from '@/types';
import { flattenNodeTree } from '@/utils/nodeTreeHelpers';
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
import { Link as LinkIcon } from 'lucide-react';

interface CreateDependencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  predecessorNode?: Node | null;
  rootTree?: Node | null;
  onSubmit: (data: CreateDependencyInput) => Promise<void>;
}

export function CreateDependencyModal({
  isOpen,
  onClose,
  predecessorNode,
  rootTree,
  onSubmit,
}: CreateDependencyModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createDependencySchema),
    defaultValues: {
      type: 'FINISH_TO_START',
      lagMinutes: 0,
    },
  });

  const availableNodes = rootTree ? flattenNodeTree(rootTree) : [];

  useEffect(() => {
    if (predecessorNode) {
      setValue('predecessorId', predecessorNode.id);
    }
  }, [predecessorNode, setValue]);

  const handleFormSubmit = async (data: CreateDependencyInput) => {
    await onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-indigo-400" />
            Link Node Dependency
          </DialogTitle>
          <DialogDescription>
            Establish topological dependency: <strong className="text-foreground">{predecessorNode?.name}</strong> must finish before the successor node starts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => handleFormSubmit(data as CreateDependencyInput))} className="space-y-4">
          <input type="hidden" {...register('predecessorId')} />

          <div className="space-y-1">
            <label className="text-xs font-semibold">Select Successor Node</label>
            <Select onValueChange={(val) => setValue('successorId', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select target node" />
              </SelectTrigger>
              <SelectContent>
                {availableNodes
                  .filter((n) => n.id !== predecessorNode?.id)
                  .map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.name} ({node.type})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.successorId && (
              <p className="text-xs text-red-500">{errors.successorId.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Dependency Type</label>
            <Select
              onValueChange={(val) => setValue('type', val as any)}
              defaultValue="FINISH_TO_START"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FINISH_TO_START">FINISH_TO_START (Standard)</SelectItem>
                <SelectItem value="START_TO_START">START_TO_START (Parallel)</SelectItem>
                <SelectItem value="FINISH_TO_FINISH">FINISH_TO_FINISH</SelectItem>
                <SelectItem value="START_TO_FINISH">START_TO_FINISH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Lag / Lead Time (Minutes)</label>
            <Input {...register('lagMinutes')} type="number" placeholder="0" />
            <p className="text-[11px] text-muted-foreground">Positive for lag delay, negative for lead time buffer.</p>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Linking...' : 'Link Dependency'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
