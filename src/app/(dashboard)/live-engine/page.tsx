import { redirect } from 'next/navigation';

/**
 * Legacy path. Live mode is now scoped to a single program
 * (/programs/:id/live), so send people to the program list to pick one.
 */
export default function LegacyLiveEnginePage() {
  redirect('/programs');
}
