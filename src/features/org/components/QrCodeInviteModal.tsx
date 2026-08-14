'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, QrCode, Copy, Check, Printer, Share2, Building2, Shield } from 'lucide-react';
import { Role } from '@/types';

interface QrCodeInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgCode: string;
  orgName?: string;
  programs?: any[];
  roles?: Role[];
}

export function QrCodeInviteModal({ isOpen, onClose, orgCode, orgName, programs = [], roles = [] }: QrCodeInviteModalProps) {
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/register?code=${orgCode}`
    : `http://localhost:3000/register?code=${orgCode}`;

  let inviteUrl = baseUrl;
  if (selectedRoleId) inviteUrl += `&roleId=${selectedRoleId}`;
  if (selectedProgramId) inviteUrl += `&programId=${selectedProgramId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md print:bg-white print:text-black">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-indigo-400">
            <QrCode className="h-4 w-4" /> Share Join Link & QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-center">
          {/* Institution Header Card */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-center gap-2 text-white font-bold text-sm">
              <Building2 className="h-4 w-4 text-indigo-400" />
              <span>{orgName || 'Institution Roster Onboarding'}</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Invite Code: <span className="text-indigo-400 font-bold">{orgCode}</span></p>
          </div>

          {/* Optional Event Program Selector */}
          {programs.length > 0 && (
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-indigo-400" /> Event Program Context
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Institution Events (General Member)</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Strict Assigned Role Selector */}
          {roles.length > 0 && (
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                <Shield className="h-3 w-3 text-indigo-400" /> Strict Assigned Role
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-semibold text-indigo-300"
              >
                <option value="">Default Baseline Role (Member / Student)</option>
                {roles
                  .filter((r) => r.name !== 'Organization Super Admin' && r.name !== 'ORG_SUPER_ADMIN')
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* 100% Scannable Dynamic QR Code Container */}
          <div className="p-5 bg-white rounded-2xl border-2 border-indigo-500/40 max-w-[240px] mx-auto shadow-2xl space-y-2.5">
            <div className="bg-white p-2 rounded-xl flex items-center justify-center border border-slate-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(inviteUrl)}`}
                alt="Scannable University Join QR Code"
                className="h-44 w-44 object-contain rounded-md"
              />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900 block">
              Scan to Join {orgCode}
            </span>
          </div>

          {/* Shareable Link Input */}
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold uppercase text-slate-400 block">Shareable Registration Link</label>
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="bg-transparent text-xs text-indigo-300 font-mono flex-1 focus:outline-none truncate"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCopyLink}
                className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </Button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Students and faculty can scan this QR code or click the link to auto-register into {orgName || 'your institution'}.
          </p>

          <DialogFooter className="pt-2 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrint}
              className="border-slate-700 bg-slate-800 text-white text-xs hover:bg-slate-700 flex items-center gap-1.5 flex-1"
            >
              <Printer className="h-3.5 w-3.5" /> Print QR Flyer
            </Button>
            <Button
              type="button"
              onClick={onClose}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex-1"
            >
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
