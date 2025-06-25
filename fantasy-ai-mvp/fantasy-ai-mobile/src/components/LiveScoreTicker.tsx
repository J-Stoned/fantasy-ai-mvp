import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useLiveScores } from '../hooks/useWebSocket';

interface Score {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  time?: string;
}

interface LiveScoreTickerProps {
  scores?: Score[];
}

const { width } = Dimensions.get('window');

const LiveScoreTicker: React.FC<LiveScoreTickerProps> = ({ scores: propScores }) => {
  // Use WebSocket live scores
  const wsScores = useLiveScores();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Mock data if no scores provided
  const defaultScores: Score[] = [
    { id: '1', homeTeam: 'LAR', awayTeam: 'SF', homeScore: 24, awayScore: 21, status: 'Q4', time: '2:15' },
    { id: '2', homeTeam: 'DAL', awayTeam: 'PHI', homeScore: 17, awayScore: 14, status: 'Q3', time: '8:42' },
    { id: '3', homeTeam: 'GB', awayTeam: 'CHI', homeScore: 28, awayScore: 10, status: 'FINAL' },
    { id: '4', homeTeam: 'KC', awayTeam: 'BUF', homeScore: 0, awayScore: 0, status: 'PREGAME', time: '8:20 PM' },
    { id: '5', homeTeam: 'NE', awayTeam: 'MIA', homeScore: 21, awayScore: 24, status: 'Q4', time: '0:45' },
  ];

  // Use WebSocket scores if available, then prop scores, then default scores
  const displayScores = wsScores?.games || propScores || defaultScores;

  useEffect(() => {
    // Auto-scroll animation
    const scrollAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scrollX, {
          toValue: 1,
          duration: 30000,
          useNativeDriver: false,
        }),
        Animated.timing(scrollX, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    );

    scrollAnimation.start();

    return () => scrollAnimation.stop();
  }, [scrollX]);

  const renderScore = (score: Score) => {
    const isLive = score.status !== 'FINAL' && score.status !== 'PREGAME';
    const isWinning = score.homeScore > score.awayScore;

    return (
      <View key={score.id} style={styles.scoreItem}>
        <View style={styles.teamContainer}>
          <Text style={[styles.teamName, isWinning && styles.winningTeam]}>
            {score.homeTeam}
          </Text>
          <Text style={[styles.score, isWinning && styles.winningScore]}>
            {score.homeScore}
          </Text>
        </View>
        <View style={styles.divider}>
          <Text style={styles.vs}>@</Text>
          {isLive && <View style={styles.liveDot} />}
          <Text style={styles.status}>{score.status}</Text>
          {score.time && <Text style={styles.time}>{score.time}</Text>}
        </View>
        <View style={styles.teamContainer}>
          <Text style={[styles.teamName, !isWinning && score.status !== 'PREGAME' && styles.winningTeam]}>
            {score.awayTeam}
          </Text>
          <Text style={[styles.score, !isWinning && score.status !== 'PREGAME' && styles.winningScore]}>
            {score.awayScore}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={styles.scoresContainer}>
          {displayScores.map(renderScore)}
          {/* Duplicate for continuous scroll effect */}
          {displayScores.map((score) => renderScore({ ...score, id: `${score.id}-dup` }))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  scoresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 30,
    paddingVertical: 10,
  },
  teamContainer: {
    alignItems: 'center',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 2,
  },
  winningTeam: {
    color: '#fff',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
  },
  winningScore: {
    color: '#fff',
  },
  divider: {
    marginHorizontal: 15,
    alignItems: 'center',
  },
  vs: {
    fontSize: 12,
    color: '#666',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff00',
    marginTop: 4,
  },
  status: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  time: {
    fontSize: 10,
    color: '#666',
  },
});

export default LiveScoreTicker;