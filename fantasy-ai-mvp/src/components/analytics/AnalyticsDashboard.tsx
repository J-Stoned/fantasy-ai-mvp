"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { PlayerPerformanceChart } from "./PlayerPerformanceChart";
import { MatchupAnalysisChart } from "./MatchupAnalysisChart";
import { LeagueStandingsChart } from "./LeagueStandingsChart";
import { LiveDataFeed } from "./LiveDataFeed";
import { 
  BarChart3,
  Zap,
  Users,
  TrendingUp,
  Target,
  Eye,
  Cpu,
  Activity,
  Brain,
  Sparkles
} from "lucide-react";

interface AnalyticsDashboardProps {
  userId: string;
  currentWeek: number;
  className?: string;
}

export function AnalyticsDashboard({ userId, currentWeek, className }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "players" | "matchups" | "league" | "live">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Mock data - in production, this would come from MCP servers
  useEffect(() => {
    const loadAnalyticsData = async () => {
      setIsLoading(true);
      
      // Simulate API call to get analytics data
      // In production, this would use Firecrawl + Knowledge Graph + AI Service
      const mockData = {
        overview: {
          weeklyInsights: [
            {
              type: "opportunity",
              title: "Waiver Wire Gem",
              description: "Jaylen Warren is available in 67% of leagues and facing a weak run defense",
              confidence: 0.89,
              action: "Add to watchlist"
            },
            {
              type: "warning",
              title: "Weather Alert",
              description: "Sunday's GB vs CHI game expects 20+ mph winds - impact passing games",
              confidence: 0.95,
              action: "Consider pivoting"
            },
            {
              type: "matchup", 
              title: "Smash Spot",
              description: "Ja'Marr Chase vs ARI secondary ranks worst against slot receivers",
              confidence: 0.92,
              action: "Prioritize in lineups"
            }
          ],
          keyMetrics: {
            teamScore: 87.4,
            leagueRank: 3,
            projectedPoints: 142.7,
            confidence: 0.84,
            optimalLineupDiff: 12.3
          }
        },
        playerPerformance: [
          {
            week: 1,
            points: 18.4,
            projectedPoints: 16.2,
            opponent: "SEA",
            result: "W" as const,
            gameScript: "positive" as const
          },
          {
            week: 2,
            points: 12.8,
            projectedPoints: 15.8,
            opponent: "LAR",
            result: "L" as const,
            gameScript: "negative" as const
          },
          {
            week: 3,
            points: 22.6,
            projectedPoints: 17.4,
            opponent: "DAL",
            result: "W" as const,
            gameScript: "positive" as const
          },
          {
            week: 4,
            points: 19.1,
            projectedPoints: 18.9,
            opponent: "ARI",
            result: "W" as const,
            gameScript: "neutral" as const
          }
        ],
        matchupAnalysis: [
          {
            playerName: "Josh Allen",
            position: "QB",
            team: "BUF",
            opponent: "MIA",
            defensiveRank: 28,
            averageAllowed: 19.8,
            recentForm: [22.4, 18.6, 25.1, 21.3],
            weather: {
              condition: "Clear",
              temperature: 72,
              windSpeed: 8
            },
            injuries: {
              playerInjuries: [],
              defenseInjuries: ["Jalen Ramsey (hamstring)"]
            },
            gameScript: "positive" as const,
            projectedPoints: 24.7,
            confidence: 0.91
          },
          {
            playerName: "Christian McCaffrey",
            position: "RB", 
            team: "SF",
            opponent: "SEA",
            defensiveRank: 12,
            averageAllowed: 16.2,
            recentForm: [14.8, 18.3, 12.6, 19.7],
            injuries: {
              playerInjuries: [],
              defenseInjuries: []
            },
            gameScript: "neutral" as const,
            projectedPoints: 18.9,
            confidence: 0.78
          }
        ],
        leagueStandings: [
          {
            id: "team1",
            name: "Touchdown Machines",
            owner: "Mike Johnson", 
            record: { wins: 8, losses: 3, ties: 0 },
            points: { total: 1547.8, average: 140.7, lastWeek: 156.2 },
            streak: { type: "W" as const, count: 3 },
            projectedWins: 10.8,
            playoffChances: 94.2,
            powerRanking: 2,
            strengthOfSchedule: 7,
            recentForm: ["W", "W", "W", "L", "W"] as const,
            topPerformers: ["Josh Allen", "Tyreek Hill", "Travis Kelce"]
          },
          {
            id: "team2", 
            name: "Fantasy Gurus",
            owner: "Sarah Chen",
            record: { wins: 7, losses: 4, ties: 0 },
            points: { total: 1489.3, average: 135.4, lastWeek: 142.1 },
            streak: { type: "L" as const, count: 1 },
            projectedWins: 9.2,
            playoffChances: 76.8,
            powerRanking: 3,
            strengthOfSchedule: 14,
            recentForm: ["L", "W", "W", "W", "L"] as const,
            topPerformers: ["Christian McCaffrey", "Ja'Marr Chase", "Mark Andrews"]
          }
        ]
      };

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAnalyticsData(mockData);
      setIsLoading(false);
    };

    loadAnalyticsData();
  }, [userId, currentWeek]);

  if (isLoading) {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Cpu className="w-8 h-8 text-neon-blue animate-pulse mx-auto mb-2" />
            <p className="text-gray-400">Loading advanced analytics...</p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-neon-blue" />
            Advanced Analytics
          </h2>
          <p className="text-gray-400">AI-powered insights and data visualization</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-lg border border-white/5">
        {[
          { id: "overview", label: "Overview", icon: <Sparkles className="w-4 h-4" /> },
          { id: "players", label: "Player Analysis", icon: <TrendingUp className="w-4 h-4" /> },
          { id: "matchups", label: "Matchups", icon: <Target className="w-4 h-4" /> },
          { id: "league", label: "League Standings", icon: <Users className="w-4 h-4" /> },
          { id: "live", label: "Live Data", icon: <Activity className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-neon-blue/20 text-neon-blue glow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Team Score</p>
                    <p className="text-2xl font-bold text-neon-blue">
                      {analyticsData.overview.keyMetrics.teamScore}
                    </p>
                  </div>
                  <Brain className="w-6 h-6 text-neon-blue" />
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">League Rank</p>
                    <p className="text-2xl font-bold text-neon-green">
                      #{analyticsData.overview.keyMetrics.leagueRank}
                    </p>
                  </div>
                  <Users className="w-6 h-6 text-neon-green" />
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Projected Points</p>
                    <p className="text-2xl font-bold text-neon-purple">
                      {analyticsData.overview.keyMetrics.projectedPoints}
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-neon-purple" />
                </div>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">AI Confidence</p>
                    <p className="text-2xl font-bold text-neon-yellow">
                      {(analyticsData.overview.keyMetrics.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <Eye className="w-6 h-6 text-neon-yellow" />
                </div>
              </GlassCard>
            </div>

            {/* Weekly Insights */}
            <GlassCard className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-neon-yellow" />
                AI Insights for Week {currentWeek}
              </h3>
              <div className="space-y-4">
                {analyticsData.overview.weeklyInsights.map((insight: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      insight.type === "opportunity" ? "bg-neon-green/10 border-neon-green/30" :
                      insight.type === "warning" ? "bg-neon-red/10 border-neon-red/30" :
                      "bg-neon-blue/10 border-neon-blue/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-semibold ${
                          insight.type === "opportunity" ? "text-neon-green" :
                          insight.type === "warning" ? "text-neon-red" : "text-neon-blue"
                        }`}>
                          {insight.title}
                        </h4>
                        <p className="text-gray-300 mt-1">{insight.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-400">
                            Confidence: {(insight.confidence * 100).toFixed(0)}%
                          </span>
                          <NeonButton size="sm" variant="purple">
                            {insight.action}
                          </NeonButton>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === "players" && (
          <PlayerPerformanceChart
            playerName="Christian McCaffrey"
            position="RB"
            data={analyticsData.playerPerformance}
          />
        )}

        {activeTab === "matchups" && (
          <MatchupAnalysisChart
            matchups={analyticsData.matchupAnalysis}
          />
        )}

        {activeTab === "league" && (
          <LeagueStandingsChart
            teams={analyticsData.leagueStandings}
            currentWeek={currentWeek}
            playoffSpots={6}
          />
        )}

        {activeTab === "live" && (
          <LiveDataFeed />
        )}
      </motion.div>
    </div>
  );
}