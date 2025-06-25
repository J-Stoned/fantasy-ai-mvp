import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { useWebSocket, usePlayerUpdates, useLiveScores, useInjuryAlerts } from '../hooks/useWebSocket';
import { voiceAI } from '../lib/ElevenLabsVoiceAI';

export const TestApiScreen: React.FC = () => {
  const { user, login, logout, checkBiometricAuth } = useAuth();
  const { isConnected, send, subscribe } = useWebSocket();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [email, setEmail] = useState('test@fantasy.ai');
  const [password, setPassword] = useState('password123');

  // Real-time data hooks
  const playerUpdates = usePlayerUpdates('player-123');
  const liveScores = useLiveScores();
  const injuryAlerts = useInjuryAlerts();

  useEffect(() => {
    if (isConnected) {
      // Subscribe to test events
      const unsubscribe = subscribe('test', (message) => {
        console.log('[TestApi] Received test message:', message);
      });
      return unsubscribe;
    }
  }, [isConnected, subscribe]);

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(true);
    try {
      const result = await testFn();
      setTestResults(prev => ({ ...prev, [testName]: { success: true, data: result } }));
      Alert.alert('Success', `${testName} completed successfully`);
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, [testName]: { success: false, error: error.message } }));
      Alert.alert('Error', `${testName} failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'Authentication',
      action: () => runTest('Authentication', async () => {
        if (user) {
          await logout();
          return 'Logged out successfully';
        } else {
          await login(email, password);
          return 'Logged in successfully';
        }
      }),
    },
    {
      name: 'Biometric Auth',
      action: () => runTest('Biometric Auth', async () => {
        const result = await checkBiometricAuth();
        return `Biometric auth ${result ? 'succeeded' : 'failed'}`;
      }),
    },
    {
      name: 'Get Leagues',
      action: () => runTest('Get Leagues', () => api.getLeagues()),
    },
    {
      name: 'Get Players',
      action: () => runTest('Get Players', () => api.getPlayers()),
    },
    {
      name: 'Get AI Insights',
      action: () => runTest('Get AI Insights', () => api.getAIInsights()),
    },
    {
      name: 'Get Live Scores',
      action: () => runTest('Get Live Scores', () => api.getLiveScores()),
    },
    {
      name: 'Voice Command',
      action: () => runTest('Voice Command', async () => {
        const response = await voiceAI.processTextCommand('What is my best lineup?');
        return response;
      }),
    },
    {
      name: 'WebSocket Send',
      action: () => runTest('WebSocket Send', async () => {
        if (!isConnected) throw new Error('WebSocket not connected');
        await send('test', { message: 'Hello from mobile!' });
        return 'Message sent';
      }),
    },
    {
      name: 'ML Player Performance',
      action: () => runTest('ML Player Performance', () => 
        api.getPlayerPerformance('player-123')
      ),
    },
    {
      name: 'ML Injury Risk',
      action: () => runTest('ML Injury Risk', () => 
        api.getInjuryRisk('player-123')
      ),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
          API Connection Test
        </Text>

        {/* Status */}
        <View style={{ marginBottom: 20, padding: 15, backgroundColor: '#1a1a1a', borderRadius: 10 }}>
          <Text style={{ color: 'white', marginBottom: 10 }}>
            User: {user ? `${user.email} (${user.id})` : 'Not logged in'}
          </Text>
          <Text style={{ color: 'white', marginBottom: 10 }}>
            WebSocket: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Text>
          <Text style={{ color: 'white' }}>
            API URL: {api.getWebSocketUrl()}
          </Text>
        </View>

        {/* Login Form */}
        {!user && (
          <View style={{ marginBottom: 20, padding: 15, backgroundColor: '#1a1a1a', borderRadius: 10 }}>
            <TextInput
              style={{ 
                backgroundColor: '#2a2a2a', 
                color: 'white', 
                padding: 10, 
                borderRadius: 5,
                marginBottom: 10 
              }}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
            <TextInput
              style={{ 
                backgroundColor: '#2a2a2a', 
                color: 'white', 
                padding: 10, 
                borderRadius: 5 
              }}
              placeholder="Password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        )}

        {/* Real-time Data */}
        <View style={{ marginBottom: 20, padding: 15, backgroundColor: '#1a1a1a', borderRadius: 10 }}>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Real-time Data
          </Text>
          <Text style={{ color: '#666', marginBottom: 5 }}>
            Player Updates: {playerUpdates ? JSON.stringify(playerUpdates).slice(0, 50) + '...' : 'None'}
          </Text>
          <Text style={{ color: '#666', marginBottom: 5 }}>
            Live Scores: {liveScores ? JSON.stringify(liveScores).slice(0, 50) + '...' : 'None'}
          </Text>
          <Text style={{ color: '#666' }}>
            Injury Alerts: {injuryAlerts.length} alerts
          </Text>
        </View>

        {/* Test Buttons */}
        {tests.map((test) => (
          <TouchableOpacity
            key={test.name}
            style={{
              backgroundColor: '#4F46E5',
              padding: 15,
              borderRadius: 10,
              marginBottom: 10,
              opacity: loading ? 0.5 : 1,
            }}
            onPress={test.action}
            disabled={loading}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                {test.name}
              </Text>
              {testResults[test.name] && (
                <Text style={{ color: testResults[test.name].success ? '#10B981' : '#EF4444' }}>
                  {testResults[test.name].success ? '✓' : '✗'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Test Results */}
        {Object.entries(testResults).length > 0 && (
          <View style={{ marginTop: 20, padding: 15, backgroundColor: '#1a1a1a', borderRadius: 10 }}>
            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
              Test Results
            </Text>
            {Object.entries(testResults).map(([name, result]) => (
              <View key={name} style={{ marginBottom: 10 }}>
                <Text style={{ color: result.success ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>
                  {name}: {result.success ? 'Success' : 'Failed'}
                </Text>
                <Text style={{ color: '#666', fontSize: 12 }}>
                  {result.success 
                    ? JSON.stringify(result.data).slice(0, 100) + '...'
                    : result.error
                  }
                </Text>
              </View>
            ))}
          </View>
        )}

        {loading && (
          <ActivityIndicator 
            size="large" 
            color="#4F46E5" 
            style={{ marginTop: 20 }} 
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};