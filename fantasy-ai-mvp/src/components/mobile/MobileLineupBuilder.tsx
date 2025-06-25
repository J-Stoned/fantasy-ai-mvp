'use client';

import { useState } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import { Player, LineupSlot } from '@/types';
import { GripVertical, X, Plus, ArrowUpDown } from 'lucide-react';
import { MobilePlayerCard } from './MobilePlayerCard';

interface MobileLineupBuilderProps {
  lineup: LineupSlot[];
  benchPlayers: Player[];
  onLineupChange: (lineup: LineupSlot[]) => void;
  onOptimize?: () => void;
}

export function MobileLineupBuilder({
  lineup: initialLineup,
  benchPlayers,
  onLineupChange,
  onOptimize
}: MobileLineupBuilderProps) {
  const [lineup, setLineup] = useState(initialLineup);
  const [showBench, setShowBench] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const handleReorder = (newOrder: LineupSlot[]) => {
    setLineup(newOrder);
    onLineupChange(newOrder);
  };

  const handleSlotTap = (index: number) => {
    if (lineup[index].player) {
      // Remove player from slot
      const updatedLineup = [...lineup];
      updatedLineup[index] = { ...updatedLineup[index], player: null };
      setLineup(updatedLineup);
      onLineupChange(updatedLineup);
    } else {
      // Show bench to select player
      setSelectedSlot(index);
      setShowBench(true);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    if (selectedSlot !== null) {
      const updatedLineup = [...lineup];
      updatedLineup[selectedSlot] = { ...updatedLineup[selectedSlot], player };
      setLineup(updatedLineup);
      onLineupChange(updatedLineup);
      setShowBench(false);
      setSelectedSlot(null);
    }
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      QB: 'bg-red-600',
      RB: 'bg-blue-600',
      WR: 'bg-green-600',
      TE: 'bg-purple-600',
      K: 'bg-yellow-600',
      DEF: 'bg-orange-600',
      FLEX: 'bg-gray-600'
    };
    return colors[position] || 'bg-gray-600';
  };

  return (
    <div className="relative h-full">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900 z-20 px-4 py-3 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Edit Lineup</h2>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onOptimize}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <ArrowUpDown className="w-4 h-4" />
              Optimize
            </motion.button>
          </div>
        </div>
        
        {/* Total Points */}
        <div className="mt-2 text-sm text-gray-400">
          Projected: <span className="text-white font-bold">
            {lineup.reduce((sum, slot) => sum + (slot.player?.projectedPoints || 0), 0).toFixed(1)} pts
          </span>
        </div>
      </div>

      {/* Lineup Slots */}
      <Reorder.Group
        axis="y"
        values={lineup}
        onReorder={handleReorder}
        className="p-4 space-y-3 pb-20"
      >
        {lineup.map((slot, index) => (
          <Reorder.Item
            key={slot.position + index}
            value={slot}
            className="touch-none"
          >
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-gray-800 rounded-xl overflow-hidden"
            >
              <div className="flex items-center p-3">
                {/* Drag Handle */}
                <div className="mr-3 text-gray-500">
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Position Badge */}
                <div className={`${getPositionColor(slot.position)} text-white px-3 py-1 rounded-lg text-sm font-bold mr-3`}>
                  {slot.position}
                </div>

                {/* Player Info or Empty Slot */}
                <div 
                  className="flex-1"
                  onClick={() => handleSlotTap(index)}
                >
                  {slot.player ? (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{slot.player.name}</p>
                        <p className="text-xs text-gray-400">
                          {slot.player.team} • {slot.player.opponent}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{slot.player.projectedPoints}</p>
                        <p className="text-xs text-gray-400">proj pts</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-gray-500">Empty slot</p>
                      <Plus className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Remove Button */}
                {slot.player && (
                  <motion.button
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSlotTap(index);
                    }}
                    className="ml-3 text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      {/* Bench Players Modal */}
      {showBench && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50"
          onClick={() => setShowBench(false)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-800">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">
                  Select Player for {selectedSlot !== null ? lineup[selectedSlot].position : ''}
                </h3>
                <motion.button
                  whileTap={{ scale: 0.8 }}
                  onClick={() => setShowBench(false)}
                  className="text-gray-400"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            {/* Bench Players List */}
            <div className="p-4 space-y-3 overflow-y-auto">
              {benchPlayers
                .filter(player => 
                  selectedSlot !== null && 
                  (lineup[selectedSlot].position === 'FLEX' || 
                   player.position === lineup[selectedSlot].position)
                )
                .map(player => (
                  <motion.div
                    key={player.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePlayerSelect(player)}
                    className="bg-gray-800 rounded-xl p-3 cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">{player.name}</p>
                        <p className="text-sm text-gray-400">
                          {player.position} • {player.team} vs {player.opponent}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{player.projectedPoints}</p>
                        <p className="text-xs text-gray-400">proj</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}