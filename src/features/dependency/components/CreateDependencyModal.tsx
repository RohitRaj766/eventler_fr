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
      <DialogContent className="sm:max-w-md bg-white border border-slate-200/80 shadow-2xl rounded-2xl p-6">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-slate-900 font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <LinkIcon className="h-4 w-4" />
            </div>
            Link Node Dependency
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-500">
            Establish topological dependency: <strong className="text-slate-900">{predecessorNode?.name}</strong> must finish before the successor node starts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => handleFormSubmit(data as CreateDependencyInput))} className="space-y-4 pt-2">
          <input type="hidden" {...register('predecessorId')} />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Select Successor Node</label>
            <Select onValueChange={(val) => setValue('successorId', val)}>
              <SelectTrigger className="h-10 text-xs bg-white border-slate-200 text-slate-900">
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
              <p className="text-xs text-red-500 font-medium">{errors.successorId.message as string}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Dependency Type</label>
            <Select onValueChange={(val) => setValue('type', val as any)} defaultValue="FINISH_TO_START">
              <SelectTrigger className="h-10 text-xs bg-white border-slate-200 text-slate-900">
                <SelectValue placeholder="Dependency type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FINISH_TO_START">Finish-to-Start (FS)</SelectItem>
                <SelectItem value="START_TO_START">Start-to-Start (SS)</SelectItem>
                <SelectItem value="FINISH_TO_FINISH">Finish-to-Finish (FF)</SelectItem>
                <SelectItem value="START_TO_FINISH">Start-to-Finish (SF)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Lag Time (Minutes)</label>
            <Input
              {...register('lagMinutes')}
              type="number"
              placeholder="0"
              className="h-10 text-xs bg-white border-slate-200 text-slate-900 focus-visible:ring-indigo-500"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              className="h-9 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
            >
              {isSubmitting ? 'Linking...' : 'Create Dependency'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
