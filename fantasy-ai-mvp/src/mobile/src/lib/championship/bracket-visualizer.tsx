/**
 * Playoff Bracket Visualizer
 * 
 * Interactive React component for visualizing championship paths,
 * playoff probabilities, and tournament bracket scenarios.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  Easing
} from 'react-native-reanimated';
import { Svg, Path, Circle, Text as SvgText, Line } from 'react-native-svg';

import { ChampionshipProbability, PlayoffPath, Team } from './championship-engine';

interface BracketVisualizerProps {
  teams: Team[];
  probabilities: ChampionshipProbability[];
  currentWeek: number;
  isLive?: boolean;
  onTeamSelect?: (team: Team) => void;
}

interface BracketTeam {
  id: string;
  name: string;
  seed: number;
  probability: number;
  eliminated?: boolean;
  record: string;
  avatar?: string;
}

interface MatchupNode {
  id: string;
  round: number;
  position: number;
  team1?: BracketTeam;
  team2?: BracketTeam;
  winner?: BracketTeam;
  probability?: number;
  isLive?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const BracketVisualizer: React.FC<BracketVisualizerProps> = ({
  teams,
  probabilities,
  currentWeek,
  isLive = false,
  onTeamSelect
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'bracket' | 'probabilities' | 'paths'>('bracket');
  const [animationPhase, setAnimationPhase] = useState(0);
  
  const bracketData = useMemo(() => 
    generateBracketData(teams, probabilities), 
    [teams, probabilities]
  );

  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  useEffect(() => {
    if (isLive) {
      const interval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 4);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLive]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: animatedValue.value,
    transform: [{ scale: 0.8 + animatedValue.value * 0.2 }],
  }));

  return (
    <Animated.View style={[{ flex: 1 }, containerStyle]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ 
            width: Math.max(screenWidth * 1.5, 800), 
            height: Math.max(screenHeight, 600),
            padding: 20 
          }}>
            {/* Header Controls */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingHorizontal: 10,
            }}>
              <Text style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: '#ffffff',
              }}>
                Championship Bracket
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {(['bracket', 'probabilities', 'paths'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setViewMode(mode)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: viewMode === mode ? '#3b82f6' : '#374151',
                    }}
                  >
                    <Text style={{
                      color: '#ffffff',
                      fontWeight: viewMode === mode ? 'bold' : 'normal',
                      textTransform: 'capitalize',
                    }}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Live Indicator */}
            {isLive && (
              <LiveIndicator animationPhase={animationPhase} />
            )}

            {/* Main Content */}
            {viewMode === 'bracket' && (
              <BracketView
                bracketData={bracketData}
                selectedTeam={selectedTeam}
                onTeamSelect={(teamId) => {
                  setSelectedTeam(teamId);
                  const team = teams.find(t => t.id === teamId);
                  if (team && onTeamSelect) {
                    onTeamSelect(team);
                  }
                }}
                isLive={isLive}
              />
            )}

            {viewMode === 'probabilities' && (
              <ProbabilityView
                probabilities={probabilities}
                selectedTeam={selectedTeam}
                onTeamSelect={setSelectedTeam}
              />
            )}

            {viewMode === 'paths' && (
              <PathView
                probabilities={probabilities}
                selectedTeam={selectedTeam}
                onTeamSelect={setSelectedTeam}
              />
            )}
          </View>
        </ScrollView>
      </ScrollView>
    </Animated.View>
  );
};

const LiveIndicator: React.FC<{ animationPhase: number }> = ({ animationPhase }) => (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  }}>
    <View style={{
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#ef4444',
      marginRight: 8,
      opacity: animationPhase % 2 === 0 ? 1 : 0.3,
    }} />
    <Text style={{
      color: '#ef4444',
      fontWeight: 'bold',
      fontSize: 14,
    }}>
      LIVE UPDATES
    </Text>
  </View>
);

