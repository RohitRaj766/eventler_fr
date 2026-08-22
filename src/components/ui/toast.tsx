'use client';

import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { dismissToast, type Toast, type ToastVariant } from '@/features/ui/uiSlice';
import { cn } from '@/lib/utils';

const VARIANT_STYLES: Record<ToastVariant, { accent: string; icon: typeof Info }> = {
  success: { accent: 'text-emerald-600 dark:text-emerald-400', icon: CheckCircle2 },
  error: { accent: 'text-red-600 dark:text-red-400', icon: XCircle },
  warning: { accent: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle },
  info: { accent: 'text-indigo-600 dark:text-indigo-400', icon: Info },
};

function ToastCard({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  const { accent, icon: Icon } = VARIANT_STYLES[toast.variant];

  useEffect(() => {
    if (!toast.duration) return;
    const timer = window.setTimeout(() => dispatch(dismissToast(toast.id)), toast.duration);
    return () => window.clearTimeout(timer);
  }, [dispatch, toast.id, toast.duration]);

  return (
    <div
      // Errors interrupt; everything else waits its turn in the queue.
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      className="animate-slide-up pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-border bg-popover p-3.5 shadow-lg"
    >
      <Icon className={cn('mt-0.5 h-4.5 w-4.5 shrink-0', accent)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-popover-foreground">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dispatch(dismissToast(toast.id))}
        className="-m-1 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={`Dismiss: ${toast.title}`}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Mounted once in the root layout. */
export function Toaster() {
  const toasts = useAppSelector((state) => state.ui.toasts);
  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-96"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
