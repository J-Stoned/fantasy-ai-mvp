'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { voiceCommands } from '@/lib/mobile-voice-commands';
import { useRouter } from 'next/navigation';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  X, 
  Loader2,
  Sparkles,
  MessageCircle,
  Lightbulb,
  ChevronUp
} from 'lucide-react';

interface EnhancedVoiceAssistantProps {
  onClose?: () => void;
  autoStart?: boolean;
  embedded?: boolean;
}

export function EnhancedVoiceAssistant({ 
  onClose,
  autoStart = false,
  embedded = false
}: EnhancedVoiceAssistantProps) {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'assistant';
    text: string;
    timestamp: Date;
  }>>([]);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 100], [1, 0]);

  useEffect(() => {
    initializeSpeechRecognition();
    
    if (autoStart) {
      setTimeout(startListening, 500);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        speechSynthesis.cancel();
      }
    };
  }, [autoStart]);

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 3;

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
        
        // Visual feedback
        if (event.results[current].isFinal) {
          handleVibration(50);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript) {
          processCommand(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech') {
          setResponse("I didn't hear anything. Tap the microphone to try again.");
        }
      };

      recognitionRef.current.onspeechstart = () => {
        handleVibration(30);
      };
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      setTranscript('');
      setResponse('');
      setShowSuggestions(false);
      recognitionRef.current.start();
      setIsListening(true);
      handleVibration(100);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      handleVibration(50);
    }
  };

  const processCommand = async (command: string) => {
    setIsProcessing(true);
    
    // Add to conversation history
    const userMessage = {
      type: 'user' as const,
      text: command,
      timestamp: new Date()
    };
    setConversationHistory(prev => [...prev, userMessage]);
    
    try {
      // Process command
      const result = await voiceCommands.processCommand(command);
      
      // Add response to history
      const assistantMessage = {
        type: 'assistant' as const,
        text: result.speech,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, assistantMessage]);
      
      setResponse(result.speech);
      
      // Speak the response
      if (result.speech) {
        speakResponse(result.speech);
      }
      
      // Handle actions
      if (result.action) {
        handleAction(result.action);
      }
      
      // Show suggestions if available
      if (result.suggestions) {
        setTimeout(() => {
          setShowSuggestions(true);
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error processing command:', error);
      setResponse("Sorry, I had trouble processing that command.");
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Voice settings for better mobile experience
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to use a better voice if available
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Samantha') || // iOS
        voice.name.includes('Google US English') || // Android
        voice.lang === 'en-US'
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onend = () => {
        setIsSpeaking(false);
        handleVibration(50);
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      
      synthRef.current = utterance;
      speechSynthesis.speak(utterance);
    }
  };

  const handleAction = (action: any) => {
    switch (action.type) {
      case 'navigate':
        setTimeout(() => {
          router.push(action.data.route);
          onClose?.();
        }, 1500);
        break;
        
      case 'lineup':
        // Handle lineup changes
        console.log('Lineup action:', action.data);
        break;
        
      case 'search':
        // Handle search
        console.log('Search action:', action.data);
        break;
        
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleVibration = (duration: number) => {
    if ('vibrate' in navigator && !embedded) {
      navigator.vibrate(duration);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const quickCommands = [
    { icon: Lightbulb, text: "Who should I start?", color: "text-yellow-500" },
    { icon: MessageCircle, text: "Check injuries", color: "text-red-500" },
    { icon: Sparkles, text: "Optimize lineup", color: "text-blue-500" },
    { icon: ChevronUp, text: "Trade suggestions", color: "text-green-500" }
  ];

  if (embedded) {
    // Compact version for embedding in other screens
    return (
      <motion.div
        className="bg-gray-800 rounded-2xl p-4"
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">Voice Assistant</h3>
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={toggleListening}
            className={`p-3 rounded-full ${
              isListening ? 'bg-red-600' : 'bg-blue-600'
            }`}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-white" />
            )}
          </motion.button>
        </div>
        
        {(transcript || response) && (
          <div className="space-y-2">
            {transcript && (
              <p className="text-sm text-gray-400">"{transcript}"</p>
            )}
            {response && (
              <p className="text-sm text-white">{response}</p>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ opacity }}
      className="fixed inset-0 bg-gradient-to-b from-gray-900 via-blue-900/20 to-black z-50 flex flex-col"
    >
      {/* Header */}
      <motion.div 
        className="flex justify-between items-center p-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div>
          <h2 className="text-xl font-bold text-white">Hey Fantasy</h2>
          <p className="text-sm text-gray-400">Your AI assistant</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={onClose}
          className="text-gray-400 p-2"
        >
          <X className="w-6 h-6" />
        </motion.button>
      </motion.div>

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <AnimatePresence>
            {conversationHistory.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: message.type === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`mb-3 ${
                  message.type === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div className={`inline-block max-w-[80%] p-3 rounded-2xl ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-white'
                }`}>
                  <p className="text-sm">{message.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Animated Voice Orb */}
        <motion.div
          className="relative mb-8"
          animate={isListening ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {/* Glow effect */}
          <motion.div
            className={`absolute inset-0 rounded-full blur-3xl ${
              isListening ? 'bg-blue-500' : 'bg-gray-700'
            }`}
            animate={{
              opacity: isListening ? [0.3, 0.6, 0.3] : 0.2,
              scale: isListening ? [1, 1.3, 1] : 1
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          
          {/* Main button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleListening}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center ${
              isListening 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                : isProcessing
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                : 'bg-gradient-to-r from-gray-700 to-gray-800'
            }`}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            style={{ y }}
          >
            {isProcessing ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : isListening ? (
              <div className="flex flex-col items-center">
                <MicOff className="w-10 h-10 text-white mb-1" />
                <span className="text-xs text-white font-medium">Listening...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Mic className="w-10 h-10 text-white mb-1" />
                <span className="text-xs text-white/80 font-medium">Tap to speak</span>
              </div>
            )}
          </motion.button>
        </motion.div>

        {/* Status indicators */}
        <AnimatePresence mode="wait">
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-blue-400 mb-4"
            >
              <Volume2 className="w-4 h-4" />
              <span className="text-sm">Speaking...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current transcript/response */}
        <AnimatePresence mode="wait">
          {(transcript || response) && !conversationHistory.length && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-full text-center mb-6"
            >
              {transcript && !response && (
                <p className="text-lg text-gray-300 italic">"{transcript}"</p>
              )}
              {response && (
                <p className="text-lg text-white mt-3">{response}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Commands */}
      {showSuggestions && !isListening && !conversationHistory.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-900/50 backdrop-blur border-t border-gray-800"
        >
          <p className="text-xs text-gray-500 mb-3 text-center">Quick commands</p>
          <div className="grid grid-cols-2 gap-2">
            {quickCommands.map((command, index) => {
              const Icon = command.icon;
              return (
                <motion.button
                  key={command.text}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    setTranscript(command.text);
                    processCommand(command.text);
                  }}
                  className="bg-gray-800/80 backdrop-blur text-left p-3 rounded-xl flex items-center gap-2"
                >
                  <Icon className={`w-4 h-4 ${command.color}`} />
                  <span className="text-xs text-gray-300">{command.text}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}