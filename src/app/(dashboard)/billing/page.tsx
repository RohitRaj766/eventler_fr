'use client';

import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Building2,
  Sparkles,
  ShieldAlert,
  Calendar,
  Zap,
  HardDrive,
  Users,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function BillingPage() {
  const { user, activeOrg } = useAppSelector((state) => state.auth);

  const activeOrgObj = activeOrg || (user?.organizations && user.organizations[0]);
  const userPermissions = user?.permissions || [];

  const currentUserRoleName =
    activeOrgObj?.role ||
    user?.organizations?.find((o: any) => o.id === activeOrgObj?.id)?.role ||
    user?.role ||
    '';

  // STRICT ACCESS GUARD: ONLY ORG_SUPER_ADMIN can access billing
  const isSuperAdmin =
    currentUserRoleName === 'Organization Super Admin' ||
    currentUserRoleName === 'ORG_SUPER_ADMIN' ||
    userPermissions.includes('*') ||
    userPermissions.includes('org.billing');

  // Render 403 Forbidden Screen if NOT Organization Super Admin
  if (!isSuperAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="h-16 w-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
              403 Access Denied
            </h2>
            <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
              Restricted to Organization Super Admin
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            The <span className="text-slate-200 font-bold">Billing & Subscription Governance Hub</span> is strictly restricted exclusively to the <span className="text-indigo-400 font-bold">Organization Super Admin (ORG_SUPER_ADMIN)</span> tier. Regular administrators, coordinators, and students cannot view financial records or manage subscription plans.
          </p>

          <div className="pt-2">
            <Link href="/dashboard">
              <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs h-10 rounded-xl border border-slate-700">
                Return to Dashboard Overview
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Super Admin Billing Hub View
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-400" />
            Billing and Enterprise Subscription Governance
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Manage subscription plans, system usage quotas, invoices, and billing contacts for {activeOrgObj?.name || 'your institution'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> ORG_SUPER_ADMIN Exclusive Access
          </span>
        </div>
      </div>

      {/* Active Plan Banner */}
      <div className="p-6 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-extrabold uppercase tracking-wider">
                Active Plan
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-slate-500" /> Code: <span className="text-white font-bold">{activeOrgObj?.code || 'NSU-2026'}</span>
              </span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              Enterprise Institutional Tier
            </h3>
            <p className="text-xs text-slate-300">
              Includes unlimited event nodes, live timeline propagation, multi-stage control rooms, and dedicated SLA.
            </p>
          </div>

          <div className="text-left md:text-right space-y-1 shrink-0">
            <p className="text-2xl font-black text-emerald-400">$4,999.00 <span className="text-xs font-normal text-slate-400">/ year</span></p>
            <p className="text-[11px] text-slate-400 flex items-center md:justify-end gap-1">
              <Calendar className="h-3.5 w-3.5 text-indigo-400" /> Auto-renews on <span className="text-white font-semibold">Dec 31, 2026</span>
            </p>
          </div>
        </div>

        {/* Quotas & Usage Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-indigo-500/20">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-indigo-400" /> Managed Events</span>
              <span className="text-emerald-400 font-bold">Unlimited</span>
            </div>
            <p className="text-base font-bold text-white">1,420 Nodes</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full w-[35%]" />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-indigo-400" /> Active Coordinators</span>
              <span className="text-indigo-400 font-bold">48 / 100 Seats</span>
            </div>
            <p className="text-base font-bold text-white">48 Active</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full w-[48%]" />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><HardDrive className="h-3.5 w-3.5 text-indigo-400" /> Storage Capacity</span>
              <span className="text-indigo-400 font-bold">14.2 GB / 500 GB</span>
            </div>
            <p className="text-base font-bold text-white">2.8% Used</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[3%]" />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Live Engine SLA</span>
              <span className="text-emerald-400 font-bold">99.99% Guaranteed</span>
            </div>
            <p className="text-base font-bold text-white">100 Gbps Dedicated</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-[100%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Tier Selection */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" /> Available Subscription Plans
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pro Tier */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-colors">
            <div className="space-y-1">
              <h4 className="font-bold text-white text-base">Pro Department</h4>
              <p className="text-xs text-slate-400">For single departmental fests and small colleges.</p>
            </div>
            <p className="text-2xl font-black text-white">$199 <span className="text-xs font-normal text-slate-400">/ month</span></p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> Up to 10 Active Event Programs</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> Up to 15 Coordinators</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> 50 GB Cloud Media Storage</li>
            </ul>
            <Button variant="outline" className="w-full border-slate-700 bg-slate-950 text-white hover:bg-slate-800 text-xs font-bold">
              Downgrade to Pro
            </Button>
          </div>

          {/* Institutional Tier */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 hover:border-slate-700 transition-colors">
            <div className="space-y-1">
              <h4 className="font-bold text-white text-base">Institutional Standard</h4>
              <p className="text-xs text-slate-400">For medium universities & multi-campus institutes.</p>
            </div>
            <p className="text-2xl font-black text-white">$499 <span className="text-xs font-normal text-slate-400">/ month</span></p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> Up to 50 Active Event Programs</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> Up to 50 Coordinators</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" /> 200 GB Cloud Media Storage</li>
            </ul>
            <Button variant="outline" className="w-full border-slate-700 bg-slate-950 text-white hover:bg-slate-800 text-xs font-bold">
              Switch to Institutional
            </Button>
          </div>

          {/* Enterprise Tier (Active) */}
          <div className="p-5 bg-gradient-to-b from-indigo-950/40 to-slate-900 border-2 border-indigo-500/50 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-extrabold uppercase">
              Current Active
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-base">Enterprise Custom</h4>
              <p className="text-xs text-slate-300">For full university ecosystems with unlimited events.</p>
            </div>
            <p className="text-2xl font-black text-indigo-400">$4,999 <span className="text-xs font-normal text-slate-400">/ year</span></p>
            <ul className="space-y-2 text-xs text-slate-200">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Unlimited Event Nodes & Trees</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 100+ Coordinator Seats</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 500 GB Storage & Dedicated SLA</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Custom University Branding & Domain</li>
            </ul>
            <Button disabled className="w-full bg-indigo-600 text-white font-bold text-xs opacity-90 cursor-default">
              Current Active Plan
            </Button>
          </div>
        </div>
      </div>

      {/* Invoice & Payment History */}
      <div className="space-y-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-400" /> Invoices and Billing History
          </h3>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold">
              <tr>
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4">Billing Date</th>
                <th className="py-3 px-4">Plan Description</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-900/40 text-slate-300">
                <td className="py-3 px-4 font-mono font-bold text-indigo-400">INV-2026-0891</td>
                <td className="py-3 px-4 text-slate-400">Jan 01, 2026</td>
                <td className="py-3 px-4 font-medium text-white">Enterprise Annual License (Netaji Subhash Univ)</td>
                <td className="py-3 px-4 font-bold text-white">$4,999.00</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                    PAID
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                    <Download className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                </td>
              </tr>

              <tr className="hover:bg-slate-900/40 text-slate-300">
                <td className="py-3 px-4 font-mono font-bold text-indigo-400">INV-2025-0102</td>
                <td className="py-3 px-4 text-slate-400">Jan 01, 2025</td>
                <td className="py-3 px-4 font-medium text-white">Enterprise Annual License (Netaji Subhash Univ)</td>
                <td className="py-3 px-4 font-bold text-white">$4,999.00</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                    PAID
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                    <Download className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
