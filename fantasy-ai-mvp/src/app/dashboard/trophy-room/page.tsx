'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Star,
  Crown,
  Zap,
  TrendingUp,
  Medal,
  Target,
  Flame,
  Award,
  Shield,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle
} from 'lucide-react';

interface TrophyData {
  id: string;
  type: 'championship' | 'weekly' | 'achievement' | 'milestone';
  name: string;
  description: string;
  dateEarned: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points?: number;
  season?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  progress: number;
  total: number;
  completed: boolean;
  reward: string;
}

// Sample trophy data
const trophies: TrophyData[] = [
  { id: '1', type: 'championship', name: '2023 League Champion', description: 'Dominated with a 12-2 record', dateEarned: '2023-12-24', rarity: 'legendary', season: '2023' },
  { id: '2', type: 'weekly', name: 'Week 8 High Score', description: 'Scored 192 points', dateEarned: '2023-10-29', rarity: 'epic', points: 192 },
  { id: '3', type: 'achievement', name: 'Perfect Lineup', description: 'Every starter outscored bench', dateEarned: '2023-10-15', rarity: 'rare' },
  { id: '4', type: 'milestone', name: '100 Wins', description: 'Career milestone achieved', dateEarned: '2023-11-20', rarity: 'epic' },
  { id: '5', type: 'weekly', name: 'Comeback King', description: 'Won after trailing by 40+', dateEarned: '2023-09-17', rarity: 'rare' },
  { id: '6', type: 'achievement', name: 'Trade Master', description: 'Completed 10 successful trades', dateEarned: '2023-11-05', rarity: 'common' },
];

const achievements: Achievement[] = [
  { id: '1', name: 'Dynasty Builder', description: 'Win 3 championships', progress: 1, total: 3, completed: false, reward: 'Legendary Trophy' },
  { id: '2', name: 'Perfect Season', description: 'Go undefeated in regular season', progress: 0, total: 1, completed: false, reward: 'Elite Badge' },
  { id: '3', name: 'Point Machine', description: 'Score 2000+ points in a season', progress: 1689, total: 2000, completed: false, reward: 'Scoring Crown' },
  { id: '4', name: 'Waiver Warrior', description: 'Pick up 50 waiver players', progress: 38, total: 50, completed: false, reward: 'Diamond Badge' },
];

const seasonStats = {
  currentSeason: {
    wins: 8,
    losses: 2,
    pointsFor: 1456.8,
    pointsAgainst: 1298.4,
    rank: 2,
    trophiesEarned: 4
  },
  allTime: {
    wins: 112,
    losses: 68,
    championships: 1,
    weeklyHighs: 18,
    perfectLineups: 7,
    totalTrophies: 23
  }
};

