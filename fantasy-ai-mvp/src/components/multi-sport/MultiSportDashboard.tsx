"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { multiSportService, SportConfig, MultiSportPlayer, GameSchedule, SportType } from "@/lib/multi-sport-service";
import {
  Trophy,
  Activity,
  Calendar,
  Users,
  TrendingUp,
  Star,
  Target,
  Zap,
  Clock,
  MapPin,
  Search,
  Filter,
  BarChart3,
  Medal,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  Play,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface MultiSportDashboardProps {
  userId: string;
}

export function MultiSportDashboard({ userId }: MultiSportDashboardProps) {
  const [sportConfigs, setSportConfigs] = useState<SportConfig[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [topPerformers, setTopPerformers] = useState<MultiSportPlayer[]>([]);
  const [schedule, setSchedule] = useState<GameSchedule[]>([]);
  const [liveGames, setLiveGames] = useState<GameSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'schedule' | 'stats'>('overview');

  useEffect(() => {
    loadSportData();
  }, []);

  useEffect(() => {
    if (selectedSport) {
      loadSportSpecificData();
    }
  }, [selectedSport]);

  const loadSportData = async () => {
    setLoading(true);
    try {
      const configs = await multiSportService.getSportConfigs();
      setSportConfigs(configs);
      
      // Set first active sport as default
      const activeSports = configs.filter(c => c.isActive);
      if (activeSports.length > 0) {
        setSelectedSport(activeSports[0].id);
      }
    } catch (error) {
      console.error('Error loading sport data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSportSpecificData = async () => {
    if (!selectedSport) return;

    try {
      const [performers, gameSchedule, live] = await Promise.all([
        multiSportService.getTopPerformers(selectedSport, 'week'),
        multiSportService.getSchedule(selectedSport),
        multiSportService.getLiveGames(selectedSport)
      ]);

      setTopPerformers(performers);
      setSchedule(gameSchedule);
      setLiveGames(live);
    } catch (error) {
      console.error('Error loading sport-specific data:', error);
    }
  };

  const getSportIcon = (sport: string) => {
    const config = sportConfigs.find(c => c.id === sport);
    return config?.icon || '🏆';
  };

  const getSportColors = (sport: string) => {
    const config = sportConfigs.find(c => c.id === sport);
    return {
      primary: config?.primaryColor || '#3b82f6',
      secondary: config?.secondaryColor || '#1d4ed8'
    };
  };

  const formatGameTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const formatGameDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'LIVE': return <Play className="w-4 h-4 text-neon-green" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-gray-400" />;
      case 'POSTPONED': return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default: return <Clock className="w-4 h-4 text-neon-blue" />;
    }
  };

  const getPositionColor = (position: string, sport: string) => {
    // Sport-specific position colors
    const colorMap: Record<string, Record<string, string>> = {
      [SportType.NBA]: {
        'PG': 'neon-blue', 'SG': 'neon-green', 'SF': 'neon-yellow', 'PF': 'neon-purple', 'C': 'neon-red'
      },
      [SportType.NFL]: {
        'QB': 'neon-red', 'RB': 'neon-green', 'WR': 'neon-blue', 'TE': 'neon-yellow', 'K': 'neon-purple', 'DEF': 'neon-gold'
      },
      [SportType.NHL]: {
        'C': 'neon-blue', 'LW': 'neon-green', 'RW': 'neon-yellow', 'D': 'neon-purple', 'G': 'neon-red'
      },
      [SportType.MLB]: {
        'C': 'neon-red', '1B': 'neon-blue', '2B': 'neon-green', '3B': 'neon-yellow', 'SS': 'neon-purple', 'OF': 'neon-gold', 'SP': 'neon-blue', 'RP': 'neon-green'
      }
    };

    return colorMap[sport]?.[position] || 'neon-blue';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <GlassCard className="p-6">
              <div className="h-32 bg-white/10 rounded" />
            </GlassCard>
          </div>
        ))}
      </div>
    );
  }

  const selectedSportConfig = sportConfigs.find(c => c.id === selectedSport);

  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-neon-green/20 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-neon-green" />
                </div>
                Multi-Sport Hub
              </h1>
              <p className="text-gray-400">
                Fantasy leagues across NFL, NBA, MLB, and NHL
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {liveGames.length > 0 && (
                <div className="px-4 py-2 bg-neon-red/20 rounded-full border border-neon-red/30">
                  <span className="text-sm text-neon-red font-medium flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    {liveGames.length} Live Game{liveGames.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Sport Selector */}
          <div className="flex gap-3 mb-6">
            {sportConfigs.map((config) => (
              <button
                key={config.id}
                onClick={() => setSelectedSport(config.id)}
                disabled={!config.isActive}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${
                  selectedSport === config.id
                    ? 'bg-neon-blue/20 border border-neon-blue/30 text-neon-blue'
                    : config.isActive
                    ? 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                    : 'bg-gray-500/10 border border-gray-500/20 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span className="text-2xl">{config.icon}</span>
                <div className="text-left">
                  <div className="font-bold">{config.shortName}</div>
                  {!config.isActive && (
                    <div className="text-xs opacity-60">Off-season</div>
                  )}
                </div>
                {selectedSport === config.id && (
                  <div className="w-2 h-2 bg-neon-blue rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'players', label: 'Top Players', icon: Star },
              { key: 'schedule', label: 'Schedule', icon: Calendar },
              { key: 'stats', label: 'Stats', icon: Target }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === key
                    ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Sport Summary */}
                <div className="lg:col-span-2">
                  <GlassCard className="p-6 mb-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-4xl">{getSportIcon(selectedSport)}</div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {selectedSportConfig?.name}
                        </h2>
                        <p className="text-gray-400">
                          {selectedSportConfig?.season.currentSeason} Season
                          {selectedSportConfig?.season.currentWeek && 
                            ` • Week ${selectedSportConfig.season.currentWeek}`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-neon-green">{topPerformers.length}</div>
                        <div className="text-sm text-gray-400">Active Players</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-neon-blue">{schedule.length}</div>
                        <div className="text-sm text-gray-400">Upcoming Games</div>
                      </div>
                      <div className="text-center p-4 bg-white/5 rounded-lg">
                        <div className="text-2xl font-bold text-neon-red">{liveGames.length}</div>
                        <div className="text-sm text-gray-400">Live Games</div>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Top Performers Preview */}
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Medal className="w-5 h-5 text-neon-gold" />
                        Top Performers
                      </h3>
                      <NeonButton
                        variant="blue"
                        onClick={() => setActiveTab('players')}
                        className="text-sm"
                      >
                        View All
                      </NeonButton>
                    </div>

                    <div className="space-y-3">
                      {topPerformers.slice(0, 5).map((player, index) => (
                        <motion.div
                          key={player.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-neon-gold/20 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-bold text-neon-gold">#{index + 1}</span>
                            </div>
                            <div>
                              <div className="font-semibold text-white">{player.name}</div>
                              <div className="text-sm text-gray-400">{player.team} • {player.position}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-neon-green">{player.fantasyPoints?.toFixed(1)} pts</div>
                            <div className="text-xs text-gray-400">Avg/Game</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Live Games */}
                  {liveGames.length > 0 && (
                    <GlassCard className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Play className="w-5 h-5 text-neon-red" />
                        <h3 className="text-lg font-bold text-white">Live Now</h3>
                      </div>

                      <div className="space-y-3">
                        {liveGames.map((game) => (
                          <div key={game.id} className="p-3 bg-neon-red/10 border border-neon-red/30 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium text-white">
                                {game.awayTeam} @ {game.homeTeam}
                              </div>
                              <div className="px-2 py-1 bg-neon-red/20 rounded-full">
                                <span className="text-xs text-neon-red font-bold">LIVE</span>
                              </div>
                            </div>
                            {game.period && (
                              <div className="text-xs text-gray-400">
                                {game.period} {game.timeRemaining && `• ${game.timeRemaining}`}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  )}

                  {/* Upcoming Games */}
                  <GlassCard className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-neon-blue" />
                      <h3 className="text-lg font-bold text-white">Upcoming</h3>
                    </div>

                    <div className="space-y-3">
                      {schedule.slice(0, 5).map((game) => (
                        <div key={game.id} className="p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-medium text-white">
                              {game.awayTeam} @ {game.homeTeam}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              {getStatusIcon(game.status)}
                              <span>{formatGameDate(game.gameDate)}</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatGameTime(game.gameDate)}
                            {game.venue && ` • ${game.venue}`}
                          </div>
                        </div>
                      ))}
                    </div>

                    {schedule.length > 5 && (
                      <button
                        onClick={() => setActiveTab('schedule')}
                        className="w-full mt-3 text-sm text-neon-blue hover:text-white transition-colors"
                      >
                        View All Games →
                      </button>
                    )}
                  </GlassCard>

                  {/* Sport Info */}
                  <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4">League Info</h3>
                    
                    {selectedSportConfig && (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Season:</span>
                          <span className="text-white">{selectedSportConfig.season.currentSeason}</span>
                        </div>
                        
                        {selectedSportConfig.season.currentWeek && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Week:</span>
                            <span className="text-white">{selectedSportConfig.season.currentWeek}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Positions:</span>
                          <span className="text-white">{selectedSportConfig.positions.length}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-400">Roster Size:</span>
                          <span className="text-white">{selectedSportConfig.rosterSettings.totalSlots}</span>
                        </div>
                      </div>
                    )}
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'players' && (
            <motion.div
              key="players"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GlassCard className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Star className="w-6 h-6 text-neon-gold" />
                  Top Players - {selectedSportConfig?.shortName}
                </h2>

                <div className="grid gap-4">
                  {topPerformers.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-neon-blue/30 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-neon-gold/20 rounded-xl flex items-center justify-center">
                            <span className="font-bold text-neon-gold">#{index + 1}</span>
                          </div>
                          
                          <div>
                            <h3 className="text-lg font-bold text-white">{player.name}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                              <span>{player.team}</span>
                              <div className={`px-2 py-1 bg-${getPositionColor(player.position, selectedSport)}/20 rounded-full border border-${getPositionColor(player.position, selectedSport)}/30`}>
                                <span className={`text-${getPositionColor(player.position, selectedSport)} font-medium`}>
                                  {player.position}
                                </span>
                              </div>
                              {player.injuryStatus && (
                                <div className="px-2 py-1 bg-neon-red/20 rounded-full border border-neon-red/30">
                                  <span className="text-neon-red font-medium text-xs">
                                    {player.injuryStatus}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-2xl font-bold text-neon-green">
                            {player.fantasyPoints?.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-400">Fantasy Points</div>
                          {player.salary && (
                            <div className="text-sm text-neon-gold">
                              ${player.salary.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Player Stats Preview */}
                      {player.stats && Object.keys(player.stats).length > 0 && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            {Object.entries(player.stats).slice(0, 4).map(([stat, value]) => (
                              <div key={stat} className="text-center">
                                <div className="font-bold text-white">
                                  {typeof value === 'number' ? value.toFixed(1) : value}
                                </div>
                                <div className="text-xs text-gray-400 capitalize">
                                  {stat.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GlassCard className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-neon-blue" />
                  Game Schedule - {selectedSportConfig?.shortName}
                </h2>

                <div className="space-y-4">
                  {schedule.map((game, index) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border transition-all ${
                        game.status === 'LIVE'
                          ? 'bg-neon-red/10 border-neon-red/30'
                          : 'bg-white/5 border-white/10 hover:border-neon-blue/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(game.status)}
                          <div>
                            <h3 className="text-lg font-bold text-white">
                              {game.awayTeam} @ {game.homeTeam}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                              <span>{formatGameDate(game.gameDate)} at {formatGameTime(game.gameDate)}</span>
                              {game.venue && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {game.venue}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            game.status === 'LIVE' ? 'bg-neon-red/20 text-neon-red' :
                            game.status === 'COMPLETED' ? 'bg-gray-500/20 text-gray-400' :
                            game.status === 'POSTPONED' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-neon-blue/20 text-neon-blue'
                          }`}>
                            {game.status}
                          </div>
                          
                          {game.status === 'COMPLETED' && game.homeScore !== undefined && (
                            <div className="mt-2 text-lg font-bold text-white">
                              {game.awayScore} - {game.homeScore}
                            </div>
                          )}
                          
                          {game.status === 'LIVE' && game.period && (
                            <div className="mt-1 text-sm text-gray-400">
                              {game.period}
                              {game.timeRemaining && ` • ${game.timeRemaining}`}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Weather (for outdoor sports) */}
                      {game.weather && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>Weather:</span>
                            <span>{game.weather.temperature}°F</span>
                            <span>{game.weather.conditions}</span>
                            {game.weather.windSpeed && (
                              <span>Wind: {game.weather.windSpeed} mph</span>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {schedule.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Games Scheduled</h3>
                    <p className="text-gray-400">
                      Check back later for upcoming games
                    </p>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default MultiSportDashboard;