import fs from 'fs';
import path from 'path';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Created file:', filePath);
}

// ----------------------------------------------------
// 1. SCAFFOLD EVENTLER_PUBLIC (Public Attendee & Guest Judge App)
// ----------------------------------------------------
const publicRoot = 'E:/own/MVP/eventler_public';

const publicPackageJson = `{
  "name": "eventler_public",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001"
  },
  "dependencies": {
    "axios": "^1.7.9",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "next": "15.1.7",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "socket.io-client": "^4.8.1",
    "tailwind-merge": "^3.0.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}`;

const publicTsConfig = `{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`;

const publicNextConfig = `import type { NextConfig } from "next";
const nextConfig: NextConfig = {};
export default nextConfig;`;

const publicPostCss = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;

const publicTailwind = `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;`;

const publicGlobalsCss = `@import "tailwindcss";

:root {
  --background: #0f172a;
  --foreground: #f8fafc;
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: Arial, Helvetica, sans-serif;
}`;

const publicLayout = `'use client';

import React from 'react';
import './globals.css';
import Link from 'next/link';
import { Sparkles, Calendar, Award, MapPin } from 'lucide-react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">Eventler <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Live App</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/judge" className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors">
              Judge Scorecards
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-3xl mx-auto w-full p-4">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="sticky bottom-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-6 py-2 flex items-center justify-around">
          <Link href="/" className="flex flex-col items-center gap-1 text-indigo-400">
            <Calendar className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Live Agendas</span>
          </Link>
          <Link href="/judge" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
            <Award className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Judge Portal</span>
          </Link>
          <a href="#" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200">
            <MapPin className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Hall Map</span>
          </a>
        </nav>
      </body>
    </html>
  );
}`;

const publicHomePage = `'use client';

import React, { useState, useEffect } from 'react';
import { Radio, Clock, MapPin, Search, ChevronRight, Bell } from 'lucide-react';

interface TimelineItem {
  id: string;
  title: string;
  category: string;
  hall: string;
  time: string;
  status: 'LIVE' | 'UPCOMING' | 'DELAYED' | 'COMPLETED';
  delayReason?: string;
  speaker: string;
}

export default function AttendeeHomePage() {
  const [search, setSearch] = useState('');
  const [liveEvents, setLiveEvents] = useState<TimelineItem[]>([
    {
      id: '1',
      title: 'Keynote & AI Robotics Symposium 2026',
      category: 'Keynote Session',
      hall: 'Auditorium Hall A (Ground Floor)',
      time: '10:00 AM - 11:30 AM',
      status: 'LIVE',
      speaker: 'Dr. Sarah Vance (Stanford AI Lab)',
    },
    {
      id: '2',
      title: 'Annual Hackathon Final Round Evaluation',
      category: 'Competition',
      hall: 'Lab Block 3rd Floor (Room 304)',
      time: '11:45 AM - 01:15 PM',
      status: 'DELAYED',
      delayReason: 'Delayed by 15 mins due to VIP keynote Q&A overrun',
      speaker: 'Jury Panel B',
    },
    {
      id: '3',
      title: 'Cultural Night & Band Performances',
      category: 'Ceremony',
      hall: 'University Open Air Theatre',
      time: '04:00 PM - 08:00 PM',
      status: 'UPCOMING',
      speaker: 'AJU Music Club & Guests',
    },
  ]);

  return (
    <div className="space-y-5 pb-8">
      {/* Live Engine Real-Time Delay Broadcast Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 via-indigo-500/10 to-transparent border border-amber-500/30 p-4 relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Live Schedule Propagation Notice</span>
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Lab Block 3rd Floor Hackathon is delayed by <strong>+15 mins</strong>. Downstream lunch break shifted to 01:30 PM.
            </p>
          </div>
        </div>
      </div>

      {/* Hero Header & Search Bar */}
      <div className="space-y-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">AJU University TechFest 2026</h1>
          <p className="text-xs text-slate-400 font-medium">Live hall session schedule & stage timeline updates</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search session, hall room, or speaker..."
            className="w-full h-10 pl-10 pr-4 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Live Session Cards Feed */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hall Agendas & Stage Timeline</h2>

        {liveEvents
          .filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.hall.toLowerCase().includes(search.toLowerCase()))
          .map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition-colors shadow-lg"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                  {item.category}
                </span>

                {item.status === 'LIVE' && (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE NOW
                  </span>
                )}

                {item.status === 'DELAYED' && (
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                    TIMELINE SHIFTED
                  </span>
                )}

                {item.status === 'UPCOMING' && (
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
                    UPCOMING
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-sm text-white leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Speaker: {item.speaker}</p>
              </div>

              {item.delayReason && (
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] font-medium text-amber-300">
                  ⚠️ {item.delayReason}
                </div>
              )}

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{item.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="truncate max-w-[150px]">{item.hall}</span>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}`;

