'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import {
  Users,
  TrendingUp,
  AlertCircle,
  Zap,
  Trophy,
  Activity,
  Cloud,
  Target,
  Brain,
  ArrowUpDown
} from 'lucide-react';

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  opponent: string;
  projectedPoints: number;
  status: 'healthy' | 'questionable' | 'doubtful' | 'out';
  trend: 'up' | 'down' | 'stable';
  ownership: number;
  weather?: 'clear' | 'rain' | 'snow' | 'wind';
}

// Sample players data
const samplePlayers: Player[] = [
  { id: '1', name: 'Patrick Mahomes', position: 'QB', team: 'KC', opponent: 'vs BUF', projectedPoints: 28.5, status: 'healthy', trend: 'up', ownership: 95 },
  { id: '2', name: 'Christian McCaffrey', position: 'RB', team: 'SF', opponent: '@ SEA', projectedPoints: 22.3, status: 'questionable', trend: 'stable', ownership: 98 },
  { id: '3', name: 'Austin Ekeler', position: 'RB', team: 'LAC', opponent: 'vs DEN', projectedPoints: 18.7, status: 'healthy', trend: 'up', ownership: 88 },
  { id: '4', name: 'Tyreek Hill', position: 'WR', team: 'MIA', opponent: '@ NYJ', projectedPoints: 19.8, status: 'healthy', trend: 'up', ownership: 96, weather: 'rain' },
  { id: '5', name: 'Stefon Diggs', position: 'WR', team: 'BUF', opponent: '@ KC', projectedPoints: 17.2, status: 'healthy', trend: 'stable', ownership: 92 },
  { id: '6', name: 'CeeDee Lamb', position: 'WR', team: 'DAL', opponent: 'vs PHI', projectedPoints: 16.8, status: 'healthy', trend: 'down', ownership: 94 },
  { id: '7', name: 'Travis Kelce', position: 'TE', team: 'KC', opponent: 'vs BUF', projectedPoints: 15.4, status: 'healthy', trend: 'stable', ownership: 99 },
  { id: '8', name: 'Ravens D/ST', position: 'DEF', team: 'BAL', opponent: 'vs CLE', projectedPoints: 9.2, status: 'healthy', trend: 'up', ownership: 45 },
  { id: '9', name: 'Justin Tucker', position: 'K', team: 'BAL', opponent: 'vs CLE', projectedPoints: 8.8, status: 'healthy', trend: 'stable', ownership: 78 },
  // Bench players
  { id: '10', name: 'Joe Mixon', position: 'RB', team: 'CIN', opponent: '@ TEN', projectedPoints: 14.2, status: 'healthy', trend: 'down', ownership: 82 },
  { id: '11', name: 'DeAndre Hopkins', position: 'WR', team: 'TEN', opponent: 'vs CIN', projectedPoints: 12.5, status: 'healthy', trend: 'up', ownership: 68 },
  { id: '12', name: 'George Kittle', position: 'TE', team: 'SF', opponent: '@ SEA', projectedPoints: 11.8, status: 'doubtful', trend: 'down', ownership: 85 },
];

const lineupPositions = [
  { slot: 'QB', required: 1 },
  { slot: 'RB', required: 2 },
  { slot: 'WR', required: 3 },
  { slot: 'TE', required: 1 },
  { slot: 'FLEX', required: 1, eligible: ['RB', 'WR', 'TE'] },
  { slot: 'DEF', required: 1 },
  { slot: 'K', required: 1 },
];

