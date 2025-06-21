import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  ScrollView,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Voice from '@react-native-voice/voice';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Lottie from 'lottie-react-native';

import VoiceService from '../services/VoiceService';
import ElevenLabsService from '../services/ElevenLabsService';
import { HapticService } from '../services/HapticService';
import { AppTheme } from '../theme/AppTheme';
import { useAppStore } from '../store/AppStore';
import VoicePersonaSelector from '../components/VoicePersonaSelector';

const { width, height } = Dimensions.get('window');

interface VoiceCommand {
  command: string;
  response: any;
  timestamp: Date;
  type: 'lineup' | 'trade' | 'waiver' | 'injury' | 'multimedia' | 'general';
}

interface VoiceVisualization {
  scale: Animated.Value;
  opacity: Animated.Value;
}

const VoiceScreen: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<any>(null);
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnimations = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0))
  ).current;
  const orbScale = useRef(new Animated.Value(1)).current;
  const orbGlow = useRef(new Animated.Value(0)).current;

  const { isVoiceEnabled, currentUser } = useAppStore();

  useEffect(() => {
    initializeVoice();
    loadCurrentPersona();
    return () => {
      Voice.stop();
      Voice.removeAllListeners();
    };
  }, []);

  const loadCurrentPersona = () => {
    const persona = VoiceService.getCurrentPersona();
    setCurrentPersona(persona);
  };

  useEffect(() => {
    if (isListening) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      stopAnimations();
    }
  }, [isListening]);

  const initializeVoice = async () => {
    try {
      // Initialize enhanced voice service
      const initialized = await VoiceService.initialize();
      if (!initialized) {
        console.warn('Enhanced voice service not available');
      }

      // Set up event listeners for enhanced features
      VoiceService.setOnListeningState(setIsListening);
      VoiceService.setOnSpeakingState(setIsSpeaking);
      VoiceService.setOnVoiceCommand((command) => {
        const historyCommand: VoiceCommand = {
          command: command.command,
          response: null,
          timestamp: command.timestamp,
          type: command.intent as any
        };
        setCommandHistory(prev => [historyCommand, ...prev.slice(0, 9)]);
      });
      VoiceService.setOnVoiceResponse((response) => {
        setCurrentResponse(response);
      });

      // Original voice recognition setup as fallback
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechError = onSpeechError;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
    } catch (error) {
      console.error('Voice initialization error:', error);
    }
  };

  const onSpeechStart = () => {
    setIsListening(true);
    HapticService.impact('light');
  };

  const onSpeechEnd = () => {
    setIsListening(false);
    setCurrentCommand('');
  };

  const onSpeechError = (error: any) => {
    console.error('Speech error:', error);
    setIsListening(false);
    setIsProcessing(false);
    HapticService.impact('heavy');
  };

  const onSpeechResults = async (event: any) => {
    const command = event.value?.[0];
    if (command) {
      await processCommand(command);
    }
  };

  const onSpeechPartialResults = (event: any) => {
    const partialCommand = event.value?.[0];
    if (partialCommand) {
      setCurrentCommand(partialCommand);
      
      // Check for wake word
      if (partialCommand.toLowerCase().includes('hey fantasy')) {
        setWakeWordDetected(true);
        HapticService.impact('medium');
        glowOrb();
      }
    }
  };

  const processCommand = async (command: string) => {
    setIsProcessing(true);
    HapticService.impact('medium');

    try {
      // Remove wake word if present
      const cleanCommand = command.toLowerCase()
        .replace(/hey fantasy,?\s*/i, '')
        .trim();

      // Use enhanced voice service for processing
      const response = await VoiceService.processCommand(cleanCommand);
      
      // Response is handled by the event listener now
      HapticService.success();
      
    } catch (error) {
      console.error('Command processing error:', error);
      HapticService.error();
    } finally {
      setIsProcessing(false);
      setWakeWordDetected(false);
    }
  };

  const determineCommandType = (command: string): VoiceCommand['type'] => {
    if (command.includes('lineup') || command.includes('start')) return 'lineup';
    if (command.includes('trade')) return 'trade';
    if (command.includes('waiver') || command.includes('pickup')) return 'waiver';
    if (command.includes('injury') || command.includes('injured')) return 'injury';
    if (command.includes('podcast') || command.includes('youtube') || command.includes('social')) return 'multimedia';
    return 'general';
  };

  const startListening = async () => {
    try {
      setCurrentCommand('');
      setCurrentResponse(null);
      // Use enhanced voice service first, fallback to basic Voice
      const success = await VoiceService.startListening();
      if (!success) {
        await Voice.start('en-US');
      }
    } catch (error) {
      console.error('Start listening error:', error);
    }
  };

  const stopListening = async () => {
    try {
      await VoiceService.stopListening();
      await Voice.stop();
    } catch (error) {
      console.error('Stop listening error:', error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    waveAnimations.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    waveAnimations.forEach(anim => anim.stopAnimation());
    orbGlow.stopAnimation();
  };

  const glowOrb = () => {
    Animated.sequence([
      Animated.timing(orbGlow, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(orbGlow, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderVoiceOrb = () => (
    <TouchableOpacity
      onPress={isListening ? stopListening : startListening}
      style={styles.orbContainer}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.orbGlow,
          {
            opacity: orbGlow,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      
      <LinearGradient
        colors={
          isSpeaking
            ? ['#9C27B0', '#673AB7']
            : wakeWordDetected
            ? ['#FF6B6B', '#FF8E53']
            : isListening
            ? ['#4ECDC4', '#44A08D']
            : ['#667eea', '#764ba2']
        }
        style={[
          styles.orb,
          {
            transform: [
              { scale: Animated.multiply(orbScale, pulseAnim) }
            ],
          },
        ]}
      >
        <Icon
          name={
            isSpeaking 
              ? 'volume-up' 
              : isListening 
              ? 'mic' 
              : 'mic-none'
          }
          size={60}
          color="white"
        />
        
        {isProcessing && (
          <View style={styles.processingIndicator}>
            <Lottie
              source={require('../assets/animations/processing.json')}
              autoPlay
              loop
              style={styles.processingAnimation}
            />
          </View>
        )}
      </LinearGradient>

      {/* Sound waves */}
      {(isListening || isSpeaking) && (
        <View style={styles.waveContainer}>
          {waveAnimations.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.wave,
                {
                  opacity: anim,
                  borderColor: isSpeaking ? '#9C27B0' : 'rgba(255,255,255,0.3)',
                  transform: [
                    {
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.5 + index * 0.2],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCurrentCommand = () => {
    if (!currentCommand && !isProcessing) return null;

    return (
      <View style={styles.commandContainer}>
        <Text style={styles.commandLabel}>
          {isProcessing ? 'Processing...' : 'Listening...'}
        </Text>
        <Text style={styles.commandText}>
          {currentCommand}
          {isListening && <Text style={styles.cursor}>|</Text>}
        </Text>
      </View>
    );
  };

  const renderResponse = () => {
    if (!currentResponse) return null;

    return (
      <View style={styles.responseContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={styles.responseCard}
        >
          <View style={styles.responseHeader}>
            <Icon name="smart-toy" size={24} color={AppTheme.colors.primary} />
            <Text style={styles.responseTitle}>Fantasy AI Response</Text>
          </View>
          
          {currentResponse.type === 'lineup' && (
            <LineupResponse data={currentResponse} />
          )}
          
          {currentResponse.type === 'multimedia' && (
            <MultimediaResponse data={currentResponse} />
          )}
          
          {currentResponse.type === 'general' && (
            <GeneralResponse data={currentResponse} />
          )}
        </LinearGradient>
      </View>
    );
  };

  const renderQuickCommands = () => (
    <View style={styles.quickCommandsContainer}>
      <Text style={styles.quickCommandsTitle}>Quick Commands</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {quickCommands.map((cmd, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickCommandButton}
            onPress={() => processCommand(cmd.command)}
          >
            <Icon name={cmd.icon} size={24} color={AppTheme.colors.primary} />
            <Text style={styles.quickCommandText}>{cmd.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCommandHistory = () => (
    <View style={styles.historyContainer}>
      <Text style={styles.historyTitle}>Recent Commands</Text>
      {commandHistory.map((cmd, index) => (
        <TouchableOpacity
          key={index}
          style={styles.historyItem}
          onPress={() => setCurrentResponse(cmd.response)}
        >
          <View style={styles.historyItemHeader}>
            <Icon 
              name={getCommandIcon(cmd.type)} 
              size={20} 
              color={AppTheme.colors.primary} 
            />
            <Text style={styles.historyCommand}>{cmd.command}</Text>
            <Text style={styles.historyTime}>
              {cmd.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={AppTheme.gradients.primary} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🎙️ Hey Fantasy</Text>
            <Text style={styles.subtitle}>
              {isVoiceEnabled 
                ? 'Voice assistant ready' 
                : 'Voice disabled in settings'
              }
            </Text>
            
            {/* Voice Persona Control */}
            {currentPersona && (
              <TouchableOpacity
                style={styles.personaControl}
                onPress={() => setShowPersonaSelector(true)}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.personaButton}
                >
                  <Icon 
                    name={currentPersona.personality === 'commentator' ? 'sports' : 
                          currentPersona.personality === 'expert' ? 'school' : 'person'}
                    size={16} 
                    color={AppTheme.colors.primary} 
                  />
                  <Text style={styles.personaButtonText}>
                    {currentPersona.name}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={16} color="rgba(255,255,255,0.6)" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Voice Orb */}
          <View style={styles.orbSection}>
            {renderVoiceOrb()}
            
            <Text style={styles.orbInstruction}>
              {isSpeaking
                ? `${currentPersona?.name || 'Assistant'} is speaking...`
                : isListening 
                ? 'Listening for your command...' 
                : 'Tap to speak or say "Hey Fantasy"'
              }
            </Text>
          </View>

          {/* Current Command */}
          {renderCurrentCommand()}

          {/* Response */}
          {renderResponse()}

          {/* Quick Commands */}
          {renderQuickCommands()}

          {/* Command History */}
          {commandHistory.length > 0 && renderCommandHistory()}
        </ScrollView>

        {/* Voice Persona Selector Modal */}
        <VoicePersonaSelector
          visible={showPersonaSelector}
          onClose={() => setShowPersonaSelector(false)}
          onPersonaSelected={(persona) => {
            setCurrentPersona(persona);
            loadCurrentPersona();
          }}
          currentPersonaId={currentPersona?.id}
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

// Quick command configurations
const quickCommands = [
  { icon: 'sports', command: 'optimize my lineup', label: 'Optimize\nLineup' },
  { icon: 'healing', command: 'check injuries', label: 'Check\nInjuries' },
  { icon: 'trending-up', command: 'find waiver targets', label: 'Waiver\nTargets' },
  { icon: 'swap-horiz', command: 'analyze trades', label: 'Trade\nAnalyzer' },
  { icon: 'record-voice-over', command: 'sound like commentator', label: 'Voice\nStyle' },
  { icon: 'podcast', command: 'podcast insights', label: 'Podcast\nBuzz' },
];

const getCommandIcon = (type: VoiceCommand['type']) => {
  switch (type) {
    case 'lineup': return 'sports';
    case 'trade': return 'swap-horiz';
    case 'waiver': return 'trending-up';
    case 'injury': return 'healing';
    case 'multimedia': return 'podcast';
    default: return 'chat';
  }
};

// Response components
const LineupResponse: React.FC<{ data: any }> = ({ data }) => (
  <View>
    <Text style={styles.responseText}>Lineup Optimized!</Text>
    {data.changes?.map((change: any, index: number) => (
      <View key={index} style={styles.changeItem}>
        <Text style={styles.changeText}>
          Start: <Text style={styles.playerIn}>{change.playerIn}</Text>
        </Text>
        <Text style={styles.changeText}>
          Bench: <Text style={styles.playerOut}>{change.playerOut}</Text>
        </Text>
        <Text style={styles.reasonText}>{change.reasoning}</Text>
      </View>
    ))}
  </View>
);

const MultimediaResponse: React.FC<{ data: any }> = ({ data }) => (
  <View>
    <Text style={styles.responseText}>Multimedia Insights</Text>
    {data.insights?.map((insight: any, index: number) => (
      <View key={index} style={styles.insightItem}>
        <Text style={styles.insightSource}>{insight.source}</Text>
        <Text style={styles.insightQuote}>"{insight.quote}"</Text>
      </View>
    ))}
  </View>
);

const GeneralResponse: React.FC<{ data: any }> = ({ data }) => (
  <View>
    <Text style={styles.responseText}>{data.summary || data.message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  personaControl: {
    marginTop: 12,
  },
  personaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  personaButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    marginHorizontal: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  orbSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orbGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  orb: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  waveContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  processingIndicator: {
    position: 'absolute',
    bottom: -10,
    right: -10,
  },
  processingAnimation: {
    width: 30,
    height: 30,
  },
  orbInstruction: {
    marginTop: 20,
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  commandContainer: {
    margin: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  commandLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  commandText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
  },
  cursor: {
    opacity: 0.7,
    fontSize: 18,
  },
  responseContainer: {
    margin: 20,
  },
  responseCard: {
    padding: 20,
    borderRadius: 12,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 12,
  },
  responseText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 12,
  },
  changeItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  changeText: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
  },
  playerIn: {
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
  playerOut: {
    color: '#FF6B6B',
    textDecorationLine: 'line-through',
  },
  reasonText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  insightItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  insightSource: {
    fontSize: 12,
    color: AppTheme.colors.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightQuote: {
    fontSize: 14,
    color: 'white',
    fontStyle: 'italic',
  },
  quickCommandsContainer: {
    margin: 20,
  },
  quickCommandsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  quickCommandButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginRight: 12,
  },
  quickCommandText: {
    fontSize: 12,
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
  },
  historyContainer: {
    margin: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  historyItem: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginBottom: 12,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyCommand: {
    flex: 1,
    fontSize: 14,
    color: 'white',
    marginLeft: 12,
  },
  historyTime: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
});

export default VoiceScreen;