const BracketView: React.FC<{
  bracketData: MatchupNode[];
  selectedTeam: string | null;
  onTeamSelect: (teamId: string) => void;
  isLive: boolean;
}> = ({ bracketData, selectedTeam, onTeamSelect, isLive }) => {
  const rounds = Math.max(...bracketData.map(m => m.round));
  
  return (
    <View style={{ flex: 1 }}>
      <Svg width="100%" height="100%" viewBox="0 0 800 600">
        {/* Draw bracket lines */}
        {bracketData.map((matchup, index) => (
          <BracketConnector
            key={`connector-${matchup.id}`}
            matchup={matchup}
            totalRounds={rounds}
            index={index}
          />
        ))}
        
        {/* Draw matchup nodes */}
        {bracketData.map((matchup, index) => (
          <MatchupNode
            key={matchup.id}
            matchup={matchup}
            isSelected={selectedTeam === matchup.team1?.id || selectedTeam === matchup.team2?.id}
            onTeamSelect={onTeamSelect}
            totalRounds={rounds}
            isLive={isLive}
            position={index}
          />
        ))}
      </Svg>
      
      {/* Legend */}
      <BracketLegend />
    </View>
  );
};

const BracketConnector: React.FC<{
  matchup: MatchupNode;
  totalRounds: number;
  index: number;
}> = ({ matchup, totalRounds }) => {
  const x = 50 + (matchup.round - 1) * 150;
  const y = 100 + matchup.position * 120;
  
  if (matchup.round === totalRounds) return null; // No connector for final
  
  return (
    <Line
      x1={x + 100}
      y1={y + 20}
      x2={x + 150}
      y2={y + 20}
      stroke="#4b5563"
      strokeWidth="2"
      strokeDasharray={matchup.winner ? "0" : "5,5"}
    />
  );
};

const MatchupNode: React.FC<{
  matchup: MatchupNode;
  isSelected: boolean;
  onTeamSelect: (teamId: string) => void;
  totalRounds: number;
  isLive: boolean;
  position: number;
}> = ({ matchup, isSelected, onTeamSelect, totalRounds, isLive, position }) => {
  const x = 50 + (matchup.round - 1) * 150;
  const y = 100 + matchup.position * 120;
  
  return (
    <g>
      {/* Matchup container */}
      <rect
        x={x}
        y={y}
        width="120"
        height="80"
        rx="8"
        fill={isSelected ? "#3b82f6" : "#1f2937"}
        stroke={isLive && matchup.isLive ? "#ef4444" : "#4b5563"}
        strokeWidth={isLive && matchup.isLive ? "3" : "1"}
      />
      
      {/* Team 1 */}
      {matchup.team1 && (
        <TeamSlot
          team={matchup.team1}
          x={x + 5}
          y={y + 5}
          onSelect={() => onTeamSelect(matchup.team1!.id)}
          isWinner={matchup.winner?.id === matchup.team1.id}
        />
      )}
      
      {/* Team 2 */}
      {matchup.team2 && (
        <TeamSlot
          team={matchup.team2}
          x={x + 5}
          y={y + 45}
          onSelect={() => onTeamSelect(matchup.team2!.id)}
          isWinner={matchup.winner?.id === matchup.team2.id}
        />
      )}
      
      {/* Probability indicator */}
      {matchup.probability && (
        <SvgText
          x={x + 60}
          y={y + 95}
          fontSize="10"
          fill="#9ca3af"
          textAnchor="middle"
        >
          {`${(matchup.probability * 100).toFixed(1)}%`}
        </SvgText>
      )}
    </g>
  );
};

