'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppSelector } from '@/app/hooks';
import {
  selectTaskPriorityOptions,
  selectTaskStatusOptions,
} from '@/features/meta/metaSlice';
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
import { Spinner } from '@/components/ui/states';
import { fromDateTimeLocalValue, fullName, humanizeEnum, toDateTimeLocalValue } from '@/utils/formatters';
import { taskFormSchema, type TaskFormInput } from '@/utils/validationSchemas';
import type { EventNode, Task, TaskPriority, TaskStatus } from '@/types';

export interface TaskSubmitValues {
  nodeId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status?: TaskStatus;
  deadline?: string;
  assigneeUserIds: string[];
}

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing an existing task. */
  task?: Task | null;
  /** Pre-selects the node when opened from the program workspace. */
  defaultNodeId?: string;
  nodes: EventNode[];
  onSubmit: (values: TaskSubmitValues) => Promise<void>;
}

export function TaskFormModal({
  open,
  onOpenChange,
  task,
  defaultNodeId,
  nodes,
  onSubmit,
}: TaskFormModalProps) {
  const priorities = useAppSelector(selectTaskPriorityOptions);
  const statuses = useAppSelector(selectTaskStatusOptions);
  const members = useAppSelector((state) => state.org.members);
  const isEditing = Boolean(task);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormInput>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      nodeId: task?.nodeId ?? defaultNodeId ?? '',
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 'MEDIUM',
      status: task?.status,
      deadline: toDateTimeLocalValue(task?.deadline),
      assigneeUserIds: task?.assignments?.map((assignment) => assignment.userId) ?? [],
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      nodeId: task?.nodeId ?? defaultNodeId ?? '',
      title: task?.title ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 'MEDIUM',
      status: task?.status,
      deadline: toDateTimeLocalValue(task?.deadline),
      assigneeUserIds: task?.assignments?.map((assignment) => assignment.userId) ?? [],
    });
  }, [open, task, defaultNodeId, reset]);

  const nodeId = watch('nodeId');
  const priority = watch('priority');
  const status = watch('status');
  const assigneeUserIds = watch('assigneeUserIds') ?? [];

  const toggleAssignee = (userId: string) => {
    const next = assigneeUserIds.includes(userId)
      ? assigneeUserIds.filter((id) => id !== userId)
      : [...assigneeUserIds, userId];
    setValue('assigneeUserIds', next, { shouldDirty: true });
  };

  const submit = async (values: TaskFormInput) => {
    await onSubmit({
      nodeId: values.nodeId,
      title: values.title,
      description: values.description || undefined,
      priority: values.priority,
      status: values.status,
      deadline: fromDateTimeLocalValue(values.deadline),
      assigneeUserIds: values.assigneeUserIds ?? [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit task' : 'Create a task'}</DialogTitle>
          <DialogDescription>
            Tasks hang off a node, so the people responsible see them alongside the part of the
            schedule they belong to.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <FormField label="Title" error={errors.title?.message} required>
            {(field) => (
              <Input
                {...field}
                {...register('title')}
                placeholder="Set up projector and audio"
                autoFocus
              />
            )}
          </FormField>

          <FormField
            label="Attach to node"
            error={errors.nodeId?.message}
            required
            hint={isEditing ? 'A task cannot be moved to a different node.' : undefined}
          >
            {(field) => (
              <Select
                value={nodeId}
                onValueChange={(value) => setValue('nodeId', value, { shouldValidate: true })}
                disabled={isEditing}
              >
                <SelectTrigger id={field.id}>
                  <SelectValue placeholder="Choose a node" />
                </SelectTrigger>
                <SelectContent>
                  {nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          <FormField label="Description" error={errors.description?.message}>
            {(field) => (
              <Textarea
                {...field}
                {...register('description')}
                rows={2}
                placeholder="Test the HDMI connection and podium mic"
              />
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Priority" error={errors.priority?.message} required>
              {(field) => (
                <Select
                  value={priority}
                  onValueChange={(value) => setValue('priority', value as TaskPriority, { shouldValidate: true })}
                >
                  <SelectTrigger id={field.id}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {humanizeEnum(option.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            {isEditing && (
              <FormField label="Status" error={errors.status?.message}>
                {(field) => (
                  <Select
                    value={status}
                    onValueChange={(value) => setValue('status', value as TaskStatus, { shouldValidate: true })}
                  >
                    <SelectTrigger id={field.id}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {humanizeEnum(option.value)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormField>
            )}

            <FormField label="Deadline" error={errors.deadline?.message}>
              {(field) => <Input {...field} {...register('deadline')} type="datetime-local" />}
            </FormField>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-foreground">Assignees</legend>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No members loaded. Anyone in your organization can be assigned once the member
                list is available.
              </p>
            ) : (
              <div className="scrollbar-thin max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {members.map((member) => {
                  const userId = member.userId;
                  const checked = assigneeUserIds.includes(userId);
                  return (
                    <label
                      key={member.id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleAssignee(userId)} />
                      <span className="min-w-0 flex-1 truncate">{fullName(member.user)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {member.role?.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </fieldset>

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
              {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
