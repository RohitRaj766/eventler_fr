'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchMyOrganizations } from '@/features/org/orgSlice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Download,
  ChevronRight,
  Download as ExportIcon,
  FolderTree,
  Radio,
  CheckSquare,
  Building2,
} from 'lucide-react';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchMyOrganizations());
  }, [dispatch]);

  const userName = user?.firstName || 'Alex';

  return (
    <div className="space-y-6 pb-8">
      {/* Top Header Row: Page Title + Date Picker + Download Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Event Coordination Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Live Event Orchestration & Dynamic Topological Impact Engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Picker Pill */}
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors">
            <CalendarIcon className="h-3.5 w-3.5 text-slate-500" />
            <span>18 Jul 2026 - 14 Aug 2026</span>
          </button>

          {/* Download Action Button */}
          <Button size="sm" className="h-9 font-bold bg-black text-white hover:bg-slate-800 rounded-lg shadow-sm">
            <Download className="mr-2 h-3.5 w-3.5" />
            Export Schedule
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid Row (4 Columns - Matching Screenshot 1:1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Hero Greeting Banner */}
        <Card className="lg:col-span-1 border border-slate-200/80 bg-white shadow-xs rounded-2xl flex flex-col justify-between p-5 relative overflow-hidden">
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              Welcome back {userName}! 🎉
            </h3>
            <p className="text-xs text-slate-500 font-medium">Chief Coordinator of the Month</p>

            <div className="pt-3">
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                98.4% On-Time
              </div>
              <span className="text-[11px] font-bold text-emerald-600">
                +65% <span className="font-medium text-slate-400">from last month</span>
              </span>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Link href="/programs/root">
              <Button variant="outline" size="sm" className="text-xs font-semibold rounded-lg h-8 border-slate-200">
                Tree Builder
              </Button>
            </Link>
          </div>
        </Card>

        {/* Card 2: Active Program Nodes */}
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Program Nodes</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                +6.1%
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
              34.1K Nodes
            </div>
          </div>
          <Link href="/programs/root" className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium hover:text-slate-900">
            <span>View tree</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Card>

        {/* Card 3: Active Coordinators */}
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Coordinators</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                +19.2%
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
              500.1K Users
            </div>
          </div>
          <Link href="/roles" className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium hover:text-slate-900">
            <span>View members</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Card>

        {/* Card 4: Avg Schedule Lag */}
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Avg Schedule Lag</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center">
                -1.2%
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
              2.1 min lag
            </div>
          </div>
          <Link href="/live-engine" className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium hover:text-slate-900">
            <span>View propagation</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>

      {/* Quick Access Event Domain Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/programs/root" className="block">
          <Card className="p-4 border border-slate-200/80 hover:border-slate-400 transition-all rounded-xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">Program Tree Builder</h4>
              <p className="text-[11px] text-slate-500">Arbitrary depth tree model</p>
            </div>
          </Card>
        </Link>

        <Link href="/live-engine" className="block">
          <Card className="p-4 border border-slate-200/80 hover:border-slate-400 transition-all rounded-xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">Live Engine Control</h4>
              <p className="text-[11px] text-slate-500">Log actual timestamps</p>
            </div>
          </Card>
        </Link>

        <Link href="/tasks" className="block">
          <Card className="p-4 border border-slate-200/80 hover:border-slate-400 transition-all rounded-xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">Task Readiness</h4>
              <p className="text-[11px] text-slate-500">Kanban readiness board</p>
            </div>
          </Card>
        </Link>

        <Link href="/venues" className="block">
          <Card className="p-4 border border-slate-200/80 hover:border-slate-400 transition-all rounded-xl flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-slate-900">Venues & Equipment</h4>
              <p className="text-[11px] text-slate-500">Resource inventory</p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Analytics Charts & Details Row (2 Columns Grid - Matching Screenshot 1:1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Card: Total Execution Volume */}
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Total Node Execution Volume</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Node completions in the last 28 days</p>
            </div>
            <div className="flex items-center gap-3 border rounded-xl px-3 py-1.5 text-xs bg-slate-50 font-semibold text-slate-700">
              <span>PLANNED <strong className="text-slate-900 font-bold ml-1">24,828</strong></span>
              <span className="text-slate-300">|</span>
              <span>ACTUAL <strong className="text-slate-900 font-bold ml-1">25,010</strong></span>
            </div>
          </div>

          {/* Bar Chart Visual Component */}
          <div className="mt-8 pt-4 pb-2">
            <div className="flex items-end justify-between h-48 px-4 gap-3 border-b border-slate-200/60 pb-2">
              <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                <div className="flex items-end gap-1 w-full justify-center">
                  <div className="w-5 bg-black rounded-t-sm h-28" />
                  <div className="w-5 bg-slate-600 rounded-t-sm h-36" />
                </div>
                <span className="text-[11px] font-medium text-slate-500">January</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                <div className="flex items-end gap-1 w-full justify-center">
                  <div className="w-5 bg-black rounded-t-sm h-40" />
                  <div className="w-5 bg-slate-600 rounded-t-sm h-32" />
                </div>
                <span className="text-[11px] font-medium text-slate-500">February</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                <div className="flex items-end gap-1 w-full justify-center">
                  <div className="w-5 bg-black rounded-t-sm h-44" />
                  <div className="w-5 bg-slate-600 rounded-t-sm h-20" />
                </div>
                <span className="text-[11px] font-medium text-slate-500">March</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                <div className="flex items-end gap-1 w-full justify-center">
                  <div className="w-5 bg-black rounded-t-sm h-24" />
                  <div className="w-5 bg-slate-600 rounded-t-sm h-36" />
                </div>
                <span className="text-[11px] font-medium text-slate-500">April</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                <div className="flex items-end gap-1 w-full justify-center">
                  <div className="w-5 bg-black rounded-t-sm h-20" />
                  <div className="w-5 bg-slate-600 rounded-t-sm h-28" />
                </div>
                <span className="text-[11px] font-medium text-slate-500">May</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                <div className="flex items-end gap-1 w-full justify-center">
                  <div className="w-5 bg-black rounded-t-sm h-48" />
                  <div className="w-5 bg-slate-600 rounded-t-sm h-36" />
                </div>
                <span className="text-[11px] font-medium text-slate-500">June</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Right Card: Topological Propagation Speed */}
        <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-500">Topological Propagation Speed</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">42.3 ms</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  +2.5% faster
                </span>
              </div>
            </div>

            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold border-slate-200">
              <ExportIcon className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Export Logs
            </Button>
          </div>

          {/* Line Chart Visual Component */}
          <div className="mt-8 pt-4">
            <svg viewBox="0 0 500 160" className="w-full h-44 overflow-visible">
              <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeWidth="1" />

              <path
                d="M 10 120 Q 70 100 130 115 T 250 120 T 370 110 T 490 80"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2.5"
              />
              <path
                d="M 10 110 Q 70 80 130 50 T 250 30 T 370 70 T 490 10"
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
              />
            </svg>

            <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mt-2 px-1">
              <span>February</span>
              <span>March</span>
              <span>April</span>
              <span>May</span>
              <span>June</span>
              <span>July</span>
              <span>August</span>
              <span>October</span>
              <span>December</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