const TeamSlot: React.FC<{
  team: BracketTeam;
  x: number;
  y: number;
  onSelect: () => void;
  isWinner?: boolean;
}> = ({ team, x, y, onSelect, isWinner }) => {
  return (
    <g onPress={onSelect}>
      {/* Seed */}
      <Circle
        cx={x + 15}
        cy={y + 15}
        r="10"
        fill={isWinner ? "#10b981" : "#6b7280"}
      />
      <SvgText
        x={x + 15}
        y={y + 18}
        fontSize="10"
        fill="#ffffff"
        textAnchor="middle"
        fontWeight="bold"
      >
        {team.seed}
      </SvgText>
      
      {/* Team name */}
      <SvgText
        x={x + 30}
        y={y + 12}
        fontSize="11"
        fill={team.eliminated ? "#6b7280" : "#ffffff"}
        fontWeight={isWinner ? "bold" : "normal"}
      >
        {team.name.length > 8 ? team.name.substring(0, 8) + '...' : team.name}
      </SvgText>
      
      {/* Record */}
      <SvgText
        x={x + 30}
        y={y + 25}
        fontSize="9"
        fill="#9ca3af"
      >
        {team.record}
      </SvgText>
      
      {/* Probability */}
      <SvgText
        x={x + 85}
        y={y + 18}
        fontSize="10"
        fill="#3b82f6"
        textAnchor="end"
        fontWeight="bold"
      >
        {`${(team.probability * 100).toFixed(0)}%`}
      </SvgText>
    </g>
  );
};

const BracketLegend: React.FC = () => (
  <View style={{
    marginTop: 20,
    padding: 16,
    backgroundColor: '#1f2937',
    borderRadius: 12,
  }}>
    <Text style={{
      color: '#ffffff',
      fontWeight: 'bold',
      marginBottom: 12,
    }}>
      Legend
    </Text>
    
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      <LegendItem color="#10b981" label="Winner" />
      <LegendItem color="#3b82f6" label="Advancing" />
      <LegendItem color="#6b7280" label="Eliminated" />
      <LegendItem color="#ef4444" label="Live Game" />
    </View>
  </View>
);

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <View style={{
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: color,
    }} />
    <Text style={{ color: '#9ca3af', fontSize: 12 }}>
      {label}
    </Text>
  </View>
);

