'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchOrgMembers, updateUserRole } from '@/features/org/orgSlice';
import { fetchRoles } from '@/features/role/roleSlice';
import { Users, Search, ShieldCheck, Calendar, Copy, Check, Crown } from 'lucide-react';

export default function MembersPage() {
  const dispatch = useAppDispatch();
  const { members, isLoading } = useAppSelector((state) => state.org);
  const { roles } = useAppSelector((state) => state.role);
  const { activeOrg, user } = useAppSelector((state) => state.auth);

  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchOrgMembers());
    dispatch(fetchRoles());
  }, [dispatch]);

  const orgCode = activeOrg?.code || 'N/A';

  // Check RBAC permission for current user
  const currentUserRoleName =
    user?.organizations?.find((o: any) => o.id === activeOrg?.id)?.role ||
    user?.role ||
    '';

  const canManageRoles =
    user?.permissions?.includes('role.manage') ||
    user?.permissions?.includes('org.manage_admins') ||
    currentUserRoleName === 'Organization Super Admin' ||
    currentUserRoleName === 'Organization Admin' ||
    currentUserRoleName === 'ORG_SUPER_ADMIN' ||
    currentUserRoleName === 'ORG_ADMIN';

  const isCurrentUserSuperAdmin =
    currentUserRoleName === 'Organization Super Admin' || currentUserRoleName === 'ORG_SUPER_ADMIN';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(orgCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = async (targetUserId: string, roleId: string) => {
    setUpdatingUserId(targetUserId);
    await dispatch(updateUserRole({ userId: targetUserId, roleId }));
    await dispatch(fetchOrgMembers());
    setUpdatingUserId(null);
  };

  const filteredMembers = members.filter((m) => {
    const name = `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.toLowerCase();
    const email = (m.user?.email || '').toLowerCase();
    const role = (m.role?.name || '').toLowerCase();
    const query = search.toLowerCase();
    return name.includes(query) || email.includes(query) || role.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            University Members & Roster
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            View enrolled students, faculty, and administrators in {activeOrg?.name || 'your institution'}.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 p-3 rounded-xl">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Institution Invite Code</span>
            <span className="text-xs font-mono font-bold text-indigo-400">{orgCode}</span>
          </div>
          <button
            onClick={handleCopyCode}
            className="h-8 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-xs transition-colors flex items-center gap-1.5 border border-indigo-500/30"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Search & Statistics Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member by name, email, or role..."
            className="w-full h-9 pl-9 pr-4 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-400 font-medium">
          Total Enrolled Members: <span className="font-bold text-white">{members.length}</span>
        </div>
      </div>

      {/* Members Directory Cards */}
      {isLoading ? (
        <div className="p-12 text-center space-y-3">
          <div className="h-8 w-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading university member roster...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center space-y-3">
          <Users className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Members Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search ? 'No members match your search criteria.' : 'Share your Institution Invite Code with staff and students so they can join!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((m) => {
            const isTargetSuperAdmin = m.role?.name === 'Organization Super Admin' || m.role?.name === 'ORG_SUPER_ADMIN';
            const isTargetAdmin = m.role?.name === 'Organization Admin' || m.role?.name === 'ORG_ADMIN';

            return (
              <div
                key={m.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition-colors shadow-lg relative overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl font-bold flex items-center justify-center text-sm shadow-md text-white ${
                        isTargetSuperAdmin
                          ? 'bg-gradient-to-tr from-amber-500 to-purple-600'
                          : isTargetAdmin
                          ? 'bg-gradient-to-tr from-indigo-600 to-violet-500'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {m.user?.firstName?.[0]}{m.user?.lastName?.[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-white">
                          {m.user?.firstName} {m.user?.lastName}
                        </h4>
                        {isTargetSuperAdmin && (
                          <span title="University Registrant / Owner">
                            <Crown className="h-3.5 w-3.5 text-amber-400" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{m.user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-500 block mb-1">Assigned Role</label>
                    {canManageRoles && roles && roles.length > 0 ? (
                      <select
                        value={m.roleId || m.role?.id}
                        disabled={
                          updatingUserId === m.userId ||
                          updatingUserId === m.user?.id ||
                          (isTargetSuperAdmin && !isCurrentUserSuperAdmin)
                        }
                        onChange={(e) => handleRoleChange(m.user?.id || m.userId, e.target.value)}
                        className={`w-full h-8 px-2 text-[11px] font-semibold rounded-lg bg-slate-950 border focus:outline-none focus:border-indigo-500 ${
                          isTargetSuperAdmin
                            ? 'text-amber-400 border-amber-500/30'
                            : isTargetAdmin
                            ? 'text-indigo-400 border-indigo-500/30'
                            : 'text-slate-300 border-slate-800'
                        }`}
                      >
                        {roles
                          .filter((r) => {
                            // Non-super-admins cannot select Super Admin role
                            if (!isCurrentUserSuperAdmin && (r.name === 'Organization Super Admin' || r.name === 'ORG_SUPER_ADMIN')) {
                              return false;
                            }
                            return true;
                          })
                          .map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                      </select>
                    ) : (
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-md inline-block ${
                          isTargetSuperAdmin
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : isTargetAdmin
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                        }`}
                      >
                        {m.role?.name || 'Member / Student'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 flex items-center gap-1 justify-end pt-1">
                  <Calendar className="h-3 w-3 text-slate-600" />
                  <span>Joined {new Date(m.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
