"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown,
  Users,
  Target,
  Calendar,
  Award,
  Zap,
  Crown,
  Medal,
  Shield
} from "lucide-react";

interface TeamData {
  id: string;
  name: string;
  owner: string;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  points: {
    total: number;
    average: number;
    lastWeek: number;
  };
  streak: {
    type: "W" | "L" | "T";
    count: number;
  };
  projectedWins: number;
  playoffChances: number;
  powerRanking: number;
  strengthOfSchedule: number;
  recentForm: ("W" | "L" | "T")[];
  topPerformers: string[];
}

interface LeagueStandingsChartProps {
  teams: TeamData[];
  currentWeek: number;
  playoffSpots: number;
  className?: string;
}

export function LeagueStandingsChart({ 
  teams, 
  currentWeek, 
  playoffSpots = 6, 
  className 
}: LeagueStandingsChartProps) {
  const [viewMode, setViewMode] = useState<"standings" | "power" | "projections">("standings");
  const [selectedTeam, setSelectedTeam] = useState<TeamData | null>(null);

  const sortedTeams = [...teams].sort((a, b) => {
    switch (viewMode) {
      case "standings":
        // Standard fantasy standings: wins, then points
        if (a.record.wins !== b.record.wins) {
          return b.record.wins - a.record.wins;
        }
        return b.points.total - a.points.total;
      case "power":
        return a.powerRanking - b.powerRanking;
      case "projections":
        return b.projectedWins - a.projectedWins;
      default:
        return 0;
    }
  });

  const getTeamStatus = (index: number, team: TeamData): {
    status: "playoff" | "bubble" | "eliminated" | "champion";
    color: string;
    icon: React.ReactNode;
  } => {
    if (index === 0 && currentWeek >= 14) {
      return { 
        status: "champion", 
        color: "neon-yellow", 
        icon: <Crown className="w-4 h-4" /> 
      };
    }
    if (index < playoffSpots) {
      return { 
        status: "playoff", 
        color: "neon-green", 
        icon: <Trophy className="w-4 h-4" /> 
      };
    }
    if (team.playoffChances > 20) {
      return { 
        status: "bubble", 
        color: "neon-yellow", 
        icon: <Target className="w-4 h-4" /> 
      };
    }
    return { 
      status: "eliminated", 
      color: "neon-red", 
      icon: <Shield className="w-4 h-4" /> 
    };
  };

  const getStreakDisplay = (streak: TeamData["streak"]) => {
    const color = streak.type === "W" ? "neon-green" : 
                  streak.type === "L" ? "neon-red" : "neon-yellow";
    return (
      <span className={`text-${color} font-bold`}>
        {streak.type}{streak.count}
      </span>
    );
  };

  return (
    <GlassCard className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-neon-yellow" />
            League Standings
          </h3>
          <p className="text-sm text-gray-400">Week {currentWeek} • {playoffSpots} playoff spots</p>
        </div>
        <div className="flex gap-2">
          {[
            { key: "standings", label: "Standings", icon: <Trophy className="w-4 h-4" /> },
            { key: "power", label: "Power", icon: <Zap className="w-4 h-4" /> },
            { key: "projections", label: "Projections", icon: <TrendingUp className="w-4 h-4" /> }
          ].map((mode) => (
            <NeonButton
              key={mode.key}
              size="sm"
              variant={viewMode === mode.key ? "blue" : "purple"}
              onClick={() => setViewMode(mode.key as any)}
              className="flex items-center gap-1"
            >
              {mode.icon}
              {mode.label}
            </NeonButton>
          ))}
        </div>
      </div>

      {/* Standings Table */}
      <div className="space-y-2 mb-6">
        {sortedTeams.map((team, index) => {
          const teamStatus = getTeamStatus(index, team);
          const isSelected = selectedTeam?.id === team.id;
          const winPercentage = team.record.wins / (team.record.wins + team.record.losses + team.record.ties);
          
          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'bg-neon-blue/20 border-neon-blue glow-sm' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              onClick={() => setSelectedTeam(isSelected ? null : team)}
            >
              <div className="flex items-center justify-between">
                {/* Rank & Team Info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-${teamStatus.color} font-bold text-lg min-w-[24px]`}>
                      {viewMode === "power" ? team.powerRanking : index + 1}
                    </span>
                    <div className={`text-${teamStatus.color}`}>
                      {teamStatus.icon}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white">{team.name}</h4>
                    <p className="text-sm text-gray-400">{team.owner}</p>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="flex items-center gap-6">
                  {/* Record */}
                  <div className="text-center">
                    <p className="text-sm font-bold text-white">
                      {team.record.wins}-{team.record.losses}
                      {team.record.ties > 0 && `-${team.record.ties}`}
                    </p>
                    <p className="text-xs text-gray-400">{(winPercentage * 100).toFixed(0)}%</p>
                  </div>

                  {/* Points */}
                  <div className="text-center">
                    <p className="text-sm font-bold text-neon-blue">{team.points.total.toFixed(0)}</p>
                    <p className="text-xs text-gray-400">{team.points.average.toFixed(1)} avg</p>
                  </div>

                  {/* View-specific metric */}
                  {viewMode === "standings" && (
                    <div className="text-center">
                      <p className="text-sm font-bold">{getStreakDisplay(team.streak)}</p>
                      <p className="text-xs text-gray-400">streak</p>
                    </div>
                  )}

                  {viewMode === "power" && (
                    <div className="text-center">
                      <p className="text-sm font-bold text-neon-purple">#{team.powerRanking}</p>
                      <p className="text-xs text-gray-400">power</p>
                    </div>
                  )}

                  {viewMode === "projections" && (
                    <div className="text-center">
                      <p className="text-sm font-bold text-neon-green">{team.projectedWins.toFixed(1)}</p>
                      <p className="text-xs text-gray-400">proj wins</p>
                    </div>
                  )}

                  {/* Playoff Chances */}
                  <div className="text-center">
                    <p className={`text-sm font-bold ${
                      team.playoffChances > 75 ? 'text-neon-green' :
                      team.playoffChances > 25 ? 'text-neon-yellow' : 'text-neon-red'
                    }`}>
                      {team.playoffChances.toFixed(0)}%
                    </p>
                    <p className="text-xs text-gray-400">playoffs</p>
                  </div>

                  {/* Recent Form */}
                  <div className="flex gap-1">
                    {team.recentForm.slice(-5).map((result, idx) => (
                      <div
                        key={idx}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          result === "W" ? 'bg-neon-green text-black' :
                          result === "L" ? 'bg-neon-red text-white' : 'bg-neon-yellow text-black'
                        }`}
                      >
                        {result}
                      </div>
                    ))}
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
                    {/* Team Stats */}
                    <div>
                      <h5 className="font-semibold mb-2 text-neon-blue">Team Statistics</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Points For:</span>
                          <span className="text-white font-medium">{team.points.total.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Points/Game:</span>
                          <span className="text-white font-medium">{team.points.average.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Week:</span>
                          <span className="text-white font-medium">{team.points.lastWeek.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">SOS Rank:</span>
                          <span className={`font-medium ${
                            team.strengthOfSchedule <= 10 ? 'text-neon-green' :
                            team.strengthOfSchedule <= 20 ? 'text-neon-yellow' : 'text-neon-red'
                          }`}>
                            #{team.strengthOfSchedule}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Projections */}
                    <div>
                      <h5 className="font-semibold mb-2 text-neon-purple">Season Outlook</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Projected Wins:</span>
                          <span className="text-neon-green font-medium">{team.projectedWins.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Playoff Odds:</span>
                          <span className={`font-medium ${
                            team.playoffChances > 75 ? 'text-neon-green' :
                            team.playoffChances > 25 ? 'text-neon-yellow' : 'text-neon-red'
                          }`}>
                            {team.playoffChances.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Power Ranking:</span>
                          <span className="text-neon-purple font-medium">#{team.powerRanking}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Current Seed:</span>
                          <span className={`font-medium ${
                            index < playoffSpots ? 'text-neon-green' : 'text-neon-red'
                          }`}>
                            #{index + 1}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Top Performers */}
                    <div>
                      <h5 className="font-semibold mb-2 text-neon-pink">Top Performers</h5>
                      <div className="space-y-1 text-sm">
                        {team.topPerformers.map((player, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Award className="w-3 h-3 text-neon-yellow" />
                            <span className="text-gray-300">{player}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Analysis */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-gray-900/50 to-transparent rounded-lg">
                    <h5 className="font-semibold mb-1 text-neon-yellow">Quick Analysis</h5>
                    <p className="text-sm text-gray-300">
                      {getTeamAnalysis(team, index, playoffSpots, currentWeek)}
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* League Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="w-4 h-4 text-neon-green" />
            <span className="text-xs text-gray-400">CLINCHED</span>
          </div>
          <p className="text-lg font-bold text-neon-green">
            {teams.filter(t => t.playoffChances >= 95).length}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="w-4 h-4 text-neon-yellow" />
            <span className="text-xs text-gray-400">IN HUNT</span>
          </div>
          <p className="text-lg font-bold text-neon-yellow">
            {teams.filter(t => t.playoffChances > 5 && t.playoffChances < 95).length}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-neon-blue" />
            <span className="text-xs text-gray-400">AVG PTS</span>
          </div>
          <p className="text-lg font-bold text-neon-blue">
            {(teams.reduce((sum, t) => sum + t.points.average, 0) / teams.length).toFixed(1)}
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="w-4 h-4 text-neon-purple" />
            <span className="text-xs text-gray-400">WEEKS LEFT</span>
          </div>
          <p className="text-lg font-bold text-neon-purple">
            {Math.max(0, 17 - currentWeek)}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

function getTeamAnalysis(
  team: TeamData, 
  currentRank: number, 
  playoffSpots: number, 
  currentWeek: number
): string {
  const analyses = [];

  // Playoff position analysis
  if (currentRank < playoffSpots) {
    if (team.playoffChances > 90) {
      analyses.push("Sitting pretty in a playoff spot with excellent odds to maintain position");
    } else {
      analyses.push("Currently in playoffs but needs to maintain pace to secure spot");
    }
  } else {
    if (team.playoffChances > 25) {
      analyses.push("Outside playoffs but very much in the hunt with solid mathematical chances");
    } else {
      analyses.push("Facing an uphill battle to make playoffs - needs significant help");
    }
  }

  // Recent performance
  const recentWins = team.recentForm.slice(-3).filter(r => r === "W").length;
  if (recentWins >= 2) {
    analyses.push("hot streak building momentum");
  } else if (recentWins === 0) {
    analyses.push("struggling recently and needs to turn things around");
  }

  // Scoring analysis
  if (team.points.average > 120) {
    analyses.push("elite scoring offense that can compete with anyone");
  } else if (team.points.average < 90) {
    analyses.push("scoring concerns that need addressing for playoff push");
  }

  return analyses.join(", ") + ".";
}