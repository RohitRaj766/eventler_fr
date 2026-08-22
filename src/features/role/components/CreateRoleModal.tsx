'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppSelector } from '@/app/hooks';
import { selectRoleCategoryOptions } from '@/features/meta/metaSlice';
import { usePermissions } from '@/hooks/usePermission';
import { ACTION_SPECS, describeReach } from '@/lib/authz';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InlineError, Spinner } from '@/components/ui/states';
import { createRoleSchema, type CreateRoleInput } from '@/utils/validationSchemas';
import { cn } from '@/lib/utils';
import type { RoleCategory } from '@/types';

/**
 * Custom role builder.
 *
 * Choosing a category preselects that category's permission pool from
 * `/meta/role-permission-pools` — the same pool the backend validates against,
 * so a role built here is one the server will accept.
 */
export function CreateRoleModal({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateRoleInput) => Promise<void>;
}) {
  const permissions = useAppSelector((state) => state.meta.permissions);
  const pools = useAppSelector((state) => state.meta.permissionPools);
  const categories = useAppSelector(selectRoleCategoryOptions);
  const { canGrant, reachOf, isSuperAdmin } = usePermissions();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: '', description: '', category: 'COORDINATOR', permissionIds: [] },
  });

  const category = watch('category');
  const selectedIds = watch('permissionIds') ?? [];

  /** The actions this category is allowed to grant, per the backend's pools. */
  const allowedActions = useMemo(() => {
    if (!category || !pools?.pools) return null;
    const pool = pools.pools[category];
    if (!pool) return null;
    return pool.includes('*') ? 'all' : new Set(pool);
  }, [category, pools]);

  // Reselect the category's pool whenever the category changes.
  useEffect(() => {
    if (!allowedActions) return;
    const next = permissions
      .filter((permission) =>
        allowedActions === 'all' ? true : allowedActions.has(permission.action),
      )
      .map((permission) => permission.id);
    setValue('permissionIds', next, { shouldValidate: true });
  }, [allowedActions, permissions, setValue]);

  useEffect(() => {
    if (open) reset({ name: '', description: '', category: 'COORDINATOR', permissionIds: [] });
  }, [open, reset]);

  const grouped = useMemo(() => {
    const byPrefix = new Map<string, typeof permissions>();
    for (const permission of [...permissions].sort((a, b) => a.action.localeCompare(b.action))) {
      const prefix = permission.action.split('.')[0];
      byPrefix.set(prefix, [...(byPrefix.get(prefix) ?? []), permission]);
    }
    return [...byPrefix.entries()];
  }, [permissions]);

  const toggle = (permissionId: string) => {
    const next = selectedIds.includes(permissionId)
      ? selectedIds.filter((id) => id !== permissionId)
      : [...selectedIds, permissionId];
    setValue('permissionIds', next, { shouldValidate: true });
  };

  /**
   * You cannot delegate what you do not hold.
   *
   * The server validates a role's permissions against its category pool, but
   * never against the creator's own grants — so without this a Coordinator
   * could mint a role more powerful than their own and hand it out. Verified:
   * `POST /roles` accepts in-pool permissions from a plain Member.
   */
  const selectedActions = useMemo(
    () =>
      selectedIds
        .map((id) => permissions.find((permission) => permission.id === id)?.action)
        .filter((action): action is string => Boolean(action)),
    [selectedIds, permissions],
  );
  const delegation = canGrant(selectedActions);

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create a custom role</DialogTitle>
          <DialogDescription>
            Give a group of people exactly the permissions they need — nothing more.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Role name" error={errors.name?.message} required>
              {(field) => (
                <Input {...field} {...register('name')} placeholder="Stage Manager" autoFocus />
              )}
            </FormField>

            <FormField
              label="Category"
              error={errors.category?.message}
              hint="Sets the permissions this role may hold."
            >
              {(field) => (
                <Select
                  value={category}
                  onValueChange={(value) =>
                    setValue('category', value as RoleCategory, { shouldValidate: true })
                  }
                >
                  <SelectTrigger id={field.id}>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          </div>

          <FormField label="Description" error={errors.description?.message}>
            {(field) => (
              <Textarea
                {...field}
                {...register('description')}
                rows={2}
                placeholder="Oversees audio-visual setup and stage timing"
              />
            )}
          </FormField>

          <fieldset>
            <legend className="text-sm font-medium text-foreground">
              Permissions
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {selectedIds.length} selected
              </span>
            </legend>
            {errors.permissionIds && (
              <p className="mt-1 text-xs font-medium text-destructive">
                {errors.permissionIds.message}
              </p>
            )}

            <div className="scrollbar-thin mt-2 max-h-64 space-y-4 overflow-y-auto rounded-lg border border-border p-3">
              {grouped.map(([prefix, items]) => (
                <div key={prefix}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {prefix}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((permission) => {
                      const outOfPool =
                        allowedActions !== null &&
                        allowedActions !== 'all' &&
                        !allowedActions.has(permission.action);

                      const notHeld = !isSuperAdmin && reachOf(permission.action) === 'none';
                      const spec = ACTION_SPECS[permission.action];
                      const blocked = outOfPool || notHeld;

                      return (
                        <label
                          key={permission.id}
                          className={cn(
                            'flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors',
                            blocked
                              ? 'cursor-not-allowed opacity-55'
                              : 'cursor-pointer hover:bg-muted',
                          )}
                          title={
                            notHeld
                              ? "You can't grant a permission you don't hold yourself."
                              : outOfPool
                                ? 'Not allowed for this role category.'
                                : undefined
                          }
                        >
                          <Checkbox
                            className="mt-0.5"
                            disabled={blocked}
                            checked={selectedIds.includes(permission.id)}
                            onCheckedChange={() => !blocked && toggle(permission.id)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs font-medium text-foreground">
                              {spec?.label ?? permission.action}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {permission.description}
                            </span>
                            {selectedIds.includes(permission.id) && (
                              <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                Scope: {describeReach(reachOf(permission.action))}
                              </span>
                            )}
                          </span>
                          {notHeld ? (
                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              You lack this
                            </span>
                          ) : outOfPool ? (
                            <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                              Outside category
                            </span>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          {!delegation.allowed && (
            <InlineError
              message={`You can only grant permissions you hold yourself. Remove: ${delegation.missing.join(', ')}.`}
            />
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !delegation.allowed}>
              {isSubmitting && <Spinner />}
              {isSubmitting ? 'Creating…' : 'Create role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
