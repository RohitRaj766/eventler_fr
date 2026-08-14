'use client';

import { useState, useEffect } from 'react';
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
import { ShieldCheck, Filter, AlertCircle } from 'lucide-react';
import { roleService } from '@/services/api/role.service';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissions: Permission[];
  onSubmit: (data: { name: string; description?: string; category?: string; permissionIds: string[] }) => Promise<void>;
}

const ROLE_CATEGORIES = [
  { value: 'COORDINATOR', label: 'Coordinator (Stage, Program & Track Operations)' },
  { value: 'VOLUNTEER', label: 'Volunteer (Task & Check-in Operations)' },
  { value: 'JURY', label: 'Jury' },
  { value: 'ORGANIZATION_ADMIN', label: 'Organization Admin (Operational Admin)' },
  { value: 'MEMBER', label: 'Member' },
];

export function CreateRoleModal({ isOpen, onClose, permissions, onSubmit }: CreateRoleModalProps) {
  const { register, handleSubmit, reset } = useForm();
  const [category, setCategory] = useState<string>('COORDINATOR');
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pools, setPools] = useState<Record<string, string[]>>({});

  useEffect(() => {
    roleService.getRolePermissionPools().then((data) => {
      if (data?.pools) {
        setPools(data.pools);
      }
    }).catch(console.error);
  }, []);

  const allowedPool = pools[category] || [];
  const isWildcard = allowedPool.includes('*');

  // Filter permissions based on the selected category's allowed pool
  const filteredPermissions = permissions.filter((p) => {
    if (isWildcard) return true;
    return allowedPool.includes(p.action);
  });

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
        category,
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
            Configure role boundaries and grant permissions from the role type's allowed pool.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-800">Role Name</label>
            <Input {...register('name', { required: true })} placeholder="e.g. Chief Stage Coordinator" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-800">Role Category Type</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSelectedPermIds([]);
              }}
              className="w-full h-9 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
            >
              {ROLE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-800">Description</label>
            <Input {...register('description')} placeholder="Responsible for live stage equipment & timing" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-indigo-600" />
                Allowed Permission Pool ({filteredPermissions.length} available)
              </label>
              <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Category: {category}
              </span>
            </div>

            <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto bg-slate-50">
              {filteredPermissions.length === 0 ? (
                <p className="text-xs text-slate-400 p-2 text-center">No available permissions for this category pool.</p>
              ) : (
                filteredPermissions.map((perm) => (
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
                ))
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || selectedPermIds.length === 0}>
              {isSubmitting ? 'Saving...' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
