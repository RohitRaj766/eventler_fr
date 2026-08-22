'use client';

import { useEffect, useMemo, useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  fetchInvitations,
  fetchOrgMembers,
  fetchOrganizationDetails,
  updateMemberRole,
} from '@/features/org/orgSlice';
import { InviteMemberModal } from '@/features/org/components/InviteMemberModal';
import { PendingInvitations } from '@/features/org/components/PendingInvitations';
import { Button } from '@/components/ui/button';
import { fetchOrgMetadata } from '@/features/meta/metaSlice';
import { fetchCurrentUser } from '@/features/auth/authSlice';
import { RequirePermission } from '@/components/auth/RequirePermission';
import { Can } from '@/components/auth/Can';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/useToast';
import { formatDateTime, fullName, initialsOf } from '@/utils/formatters';
import type { OrganizationMember } from '@/types';

/**
 * Member roster and role assignment.
 *
 * Changing a role takes effect server-side immediately, so a user changing
 * their own role has their permission cache refreshed right after — otherwise
 * the sidebar would keep showing links they can no longer use.
 */
export default function MembersPage() {
  const dispatch = useAppDispatch();
  const toast = useToast();

  const { members, isLoadingMembers, membersError, invitations, isLoadingInvitations, details } =
    useAppSelector((state) => state.org);
  const orgRoles = useAppSelector((state) => state.meta.orgRoles);
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const activeOrgId = useAppSelector((state) => state.auth.activeOrgId);

  const [pendingChange, setPendingChange] = useState<{
    member: OrganizationMember;
    roleId: string;
    roleName: string;
  } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    void dispatch(fetchOrgMembers());
    void dispatch(fetchInvitations());
    if (!orgRoles.length) void dispatch(fetchOrgMetadata());
  }, [dispatch, activeOrgId, orgRoles.length]);

  // The invite dialog shows the org code as the fallback join route.
  useEffect(() => {
    if (activeOrgId && !details) void dispatch(fetchOrganizationDetails(activeOrgId));
  }, [dispatch, activeOrgId, details]);

  const roleNameById = useMemo(
    () => new Map(orgRoles.map((role) => [role.id, role.name])),
    [orgRoles],
  );

  const applyRoleChange = async (member: OrganizationMember, roleId: string) => {
    const result = await dispatch(updateMemberRole({ userId: member.userId, roleId }));
    if (updateMemberRole.rejected.match(result)) {
      toast.error('Could not change the role', result.payload as string);
      return;
    }
    toast.success('Role updated', `${fullName(member.user)} is now ${roleNameById.get(roleId)}.`);

    // The backend checks permissions against the database on every request, so
    // our own cached permissions are stale the moment we change our own role.
    if (member.userId === currentUserId) await dispatch(fetchCurrentUser());
    void dispatch(fetchOrgMetadata());
  };

  const columns: DataTableColumn<OrganizationMember>[] = [
    {
      id: 'member',
      header: 'Member',
      sortValue: (row) => fullName(row.user),
      searchValue: (row) => `${fullName(row.user)} ${row.user?.email ?? ''}`,
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-muted text-xs font-semibold">
              {initialsOf(row.user)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {fullName(row.user)}
              {row.userId === currentUserId && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
              )}
            </p>
            <p className="truncate text-xs text-muted-foreground">{row.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      sortValue: (row) => row.role?.name ?? '',
      cell: (row) => (
        <Can
          action="role.manage"
          fallback={
            <span className="text-sm text-muted-foreground">{row.role?.name ?? 'Member'}</span>
          }
        >
          <Select
            value={row.roleId}
            onValueChange={(roleId) => {
              if (roleId === row.roleId) return;
              setPendingChange({
                member: row,
                roleId,
                roleName: roleNameById.get(roleId) ?? 'this role',
              });
            }}
            disabled={!orgRoles.length}
          >
            <SelectTrigger className="h-8 w-52" aria-label={`Role for ${fullName(row.user)}`}>
              <SelectValue placeholder={row.role?.name ?? 'Choose a role'} />
            </SelectTrigger>
            <SelectContent>
              {orgRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Can>
      ),
    },
    {
      id: 'phone',
      header: 'Phone',
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{row.user?.phoneNumber ?? '—'}</span>
      ),
    },
    {
      id: 'joined',
      header: 'Joined',
      hideOnMobile: true,
      sortValue: (row) => row.createdAt,
      cell: (row) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <RequirePermission action="org.read" title="the member roster">
      <div className="space-y-5">
        <PageHeader
          title="Members"
          description="Everyone who has joined this organization, and what they can do."
          actions={
            <Can action="role.manage">
              <Button onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Invite member
              </Button>
            </Can>
          }
        />

        <p className="rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground">
          You never set anyone&apos;s password. Invite someone by email — if they already have an
          Eventler account they join straight away — or share your institution code{' '}
          {details?.code && (
            <code className="rounded bg-background px-1.5 py-0.5 font-mono text-xs text-foreground">
              {details.code}
            </code>
          )}{' '}
          so they can register and choose their own.
        </p>

        <DataTable
          columns={columns}
          rows={members}
          rowKey={(row) => row.id}
          isLoading={isLoadingMembers}
          error={membersError}
          onRetry={() => void dispatch(fetchOrgMembers())}
          searchPlaceholder="Search members…"
          emptyIcon={Users}
          emptyTitle="No members yet"
          emptyDescription="Share your institution code so people can register and join."
          caption="Organization members"
        />

        <Can action="role.manage">
          <PendingInvitations
            invitations={invitations}
            isLoading={isLoadingInvitations}
            onInvite={() => setInviteOpen(true)}
          />
        </Can>

        <InviteMemberModal
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          organizationCode={details?.code}
        />

        <ConfirmDialog
          open={Boolean(pendingChange)}
          onOpenChange={(open) => !open && setPendingChange(null)}
          title="Change this member's role?"
          description={
            pendingChange ? (
              pendingChange.member.userId === currentUserId ? (
                <>
                  You&apos;re changing <strong>your own</strong> role to{' '}
                  <strong>{pendingChange.roleName}</strong>. If that role has fewer permissions,
                  you may immediately lose access to parts of the app — including the ability to
                  change it back.
                </>
              ) : (
                <>
                  <strong>{fullName(pendingChange.member.user)}</strong> will become{' '}
                  <strong>{pendingChange.roleName}</strong>. Their access changes straight away.
                </>
              )
            ) : (
              ''
            )
          }
          confirmLabel="Change role"
          destructive={pendingChange?.member.userId === currentUserId}
          onConfirm={async () => {
            if (pendingChange) {
              await applyRoleChange(pendingChange.member, pendingChange.roleId);
            }
            setPendingChange(null);
          }}
        />
      </div>
    </RequirePermission>
  );
}
