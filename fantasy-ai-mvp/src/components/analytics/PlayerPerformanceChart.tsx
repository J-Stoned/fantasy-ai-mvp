"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Target,
  Activity,
  BarChart3 
} from "lucide-react";

interface PlayerPerformanceData {
  week: number;
  points: number;
  projectedPoints: number;
  opponent: string;
  result: "W" | "L" | "T";
  gameScript: "positive" | "negative" | "neutral";
}

interface PlayerPerformanceChartProps {
  playerName: string;
  position: string;
  data: PlayerPerformanceData[];
  className?: string;
}

export function PlayerPerformanceChart({ 
  playerName, 
  position, 
  data, 
  className 
}: PlayerPerformanceChartProps) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"4week" | "season">("4week");

  const filteredData = selectedTimeframe === "4week" 
    ? data.slice(-4) 
    : data;

  const maxPoints = Math.max(...filteredData.map(d => Math.max(d.points, d.projectedPoints)));
  const avgPoints = filteredData.reduce((sum, d) => sum + d.points, 0) / filteredData.length;
  const consistency = calculateConsistency(filteredData);
  const trend = calculateTrend(filteredData);

  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">{playerName}</h3>
          <p className="text-sm text-gray-400">{position} Performance Analysis</p>
        </div>
        <div className="flex gap-2">
          <NeonButton
            size="sm"
            variant={selectedTimeframe === "4week" ? "blue" : "purple"}
            onClick={() => setSelectedTimeframe("4week")}
          >
            Last 4
          </NeonButton>
          <NeonButton
            size="sm"
            variant={selectedTimeframe === "season" ? "blue" : "purple"}
            onClick={() => setSelectedTimeframe("season")}
          >
            Season
          </NeonButton>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="w-4 h-4 text-neon-blue" />
            <span className="text-xs text-gray-400">AVG</span>
          </div>
          <p className="text-lg font-bold text-neon-blue">{avgPoints.toFixed(1)}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity className="w-4 h-4 text-neon-green" />
            <span className="text-xs text-gray-400">CONSISTENCY</span>
          </div>
          <p className="text-lg font-bold text-neon-green">{consistency}%</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            {trend > 0 ? 
              <TrendingUp className="w-4 h-4 text-neon-green" /> : 
              <TrendingDown className="w-4 h-4 text-neon-red" />
            }
            <span className="text-xs text-gray-400">TREND</span>
          </div>
          <p className={`text-lg font-bold ${trend > 0 ? 'text-neon-green' : 'text-neon-red'}`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative h-64 mb-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pr-2">
          <span>{maxPoints.toFixed(0)}</span>
          <span>{(maxPoints * 0.75).toFixed(0)}</span>
          <span>{(maxPoints * 0.5).toFixed(0)}</span>
          <span>{(maxPoints * 0.25).toFixed(0)}</span>
          <span>0</span>
        </div>

        {/* Chart Area */}
        <div className="ml-8 h-full relative">
          {/* Grid Lines */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <div
              key={percent}
              className="absolute left-0 right-0 border-t border-white/10"
              style={{ top: `${100 - percent}%` }}
            />
          ))}

          {/* Data Bars */}
          <div className="flex items-end justify-between h-full px-2">
            {filteredData.map((dataPoint, index) => {
              const actualHeight = (dataPoint.points / maxPoints) * 100;
              const projectedHeight = (dataPoint.projectedPoints / maxPoints) * 100;
              const isHovered = hoveredWeek === dataPoint.week;

              return (
                <motion.div
                  key={dataPoint.week}
                  className="flex flex-col items-center gap-1 relative"
                  style={{ width: `${90 / filteredData.length}%` }}
                  onMouseEnter={() => setHoveredWeek(dataPoint.week)}
                  onMouseLeave={() => setHoveredWeek(null)}
                  whileHover={{ scale: 1.05 }}
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-full mb-2 bg-gray-900 border border-white/20 rounded-lg p-3 text-xs z-10 min-w-[120px]"
                    >
                      <p className="font-semibold">Week {dataPoint.week}</p>
                      <p className="text-neon-blue">Actual: {dataPoint.points.toFixed(1)}</p>
                      <p className="text-gray-400">Projected: {dataPoint.projectedPoints.toFixed(1)}</p>
                      <p className="text-neon-yellow">vs {dataPoint.opponent}</p>
                    </motion.div>
                  )}

                  {/* Bars Container */}
                  <div className="relative flex items-end gap-1 h-full">
                    {/* Projected Points Bar (Background) */}
                    <motion.div
                      className="w-3 bg-gray-600/50 rounded-t-sm"
                      style={{ height: `${projectedHeight}%` }}
                      initial={{ height: 0 }}
                      animate={{ height: `${projectedHeight}%` }}
                      transition={{ delay: index * 0.1 }}
                    />
                    
                    {/* Actual Points Bar */}
                    <motion.div
                      className={`w-3 rounded-t-sm ${
                        dataPoint.points >= dataPoint.projectedPoints
                          ? 'bg-gradient-to-t from-neon-green/80 to-neon-green'
                          : 'bg-gradient-to-t from-neon-red/80 to-neon-red'
                      } ${isHovered ? 'glow-md' : ''}`}
                      style={{ height: `${actualHeight}%` }}
                      initial={{ height: 0 }}
                      animate={{ height: `${actualHeight}%` }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    />
                  </div>

                  {/* Week Label */}
                  <span className="text-xs text-gray-400">W{dataPoint.week}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-r from-neon-green to-neon-green/80 rounded" />
          <span className="text-gray-400">Actual Points</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-600/50 rounded" />
          <span className="text-gray-400">Projected Points</span>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-neon-purple" />
          Performance Insights
        </h4>
        <div className="space-y-2 text-sm">
          {getPerformanceInsights(filteredData, avgPoints, consistency, trend).map((insight, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-gray-300"
            >
              • {insight}
            </motion.p>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

// Helper Functions
function calculateConsistency(data: PlayerPerformanceData[]): number {
  if (data.length < 2) return 100;
  
  const avg = data.reduce((sum, d) => sum + d.points, 0) / data.length;
  const variance = data.reduce((sum, d) => sum + Math.pow(d.points - avg, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / avg;
  
  // Convert to consistency percentage (lower CV = higher consistency)
  return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));
}

function calculateTrend(data: PlayerPerformanceData[]): number {
  if (data.length < 2) return 0;
  
  const recent = data.slice(-3);
  const earlier = data.slice(-6, -3);
  
  if (earlier.length === 0) return 0;
  
  const recentAvg = recent.reduce((sum, d) => sum + d.points, 0) / recent.length;
  const earlierAvg = earlier.reduce((sum, d) => sum + d.points, 0) / earlier.length;
  
  return recentAvg - earlierAvg;
}

function getPerformanceInsights(
  data: PlayerPerformanceData[], 
  avgPoints: number, 
  consistency: number, 
  trend: number
): string[] {
  const insights: string[] = [];
  
  // Consistency insights
  if (consistency > 80) {
    insights.push("Highly consistent performer with reliable weekly output");
  } else if (consistency < 60) {
    insights.push("Volatile performance - high ceiling but risky floor");
  }
  
  // Trend insights
  if (trend > 3) {
    insights.push("Strong upward trend in recent performances");
  } else if (trend < -3) {
    insights.push("Concerning downward trend in recent weeks");
  }
  
  // Projection accuracy
  const accuracyRate = data.filter(d => 
    Math.abs(d.points - d.projectedPoints) / d.projectedPoints < 0.2
  ).length / data.length * 100;
  
  if (accuracyRate > 70) {
    insights.push("Projections have been highly accurate for this player");
  } else if (accuracyRate < 50) {
    insights.push("Projections often miss the mark - high variance player");
  }
  
  // Average performance
  if (avgPoints > 20) {
    insights.push("Elite weekly scoring - must-start player");
  } else if (avgPoints < 10) {
    insights.push("Below-average scoring - consider alternative options");
  }
  
  return insights.slice(0, 3); // Limit to 3 insights
}