const ProbabilityView: React.FC<{
  probabilities: ChampionshipProbability[];
  selectedTeam: string | null;
  onTeamSelect: (teamId: string) => void;
}> = ({ probabilities, selectedTeam, onTeamSelect }) => {
  return (
    <View style={{ flex: 1 }}>
      <View style={{
        flexDirection: 'row',
        backgroundColor: '#1f2937',
        borderRadius: 8,
        padding: 4,
        marginBottom: 20,
      }}>
        <Text style={{
          flex: 2,
          color: '#9ca3af',
          fontWeight: 'bold',
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}>
          Team
        </Text>
        <Text style={{
          flex: 1,
          color: '#9ca3af',
          fontWeight: 'bold',
          paddingHorizontal: 8,
          paddingVertical: 8,
          textAlign: 'center',
        }}>
          Playoffs
        </Text>
        <Text style={{
          flex: 1,
          color: '#9ca3af',
          fontWeight: 'bold',
          paddingHorizontal: 8,
          paddingVertical: 8,
          textAlign: 'center',
        }}>
          Championship
        </Text>
        <Text style={{
          flex: 1,
          color: '#9ca3af',
          fontWeight: 'bold',
          paddingHorizontal: 8,
          paddingVertical: 8,
          textAlign: 'center',
        }}>
          Seed
        </Text>
      </View>
      
      {probabilities.map((prob, index) => (
        <ProbabilityRow
          key={prob.teamId}
          probability={prob}
          rank={index + 1}
          isSelected={selectedTeam === prob.teamId}
          onSelect={() => onTeamSelect(prob.teamId)}
        />
      ))}
    </View>
  );
};

const ProbabilityRow: React.FC<{
  probability: ChampionshipProbability;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ probability, rank, isSelected, onSelect }) => {
  const animatedProgress = useSharedValue(0);
  
  useEffect(() => {
    animatedProgress.value = withSpring(probability.championshipProbability, {
      damping: 15,
      stiffness: 100,
    });
  }, [probability.championshipProbability]);
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value * 100}%`,
  }));
  
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={{
        backgroundColor: isSelected ? '#3b82f6' : '#374151',
        borderRadius: 8,
        marginBottom: 8,
        overflow: 'hidden',
      }}
    >
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
      }}>
        <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{
            color: '#9ca3af',
            fontSize: 14,
            fontWeight: 'bold',
            marginRight: 12,
            minWidth: 20,
          }}>
            {rank}
          </Text>
          <Text style={{
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 'bold',
          }}>
            Team {probability.teamId}
          </Text>
        </View>
        
        <Text style={{
          flex: 1,
          color: '#ffffff',
          fontSize: 14,
          textAlign: 'center',
          fontWeight: '600',
        }}>
          {(probability.playoffProbability * 100).toFixed(1)}%
        </Text>
        
        <Text style={{
          flex: 1,
          color: '#ffffff',
          fontSize: 14,
          textAlign: 'center',
          fontWeight: '600',
        }}>
          {(probability.championshipProbability * 100).toFixed(1)}%
        </Text>
        
        <Text style={{
          flex: 1,
          color: '#ffffff',
          fontSize: 14,
          textAlign: 'center',
          fontWeight: '600',
        }}>
          {probability.expectedSeed.toFixed(1)}
        </Text>
      </View>
      
      {/* Progress bar */}
      <View style={{
        height: 4,
        backgroundColor: '#1f2937',
      }}>
        <Animated.View style={[
          progressStyle,
          {
            height: '100%',
            backgroundColor: '#10b981',
          }
        ]} />
      </View>
    </TouchableOpacity>
  );
};

const PathView: React.FC<{
  probabilities: ChampionshipProbability[];
  selectedTeam: string | null;
  onTeamSelect: (teamId: string) => void;
}> = ({ probabilities, selectedTeam, onTeamSelect }) => {
  const selectedProbability = probabilities.find(p => p.teamId === selectedTeam);
  
  return (
    <View style={{ flex: 1 }}>
      {/* Team Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 20 }}
      >
        <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 4 }}>
          {probabilities.slice(0, 8).map((prob) => (
            <TouchableOpacity
              key={prob.teamId}
              onPress={() => onTeamSelect(prob.teamId)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: selectedTeam === prob.teamId ? '#3b82f6' : '#374151',
                minWidth: 100,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: '#ffffff',
                fontWeight: selectedTeam === prob.teamId ? 'bold' : 'normal',
                fontSize: 14,
              }}>
                Team {prob.teamId}
              </Text>
              <Text style={{
                color: '#9ca3af',
                fontSize: 12,
              }}>
                {(prob.championshipProbability * 100).toFixed(1)}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      {/* Path Details */}
      {selectedProbability ? (
        <ChampionshipPath probability={selectedProbability} />
      ) : (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Text style={{
            color: '#9ca3af',
            fontSize: 16,
            textAlign: 'center',
          }}>
            Select a team to view their championship path
          </Text>
        </View>
      )}
    </View>
  );
};

const ChampionshipPath: React.FC<{
  probability: ChampionshipProbability;
}> = ({ probability }) => {
  return (
    <View style={{ flex: 1 }}>
      {/* Optimal Path */}
      <View style={{
        backgroundColor: '#1f2937',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}>
        <Text style={{
          color: '#ffffff',
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 12,
        }}>
          Optimal Championship Path
        </Text>
        
        <View style={{ gap: 12 }}>
          <PathRound
            title="First Round"
            opponent={probability.optimalPath.round1.opponent}
            probability={probability.optimalPath.round1.winProbability}
          />
          <PathRound
            title="Semi-Final"
            opponent={probability.optimalPath.round2.opponent}
            probability={probability.optimalPath.round2.winProbability}
          />
          <PathRound
            title="Championship"
            opponent={probability.optimalPath.championship.opponent}
            probability={probability.optimalPath.championship.winProbability}
          />
        </View>
        
        <View style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: '#374151',
          borderRadius: 8,
        }}>
          <Text style={{
            color: '#10b981',
            fontSize: 16,
            fontWeight: 'bold',
            textAlign: 'center',
          }}>
            Total Path Probability: {(probability.optimalPath.totalProbability * 100).toFixed(1)}%
          </Text>
        </View>
      </View>
      
      {/* Key Factors */}
      <View style={{
        backgroundColor: '#1f2937',
        borderRadius: 12,
        padding: 16,
      }}>
        <Text style={{
          color: '#ffffff',
          fontSize: 18,
          fontWeight: 'bold',
          marginBottom: 12,
        }}>
          Key Success Factors
        </Text>
        
        {probability.keyFactors.slice(0, 5).map((factor, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              borderBottomWidth: index < 4 ? 1 : 0,
              borderBottomColor: '#374151',
            }}
          >
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: factor.impact > 0 ? '#10b981' : factor.impact < 0 ? '#ef4444' : '#6b7280',
              marginRight: 12,
            }} />
            <View style={{ flex: 1 }}>
              <Text style={{
                color: '#ffffff',
                fontSize: 14,
                fontWeight: '600',
              }}>
                {factor.factor}
              </Text>
              <Text style={{
                color: '#9ca3af',
                fontSize: 12,
              }}>
                {factor.description}
              </Text>
            </View>
            <Text style={{
              color: factor.impact > 0 ? '#10b981' : factor.impact < 0 ? '#ef4444' : '#6b7280',
              fontSize: 14,
              fontWeight: 'bold',
            }}>
              {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(0)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const PathRound: React.FC<{
  title: string;
  opponent: string;
  probability: number;
}> = ({ title, opponent, probability }) => (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#374151',
    borderRadius: 8,
  }}>
    <View style={{ flex: 1 }}>
      <Text style={{
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
      }}>
        {title}
      </Text>
      <Text style={{
        color: '#9ca3af',
        fontSize: 12,
      }}>
        vs {opponent}
      </Text>
    </View>
    <Text style={{
      color: '#3b82f6',
      fontSize: 16,
      fontWeight: 'bold',
    }}>
      {(probability * 100).toFixed(1)}%
    </Text>
  </View>
);

// Helper function to generate bracket data
function generateBracketData(
  teams: Team[],
  probabilities: ChampionshipProbability[]
): MatchupNode[] {
  const playoffTeams = probabilities
    .filter(p => p.playoffProbability > 0.1)
    .sort((a, b) => a.expectedSeed - b.expectedSeed)
    .slice(0, 6)
    .map((prob, index) => ({
      id: prob.teamId,
      name: `Team ${prob.teamId}`,
      seed: index + 1,
      probability: prob.championshipProbability,
      record: '12-2', // Would use actual record
    }));

  const bracket: MatchupNode[] = [];
  
  // First round (seeds 3-6)
  bracket.push({
    id: 'r1-1',
    round: 1,
    position: 0,
    team1: playoffTeams[2], // 3 seed
    team2: playoffTeams[5], // 6 seed
    probability: 0.65,
  });
  
  bracket.push({
    id: 'r1-2',
    round: 1,
    position: 1,
    team1: playoffTeams[3], // 4 seed
    team2: playoffTeams[4], // 5 seed
    probability: 0.55,
  });
  
  // Semi-finals
  bracket.push({
    id: 'sf-1',
    round: 2,
    position: 0,
    team1: playoffTeams[0], // 1 seed (bye)
    team2: undefined, // Winner of 4v5
    probability: 0.7,
  });
  
  bracket.push({
    id: 'sf-2',
    round: 2,
    position: 1,
    team1: playoffTeams[1], // 2 seed (bye)
    team2: undefined, // Winner of 3v6
    probability: 0.65,
  });
  
  // Championship
  bracket.push({
    id: 'final',
    round: 3,
    position: 0,
    team1: undefined, // SF winner 1
    team2: undefined, // SF winner 2
    probability: 0.5,
  });
  
  return bracket;
}

export default BracketVisualizer;