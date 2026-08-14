'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Permission } from '@/types';
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
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck } from 'lucide-react';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: Permission[];
  onSubmit: (data: { name: string; description?: string; permissionIds: string[] }) => Promise<void>;
}

export function CreateRoleModal({ isOpen, onClose, permissions, onSubmit }: CreateRoleModalProps) {
  const { register, handleSubmit, reset } = useForm();
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePermission = (id: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: data.name,
        description: data.description,
        permissionIds: selectedPermIds,
      });
      reset();
      setSelectedPermIds([]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            Create Custom Institutional Role
          </DialogTitle>
          <DialogDescription>
            Define custom role scopes and permission unions (User → Role → Permission → Scope).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold">Role Name</label>
            <Input {...register('name', { required: true })} placeholder="e.g. Chief Technical Coordinator" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">Description</label>
            <Input {...register('description')} placeholder="Responsible for live stage equipment & timing" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold block">Granted Scope Permissions</label>
            <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto bg-slate-50">
              {permissions.map((perm) => (
                <div key={perm.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={perm.id}
                    checked={selectedPermIds.includes(perm.id)}
                    onCheckedChange={() => togglePermission(perm.id)}
                  />
                  <label htmlFor={perm.id} className="text-xs font-mono font-medium cursor-pointer text-slate-800">
                    {perm.action} <span className="text-[10px] text-slate-400 font-sans">({perm.scopeType})</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
