'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { Player } from '@/types';
import { Star, TrendingUp, TrendingDown, AlertCircle, Heart } from 'lucide-react';

interface MobilePlayerCardProps {
  player: Player;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  showActions?: boolean;
}

export function MobilePlayerCard({
  player,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  showActions = true
}: MobilePlayerCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x > 100 && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -100 && onSwipeLeft) {
      onSwipeLeft();
    }
  };

  const getTrendIcon = () => {
    if (!player.stats?.trend) return null;
    
    if (player.stats.trend > 0) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else if (player.stats.trend < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getHealthColor = () => {
    if (player.healthStatus === 'healthy') return 'text-green-500';
    if (player.healthStatus === 'questionable') return 'text-yellow-500';
    if (player.healthStatus === 'injured') return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={showActions ? 'x' : false}
      dragConstraints={{ left: -200, right: 200 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 0.95 }}
      onClick={onTap}
      className="relative cursor-pointer"
    >
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl overflow-hidden">
        {/* Player Image Section */}
        <div className="relative h-48 bg-gradient-to-b from-blue-600 to-blue-800">
          <Image
            src={player.imageUrl || '/player-silhouette.png'}
            alt={player.name}
            fill
            className="object-cover"
          />
          
          {/* Quick Stats Overlay */}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-white font-bold">{player.rating || 'N/A'}</span>
            </div>
          </div>
          
          {/* Favorite Button */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full p-2"
          >
            <Heart 
              className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`}
            />
          </motion.button>
        </div>

        {/* Player Info */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-bold text-white">{player.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{player.position}</span>
                <span>•</span>
                <span>{player.team}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon()}
              <AlertCircle className={`w-4 h-4 ${getHealthColor()}`} />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-xs text-gray-500">Proj</p>
              <p className="text-sm font-bold text-white">{player.projectedPoints || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Avg</p>
              <p className="text-sm font-bold text-white">{player.averagePoints || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Own%</p>
              <p className="text-sm font-bold text-white">{player.ownership || 0}%</p>
            </div>
          </div>

          {/* Action Hints */}
          {showActions && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>← Bench</span>
              <span>Tap for details</span>
              <span>Start →</span>
            </div>
          )}
        </div>

        {/* Swipe Indicators */}
        {showActions && (
          <>
            <motion.div
              className="absolute inset-0 bg-red-500/20 flex items-center justify-center"
              style={{
                opacity: useTransform(x, [-200, -100, 0], [1, 0.5, 0])
              }}
            >
              <p className="text-white text-2xl font-bold rotate-12">BENCH</p>
            </motion.div>
            <motion.div
              className="absolute inset-0 bg-green-500/20 flex items-center justify-center"
              style={{
                opacity: useTransform(x, [0, 100, 200], [0, 0.5, 1])
              }}
            >
              <p className="text-white text-2xl font-bold -rotate-12">START</p>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}