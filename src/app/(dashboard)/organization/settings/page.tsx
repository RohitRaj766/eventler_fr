import { redirect } from 'next/navigation';

/** Settings live on the organization overview; keep the documented route working. */
export default function OrganizationSettingsPage() {
  redirect('/organization');
}
