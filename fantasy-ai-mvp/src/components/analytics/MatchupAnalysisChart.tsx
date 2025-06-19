"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  Shield, 
  Sword, 
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye
} from "lucide-react";

interface MatchupData {
  playerName: string;
  position: string;
  team: string;
  opponent: string;
  defensiveRank: number; // 1-32 rank against position
  averageAllowed: number; // Average points allowed to position
  recentForm: number[]; // Last 4 games allowed
  weather?: {
    condition: string;
    temperature: number;
    windSpeed: number;
  };
  injuries: {
    playerInjuries: string[];
    defenseInjuries: string[];
  };
  gameScript: "positive" | "negative" | "neutral";
  projectedPoints: number;
  confidence: number;
}

interface MatchupAnalysisChartProps {
  matchups: MatchupData[];
  className?: string;
}

export function MatchupAnalysisChart({ matchups, className }: MatchupAnalysisChartProps) {
  const [selectedMatchup, setSelectedMatchup] = useState<MatchupData | null>(null);
  const [sortBy, setSortBy] = useState<"rank" | "projection" | "confidence">("projection");

  const sortedMatchups = [...matchups].sort((a, b) => {
    switch (sortBy) {
      case "rank":
        return b.defensiveRank - a.defensiveRank; // Higher rank = easier matchup
      case "projection":
        return b.projectedPoints - a.projectedPoints;
      case "confidence":
        return b.confidence - a.confidence;
      default:
        return 0;
    }
  });

  const getMatchupRating = (matchup: MatchupData): {
    rating: "excellent" | "good" | "average" | "difficult" | "avoid";
    score: number;
    color: string;
  } => {
    const defenseScore = (33 - matchup.defensiveRank) / 32 * 40; // 0-40 points
    const recentFormScore = (matchup.recentForm.reduce((a, b) => a + b, 0) / matchup.recentForm.length) / 25 * 30; // 0-30 points
    const gameScriptScore = matchup.gameScript === "positive" ? 20 : matchup.gameScript === "neutral" ? 10 : 0; // 0-20 points
    const weatherScore = matchup.weather?.windSpeed && matchup.weather.windSpeed > 15 ? -5 : 5; // -5 to 5 points
    const injuryScore = (matchup.injuries.defenseInjuries.length * 5) - (matchup.injuries.playerInjuries.length * 10); // Variable
    
    const totalScore = defenseScore + recentFormScore + gameScriptScore + weatherScore + injuryScore;
    
    if (totalScore >= 80) return { rating: "excellent", score: totalScore, color: "neon-green" };
    if (totalScore >= 65) return { rating: "good", score: totalScore, color: "neon-blue" };
    if (totalScore >= 45) return { rating: "average", score: totalScore, color: "neon-yellow" };
    if (totalScore >= 30) return { rating: "difficult", score: totalScore, color: "neon-orange" };
    return { rating: "avoid", score: totalScore, color: "neon-red" };
  };

  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Sword className="w-5 h-5 text-neon-blue" />
            Matchup Analysis
          </h3>
          <p className="text-sm text-gray-400">Detailed player vs defense breakdown</p>
        </div>
        <div className="flex gap-2">
          {["projection", "rank", "confidence"].map((option) => (
            <NeonButton
              key={option}
              size="sm"
              variant={sortBy === option ? "blue" : "purple"}
              onClick={() => setSortBy(option as any)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </NeonButton>
          ))}
        </div>
      </div>

      {/* Matchup Grid */}
      <div className="space-y-3 mb-6">
        {sortedMatchups.map((matchup, index) => {
          const rating = getMatchupRating(matchup);
          const isSelected = selectedMatchup?.playerName === matchup.playerName;
          
          return (
            <motion.div
              key={matchup.playerName}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'bg-neon-blue/20 border-neon-blue glow-sm' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              onClick={() => setSelectedMatchup(isSelected ? null : matchup)}
            >
              <div className="flex items-center justify-between">
                {/* Player Info */}
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full bg-${rating.color} animate-pulse`} />
                  <div>
                    <h4 className="font-semibold text-white">{matchup.playerName}</h4>
                    <p className="text-sm text-gray-400">{matchup.position} • {matchup.team} vs {matchup.opponent}</p>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="flex items-center gap-6">
                  {/* Defense Rank */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1">
                      <Shield className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">DEF RANK</span>
                    </div>
                    <p className={`text-sm font-bold ${
                      matchup.defensiveRank <= 10 ? 'text-neon-green' : 
                      matchup.defensiveRank <= 20 ? 'text-neon-yellow' : 'text-neon-red'
                    }`}>
                      {matchup.defensiveRank}
                    </p>
                  </div>

                  {/* Projected Points */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1">
                      <Target className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">PROJ</span>
                    </div>
                    <p className="text-sm font-bold text-neon-blue">{matchup.projectedPoints.toFixed(1)}</p>
                  </div>

                  {/* Confidence */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1">
                      <Eye className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">CONF</span>
                    </div>
                    <p className="text-sm font-bold text-neon-purple">{(matchup.confidence * 100).toFixed(0)}%</p>
                  </div>

                  {/* Rating */}
                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1">
                      {rating.rating === "excellent" && <CheckCircle className="w-3 h-3 text-neon-green" />}
                      {rating.rating === "good" && <CheckCircle className="w-3 h-3 text-neon-blue" />}
                      {rating.rating === "average" && <AlertTriangle className="w-3 h-3 text-neon-yellow" />}
                      {(rating.rating === "difficult" || rating.rating === "avoid") && <XCircle className="w-3 h-3 text-neon-red" />}
                      <span className="text-xs text-gray-400">RATING</span>
                    </div>
                    <p className={`text-sm font-bold text-${rating.color} capitalize`}>
                      {rating.rating}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Recent Defense Performance */}
                    <div>
                      <h5 className="font-semibold mb-2 text-neon-blue">Recent Defense vs {matchup.position}</h5>
                      <div className="space-y-1">
                        {matchup.recentForm.map((points, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-400">Game {idx + 1}:</span>
                            <span className={`font-medium ${
                              points > matchup.averageAllowed ? 'text-neon-red' : 'text-neon-green'
                            }`}>
                              {points.toFixed(1)} pts
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-semibold border-t border-white/20 pt-1">
                          <span className="text-gray-300">Season Avg:</span>
                          <span className="text-neon-yellow">{matchup.averageAllowed.toFixed(1)} pts</span>
                        </div>
                      </div>
                    </div>

                    {/* Game Context */}
                    <div>
                      <h5 className="font-semibold mb-2 text-neon-purple">Game Context</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Game Script:</span>
                          <span className={`capitalize font-medium ${
                            matchup.gameScript === "positive" ? 'text-neon-green' :
                            matchup.gameScript === "neutral" ? 'text-neon-yellow' : 'text-neon-red'
                          }`}>
                            {matchup.gameScript}
                          </span>
                        </div>
                        {matchup.weather && (
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Weather:</span>
                              <span className="text-gray-300">{matchup.weather.condition}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Temp:</span>
                              <span className="text-gray-300">{matchup.weather.temperature}°F</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Wind:</span>
                              <span className={`${matchup.weather.windSpeed > 15 ? 'text-neon-red' : 'text-gray-300'}`}>
                                {matchup.weather.windSpeed} mph
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Injury Report */}
                    <div>
                      <h5 className="font-semibold mb-2 text-neon-pink">Injury Report</h5>
                      <div className="space-y-2 text-sm">
                        {matchup.injuries.playerInjuries.length > 0 && (
                          <div>
                            <span className="text-neon-red font-medium">Player Concerns:</span>
                            <ul className="text-gray-400 ml-2">
                              {matchup.injuries.playerInjuries.map((injury, idx) => (
                                <li key={idx}>• {injury}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {matchup.injuries.defenseInjuries.length > 0 && (
                          <div>
                            <span className="text-neon-green font-medium">Defense Out:</span>
                            <ul className="text-gray-400 ml-2">
                              {matchup.injuries.defenseInjuries.map((injury, idx) => (
                                <li key={idx}>• {injury}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {matchup.injuries.playerInjuries.length === 0 && matchup.injuries.defenseInjuries.length === 0 && (
                          <p className="text-neon-green">No significant injury concerns</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Matchup Recommendation */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-gray-900/50 to-transparent rounded-lg">
                    <h5 className="font-semibold mb-1 text-neon-yellow">Recommendation</h5>
                    <p className="text-sm text-gray-300">
                      {getMatchupRecommendation(matchup, rating)}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">EXCELLENT</p>
          <p className="text-lg font-bold text-neon-green">
            {sortedMatchups.filter(m => getMatchupRating(m).rating === "excellent").length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">GOOD</p>
          <p className="text-lg font-bold text-neon-blue">
            {sortedMatchups.filter(m => getMatchupRating(m).rating === "good").length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">AVERAGE</p>
          <p className="text-lg font-bold text-neon-yellow">
            {sortedMatchups.filter(m => getMatchupRating(m).rating === "average").length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">AVOID</p>
          <p className="text-lg font-bold text-neon-red">
            {sortedMatchups.filter(m => ["difficult", "avoid"].includes(getMatchupRating(m).rating)).length}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

function getMatchupRecommendation(
  matchup: MatchupData, 
  rating: { rating: string; score: number; color: string }
): string {
  const recommendations = {
    excellent: `${matchup.playerName} is in an elite matchup. The ${matchup.opponent} defense ranks ${matchup.defensiveRank} against ${matchup.position}s and has allowed big games recently. Strong start recommendation.`,
    good: `Solid matchup for ${matchup.playerName}. The ${matchup.opponent} defense has been exploitable and game conditions favor a good performance. Confident start.`,
    average: `${matchup.playerName} has a neutral matchup. The ${matchup.opponent} defense is middle-of-the-pack. Consider other factors like team needs and alternatives.`,
    difficult: `Challenging matchup for ${matchup.playerName}. The ${matchup.opponent} defense has been strong against ${matchup.position}s. Consider alternative options if available.`,
    avoid: `Poor matchup for ${matchup.playerName}. Multiple factors suggest a difficult game including strong defense and unfavorable conditions. Look for better alternatives.`
  };
  
  return recommendations[rating.rating as keyof typeof recommendations] || "Unable to generate recommendation.";
}