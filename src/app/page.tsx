import { redirect } from 'next/navigation';

export default function Home() {
  // The guards decide where an unauthenticated visitor actually lands.
  redirect('/dashboard');
}
