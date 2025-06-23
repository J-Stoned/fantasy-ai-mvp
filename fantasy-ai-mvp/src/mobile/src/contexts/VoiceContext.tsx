import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store';
import { processVoiceCommand } from '../services/voiceService';

interface VoiceContextType {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  speak: (text: string) => Promise<void>;
  stopSpeaking: () => void;
  processCommand: (command: string) => Promise<void>;
  setWakeWordEnabled: (enabled: boolean) => void;
  wakeWordDetected: boolean;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

const WAKE_WORDS = ['hey fantasy', 'ok fantasy', 'fantasy'];

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  
  const { voiceEnabled } = useStore();
  const wakeWordTimeoutRef = useRef<NodeJS.Timeout>();
  const continuousListeningRef = useRef(false);

  useEffect(() => {
    setupVoiceRecognition();
    
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  useEffect(() => {
    if (voiceEnabled && wakeWordEnabled) {
      startContinuousListening();
    } else {
      stopContinuousListening();
    }
  }, [voiceEnabled, wakeWordEnabled]);

  const setupVoiceRecognition = async () => {
    try {
      await Audio.requestPermissionsAsync();
      
      Voice.onSpeechStart = onSpeechStart;
      Voice.onSpeechEnd = onSpeechEnd;
      Voice.onSpeechResults = onSpeechResults;
      Voice.onSpeechPartialResults = onSpeechPartialResults;
      Voice.onSpeechError = onSpeechError;
    } catch (error) {
      console.error('Voice setup error:', error);
      setError('Failed to setup voice recognition');
    }
  };

  const onSpeechStart = () => {
    setError(null);
    setTranscript('');
  };

  const onSpeechEnd = () => {
    if (continuousListeningRef.current && !wakeWordDetected) {
      // Restart listening for wake word
      setTimeout(() => {
        if (continuousListeningRef.current) {
          Voice.start('en-US');
        }
      }, 500);
    }
  };

  const onSpeechResults = (event: any) => {
    const text = event.value?.[0] || '';
    setTranscript(text);
    
    if (wakeWordDetected) {
      // Process command after wake word
      processCommand(text);
      setWakeWordDetected(false);
    }
  };

  const onSpeechPartialResults = (event: any) => {
    const text = event.value?.[0] || '';
    setTranscript(text);
    
    // Check for wake word
    if (!wakeWordDetected && checkForWakeWord(text)) {
      handleWakeWordDetected();
    }
  };

  const onSpeechError = (event: any) => {
    console.error('Speech error:', event.error);
    setError(event.error?.message || 'Voice recognition error');
    setIsListening(false);
    
    if (continuousListeningRef.current) {
      // Restart continuous listening after error
      setTimeout(() => {
        if (continuousListeningRef.current) {
          startContinuousListening();
        }
      }, 2000);
    }
  };

  const checkForWakeWord = (text: string): boolean => {
    const lowerText = text.toLowerCase();
    return WAKE_WORDS.some(word => lowerText.includes(word));
  };

  const handleWakeWordDetected = async () => {
    setWakeWordDetected(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Stop current listening session
    await Voice.stop();
    
    // Provide audio feedback
    await speak("I'm listening");
    
    // Start listening for command
    setTimeout(() => {
      startListening();
    }, 500);
    
    // Auto timeout after 5 seconds
    if (wakeWordTimeoutRef.current) {
      clearTimeout(wakeWordTimeoutRef.current);
    }
    wakeWordTimeoutRef.current = setTimeout(() => {
      setWakeWordDetected(false);
      stopListening();
    }, 5000);
  };

  const startContinuousListening = async () => {
    try {
      continuousListeningRef.current = true;
      await Voice.start('en-US');
    } catch (error) {
      console.error('Continuous listening error:', error);
    }
  };

  const stopContinuousListening = async () => {
    try {
      continuousListeningRef.current = false;
      await Voice.stop();
    } catch (error) {
      console.error('Stop continuous listening error:', error);
    }
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      setError(null);
      setTranscript('');
      
      await Voice.start('en-US');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Start listening error:', error);
      setError('Failed to start voice recognition');
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
      
      if (wakeWordTimeoutRef.current) {
        clearTimeout(wakeWordTimeoutRef.current);
      }
    } catch (error) {
      console.error('Stop listening error:', error);
    }
  };

  const speak = async (text: string) => {
    try {
      setIsSpeaking(true);
      
      // Stop any ongoing speech
      Speech.stop();
      
      await Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const processCommand = async (command: string) => {
    try {
      setIsListening(false);
      
      // Process the voice command
      const result = await processVoiceCommand(command);
      
      // Speak the response
      if (result.response) {
        await speak(result.response);
      }
      
      // Handle any actions
      if (result.action) {
        // Navigate, update state, etc. based on the action
        handleVoiceAction(result.action);
      }
    } catch (error) {
      console.error('Command processing error:', error);
      await speak("Sorry, I couldn't process that command");
    }
  };

  const handleVoiceAction = (action: any) => {
    // Handle navigation, state updates, etc.
    console.log('Voice action:', action);
    // Implementation would depend on your navigation setup
  };

  return (
    <VoiceContext.Provider
      value={{
        isListening,
        isSpeaking,
        transcript,
        error,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        processCommand,
        setWakeWordEnabled,
        wakeWordDetected,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}