"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { 
  Play, 
  Users, 
  Settings, 
  Trophy,
  Target,
  TrendingUp,
  Star,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Clock,
  Zap,
  RefreshCw
} from "lucide-react";

interface MockDraftSettings {
  sport: string;
  draftType: string;
  teamCount: number;
  rounds: number;
  userPosition: number;
  scoring: string;
}

interface DraftedPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  round: number;
  pick: number;
  adp: number;
  projectedPoints: number;
}

interface MockDraftResult {
  userTeam: DraftedPlayer[];
  allPicks: Array<{
    round: number;
    pick: number;
    player: DraftedPlayer;
    drafter: string;
  }>;
  analysis: {
    grade: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
}

interface MockDraftSimulatorProps {
  onStartLiveDraft: () => void;
}

export function MockDraftSimulator({ onStartLiveDraft }: MockDraftSimulatorProps) {
  const [settings, setSettings] = useState<MockDraftSettings>({
    sport: 'FOOTBALL',
    draftType: 'PPR',
    teamCount: 12,
    rounds: 15,
    userPosition: 6,
    scoring: 'PPR'
  });

  const [isDrafting, setIsDrafting] = useState(false);
  const [draftProgress, setDraftProgress] = useState(0);
  const [currentPick, setCurrentPick] = useState({ round: 0, pick: 0 });
  const [result, setResult] = useState<MockDraftResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [recentMockDrafts, setRecentMockDrafts] = useState<MockDraftResult[]>([]);

  useEffect(() => {
    // Load recent mock drafts from localStorage or API
    const mockResults: MockDraftResult[] = [
      {
        userTeam: [
          {
            id: '1',
            name: 'Josh Allen',
            position: 'QB',
            team: 'BUF',
            round: 1,
            pick: 6,
            adp: 3.8,
            projectedPoints: 312.6
          },
          {
            id: '2',
            name: 'Saquon Barkley',
            position: 'RB',
            team: 'NYG',
            round: 2,
            pick: 19,
            adp: 18.2,
            projectedPoints: 245.3
          }
        ],
        allPicks: [],
        analysis: {
          grade: 'B+',
          score: 87,
          strengths: ['Strong QB play', 'Good value picks'],
          weaknesses: ['Weak at RB depth'],
          recommendations: ['Target RB handcuffs', 'Stream defenses']
        }
      }
    ];
    setRecentMockDrafts(mockResults);
  }, []);

  const startMockDraft = async () => {
    setIsDrafting(true);
    setDraftProgress(0);
    setCurrentPick({ round: 1, pick: 1 });
    setResult(null);

    // Simulate draft progression
    const totalPicks = settings.teamCount * settings.rounds;
    let currentPickNumber = 1;

    const interval = setInterval(() => {
      const round = Math.ceil(currentPickNumber / settings.teamCount);
      const pickInRound = ((currentPickNumber - 1) % settings.teamCount) + 1;
      
      setCurrentPick({ round, pick: pickInRound });
      setDraftProgress((currentPickNumber / totalPicks) * 100);
      
      currentPickNumber++;
      
      if (currentPickNumber > totalPicks) {
        clearInterval(interval);
        completeMockDraft();
      }
    }, 150); // Fast simulation
  };

  const completeMockDraft = () => {
    const mockResult: MockDraftResult = {
      userTeam: [
        {
          id: '1',
          name: 'Christian McCaffrey',
          position: 'RB',
          team: 'SF',
          round: 1,
          pick: settings.userPosition,
          adp: 1.2,
          projectedPoints: 285.4
        },
        {
          id: '2',
          name: 'Stefon Diggs',
          position: 'WR',
          team: 'BUF',
          round: 2,
          pick: settings.teamCount * 2 - settings.userPosition + 1,
          adp: 15.7,
          projectedPoints: 234.8
        },
        {
          id: '3',
          name: 'Travis Kelce',
          position: 'TE',
          team: 'KC',
          round: 3,
          pick: settings.userPosition + (settings.teamCount * 2),
          adp: 8.9,
          projectedPoints: 198.7
        },
        {
          id: '4',
          name: 'Josh Allen',
          position: 'QB',
          team: 'BUF',
          round: 4,
          pick: settings.teamCount * 4 - settings.userPosition + 1,
          adp: 3.8,
          projectedPoints: 312.6
        },
        {
          id: '5',
          name: 'Joe Mixon',
          position: 'RB',
          team: 'CIN',
          round: 5,
          pick: settings.userPosition + (settings.teamCount * 4),
          adp: 45.3,
          projectedPoints: 198.2
        }
      ],
      allPicks: [],
      analysis: {
        grade: 'A-',
        score: 91,
        strengths: [
          'Elite RB1 foundation',
          'Top-tier TE advantage',
          'QB1 upside',
          'Good value in middle rounds'
        ],
        weaknesses: [
          'Thin RB depth',
          'No WR depth',
          'Late-round concerns'
        ],
        recommendations: [
          'Prioritize RB handcuffs on waivers',
          'Stream defenses weekly',
          'Target WR sleepers in later rounds',
          'Consider trading TE for RB depth'
        ]
      }
    };

    setResult(mockResult);
    setIsDrafting(false);
    setRecentMockDrafts(prev => [mockResult, ...prev.slice(0, 4)]);
  };

  const resetDraft = () => {
    setResult(null);
    setDraftProgress(0);
    setCurrentPick({ round: 0, pick: 0 });
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-neon-green';
    if (grade.startsWith('B')) return 'text-neon-blue';
    if (grade.startsWith('C')) return 'text-neon-yellow';
    return 'text-neon-red';
  };

  const getPositionCounts = (team: DraftedPlayer[]) => {
    const counts: Record<string, number> = {};
    team.forEach(player => {
      counts[player.position] = (counts[player.position] || 0) + 1;
    });
    return counts;
  };

  if (isDrafting) {
    return (
      <div className="space-y-6">
        <GlassCard className="p-8 text-center">
          <motion.div
            className="w-20 h-20 mx-auto mb-6 bg-neon-blue/20 rounded-full flex items-center justify-center"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity 
            }}
          >
            <Play className="w-10 h-10 text-neon-blue" />
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-4">
            Simulating Mock Draft...
          </h2>
          
          <p className="text-gray-400 mb-6">
            Round {currentPick.round}, Pick {currentPick.pick}
          </p>

          <div className="w-full bg-white/10 rounded-full h-3 mb-4">
            <motion.div 
              className="bg-neon-blue h-3 rounded-full transition-all duration-300"
              style={{ width: `${draftProgress}%` }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>

          <div className="text-sm text-gray-400">
            {draftProgress.toFixed(0)}% Complete
          </div>
        </GlassCard>
      </div>
    );
  }