const publicJudgePage = `'use client';

import React, { useState } from 'react';
import { Award, CheckCircle, Star } from 'lucide-react';

export default function JudgePortalPage() {
  const [selectedTeam, setSelectedTeam] = useState('Team Alpha (Robotics track)');
  const [scores, setScores] = useState({
    innovation: 9,
    execution: 8,
    presentation: 9,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <Award className="h-4 w-4" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Guest Judge Scorecard Portal</h1>
        </div>
        <p className="text-xs text-slate-400 font-medium">Evaluate competition teams & submit round scores in real time</p>
      </div>

      {submitted ? (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-6 text-center space-y-3">
          <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">Scorecard Submitted!</h3>
          <p className="text-xs text-slate-300">Your evaluation for {selectedTeam} has been recorded and synced to the jury tally board.</p>
          <button onClick={() => setSubmitted(false)} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">
            Evaluate Next Team
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Select Competition Team</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            >
              <option>Team Alpha (Robotics Track)</option>
              <option>Team Beta (AI CodeSprint)</option>
              <option>Team Gamma (IoT Hardware)</option>
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Technical Innovation (1-10)</span>
                <span className="text-indigo-400 font-bold">{scores.innovation}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={scores.innovation}
                onChange={(e) => setScores({ ...scores, innovation: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Code Execution & Quality (1-10)</span>
                <span className="text-indigo-400 font-bold">{scores.execution}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={scores.execution}
                onChange={(e) => setScores({ ...scores, execution: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Stage Presentation (1-10)</span>
                <span className="text-indigo-400 font-bold">{scores.presentation}/10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={scores.presentation}
                onChange={(e) => setScores({ ...scores, presentation: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-indigo-500/20"
          >
            Submit Scorecard
          </button>
        </form>
      )}
    </div>
  );
}`;

writeFile(path.join(publicRoot, 'package.json'), publicPackageJson);
writeFile(path.join(publicRoot, 'tsconfig.json'), publicTsConfig);
writeFile(path.join(publicRoot, 'next.config.ts'), publicNextConfig);
writeFile(path.join(publicRoot, 'postcss.config.mjs'), publicPostCss);
writeFile(path.join(publicRoot, 'tailwind.config.ts'), publicTailwind);
writeFile(path.join(publicRoot, 'src/app/globals.css'), publicGlobalsCss);
writeFile(path.join(publicRoot, 'src/app/layout.tsx'), publicLayout);
writeFile(path.join(publicRoot, 'src/app/page.tsx'), publicHomePage);
writeFile(path.join(publicRoot, 'src/app/judge/page.tsx'), publicJudgePage);

// ----------------------------------------------------
// 2. SCAFFOLD EVENTLER_ADMIN (Platform Owner Super Admin Portal)
// ----------------------------------------------------
const adminRoot = 'E:/own/MVP/eventler_admin';

const adminPackageJson = `{
  "name": "eventler_admin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3002",
    "build": "next build",
    "start": "next start -p 3002"
  },
  "dependencies": {
    "axios": "^1.7.9",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "next": "15.1.7",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.1"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}`;

const adminTsConfig = publicTsConfig;
const adminNextConfig = publicNextConfig;
const adminPostCss = publicPostCss;
const adminTailwind = publicTailwind;
const adminGlobalsCss = publicGlobalsCss;

