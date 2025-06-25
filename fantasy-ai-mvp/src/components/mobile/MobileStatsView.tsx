'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Trophy,
  Target,
  Activity,
  ChevronRight
} from 'lucide-react';
import { Player } from '@/types';

interface MobileStatsViewProps {
  player: Player;
  onClose?: () => void;
}

interface StatCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  stats: { label: string; value: string | number; trend?: number }[];
}

export function MobileStatsView({ player, onClose }: MobileStatsViewProps) {
  const [activeCategory, setActiveCategory] = useState('overview');

  const categories: StatCategory[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Activity,
      stats: [
        { label: 'Season Avg', value: player.averagePoints || 0, trend: 2.3 },
        { label: 'Last 3 Games', value: 18.7, trend: -1.2 },
        { label: 'Projected', value: player.projectedPoints || 0 },
        { label: 'Floor/Ceiling', value: `${12.5}/${25.3}` }
      ]
    },
    {
      id: 'matchup',
      label: 'Matchup',
      icon: Target,
      stats: [
        { label: 'Opp Rank vs Pos', value: '5th' },
        { label: 'Points Allowed', value: 19.8 },
        { label: 'Weather Impact', value: 'None' },
        { label: 'Vegas O/U', value: 48.5 }
      ]
    },
    {
      id: 'trends',
      label: 'Trends',
      icon: TrendingUp,
      stats: [
        { label: 'Target Share', value: '28%', trend: 3.2 },
        { label: 'Red Zone Looks', value: 4.2, trend: 0.8 },
        { label: 'Snap Count %', value: '92%', trend: -2.1 },
        { label: 'YAC', value: 5.8, trend: 1.1 }
      ]
    },
    {
      id: 'season',
      label: 'Season',
      icon: Trophy,
      stats: [
        { label: 'Games Played', value: 12 },
        { label: 'Total Points', value: 198.4 },
        { label: 'Rank at Position', value: '#7' },
        { label: 'Consistency', value: '78%' }
      ]
    }
  ];

  const currentCategory = categories.find(c => c.id === activeCategory) || categories[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Player Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-white">{player.name}</h2>
              <p className="text-blue-100">
                {player.position} • {player.team} • #{player.jerseyNumber || 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{player.projectedPoints}</p>
              <p className="text-sm text-blue-100">Projected</p>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto bg-gray-800 px-2 py-3 gap-2 no-scrollbar">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;

            return (
              <motion.button
                key={category.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Stats Content */}
        <div className="p-4 space-y-3 pb-safe">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {currentCategory.stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-800 rounded-xl p-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="text-sm text-gray-400">{stat.label}</p>
                      <p className="text-xl font-bold text-white mt-1">
                        {stat.value}
                      </p>
                    </div>
                    {stat.trend !== undefined && (
                      <div className={`flex items-center gap-1 ${
                        stat.trend > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {stat.trend > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="text-sm font-medium">
                          {Math.abs(stat.trend)}%
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Quick Actions */}
          <div className="mt-6 space-y-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gray-800 rounded-xl p-4 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-white">View Game Log</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gray-800 rounded-xl p-4 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="text-white">Compare Players</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}