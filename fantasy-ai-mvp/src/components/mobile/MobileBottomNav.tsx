'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  Trophy, 
  TrendingUp, 
  Mic, 
  User,
  Brain,
  Users,
  Calendar
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'leagues', label: 'Leagues', icon: Trophy, path: '/leagues' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/ai-analytics' },
  { id: 'voice', label: 'Voice', icon: Mic, path: '/voice-assistant-demo' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' }
];

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('home');
  const [showQuickActions, setShowQuickActions] = useState(false);

  useEffect(() => {
    const currentItem = navItems.find(item => pathname.startsWith(item.path));
    if (currentItem) {
      setActiveTab(currentItem.id);
    }
  }, [pathname]);

  const handleTabPress = (item: NavItem) => {
    if (item.id === activeTab && item.id === 'analytics') {
      // Show quick actions on double tap
      setShowQuickActions(true);
      setTimeout(() => setShowQuickActions(false), 3000);
    } else {
      setActiveTab(item.id);
      router.push(item.path);
    }
  };

  return (
    <>
      {/* Quick Actions Menu */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-20 left-4 right-4 bg-gray-800 rounded-2xl p-4 shadow-2xl z-40"
          >
            <div className="grid grid-cols-3 gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2 p-3 bg-gray-700 rounded-xl"
                onClick={() => router.push('/ml-dashboard')}
              >
                <Brain className="w-6 h-6 text-blue-400" />
                <span className="text-xs text-gray-300">ML Models</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2 p-3 bg-gray-700 rounded-xl"
                onClick={() => router.push('/data-pipeline')}
              >
                <Calendar className="w-6 h-6 text-green-400" />
                <span className="text-xs text-gray-300">Schedule</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2 p-3 bg-gray-700 rounded-xl"
                onClick={() => router.push('/leagues')}
              >
                <Users className="w-6 h-6 text-purple-400" />
                <span className="text-xs text-gray-300">My Teams</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleTabPress(item)}
                className="relative flex flex-col items-center justify-center w-full h-full"
              >
                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-500 rounded-full"
                  />
                )}

                {/* Icon Container */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="relative"
                >
                  <Icon 
                    className={`w-6 h-6 ${
                      isActive ? 'text-blue-500' : 'text-gray-500'
                    }`}
                  />
                  
                  {/* Badge */}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </motion.div>

                {/* Label */}
                <span className={`text-xs mt-1 ${
                  isActive ? 'text-blue-500 font-medium' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* iPhone Home Indicator Safe Area */}
        <div className="h-safe-area-inset-bottom bg-gray-900" />
      </div>
    </>
  );
}