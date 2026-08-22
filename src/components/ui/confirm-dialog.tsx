'use client';

import { useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/states';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Spell out the consequence — what is removed, and whether it can be undone. */
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive styling for anything that removes data. */
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

/**
 * Confirmation gate for irreversible actions.
 *
 * Stays open and busy until the promise settles, so a user cannot fire a
 * delete twice, and closes only on success — on failure the caller's toast
 * explains why while the dialog steps aside.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
}: ConfirmDialogProps) {
  const [isWorking, setIsWorking] = useState(false);

  const handleConfirm = async () => {
    setIsWorking(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isWorking && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {destructive && (
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1.5">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isWorking}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isWorking}
          >
            {isWorking && <Spinner />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook form of the dialog for pages with many one-off confirmations.
 *
 * ```tsx
 * const confirm = useConfirm();
 * <Button onClick={() => confirm.ask({ title: '…', description: '…', onConfirm: … })} />
 * {confirm.dialog}
 * ```
 */
export function useConfirm() {
  const [request, setRequest] = useState<
    Omit<ConfirmDialogProps, 'open' | 'onOpenChange'> | null
  >(null);

  const dialog = request ? (
    <ConfirmDialog
      {...request}
      open
      onOpenChange={(open) => !open && setRequest(null)}
    />
  ) : null;

  return {
    ask: (next: Omit<ConfirmDialogProps, 'open' | 'onOpenChange'>) => setRequest(next),
    dialog,
  };
}
