'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { RealtimeUpdates } from '@/components/dashboard/RealtimeUpdates';
import {
  LayoutDashboard,
  LineChart,
  Users,
  TrendingUp,
  Trophy,
  Zap,
  Brain,
  Settings
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
  { name: 'Analytics', href: '/dashboard/analytics', icon: LineChart },
  { name: 'Lineup Builder', href: '/dashboard/lineup-builder', icon: Users },
  { name: 'Trade Simulator', href: '/dashboard/trade-simulator', icon: TrendingUp },
  { name: 'Trophy Room', href: '/dashboard/trophy-room', icon: Trophy },
  { name: 'AI Insights', href: '/dashboard/ai-insights', icon: Brain },
  { name: 'Dominator Suite', href: '/dashboard/dominator', icon: Zap },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-gray-900 border-r border-gray-800">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Fantasy.AI
            </h1>
          </div>
          <nav className="flex-1 px-2 mt-8 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors'
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300',
                      'mr-3 flex-shrink-0 h-5 w-5'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-950">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Real-time Updates Component */}
      <RealtimeUpdates />

      {/* Mobile bottom navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigation.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300',
                  'flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs'
                )}
              >
                <item.icon className="h-5 w-5 mb-1" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}