const adminLayout = `'use client';

import React from 'react';
import './globals.css';
import Link from 'next/link';
import { ShieldCheck, Building, CreditCard, Activity } from 'lucide-react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex font-sans">
        {/* Admin Executive Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-6 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 px-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-bold text-sm text-white">Eventler Admin</h1>
                <p className="text-[10px] text-indigo-400 font-semibold uppercase">Platform Owner</p>
              </div>
            </div>

            <nav className="space-y-1">
              <Link href="/" className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-white">
                <Building className="h-4 w-4 text-indigo-400" />
                <span>Client Universities</span>
              </Link>
              <a href="#" className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white rounded-lg">
                <CreditCard className="h-4 w-4 text-slate-400" />
                <span>Subscriptions & Billing</span>
              </a>
              <a href="#" className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white rounded-lg">
                <Activity className="h-4 w-4 text-slate-400" />
                <span>Socket & System Health</span>
              </a>
            </nav>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <p className="text-xs font-bold text-white">Core SaaS Control</p>
            <p className="text-[10px] text-slate-400">Owner: Rohit Raj (Super Admin)</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}`;

const adminHomePage = `'use client';

import React from 'react';
import { Building, ShieldCheck, Activity, Users, Plus, CheckCircle } from 'lucide-react';

export default function PlatformOwnerAdminPage() {
  const clients = [
    { id: '1', name: 'Arka Jain University', code: 'AJU-2026', plan: 'Enterprise Unlimited', status: 'ACTIVE', users: 1250, programs: 14 },
    { id: '2', name: 'Stanford Engineering Lab', code: 'STANFORD-ENG', plan: 'Pro Multi-Campus', status: 'ACTIVE', users: 3400, programs: 28 },
    { id: '3', name: 'IIT Bombay Techfest', code: 'IITB-TECH26', plan: 'Enterprise Unlimited', status: 'ACTIVE', users: 8900, programs: 42 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Owner Dashboard</h1>
          <p className="text-xs text-slate-400 font-medium">Manage registered client universities, SaaS tier subscriptions & global metrics</p>
        </div>

        <button className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/20">
          <Plus className="h-4 w-4" /> Onboard Client University
        </button>
      </div>

      {/* Global SaaS Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total Client Universities</span>
          <div className="text-2xl font-extrabold text-white">48 Client Orgs</div>
          <span className="text-[11px] text-emerald-400 font-semibold">+4 this month</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Active Platform Users</span>
          <div className="text-2xl font-extrabold text-white">52,410 Users</div>
          <span className="text-[11px] text-emerald-400 font-semibold">+18.5% growth</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Live Programs Executed</span>
          <div className="text-2xl font-extrabold text-white">384 Event Trees</div>
          <span className="text-[11px] text-indigo-400 font-semibold">99.9% Uptime</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Monthly SaaS MRR</span>
          <div className="text-2xl font-extrabold text-white">$24,800 / mo</div>
          <span className="text-[11px] text-emerald-400 font-semibold">+12% MRR</span>
        </div>
      </div>

      {/* Client University Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building className="h-5 w-5 text-indigo-400" />
            Registered University Clients
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-3 px-2">Institution Name</th>
                <th className="py-3 px-2">Unique Code</th>
                <th className="py-3 px-2">Subscription Plan</th>
                <th className="py-3 px-2">Active Users</th>
                <th className="py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-2 font-bold text-white">{c.name}</td>
                  <td className="py-3 px-2 font-mono font-bold text-indigo-400">{c.code}</td>
                  <td className="py-3 px-2 text-slate-300 font-medium">{c.plan}</td>
                  <td className="py-3 px-2 text-slate-300">{c.users.toLocaleString()}</td>
                  <td className="py-3 px-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}`;

writeFile(path.join(adminRoot, 'package.json'), adminPackageJson);
writeFile(path.join(adminRoot, 'tsconfig.json'), adminTsConfig);
writeFile(path.join(adminRoot, 'next.config.ts'), adminNextConfig);
writeFile(path.join(adminRoot, 'postcss.config.mjs'), adminPostCss);
writeFile(path.join(adminRoot, 'tailwind.config.ts'), adminTailwind);
writeFile(path.join(adminRoot, 'src/app/globals.css'), adminGlobalsCss);
writeFile(path.join(adminRoot, 'src/app/layout.tsx'), adminLayout);
writeFile(path.join(adminRoot, 'src/app/page.tsx'), adminHomePage);

console.log('--- ALL 3 FRONTEND PROJECTS SUCCESSFULLY SCAFFOLDED ---');
