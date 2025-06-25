'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Player } from '@/types';
import { MobilePlayerCard } from './MobilePlayerCard';
import { Check, X, RotateCcw } from 'lucide-react';

interface MobileSwipeableCardsProps {
  players: Player[];
  onSwipeLeft?: (player: Player) => void;
  onSwipeRight?: (player: Player) => void;
  onComplete?: () => void;
  title?: string;
  leftLabel?: string;
  rightLabel?: string;
}

export function MobileSwipeableCards({
  players,
  onSwipeLeft,
  onSwipeRight,
  onComplete,
  title = "Swipe to Decide",
  leftLabel = "Bench",
  rightLabel = "Start"
}: MobileSwipeableCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, 'left' | 'right'>>({});
  const [lastAction, setLastAction] = useState<{ player: Player; action: 'left' | 'right' } | null>(null);

  const currentPlayer = players[currentIndex];
  const remainingCards = players.length - currentIndex;
  const progress = (currentIndex / players.length) * 100;

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!currentPlayer) return;

    const newDecisions = { ...decisions, [currentPlayer.id]: direction };
    setDecisions(newDecisions);
    setLastAction({ player: currentPlayer, action: direction });

    if (direction === 'left' && onSwipeLeft) {
      onSwipeLeft(currentPlayer);
    } else if (direction === 'right' && onSwipeRight) {
      onSwipeRight(currentPlayer);
    }

    // Move to next card
    if (currentIndex < players.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (onComplete) {
      onComplete();
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      if (lastAction) {
        const newDecisions = { ...decisions };
        delete newDecisions[lastAction.player.id];
        setDecisions(newDecisions);
      }
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setDecisions({});
    setLastAction(null);
  };

  if (!currentPlayer && currentIndex >= players.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-green-500 rounded-full p-6 mb-4"
        >
          <Check className="w-12 h-12 text-white" />
        </motion.div>
        <h3 className="text-xl font-bold text-white mb-2">All Done!</h3>
        <p className="text-gray-400 mb-6">You've reviewed all players</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
        >
          Review Again
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={handleUndo}
              disabled={currentIndex === 0}
              className={`p-2 rounded-lg ${
                currentIndex === 0 
                  ? 'bg-gray-800 text-gray-600' 
                  : 'bg-gray-800 text-white'
              }`}
            >
              <RotateCcw className="w-5 h-5" />
            </motion.button>
            <span className="text-sm text-gray-400">
              {remainingCards} left
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
          <motion.div
            className="bg-blue-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          />
        </div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 relative px-4 pb-24">
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="popLayout">
            {players.slice(currentIndex, currentIndex + 3).reverse().map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                animate={{
                  scale: 1 - index * 0.05,
                  y: index * -10,
                  opacity: 1
                }}
                exit={{
                  x: decisions[player.id] === 'right' ? 300 : -300,
                  y: -50,
                  opacity: 0,
                  rotate: decisions[player.id] === 'right' ? 20 : -20,
                  transition: { duration: 0.3 }
                }}
                className="absolute w-full max-w-sm"
                style={{ zIndex: 3 - index }}
              >
                <MobilePlayerCard
                  player={player}
                  onSwipeLeft={() => handleSwipe('left')}
                  onSwipeRight={() => handleSwipe('right')}
                  showActions={index === 0}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-8 left-0 right-0 px-8">
        <div className="flex justify-between items-center">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => handleSwipe('left')}
            className="bg-red-500 rounded-full p-4 shadow-lg"
          >
            <X className="w-8 h-8 text-white" />
          </motion.button>

          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase">{leftLabel}</p>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase">{rightLabel}</p>
          </div>

          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => handleSwipe('right')}
            className="bg-green-500 rounded-full p-4 shadow-lg"
          >
            <Check className="w-8 h-8 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}