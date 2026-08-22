import { redirect } from 'next/navigation';

/** Legacy path — members now live under the organization section. */
export default function LegacyMembersPage() {
  redirect('/organization/members');
}
