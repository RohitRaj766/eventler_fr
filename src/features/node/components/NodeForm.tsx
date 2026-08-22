'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarDays, MoonStar } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import {
  selectNodeStatusOptions,
  selectNodeTypeOptions,
} from '@/features/meta/metaSlice';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/states';
import { nodeFormSchema, type NodeFormInput } from '@/utils/validationSchemas';
import {
  combineDateAndTime,
  crossesMidnight,
  formatDayLabel,
  formatDuration,
  humanizeEnum,
  minutesBetweenTimes,
  toDateInputValue,
  toTimeInputValue,
} from '@/utils/formatters';
import type { EventNode, NodeStatus, NodeTypeCategory } from '@/types';

export interface NodeFormValues {
  name: string;
  type: NodeTypeCategory;
  customTypeName?: string;
  description?: string;
  plannedStartTime: string;
  plannedEndTime: string;
  venueId?: string | null;
  status?: NodeStatus;
}

interface NodeFormProps {
  /** Present when editing; absent when creating. */
  node?: EventNode | null;
  /** Seeds the date and venue for a new child. */
  parent?: EventNode | null;
  onSubmit: (values: NodeFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const NO_VENUE = '__none__';

/** Default length for a new node when there is nothing better to go on. */
const DEFAULT_DURATION_MINUTES = 60;

/**
 * Picks sensible opening values for a new child.
 *
 * A child runs on a day its parent already covers, so the date is inherited
 * rather than asked for. The time slots in after the last sibling — building a
 * run of show means appending, so the common case should need no editing at
 * all — falling back to the parent's own start when there are no siblings yet.
 */
function seedFromParent(parent: EventNode) {
  const siblings = parent.children ?? [];
  const lastEnd = siblings.length
    ? siblings
        .map((child) => new Date(child.plannedEndTime).getTime())
        .reduce((latest, current) => Math.max(latest, current), 0)
    : null;

  const parentStart = new Date(parent.plannedStartTime);
  const parentEnd = new Date(parent.plannedEndTime);

  // Start where the previous sibling finished, but never past the parent's end.
  const start =
    lastEnd && lastEnd < parentEnd.getTime() ? new Date(lastEnd) : parentStart;

  const end = new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60_000);

  return {
    date: toDateInputValue(start),
    startTime: toTimeInputValue(start),
    endTime: toTimeInputValue(end),
  };
}

/**
 * One form for creating and editing nodes.
 *
 * Type and status options come from `/meta/*`, so a node type added
 * server-side appears here without a code change. The form adapts to the type:
 * a CUSTOM node asks for its own label, and status only appears when editing
 * (the backend always creates nodes as SCHEDULED).
 */
export function NodeForm({ node, parent, onSubmit, onCancel, submitLabel }: NodeFormProps) {
  const nodeTypes = useAppSelector(selectNodeTypeOptions);
  const nodeStatuses = useAppSelector(selectNodeStatusOptions);
  const venues = useAppSelector((state) => state.meta.orgVenues);
  const isEditing = Boolean(node);

  const defaults = useMemo(() => {
    if (node) {
      return {
        date: toDateInputValue(node.plannedStartTime),
        startTime: toTimeInputValue(node.plannedStartTime),
        endTime: toTimeInputValue(node.plannedEndTime),
      };
    }
    if (parent) return seedFromParent(parent);
    return { date: toDateInputValue(new Date()), startTime: '09:00', endTime: '10:00' };
  }, [node, parent]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NodeFormInput>({
    resolver: zodResolver(nodeFormSchema),
    defaultValues: {
      name: node?.name ?? '',
      type: node?.type ?? 'SESSION',
      customTypeName: node?.customTypeName ?? '',
      description: node?.description ?? '',
      venueId: node?.venueId ?? parent?.venueId ?? '',
      status: node?.status,
      ...defaults,
    },
  });

  // Re-seed when the dialog is reused for a different node.
  useEffect(() => {
    reset({
      name: node?.name ?? '',
      type: node?.type ?? 'SESSION',
      customTypeName: node?.customTypeName ?? '',
      description: node?.description ?? '',
      venueId: node?.venueId ?? parent?.venueId ?? '',
      status: node?.status,
      ...defaults,
    });
  }, [node, parent, defaults, reset]);

  const type = watch('type');
  const venueId = watch('venueId');
  const status = watch('status');
  const date = watch('date');
  const startTime = watch('startTime');
  const endTime = watch('endTime');

  const overnight = crossesMidnight(startTime, endTime);
  const duration = minutesBetweenTimes(startTime, endTime);

  /** Warns when a child lands outside the window its parent occupies. */
  const outsideParent = useMemo(() => {
    if (!parent || !date || !startTime || !endTime) return false;
    const start = combineDateAndTime(date, startTime);
    const end = combineDateAndTime(date, endTime, overnight ? 1 : 0);
    if (!start || !end) return false;
    return (
      new Date(start) < new Date(parent.plannedStartTime) ||
      new Date(end) > new Date(parent.plannedEndTime)
    );
  }, [parent, date, startTime, endTime, overnight]);

  const submit = async (values: NodeFormInput) => {
    const rollsOver = crossesMidnight(values.startTime, values.endTime);
    const plannedStartTime = combineDateAndTime(values.date, values.startTime);
    const plannedEndTime = combineDateAndTime(values.date, values.endTime, rollsOver ? 1 : 0);
    if (!plannedStartTime || !plannedEndTime) return;

    await onSubmit({
      name: values.name,
      type: values.type,
      customTypeName: values.type === 'CUSTOM' ? values.customTypeName || undefined : undefined,
      description: values.description || undefined,
      plannedStartTime,
      plannedEndTime,
      venueId: values.venueId && values.venueId !== NO_VENUE ? values.venueId : null,
      status: values.status,
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <FormField label="Name" error={errors.name?.message} required>
        {(field) => (
          <Input {...field} {...register('name')} placeholder="AI/ML Keynote Session" autoFocus />
        )}
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Type" error={errors.type?.message} required>
          {(field) => (
            <Select
              value={type}
              onValueChange={(value) => setValue('type', value as NodeTypeCategory, { shouldValidate: true })}
            >
              <SelectTrigger id={field.id} aria-describedby={field['aria-describedby']}>
                <SelectValue placeholder="Choose a type" />
              </SelectTrigger>
              <SelectContent>
                {nodeTypes
                  // A PROGRAM root is created by the program itself, never by hand.
                  .filter((option) => option.value !== 'PROGRAM')
                  .map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </FormField>

        {type === 'CUSTOM' ? (
          <FormField label="Custom type label" error={errors.customTypeName?.message} required>
            {(field) => (
              <Input {...field} {...register('customTypeName')} placeholder="e.g. Panel Debate" />
            )}
          </FormField>
        ) : (
          isEditing && (
            <FormField label="Status" error={errors.status?.message}>
              {(field) => (
                <Select
                  value={status}
                  onValueChange={(value) => setValue('status', value as NodeStatus, { shouldValidate: true })}
                >
                  <SelectTrigger id={field.id}>
                    <SelectValue placeholder="Choose a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeStatuses.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {humanizeEnum(option.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          )
        )}
      </div>

      <FormField label="Description" error={errors.description?.message}>
        {(field) => (
          <Textarea
            {...field}
            {...register('description')}
            rows={2}
            placeholder="What happens in this block?"
          />
        )}
      </FormField>

      {/*
        Scheduling: the date comes from the parent and rarely needs touching, so
        it sits first and small, and the two time fields — the only thing that
        actually varies per node — get the room.
      */}
      <fieldset className="rounded-lg border border-border p-3.5">
        <legend className="px-1 text-sm font-medium text-foreground">Scheduling</legend>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <FormField
            label="Date"
            error={errors.date?.message}
            required
            hint={
              parent && !isEditing
                ? `Same day as ${parent.name}. Change it only if this runs on another day.`
                : undefined
            }
          >
            {(field) => <Input {...field} {...register('date')} type="date" />}
          </FormField>

          <FormField label="Starts" error={errors.startTime?.message} required>
            {(field) => (
              <Input {...field} {...register('startTime')} type="time" className="w-32" />
            )}
          </FormField>

          <FormField label="Ends" error={errors.endTime?.message} required>
            {(field) => (
              <Input {...field} {...register('endTime')} type="time" className="w-32" />
            )}
          </FormField>
        </div>

        {/* Live read-back, so what will be saved is never in doubt. */}
        {date && startTime && endTime && !errors.endTime && (
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="font-medium text-foreground">{formatDayLabel(date)}</span>
            <span className="tabular-nums">
              {startTime} – {endTime}
            </span>
            <span>· {formatDuration(duration)}</span>
            {overnight && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <MoonStar className="h-3.5 w-3.5" aria-hidden="true" />
                ends next day
              </span>
            )}
          </p>
        )}

        {parent && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {parent.name} runs {formatDayLabel(parent.plannedStartTime)}{' '}
            {toTimeInputValue(parent.plannedStartTime)} – {toTimeInputValue(parent.plannedEndTime)}.
          </p>
        )}

        {/*
          A warning, not a block: the backend accepts children outside their
          parent's window, and there are legitimate reasons to overrun.
        */}
        {outsideParent && (
          <p className="mt-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            This falls outside {parent?.name}&apos;s window. That&apos;s allowed — just check it&apos;s
            what you meant.
          </p>
        )}
      </fieldset>

      <FormField
        label="Venue"
        error={errors.venueId?.message}
        hint={
          venues.length
            ? parent?.venueId && !isEditing
              ? `Defaults to ${parent.name}'s venue.`
              : undefined
            : 'No venues yet — add one under Venues.'
        }
      >
        {(field) => (
          <Select
            value={venueId || NO_VENUE}
            onValueChange={(value) => setValue('venueId', value === NO_VENUE ? '' : value)}
            disabled={!venues.length}
          >
            <SelectTrigger id={field.id}>
              <SelectValue placeholder="No venue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_VENUE}>No venue</SelectItem>
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.id}>
                  {venue.name}
                  {venue.building ? ` · ${venue.building}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Saving…' : (submitLabel ?? (isEditing ? 'Save changes' : 'Add node'))}
        </Button>
      </div>
    </form>
  );
}
