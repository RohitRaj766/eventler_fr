'use client';

import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Lock,
  Download,
  ShieldAlert,
  Search,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function InvoicesPage() {
  const { user, activeOrg } = useAppSelector((state) => state.auth);
  const [searchQuery, setSearchQuery] = useState('');

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
            The <span className="text-slate-200 font-bold">Invoices and Financial Receipts Hub</span> is restricted exclusively to <span className="text-indigo-400 font-bold">Organization Super Admin (ORG_SUPER_ADMIN)</span> accounts.
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

  const invoices = [
    {
      id: 'INV-2026-0891',
      date: 'Jan 01, 2026',
      dueDate: 'Jan 15, 2026',
      description: 'Enterprise Annual License (Unlimited Events & 100 Coordinator Seats)',
      amount: '$4,999.00',
      status: 'PAID',
      method: 'Visa ending in 4242',
    },
    {
      id: 'INV-2025-0102',
      date: 'Jan 01, 2025',
      dueDate: 'Jan 15, 2025',
      description: 'Enterprise Annual License (Netaji Subhash University)',
      amount: '$4,999.00',
      status: 'PAID',
      method: 'Visa ending in 4242',
    },
    {
      id: 'INV-2024-0012',
      date: 'Dec 15, 2024',
      dueDate: 'Dec 30, 2024',
      description: 'Pro Institutional Migration & Custom Domain Setup',
      amount: '$1,250.00',
      status: 'PAID',
      method: 'Bank Wire Transfer',
    },
  ];

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            Invoices and Tax Receipts
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            View historical invoices, tax statements, and download official PDF payment receipts for {activeOrgObj?.name || 'your institution'}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> ORG_SUPER_ADMIN Exclusive Access
          </span>
        </div>
      </div>

      {/* Invoice Search & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Invoice ID or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <p className="text-xs text-slate-400 font-mono">
          Showing <span className="text-white font-bold">{filteredInvoices.length}</span> Invoices
        </p>
      </div>

      {/* Invoices Table */}
      <div className="space-y-3 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold">
              <tr>
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-900/40 text-slate-300">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{inv.id}</td>
                  <td className="py-3.5 px-4 text-slate-400">{inv.date}</td>
                  <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">{inv.description}</td>
                  <td className="py-3.5 px-4 text-slate-400 flex items-center gap-1.5 pt-4">
                    <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{inv.method}</span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">{inv.amount}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => alert(`Downloading official PDF for invoice ${inv.id}`)}
                      className="h-7 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> PDF Receipt
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
