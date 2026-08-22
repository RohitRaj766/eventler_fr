import { redirect } from 'next/navigation';

/** Legacy path — roles now live under the organization section. */
export default function LegacyRolesPage() {
  redirect('/organization/roles');
}
