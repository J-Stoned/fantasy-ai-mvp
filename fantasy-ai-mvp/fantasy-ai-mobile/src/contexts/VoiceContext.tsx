import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Platform } from 'react-native';

interface VoiceContextType {
  isListening: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  setVoicePersona: (persona: 'expert' | 'coach' | 'analyst' | 'friend') => void;
  voicePersona: 'expert' | 'coach' | 'analyst' | 'friend';
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};

interface VoiceProviderProps {
  children: ReactNode;
}

export const VoiceProvider: React.FC<VoiceProviderProps> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voicePersona, setVoicePersona] = useState<VoiceContextType['voicePersona']>('coach');

  const startListening = async () => {
    try {
      setIsListening(true);
      // Mock voice recognition - replace with actual implementation
      // Using @react-native-voice/voice or similar
      
      // Simulate voice recognition
      setTimeout(() => {
        setTranscript('Show me my best lineup for this week');
        setIsListening(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to start listening:', error);
      setIsListening(false);
      throw error;
    }
  };

  const stopListening = () => {
    setIsListening(false);
    // Stop actual voice recognition
  };

  const speak = async (text: string) => {
    try {
      // Mock TTS - replace with actual implementation
      // Using react-native-tts or ElevenLabs API
      console.log(`Speaking (${voicePersona}):`, text);
      
      // Simulate speech
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to speak:', error);
      throw error;
    }
  };

  const value = {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
    setVoicePersona,
    voicePersona,
  };

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
};