import Link from 'next/link';
import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

/** Shared chrome for every auth screen: brand mark, title, body, footer link. */
export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div>
      <Link href="/" className="mb-8 inline-flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-base font-semibold tracking-tight text-foreground">Eventler</span>
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}

      <div className="mt-7">{children}</div>

      {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}
