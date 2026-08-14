'use client';

import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  Lock,
  ShieldAlert,
  Building2,
  Sparkles,
  Plus,
  CheckCircle2,
  Mail,
  MapPin,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

export default function PaymentMethodsPage() {
  const { user, activeOrg } = useAppSelector((state) => state.auth);

  const activeOrgObj = activeOrg || (user?.organizations && user.organizations[0]);
  const userPermissions = user?.permissions || [];

  const currentUserRoleName =
    activeOrgObj?.role ||
    user?.organizations?.find((o: any) => o.id === activeOrgObj?.id)?.role ||
    user?.role ||
    '';

  const isSuperAdmin =
    currentUserRoleName === 'Organization Super Admin' ||
    currentUserRoleName === 'ORG_SUPER_ADMIN' ||
    userPermissions.includes('*') ||
    userPermissions.includes('org.billing');

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
            The <span className="text-slate-200 font-bold">Payment Methods and Billing Contact Hub</span> is restricted exclusively to <span className="text-indigo-400 font-bold">Organization Super Admin (ORG_SUPER_ADMIN)</span> accounts.
          </p>
          <div className="pt-2">
            <Link href="/dashboard">
              <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs h-10 rounded-xl border border-slate-700">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-400" />
            Payment Methods and Billing Contacts
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Manage corporate credit cards, institutional tax IDs, and billing notification contacts for {activeOrgObj?.name || 'your institution'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> ORG_SUPER_ADMIN Exclusive Access
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Saved Payment Methods */}
        <div className="space-y-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-400" /> Primary Payment Methods
            </h3>
            <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Add Card
            </Button>
          </div>

          {/* Visa Card */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-14 bg-indigo-600/20 border border-indigo-500/40 rounded-lg flex items-center justify-center font-black text-indigo-300 text-sm">
                VISA
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  •••• •••• •••• 4242
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold uppercase">
                    PRIMARY
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 font-mono">Expires 08/2028 • Corporate Card</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-white">
              Edit
            </Button>
          </div>

          {/* Backup Bank Transfer */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-14 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center font-bold text-slate-300 text-xs">
                ACH
              </div>
              <div>
                <p className="text-xs font-bold text-white">University Bank Wire Transfer</p>
                <p className="text-[11px] text-slate-400 font-mono">HDFC Bank • Account ending 9012</p>
              </div>
            </div>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400 hover:text-white">
              Manage
            </Button>
          </div>
        </div>

        {/* Institutional Billing Contact Details */}
        <div className="space-y-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-400" /> Institutional Billing Details
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Official Institution Name</span>
              <p className="font-bold text-white text-sm">{activeOrgObj?.name || 'Netaji Subhash University'}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                <Mail className="h-3 w-3 text-indigo-400" /> Billing Email Notifications
              </span>
              <p className="font-mono text-indigo-300 font-semibold">{user?.email || 'finance@nsu.ac.in'}</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                <FileCheck className="h-3 w-3 text-indigo-400" /> Tax Registration / GSTIN
              </span>
              <p className="font-mono text-slate-300">20AAACN9081F1Z8 (Exempt University Entity)</p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                <MapPin className="h-3 w-3 text-indigo-400" /> Registered Billing Address
              </span>
              <p className="text-slate-300 leading-relaxed">
                Pokhariput Campus, Financial Hub District, Jamshedpur, Jharkhand - 831002
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
