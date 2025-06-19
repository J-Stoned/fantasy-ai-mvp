"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "./GlassCard";
import { NeonButton } from "./NeonButton";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Clock,
  BarChart3,
  Info,
  Star,
  Shield
} from "lucide-react";

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    position: string;
    team: string;
    opponent: string;
    projectedPoints: number;
    lastWeekPoints: number;
    seasonAverage: number;
    injuryStatus?: string;
    confidence: number;
    trend: "up" | "down" | "stable";
    matchupRating: "excellent" | "good" | "average" | "difficult";
    isStarter: boolean;
    ownership?: number;
  };
  showAdvanced?: boolean;
  onClick?: () => void;
  className?: string;
}

export function EnhancedPlayerCard({ 
  player, 
  showAdvanced = false,
  onClick,
  className 
}: PlayerCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getPositionColor = (position: string): string => {
    const colors: Record<string, string> = {
      QB: "neon-blue",
      RB: "neon-green", 
      WR: "neon-purple",
      TE: "neon-pink",
      K: "neon-yellow",
      DST: "neon-cyan"
    };
    return colors[position] || "neon-blue";
  };

  const getMatchupColor = (rating: string): string => {
    const colors: Record<string, string> = {
      excellent: "neon-green",
      good: "neon-blue",
      average: "neon-yellow", 
      difficult: "neon-red"
    };
    return colors[rating] || "neon-yellow";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-neon-green" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-neon-red" />;
      default:
        return <Activity className="w-4 h-4 text-neon-yellow" />;
    }
  };

  const getInjuryIcon = (status?: string) => {
    if (!status || status === "Healthy") {
      return <CheckCircle className="w-4 h-4 text-neon-green" />;
    }
    return <AlertTriangle className="w-4 h-4 text-neon-red" />;
  };

  return (
    <motion.div
      className={className}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <GlassCard 
        className={`p-4 cursor-pointer transition-all duration-300 relative overflow-hidden ${
          isHovered ? 'glow-md' : ''
        } ${player.isStarter ? 'border-neon-blue border-2' : ''}`}
      >
        {/* Animated Background Gradient */}
        <motion.div
          className={`absolute inset-0 opacity-10 bg-gradient-to-br from-${getPositionColor(player.position)} to-transparent`}
          animate={{ 
            backgroundPosition: isHovered ? ["0% 0%", "100% 100%"] : "0% 0%",
          }}
          transition={{ duration: 2, repeat: isHovered ? Infinity : 0, repeatType: "reverse" }}
        />

        {/* Starter Badge */}
        {player.isStarter && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute top-2 right-2 bg-neon-blue text-black text-xs font-bold px-2 py-1 rounded-full"
          >
            STARTER
          </motion.div>
        )}

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <motion.span
                  className={`text-${getPositionColor(player.position)} font-bold text-sm px-2 py-1 rounded bg-white/10`}
                  whileHover={{ scale: 1.1 }}
                >
                  {player.position}
                </motion.span>
                {showAdvanced && player.ownership && (
                  <span className="text-xs text-gray-400">
                    {player.ownership}% owned
                  </span>
                )}
              </div>
              <h3 className="font-bold text-white text-lg leading-tight">{player.name}</h3>
              <p className="text-sm text-gray-400">{player.team} vs {player.opponent}</p>
            </div>

            {/* Confidence Score */}
            <motion.div
              className="text-center"
              whileHover={{ scale: 1.1 }}
            >
              <div className={`text-2xl font-bold text-${
                player.confidence > 0.8 ? 'neon-green' :
                player.confidence > 0.6 ? 'neon-yellow' : 'neon-red'
              }`}>
                {(player.confidence * 100).toFixed(0)}
              </div>
              <div className="text-xs text-gray-400">CONF</div>
            </motion.div>
          </div>

          {/* Main Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Projected Points */}
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="w-3 h-3 text-neon-blue" />
                <span className="text-xs text-gray-400">PROJ</span>
              </div>
              <div className="text-lg font-bold text-neon-blue">
                {player.projectedPoints.toFixed(1)}
              </div>
            </motion.div>

            {/* Last Week */}
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">LAST</span>
              </div>
              <div className="text-lg font-bold text-white">
                {player.lastWeekPoints.toFixed(1)}
              </div>
            </motion.div>

            {/* Season Average */}
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <BarChart3 className="w-3 h-3 text-neon-purple" />
                <span className="text-xs text-gray-400">AVG</span>
              </div>
              <div className="text-lg font-bold text-neon-purple">
                {player.seasonAverage.toFixed(1)}
              </div>
            </motion.div>
          </div>

          {/* Status Row */}
          <div className="flex items-center justify-between mb-3">
            {/* Trend */}
            <motion.div 
              className="flex items-center gap-1"
              whileHover={{ scale: 1.1 }}
            >
              {getTrendIcon(player.trend)}
              <span className="text-xs text-gray-400 capitalize">{player.trend}</span>
            </motion.div>

            {/* Matchup Rating */}
            <motion.div 
              className={`px-2 py-1 rounded text-xs font-medium bg-${getMatchupColor(player.matchupRating)}/20 text-${getMatchupColor(player.matchupRating)} capitalize`}
              whileHover={{ scale: 1.05 }}
            >
              {player.matchupRating} matchup
            </motion.div>

            {/* Injury Status */}
            <motion.div 
              className="flex items-center gap-1"
              whileHover={{ scale: 1.1 }}
            >
              {getInjuryIcon(player.injuryStatus)}
              <span className="text-xs text-gray-400">
                {player.injuryStatus || "Healthy"}
              </span>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <NeonButton
              size="sm"
              variant="blue"
              className="flex-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
            >
              <Info className="w-3 h-3 mr-1" />
              Details
            </NeonButton>
            {showAdvanced && (
              <NeonButton
                size="sm" 
                variant="purple"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  // Add to lineup logic
                }}
              >
                <Star className="w-3 h-3" />
              </NeonButton>
            )}
          </div>

          {/* Expandable Details */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-3 pt-3 border-t border-white/20"
              >
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ceiling Projection:</span>
                    <span className="text-neon-green">{(player.projectedPoints * 1.3).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Floor Projection:</span>
                    <span className="text-neon-red">{(player.projectedPoints * 0.7).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Matchup Difficulty:</span>
                    <span className={`text-${getMatchupColor(player.matchupRating)} capitalize`}>
                      {player.matchupRating}
                    </span>
                  </div>
                  {showAdvanced && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Target Share:</span>
                        <span className="text-neon-blue">
                          {player.position === "WR" || player.position === "TE" ? "22%" : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Red Zone Looks:</span>
                        <span className="text-neon-purple">
                          {Math.floor(Math.random() * 5) + 1}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Animation Elements */}
        {isHovered && (
          <>
            <motion.div
              className={`absolute top-1/4 right-4 w-2 h-2 bg-${getPositionColor(player.position)} rounded-full`}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className={`absolute bottom-1/4 left-4 w-1 h-1 bg-${getPositionColor(player.position)} rounded-full`}
              animate={{
                y: [10, -10, 10],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
          </>
        )}

        {/* Performance Indicator */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-${getPositionColor(player.position)} to-transparent`}
          initial={{ width: 0 }}
          animate={{ width: `${player.confidence * 100}%` }}
          transition={{ duration: 1, delay: 0.5 }}
        />
      </GlassCard>
    </motion.div>
  );
}