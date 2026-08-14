import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shadcn UI Kit - Eventler Dashboard',
  description: 'Scalable Live Event Orchestration and Schedule Propagation Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50/50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
