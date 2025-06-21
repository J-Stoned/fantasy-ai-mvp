"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Search, Mic, Bell, Settings, User, Activity, TrendingUp, 
  Users, Trophy, BarChart3, PieChart, LineChart, Timer, 
  Flame, Star, Play, Pause, Volume2, Heart, Share2,
  Zap, Target, Circle
} from 'lucide-react';

// Real MagicUI Components from MCP Server
import { 
  NumberTicker, 
  AnimatedGradientText, 
  MagicCard, 
  ShimmerButton, 
  SimpleBentoGrid as BentoGrid, 
  SimpleDock as Dock 
} from '@/components/magicui';
import { useLiveSportsData } from '@/hooks/useLiveSportsData';

const AnimatedGridPattern = () => (
  <div className="fixed inset-0 opacity-20">
    <div className="absolute inset-0" style={{
      backgroundImage: `
        linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
      `,
      backgroundSize: '50px 50px',
      animation: 'grid-move 20s linear infinite'
    }} />
    <style jsx>{`
      @keyframes grid-move {
        0% { transform: translate(0, 0); }
        100% { transform: translate(50px, 50px); }
      }
    `}</style>
  </div>
);

const FlickeringGrid = () => (
  <div className="fixed inset-0 opacity-30">
    <div className="absolute inset-0 grid grid-cols-20 grid-rows-20 gap-1">
      {Array.from({ length: 400 }).map((_, i) => (
        <div 
          key={i}
          className="w-1 h-1 bg-blue-400 rounded-full opacity-20"
          style={{
            animation: `flicker ${2 + Math.random() * 3}s infinite ${Math.random() * 2}s`
          }}
        />
      ))}
    </div>
    <style jsx>{`
      @keyframes flicker {
        0%, 100% { opacity: 0.1; }
        50% { opacity: 0.8; }
      }
    `}</style>
  </div>
);

const Meteors = ({ number = 20 }: { number?: number }) => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: number }).map((_, i) => (
      <div
        key={i}
        className="absolute h-0.5 w-0.5 bg-blue-400 shadow-lg"
        style={{
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animation: `meteor ${3 + Math.random() * 2}s linear infinite ${Math.random() * 2}s`
        }}
      />
    ))}
    <style jsx>{`
      @keyframes meteor {
        0% {
          transform: translateX(-100px) translateY(-100px);
          opacity: 0;
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          transform: translateX(300px) translateY(300px);
          opacity: 0;
        }
      }
    `}</style>
  </div>
);


