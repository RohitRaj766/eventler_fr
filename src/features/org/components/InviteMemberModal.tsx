'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Shield, Copy, Check, Send, Calendar } from 'lucide-react';
import { Role } from '@/types';
import { organizationService } from '@/services/api';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgCode: string;
  roles: Role[];
  programs?: any[];
  onInviteSent?: (email: string, roleId: string) => void;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  orgCode,
  roles,
  programs = [],
  onInviteSent,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [invitedLink, setInvitedLink] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);

    try {
      const targetRoleId = selectedRoleId || roles[0]?.id;
      const res = await organizationService.createInvitation({
        email,
        roleId: targetRoleId,
        programId: selectedProgramId || undefined,
      });

      if (res?.isExistingUser) {
        setIsExistingUser(true);
        setInvitedLink('USER_LINKED');
      } else {
        setIsExistingUser(false);
        const progQuery = selectedProgramId ? `&programId=${selectedProgramId}` : '';
        const link = `${window.location.origin}/register?code=${orgCode}&email=${encodeURIComponent(email)}${progQuery}`;
        setInvitedLink(link);
      }

      if (onInviteSent) {
        onInviteSent(email, targetRoleId);
      }
    } catch (err) {
      console.error('Failed to create invitation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (invitedLink) {
      navigator.clipboard.writeText(invitedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setEmail('');
    setInvitedLink(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleReset}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-indigo-400">
            <Mail className="h-4 w-4" /> Direct Member Email Invitation
          </DialogTitle>
        </DialogHeader>

        {invitedLink ? (
          <div className="space-y-4 py-2">
            {isExistingUser ? (
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs space-y-1.5">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400" /> Existing Account Linked Instantly!
                </p>
                <p>
                  <span className="font-bold text-indigo-400">{email}</span> already has an account. They have been directly assigned to the event roster in the database!
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs">
                  ✓ Invitation link created for <span className="font-bold">{email}</span>!
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Personalized Invitation Link</label>
                  <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <input
                      type="text"
                      readOnly
                      value={invitedLink}
                      className="bg-transparent text-xs text-indigo-300 font-mono flex-1 focus:outline-none truncate"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCopyLink}
                      className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Share this link with {email}. When they open it, the institution code will be automatically populated!
                </p>
              </>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                onClick={() => {
                  setInvitedLink(null);
                  setEmail('');
                }}
                variant="outline"
                className="border-slate-700 bg-slate-800 text-white text-xs hover:bg-slate-700"
              >
                Invite Another
              </Button>
              <Button
                type="button"
                onClick={handleReset}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-indigo-400" /> Member Email Address
              </label>
              <Input
                type="email"
                required
                placeholder="e.g. coordinator@nsu.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-400" /> Target Event Program (Optional)
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">All Institution Events (General Member)</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-indigo-400" /> Assign Role
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Role (Default: Member / Student)</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-semibold text-indigo-400">Institution Invite Code: {orgCode}</p>
              <p>Generates an instant invitation link mapped to your university organization context.</p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-slate-700 bg-slate-800 text-white text-xs hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" /> Generate Invitation
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