export default function TrophyRoomPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTrophy, setSelectedTrophy] = useState<TrophyData | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | '3d'>('grid');
  const animationRef = useRef<number>();

  // Simple 3D animation using Canvas (in production, would use Three.js)
  useEffect(() => {
    if (viewMode !== '3d' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    let rotation = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw rotating trophy (simplified 2D representation)
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rotation);
      
      // Trophy base
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-40, 20, 80, 20);
      
      // Trophy cup
      ctx.beginPath();
      ctx.moveTo(-30, -30);
      ctx.lineTo(30, -30);
      ctx.lineTo(20, 20);
      ctx.lineTo(-20, 20);
      ctx.closePath();
      ctx.fill();
      
      // Handles
      ctx.beginPath();
      ctx.arc(-35, -10, 15, 0, Math.PI * 2);
      ctx.arc(35, -10, 15, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 5;
      ctx.stroke();
      
      ctx.restore();
      
      rotation += 0.02;
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [viewMode]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-600 to-yellow-400';
      case 'epic': return 'from-purple-600 to-purple-400';
      case 'rare': return 'from-blue-600 to-blue-400';
      default: return 'from-gray-600 to-gray-400';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Crown className="h-4 w-4" />;
      case 'epic': return <Star className="h-4 w-4" />;
      case 'rare': return <Sparkles className="h-4 w-4" />;
      default: return <Medal className="h-4 w-4" />;
    }
  };

  const playSound = (type: string) => {
    if (!soundEnabled) return;
    // In production, would play actual sound effects
    console.log(`Playing ${type} sound`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Trophy Room</h1>
          <p className="text-gray-400 mt-1">Your achievements and glory</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="border-gray-700"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <div className="flex gap-2 p-1 bg-gray-900 rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </Button>
            <Button
              variant={viewMode === '3d' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('3d')}
            >
              3D View
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border-yellow-800/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <span className="text-2xl font-bold text-white">{seasonStats.allTime.championships}</span>
            </div>
            <p className="text-sm text-gray-400">Championships</p>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 border-purple-800/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Star className="h-8 w-8 text-purple-500" />
              <span className="text-2xl font-bold text-white">{seasonStats.allTime.totalTrophies}</span>
            </div>
            <p className="text-sm text-gray-400">Total Trophies</p>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border-blue-800/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold text-white">{seasonStats.allTime.wins}</span>
            </div>
            <p className="text-sm text-gray-400">Career Wins</p>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-900/20 to-green-800/20 border-green-800/50">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Flame className="h-8 w-8 text-green-500" />
              <span className="text-2xl font-bold text-white">{seasonStats.currentSeason.wins}-{seasonStats.currentSeason.losses}</span>
            </div>
            <p className="text-sm text-gray-400">Current Season</p>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="trophies" className="space-y-6">
        <TabsList className="bg-gray-900/50 border border-gray-800">
          <TabsTrigger value="trophies">Trophy Collection</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Hall of Fame</TabsTrigger>
        </TabsList>

        <TabsContent value="trophies">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trophies.map(trophy => (
                <Card
                  key={trophy.id}
                  className="bg-gray-900/50 border-gray-800 cursor-pointer hover:border-gray-600 transition-all hover:scale-105"
                  onClick={() => {
                    setSelectedTrophy(trophy);
                    playSound('select');
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${getRarityColor(trophy.rarity)}`}>
                        {trophy.type === 'championship' && <Crown className="h-6 w-6 text-white" />}
                        {trophy.type === 'weekly' && <Trophy className="h-6 w-6 text-white" />}
                        {trophy.type === 'achievement' && <Award className="h-6 w-6 text-white" />}
                        {trophy.type === 'milestone' && <Target className="h-6 w-6 text-white" />}
                      </div>
                      <Badge className={`bg-gradient-to-r ${getRarityColor(trophy.rarity)} text-white border-0`}>
                        {getRarityIcon(trophy.rarity)}
                        <span className="ml-1 capitalize">{trophy.rarity}</span>
                      </Badge>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-white mb-1">{trophy.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{trophy.description}</p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{new Date(trophy.dateEarned).toLocaleDateString()}</span>
                      {trophy.points && (
                        <span className="text-yellow-500 font-semibold">{trophy.points} pts</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-900/50 border-gray-800">
              <div className="p-8">
                <canvas
                  ref={canvasRef}
                  className="w-full h-96 bg-gray-950 rounded-lg"
                />
                <p className="text-center text-gray-400 mt-4">
                  3D Trophy Showcase (In production, this would be an interactive Three.js scene)
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="achievements">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {achievements.map(achievement => (
              <Card key={achievement.id} className="bg-gray-900/50 border-gray-800">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{achievement.name}</h3>
                      <p className="text-sm text-gray-400">{achievement.description}</p>
                    </div>
                    {achievement.completed ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <Shield className="h-6 w-6 text-gray-600" />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">{achievement.progress}/{achievement.total}</span>
                    </div>
                    <Progress value={(achievement.progress / achievement.total) * 100} className="h-2" />
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {achievement.reward}
                    </Badge>
                    {!achievement.completed && (
                      <span className="text-xs text-gray-500">
                        {((achievement.progress / achievement.total) * 100).toFixed(0)}% complete
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card className="bg-gray-900/50 border-gray-800">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Hall of Fame</h3>
              
              <div className="space-y-4">
                {[
                  { rank: 1, name: 'Algorithm Assassins', championships: 3, wins: 156, winRate: 72.2 },
                  { rank: 2, name: 'Data Destroyers', championships: 2, wins: 142, winRate: 68.9 },
                  { rank: 3, name: 'You', championships: 1, wins: 112, winRate: 62.2, isUser: true },
                  { rank: 4, name: 'Trophy Hunters', championships: 1, wins: 108, winRate: 61.4 },
                  { rank: 5, name: 'Dynasty Builders', championships: 1, wins: 98, winRate: 58.3 },
                ].map(entry => (
                  <div
                    key={entry.rank}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      entry.isUser ? 'bg-blue-900/20 border border-blue-800' : 'bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${
                        entry.rank === 1 ? 'text-yellow-500' :
                        entry.rank === 2 ? 'text-gray-400' :
                        entry.rank === 3 ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        #{entry.rank}
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          {entry.name}
                          {entry.isUser && <span className="text-blue-400 ml-2">(You)</span>}
                        </p>
                        <p className="text-sm text-gray-400">
                          {entry.championships} championship{entry.championships !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">{entry.wins} wins</p>
                      <p className="text-sm text-gray-400">{entry.winRate}% win rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trophy Detail Modal */}
      {selectedTrophy && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTrophy(null)}
        >
          <Card
            className="bg-gray-900 border-gray-800 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-4 rounded-xl bg-gradient-to-br ${getRarityColor(selectedTrophy.rarity)}`}>
                  {selectedTrophy.type === 'championship' && <Crown className="h-12 w-12 text-white" />}
                  {selectedTrophy.type === 'weekly' && <Trophy className="h-12 w-12 text-white" />}
                  {selectedTrophy.type === 'achievement' && <Award className="h-12 w-12 text-white" />}
                  {selectedTrophy.type === 'milestone' && <Target className="h-12 w-12 text-white" />}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTrophy(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </Button>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">{selectedTrophy.name}</h2>
              <p className="text-gray-400 mb-4">{selectedTrophy.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-sm text-gray-400">Date Earned</span>
                  <span className="text-sm font-medium text-white">
                    {new Date(selectedTrophy.dateEarned).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                  <span className="text-sm text-gray-400">Rarity</span>
                  <Badge className={`bg-gradient-to-r ${getRarityColor(selectedTrophy.rarity)} text-white border-0`}>
                    {getRarityIcon(selectedTrophy.rarity)}
                    <span className="ml-1 capitalize">{selectedTrophy.rarity}</span>
                  </Badge>
                </div>
                
                {selectedTrophy.points && (
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-sm text-gray-400">Points Scored</span>
                    <span className="text-sm font-medium text-yellow-500">{selectedTrophy.points}</span>
                  </div>
                )}
                
                {selectedTrophy.season && (
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-sm text-gray-400">Season</span>
                    <span className="text-sm font-medium text-white">{selectedTrophy.season}</span>
                  </div>
                )}
              </div>
              
              <Button
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={() => {
                  playSound('share');
                  // Share functionality
                }}
              >
                <Zap className="h-4 w-4 mr-2" />
                Share Trophy
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}