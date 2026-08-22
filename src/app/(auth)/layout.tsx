import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { CalendarClock, GitBranch, Radio } from 'lucide-react';
import { GuestGuard } from '@/components/auth/GuestGuard';
import { LoadingState } from '@/components/ui/states';

const HIGHLIGHTS = [
  {
    icon: GitBranch,
    title: 'Model the whole event',
    body: 'Programs, activities, sessions, rounds and tasks in one hierarchy of any depth.',
  },
  {
    icon: Radio,
    title: 'Run it live',
    body: 'Record what actually happened and watch the delay propagate downstream automatically.',
  },
  {
    icon: CalendarClock,
    title: 'Keep everyone aligned',
    body: 'Role-scoped access, task assignments and a full audit trail of every schedule change.',
  },
];

/**
 * Split layout: the form on the left, the product story on the right. The
 * right panel is decorative and drops away below `lg` so small screens get the
 * full width for the form itself.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // GuestGuard reads `?next=` and the auth pages read their own query
    // params, so the whole subtree needs a Suspense boundary or the static
    // prerender bails out.
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <LoadingState />
        </div>
      }
    >
      <GuestGuard>
        <div className="grid min-h-dvh lg:grid-cols-2">
          <main className="flex items-center justify-center px-4 py-10 sm:px-8">
            <div className="w-full max-w-sm">{children}</div>
          </main>

          <aside
            className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-center lg:px-14"
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(99,102,241,0.35),transparent_55%),radial-gradient(circle_at_75%_85%,rgba(139,92,246,0.28),transparent_50%)]" />
            <div className="relative">
              <p className="text-sm font-medium text-indigo-300">Eventler</p>
              <h2 className="mt-3 max-w-md text-3xl font-semibold leading-tight tracking-tight text-white">
                Live event orchestration for institutions that run on a schedule.
              </h2>

              <ul className="mt-10 space-y-6">
                {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-4">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-indigo-200">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-1 max-w-sm text-sm leading-relaxed text-slate-300">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </GuestGuard>
    </Suspense>
  );
}