  if (result) {
    const positionCounts = getPositionCounts(result.userTeam);
    
    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Mock Draft Results
            </h2>
            <p className="text-gray-400">
              {settings.teamCount}-team {settings.draftType} league • Position {settings.userPosition}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getGradeColor(result.analysis.grade)}`}>
                {result.analysis.grade}
              </div>
              <div className="text-sm text-gray-400">Grade</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {result.analysis.score}
              </div>
              <div className="text-sm text-gray-400">Score</div>
            </div>
            
            <NeonButton
              variant="blue"
              onClick={resetDraft}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              New Draft
            </NeonButton>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Your Team */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  Your Team
                </h3>
                
                {/* Position Summary */}
                <div className="flex items-center gap-4 text-sm">
                  {Object.entries(positionCounts).map(([position, count]) => (
                    <div key={position} className="text-center">
                      <div className="font-bold text-white">{count}</div>
                      <div className="text-gray-400">{position}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {result.userTeam.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-white/5 border border-white/10 rounded-lg hover:border-neon-blue/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neon-blue/20 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-neon-blue">
                            {player.position}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {player.name}
                          </div>
                          <div className="text-sm text-gray-400">
                            {player.team} • ADP: {player.adp.toFixed(1)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {player.projectedPoints.toFixed(1)} pts
                        </div>
                        <div className="text-sm text-gray-400">
                          R{player.round}.{player.pick}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-neon-green">
                          Value
                        </div>
                        <div className="text-xs text-gray-400">
                          +{((player.adp - player.pick) * 2).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">
                      Projected Total Points
                    </div>
                    <div className="text-sm text-gray-400">
                      Based on current projections
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-neon-green">
                    {result.userTeam.reduce((sum, player) => sum + player.projectedPoints, 0).toFixed(1)}
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Analysis */}
          <div className="space-y-4">
            {/* Grade */}
            <GlassCard className="p-4 text-center">
              <div className={`text-4xl font-bold mb-2 ${getGradeColor(result.analysis.grade)}`}>
                {result.analysis.grade}
              </div>
              <div className="text-white font-semibold mb-1">
                Draft Grade
              </div>
              <div className="text-sm text-gray-400">
                Score: {result.analysis.score}/100
              </div>
            </GlassCard>

            {/* Strengths */}
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-neon-green" />
                <h4 className="font-bold text-white">Strengths</h4>
              </div>
              <div className="space-y-2">
                {result.analysis.strengths.map((strength, index) => (
                  <div key={index} className="text-sm text-gray-300 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-neon-green rounded-full mt-2 flex-shrink-0" />
                    {strength}
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Weaknesses */}
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-neon-yellow" />
                <h4 className="font-bold text-white">Areas to Improve</h4>
              </div>
              <div className="space-y-2">
                {result.analysis.weaknesses.map((weakness, index) => (
                  <div key={index} className="text-sm text-gray-300 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-neon-yellow rounded-full mt-2 flex-shrink-0" />
                    {weakness}
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Recommendations */}
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-neon-blue" />
                <h4 className="font-bold text-white">Recommendations</h4>
              </div>
              <div className="space-y-2">
                {result.analysis.recommendations.map((rec, index) => (
                  <div key={index} className="text-sm text-gray-300 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-neon-blue rounded-full mt-2 flex-shrink-0" />
                    {rec}
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Action Buttons */}
            <div className="space-y-2">
              <NeonButton
                variant="green"
                onClick={onStartLiveDraft}
                className="w-full flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Live Draft
              </NeonButton>
              
              <NeonButton
                variant="blue"
                onClick={startMockDraft}
                className="w-full flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Run Another Mock
              </NeonButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Mock Draft Simulator
          </h2>
          <p className="text-gray-400">
            Practice your draft strategy with AI opponents
          </p>
        </div>
        
        <NeonButton
          variant="blue"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </NeonButton>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <GlassCard className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Draft Settings
              </h3>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sport
                  </label>
                  <select
                    value={settings.sport}
                    onChange={(e) => setSettings(prev => ({ ...prev, sport: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue/50"
                  >
                    <option value="FOOTBALL">Football</option>
                    <option value="BASKETBALL">Basketball</option>
                    <option value="BASEBALL">Baseball</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Scoring
                  </label>
                  <select
                    value={settings.draftType}
                    onChange={(e) => setSettings(prev => ({ ...prev, draftType: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue/50"
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="PPR">PPR</option>
                    <option value="HALF_PPR">Half PPR</option>
                    <option value="SUPERFLEX">Superflex</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Teams
                  </label>
                  <select
                    value={settings.teamCount}
                    onChange={(e) => setSettings(prev => ({ ...prev, teamCount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue/50"
                  >
                    <option value={8}>8 Teams</option>
                    <option value={10}>10 Teams</option>
                    <option value={12}>12 Teams</option>
                    <option value={14}>14 Teams</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rounds
                  </label>
                  <select
                    value={settings.rounds}
                    onChange={(e) => setSettings(prev => ({ ...prev, rounds: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue/50"
                  >
                    <option value={15}>15 Rounds</option>
                    <option value={16}>16 Rounds</option>
                    <option value={17}>17 Rounds</option>
                    <option value={20}>20 Rounds</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Position
                  </label>
                  <select
                    value={settings.userPosition}
                    onChange={(e) => setSettings(prev => ({ ...prev, userPosition: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-blue/50"
                  >
                    {Array.from({ length: settings.teamCount }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Position {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mock Draft Card */}
      <GlassCard className="p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-neon-purple/20 rounded-full flex items-center justify-center">
          <Trophy className="w-10 h-10 text-neon-purple" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-4">
          Ready to Draft?
        </h3>
        
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Test your draft strategy against AI opponents in a {settings.teamCount}-team {settings.draftType} league. 
          You'll draft from position {settings.userPosition}.
        </p>

        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-neon-blue" />
            <span className="text-sm text-gray-400">
              {settings.teamCount} Teams
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-neon-green" />
            <span className="text-sm text-gray-400">
              ~2 minutes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-neon-yellow" />
            <span className="text-sm text-gray-400">
              Position {settings.userPosition}
            </span>
          </div>
        </div>

        <NeonButton
          variant="purple"
          onClick={startMockDraft}
          className="flex items-center gap-2 mx-auto"
        >
          <Play className="w-4 h-4" />
          Start Mock Draft
        </NeonButton>
      </GlassCard>

      {/* Recent Mock Drafts */}
      {recentMockDrafts.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4">
            Recent Mock Drafts
          </h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentMockDrafts.slice(0, 3).map((mockDraft, index) => (
              <GlassCard key={index} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`text-xl font-bold ${getGradeColor(mockDraft.analysis.grade)}`}>
                    {mockDraft.analysis.grade}
                  </div>
                  <div className="text-sm text-gray-400">
                    {mockDraft.userTeam.length} players
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {mockDraft.userTeam.slice(0, 3).map((player) => (
                    <div key={player.id} className="text-sm text-white">
                      {player.name} ({player.position})
                    </div>
                  ))}
                  {mockDraft.userTeam.length > 3 && (
                    <div className="text-xs text-gray-400">
                      +{mockDraft.userTeam.length - 3} more players
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-400">
                  Score: {mockDraft.analysis.score}/100
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MockDraftSimulator;