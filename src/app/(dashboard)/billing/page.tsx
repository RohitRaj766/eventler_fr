import { redirect } from 'next/navigation';

/** Legacy path — billing now lives under the organization section. */
export default function LegacyBillingPage() {
  redirect('/organization/billing');
}