export default function FantasyAISportsDashboard() {
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveStats, setLiveStats] = useState({
    activeUsers: 47823,
    todaysBets: 892341,
    liveGames: 12,
    aiPredictions: 156,
    totalWinnings: 2847293
  });

  // 🚀 LIVE SPORTS DATA - 30 second auto-refresh
  const { 
    players: livePlayerData, 
    isLoading: playersLoading, 
    isLive,
    lastUpdated 
  } = useLiveSportsData({ limit: 10 });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10) - 5,
        todaysBets: prev.todaysBets + Math.floor(Math.random() * 50),
        liveGames: 12,
        aiPredictions: prev.aiPredictions + Math.floor(Math.random() * 3),
        totalWinnings: prev.totalWinnings + Math.floor(Math.random() * 1000)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const startVoiceSearch = () => {
    setIsListening(true);
    // Voice recognition would go here
    setTimeout(() => setIsListening(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white overflow-hidden">
      {/* Animated Background Effects */}
      <AnimatedGridPattern />
      <FlickeringGrid />
      <Meteors number={15} />
      
      {/* Header Command Center */}
      <header className="relative z-50 p-6 border-b border-gray-700/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Brand Section */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  <AnimatedGradientText>Fantasy.AI</AnimatedGradientText>
                </h1>
                <p className="text-sm text-gray-400">Neural Sports Intelligence</p>
              </div>
            </div>

            {/* Quantum Search System */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search players, teams, stats, predictions..."
                  className="w-full pl-12 pr-12 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:border-blue-500/50 focus:outline-none backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/70"
                />
                <button
                  onClick={startVoiceSearch}
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-all duration-300 ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Control Panel */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-400">Live Time</div>
                <div className="text-lg font-mono">
                  {currentTime.toLocaleTimeString()}
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 relative">
                  <Bell className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center">3</div>
                </button>
                <button className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300">
                  <Settings className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-105 transition-all duration-300">
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="relative z-40 p-6 max-w-7xl mx-auto">
        
        {/* Live Stats Banner */}
        <div className="mb-8">
          <MagicCard className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">Live Fantasy Intelligence</h2>
                <p className="text-gray-400">Real-time sports data and AI predictions</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full animate-pulse ${isLive ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className={`text-sm ${isLive ? 'text-green-400' : 'text-yellow-400'}`}>
                  {isLive ? 'LIVE DATA' : 'MOCK DATA'}
                </span>
                {playersLoading && <span className="text-xs text-blue-400">Updating...</span>}
              </div>
            </div>
          </MagicCard>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MagicCard className="text-center">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                <NumberTicker value={livePlayerData.length > 0 ? livePlayerData.length * 2347 : liveStats.activeUsers} />
              </div>
              <div className="text-sm text-gray-400">
                {livePlayerData.length > 0 ? 'Live Players Tracked' : 'Active Users'}
              </div>
            </MagicCard>

            <MagicCard className="text-center">
              <Target className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                <NumberTicker value={liveStats.todaysBets} />
              </div>
              <div className="text-sm text-gray-400">Today's Bets</div>
            </MagicCard>

            <MagicCard className="text-center">
              <Activity className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                <NumberTicker value={liveStats.liveGames} />
              </div>
              <div className="text-sm text-gray-400">Live Games</div>
            </MagicCard>

            <MagicCard className="text-center">
              <Zap className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                <NumberTicker value={liveStats.aiPredictions} />
              </div>
              <div className="text-sm text-gray-400">AI Predictions</div>
            </MagicCard>

            <MagicCard className="text-center">
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                $<NumberTicker value={liveStats.totalWinnings} />
              </div>
              <div className="text-sm text-gray-400">Total Winnings</div>
            </MagicCard>
          </div>
        </div>

        {/* Main Content Grid */}
        <BentoGrid className="mb-8">
          {/* Live Games */}
          <MagicCard className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <Activity className="w-5 h-5 mr-2 text-red-500" />
                Live Games
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-500">LIVE</span>
              </div>
            </div>
                         <div className="space-y-3">
               {[
                 { home: "Lakers", away: "Warriors", score: "98-92", time: "Q3 8:42", sport: "🏀" },
                 { home: "Chiefs", away: "Bills", score: "21-14", time: "Q2 12:33", sport: "🏈" },
                 { home: "Yankees", away: "Red Sox", score: "7-4", time: "T8", sport: "⚾" }
               ].map((game, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                   <div className="flex items-center space-x-3">
                     <span className="text-lg">{game.sport}</span>
                     <div>
                       <div className="font-medium">{game.home} vs {game.away}</div>
                       <div className="text-sm text-gray-400">{game.time}</div>
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="text-lg font-bold">{game.score}</div>
                   </div>
                 </div>
               ))}
             </div>
          </MagicCard>

          {/* AI Predictions */}
          <MagicCard>
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-purple-500" />
              AI Predictions
            </h3>
            <div className="space-y-3">
              {[
                { player: "L. James", prediction: "32+ PTS", confidence: 87 },
                { player: "S. Curry", prediction: "6+ 3PM", confidence: 92 },
                { player: "J. Allen", prediction: "12+ REB", confidence: 78 }
              ].map((pred, i) => (
                <div key={i} className="p-3 bg-gray-800/30 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{pred.player}</span>
                    <span className="text-sm text-green-400">{pred.confidence}%</span>
                  </div>
                  <div className="text-sm text-gray-400">{pred.prediction}</div>
                  <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-1 rounded-full"
                      style={{ width: `${pred.confidence}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </MagicCard>

          {/* Quick Actions */}
          <MagicCard>
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <ShimmerButton className="w-full">
                <LineChart className="w-4 h-4 mr-2" />
                View Analytics
              </ShimmerButton>
              <ShimmerButton className="w-full">
                <Users className="w-4 h-4 mr-2" />
                Join Draft
              </ShimmerButton>
              <ShimmerButton className="w-full">
                <Target className="w-4 h-4 mr-2" />
                Place Bet
              </ShimmerButton>
            </div>
          </MagicCard>
        </BentoGrid>

      </main>

      {/* Floating Dock Navigation */}
      <Dock>
        <button className="p-3 rounded-xl hover:bg-gray-700/50 transition-all duration-300">
          <BarChart3 className="w-5 h-5" />
        </button>
        <button className="p-3 rounded-xl hover:bg-gray-700/50 transition-all duration-300">
          <Trophy className="w-5 h-5" />
        </button>
        <button className="p-3 rounded-xl bg-blue-600 text-white">
          <Activity className="w-5 h-5" />
        </button>
        <button className="p-3 rounded-xl hover:bg-gray-700/50 transition-all duration-300">
          <Users className="w-5 h-5" />
        </button>
        <button className="p-3 rounded-xl hover:bg-gray-700/50 transition-all duration-300">
          <Settings className="w-5 h-5" />
        </button>
      </Dock>
    </div>
  );
}