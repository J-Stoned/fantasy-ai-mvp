import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Surface,
  useTheme,
  IconButton,
  Chip,
  List,
  Avatar,
  Button,
  FAB,
  Card,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Voice from '@react-native-voice/voice';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'suggestion' | 'player' | 'lineup';
  data?: any;
}

interface QuickAction {
  label: string;
  icon: string;
  action: string;
}

const VoiceAssistantScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey! I'm your Fantasy AI assistant. You can ask me anything about your fantasy teams, players, or get recommendations. Try saying 'Hey Fantasy' to get started!",
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  const quickActions: QuickAction[] = [
    { label: 'Lineup Advice', icon: 'clipboard-list', action: 'lineup' },
    { label: 'Player News', icon: 'newspaper', action: 'news' },
    { label: 'Trade Analysis', icon: 'swap-horizontal', action: 'trade' },
    { label: 'Injury Updates', icon: 'medical-bag', action: 'injuries' },
  ];

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    if (isListening) {
      // Pulse animation
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

      // Wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [isListening]);

  const onSpeechStart = () => {
    console.log('Speech started');
  };

  const onSpeechEnd = () => {
    console.log('Speech ended');
    setIsListening(false);
  };

  const onSpeechResults = (e: any) => {
    const text = e.value[0];
    setTranscript('');
    handleUserMessage(text);
  };

  const onSpeechPartialResults = (e: any) => {
    setTranscript(e.value[0]);
  };

  const onSpeechError = (e: any) => {
    console.error('Speech error:', e);
    setIsListening(false);
    setTranscript('');
  };

  const startListening = async () => {
    try {
      await Voice.start('en-US');
      setIsListening(true);
    } catch (e) {
      console.error('Error starting voice recognition:', e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.error('Error stopping voice recognition:', e);
    }
  };

  const handleUserMessage = (text: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const response = generateAIResponse(text);
      setMessages(prev => [...prev, response]);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 1000);
  };

  const generateAIResponse = (userText: string): Message => {
    const lowerText = userText.toLowerCase();

    if (lowerText.includes('lineup') || lowerText.includes('team')) {
      return {
        id: Date.now().toString(),
        text: "Based on today's matchups, I recommend starting LeBron James over Anthony Davis. LeBron has been hot lately with 3 straight 30+ point games.",
        isUser: false,
        timestamp: new Date(),
        type: 'lineup',
        data: {
          recommendation: 'Start LeBron James',
          reason: 'Better matchup and recent form',
        },
      };
    }

    if (lowerText.includes('injury') || lowerText.includes('injured')) {
      return {
        id: Date.now().toString(),
        text: "Here are the latest injury updates for your players:",
        isUser: false,
        timestamp: new Date(),
        type: 'text',
      };
    }

    if (lowerText.includes('trade')) {
      return {
        id: Date.now().toString(),
        text: "I can help analyze potential trades. Which players are you considering trading?",
        isUser: false,
        timestamp: new Date(),
        type: 'suggestion',
      };
    }

    return {
      id: Date.now().toString(),
      text: "I understand you're asking about fantasy sports. Let me help you with that. What specific information do you need?",
      isUser: false,
      timestamp: new Date(),
    };
  };

  const handleQuickAction = (action: string) => {
    const actionMessages: { [key: string]: string } = {
      lineup: "Show me my lineup recommendations",
      news: "What's the latest player news?",
      trade: "Analyze a trade for me",
      injuries: "Show injury updates",
    };

    handleUserMessage(actionMessages[action] || "Help me with fantasy sports");
  };

  const renderMessage = (message: Message) => {
    if (message.type === 'player') {
      return (
        <Card style={[styles.messageCard, message.isUser && styles.userMessageCard]}>
          <Card.Content>
            <View style={styles.playerCard}>
              <Avatar.Text size={40} label="LJ" />
              <View style={styles.playerInfo}>
                <Text variant="titleMedium">LeBron James</Text>
                <Text variant="bodySmall">LAL • SF • Projected: 48.5</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Surface
        style={[
          styles.messageBubble,
          message.isUser ? styles.userMessage : styles.aiMessage,
        ]}
        elevation={1}
      >
        <Text variant="bodyMedium">{message.text}</Text>
        <Text variant="bodySmall" style={styles.timestamp}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </Surface>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <View style={styles.headerContent}>
          <Text variant="titleLarge">Fantasy AI Assistant</Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: theme.colors.primary }]} />
            <Text variant="bodySmall">Active</Text>
          </View>
        </View>
        <IconButton
          icon="cog"
          size={24}
          onPress={() => {}}
        />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map(message => (
          <View key={message.id} style={styles.messageWrapper}>
            {renderMessage(message)}
          </View>
        ))}
        {isListening && transcript && (
          <View style={styles.transcriptContainer}>
            <Text variant="bodyMedium" style={styles.transcriptText}>
              {transcript}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.quickActionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickActions.map((action, index) => (
            <Chip
              key={index}
              icon={action.icon}
              onPress={() => handleQuickAction(action.action)}
              style={styles.quickActionChip}
              mode="outlined"
            >
              {action.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      <View style={styles.voiceControl}>
        <TouchableOpacity
          onPress={isListening ? stopListening : startListening}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.voiceButton,
              {
                transform: [{ scale: pulseAnim }],
                backgroundColor: isListening ? theme.colors.primary : theme.colors.surface,
              },
            ]}
          >
            <Icon
              name={isListening ? 'microphone' : 'microphone-outline'}
              size={40}
              color={isListening ? theme.colors.onPrimary : theme.colors.primary}
            />
          </Animated.View>
        </TouchableOpacity>
        <Text variant="bodyMedium" style={styles.voiceHint}>
          {isListening ? 'Listening...' : 'Tap to speak'}
        </Text>
      </View>

      {isListening && (
        <Animated.View
          style={[
            styles.waveAnimation,
            {
              opacity: waveAnim,
              transform: [
                {
                  scale: waveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 3],
                  }),
                },
              ],
            },
          ]}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 100,
  },
  messageWrapper: {
    marginBottom: 10,
  },
  messageBubble: {
    padding: 15,
    borderRadius: 18,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(103, 80, 164, 0.2)',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  timestamp: {
    marginTop: 5,
    opacity: 0.6,
  },
  messageCard: {
    maxWidth: '80%',
    borderRadius: 12,
  },
  userMessageCard: {
    alignSelf: 'flex-end',
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerInfo: {
    flex: 1,
  },
  transcriptContainer: {
    alignSelf: 'center',
    padding: 15,
    backgroundColor: 'rgba(103, 80, 164, 0.1)',
    borderRadius: 18,
    marginTop: 10,
  },
  transcriptText: {
    fontStyle: 'italic',
  },
  quickActionsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  quickActionChip: {
    marginRight: 8,
  },
  voiceControl: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  voiceButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  voiceHint: {
    marginTop: 10,
    opacity: 0.7,
  },
  waveAnimation: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(103, 80, 164, 0.2)',
  },
});

export default VoiceAssistantScreen;