function SortablePlayer({ player, isStarter }: { player: Player; isStarter: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusColors = {
    healthy: 'text-green-500',
    questionable: 'text-yellow-500',
    doubtful: 'text-orange-500',
    out: 'text-red-500',
  };

  const trendIcons = {
    up: <TrendingUp className="h-4 w-4 text-green-500" />,
    down: <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />,
    stable: <Activity className="h-4 w-4 text-gray-500" />,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 rounded-lg border transition-all cursor-move hover:shadow-lg ${
        isStarter ? 'bg-gray-900 border-blue-800' : 'bg-gray-900/50 border-gray-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowUpDown className="h-4 w-4 text-gray-500" />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-white">{player.name}</p>
              <Badge variant="secondary" className="text-xs">
                {player.position}
              </Badge>
              {player.weather && (
                <Cloud className="h-4 w-4 text-blue-400" />
              )}
            </div>
            <p className="text-sm text-gray-400">
              {player.team} {player.opponent}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-lg font-bold text-white">{player.projectedPoints}</p>
            <p className="text-xs text-gray-400">proj pts</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            {trendIcons[player.trend]}
            <span className={`text-xs ${statusColors[player.status]}`}>
              {player.status === 'healthy' ? '✓' : player.status.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LineupBuilderPage() {
  const [players, setPlayers] = useState(samplePlayers);
  const [optimizing, setOptimizing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const starters = players.slice(0, 9);
  const bench = players.slice(9);
  const totalProjected = starters.reduce((sum, p) => sum + p.projectedPoints, 0);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setPlayers((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const optimizeLineup = async () => {
    setOptimizing(true);
    // Simulate AI optimization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Sort players by projected points within position groups
    const optimized = [...players].sort((a, b) => {
      if (a.position !== b.position) {
        const posOrder = ['QB', 'RB', 'WR', 'TE', 'DEF', 'K'];
        return posOrder.indexOf(a.position) - posOrder.indexOf(b.position);
      }
      return b.projectedPoints - a.projectedPoints;
    });
    
    setPlayers(optimized);
    setOptimizing(false);
  };

  const getLineupScore = () => {
    const maxPossible = 180;
    const score = (totalProjected / maxPossible) * 100;
    return Math.min(score, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Interactive Lineup Builder</h1>
          <p className="text-gray-400 mt-1">Drag and drop to optimize your lineup</p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={optimizeLineup}
            disabled={optimizing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {optimizing ? (
              <>
                <Brain className="h-4 w-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                AI Optimize
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Lineup Score Card */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-800/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Lineup Score</h3>
              <p className="text-sm text-gray-400">AI-powered lineup analysis</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">{totalProjected.toFixed(1)}</p>
              <p className="text-sm text-gray-400">projected points</p>
            </div>
          </div>
          <Progress value={getLineupScore()} className="h-3 mb-2" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Lineup Strength</span>
            <span className={`font-semibold ${getLineupScore() > 80 ? 'text-green-500' : getLineupScore() > 60 ? 'text-yellow-500' : 'text-red-500'}`}>
              {getLineupScore() > 80 ? 'Excellent' : getLineupScore() > 60 ? 'Good' : 'Needs Work'}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Starting Lineup */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900/50 border-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Starting Lineup
                </h3>
                <Badge variant="secondary" className="bg-blue-900/50 text-blue-400">
                  {starters.length}/9 slots filled
                </Badge>
              </div>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={players}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {starters.map((player) => (
                      <SortablePlayer key={player.id} player={player} isStarter={true} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </Card>
        </div>

        {/* Bench & Analysis */}
        <div className="space-y-6">
          {/* Bench */}
          <Card className="bg-gray-900/50 border-gray-800">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                Bench
              </h3>
              <div className="space-y-3">
                {bench.map((player) => (
                  <SortablePlayer key={player.id} player={player} isStarter={false} />
                ))}
              </div>
            </div>
          </Card>

          {/* AI Insights */}
          <Card className="bg-gray-900/50 border-gray-800">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-500" />
                AI Insights
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-400">Injury Alert</p>
                      <p className="text-xs text-gray-400">McCaffrey is questionable. Consider starting Mixon.</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-blue-900/20 border border-blue-800/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Cloud className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-400">Weather Impact</p>
                      <p className="text-xs text-gray-400">Rain expected for MIA @ NYJ. May affect passing game.</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-green-900/20 border border-green-800/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-400">Matchup Advantage</p>
                      <p className="text-xs text-gray-400">Ravens D/ST has elite matchup vs struggling CLE offense.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}