'use client';

import { useState, useEffect, useCallback } from 'react';
import { voiceCommands, VoiceResponse } from '@/lib/mobile-voice-commands';
import { useRouter } from 'next/navigation';

interface UseVoiceCommandsOptions {
  onCommand?: (command: string) => void;
  onResponse?: (response: VoiceResponse) => void;
  onError?: (error: Error) => void;
  autoListen?: boolean;
  wakeWord?: string;
}

export function useVoiceCommands(options: UseVoiceCommandsOptions = {}) {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<VoiceResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const {
    onCommand,
    onResponse,
    onError,
    autoListen = false,
    wakeWord = 'hey fantasy'
  } = options;

  // Initialize continuous listening for wake word
  useEffect(() => {
    if (autoListen && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join(' ')
          .toLowerCase();
        
        if (transcript.includes(wakeWord)) {
          recognition.stop();
          startListening();
        }
      };
      
      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error('Wake word recognition error:', event.error);
        }
      };
      
      recognition.onend = () => {
        if (autoListen) {
          // Restart listening for wake word
          setTimeout(() => recognition.start(), 1000);
        }
      };
      
      try {
        recognition.start();
      } catch (e) {
        console.error('Failed to start wake word detection:', e);
      }
      
      return () => {
        recognition.stop();
      };
    }
  }, [autoListen, wakeWord]);

  const startListening = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsListening(true);
      setError(null);
      
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onresult = async (event: any) => {
        const command = event.results[0][0].transcript;
        setLastCommand(command);
        onCommand?.(command);
        
        setIsProcessing(true);
        try {
          const response = await voiceCommands.processCommand(command);
          setLastResponse(response);
          onResponse?.(response);
          
          // Handle navigation actions
          if (response.action?.type === 'navigate') {
            router.push(response.action.data.route);
          }
        } catch (err) {
          const error = err as Error;
          setError(error);
          onError?.(error);
        } finally {
          setIsProcessing(false);
        }
      };
      
      recognition.onerror = (event: any) => {
        setIsListening(false);
        const error = new Error(`Speech recognition error: ${event.error}`);
        setError(error);
        onError?.(error);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      const error = new Error('Speech recognition not supported');
      setError(error);
      onError?.(error);
    }
  }, [router, onCommand, onResponse, onError]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    // Note: Can't directly stop recognition from here
    // It will stop automatically when speech ends
  }, []);

  const speak = useCallback((text: string, options?: SpeechSynthesisUtterance) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (options) {
        Object.assign(utterance, options);
      } else {
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
      }
      
      speechSynthesis.speak(utterance);
    }
  }, []);

  const processCommand = useCallback(async (command: string) => {
    setLastCommand(command);
    setIsProcessing(true);
    setError(null);
    
    try {
      const response = await voiceCommands.processCommand(command);
      setLastResponse(response);
      return response;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    // State
    isListening,
    isProcessing,
    lastCommand,
    lastResponse,
    error,
    
    // Actions
    startListening,
    stopListening,
    speak,
    processCommand,
    
    // Utilities
    isSupported: typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  };
}