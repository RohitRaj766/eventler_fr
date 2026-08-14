'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileSpreadsheet, Check, AlertCircle, Users } from 'lucide-react';

interface ParsedMemberRow {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  eventProgram?: string;
  isValidRole: boolean;
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkSubmit?: (rows: ParsedMemberRow[]) => void;
}

const ALLOWED_ROLES = [
  'Organization Super Admin',
  'Organization Admin',
  'Chief Coordinator',
  'Session Coordinator',
  'Volunteer',
  'Member / Student',
  'Member'
];

export function BulkImportModal({ isOpen, onClose, onBulkSubmit }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedMemberRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedCount, setSubmittedCount] = useState<number | null>(null);

  const handleDownloadSample = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'FirstName,LastName,Email,PhoneNumber,Role,EventProgram\n' +
      'Aniket,Sharma,aniket@nsu.ac.in,+919876543210,Session Coordinator,HackHorizon 2026\n' +
      'Priya,Patel,priya@nsu.ac.in,+919876543211,Volunteer,Technika 2026\n' +
      'Rohan,Verma,rohan@nsu.ac.in,+919876543212,Member,All Institution Events\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'eventler_member_roster_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSubmittedCount(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a valid .csv file format');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          setError('CSV file appears to be empty or missing data rows');
          return;
        }

        const rows: ParsedMemberRow[] = [];
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length >= 3) {
            const rawRole = cols[4] || cols[3] || 'Member';
            const normalizedRole = rawRole.toLowerCase();
            const isValid = ALLOWED_ROLES.some((r) => r.toLowerCase() === normalizedRole);

            rows.push({
              firstName: cols[0] || '',
              lastName: cols[1] || '',
              email: cols[2] || '',
              phoneNumber: cols[3] && cols[3].startsWith('+') ? cols[3] : undefined,
              role: rawRole,
              eventProgram: cols[5] || undefined,
              isValidRole: isValid,
            });
          }
        }

        if (rows.length === 0) {
          setError('No valid rows found in CSV');
        } else {
          setParsedRows(rows);
        }
      } catch (err) {
        setError('Failed to parse CSV file');
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleSubmit = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    try {
      if (onBulkSubmit) {
        await onBulkSubmit(parsedRows);
      }
      setSubmittedCount(parsedRows.length);
    } catch (err) {
      setError('Bulk onboarding process failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setError(null);
    setSubmittedCount(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleReset}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center justify-between text-indigo-400">
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" /> Bulk Member CSV Import
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadSample}
              className="h-7 text-xs border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20"
            >
              <Download className="h-3.5 w-3.5 mr-1" /> Template CSV
            </Button>
          </DialogTitle>
        </DialogHeader>

        {submittedCount !== null ? (
          <div className="py-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Bulk Onboarding Completed!</h3>
            <p className="text-xs text-slate-400">
              Successfully processed <span className="font-bold text-emerald-400">{submittedCount}</span> member invitations.
            </p>
            <DialogFooter className="pt-4">
              <Button onClick={handleReset} className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold text-xs">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* File Upload Box */}
            <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center bg-slate-950/60 transition-colors relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-white">
                {file ? file.name : 'Click or Drag & Drop .CSV roster file'}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Supported format: <span className="font-mono text-slate-400">FirstName, LastName, Email, PhoneNumber, Role, EventProgram</span>
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Parsed Preview Table */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-indigo-400" /> Preview Parsed Roster ({parsedRows.length} members)
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Role Status</th>
                        <th className="py-2 px-3">Event Context</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {parsedRows.map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50 text-slate-300">
                          <td className="py-1.5 px-3 font-semibold text-white">
                            {r.firstName} {r.lastName}
                          </td>
                          <td className="py-1.5 px-3 text-slate-400">{r.email}</td>
                          <td className="py-1.5 px-3 font-mono">
                            {r.isValidRole ? (
                              <span className="text-emerald-400 font-bold">✓ {r.role}</span>
                            ) : (
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                ⚠️ Unknown Role ({r.role})
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-3 text-slate-500">
                            {r.eventProgram || 'All Institution Events'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
                type="button"
                disabled={parsedRows.length === 0 || isSubmitting}
                onClick={handleSubmit}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                {isSubmitting ? 'Importing Roster...' : `Import ${parsedRows.length} Members`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
