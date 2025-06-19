"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { voiceAssistantService, VoiceResponse, UserVoicePreferences } from "@/lib/voice-assistant-service";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  Zap,
  Brain,
  Activity,
  MessageCircle,
  User,
  Play,
  Pause,
  RotateCcw,
  Headphones,
  Lock,
  Smartphone
} from "lucide-react";

interface VoiceAssistantProps {
  userId: string;
  isLockScreen?: boolean;
  sideButtonActivated?: boolean;
}

interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
  timestamp: Date;
  isPlaying?: boolean;
  data?: any;
  followUpSuggestions?: string[];
}

export function VoiceAssistant({ userId, isLockScreen = false, sideButtonActivated = false }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [voicePreferences, setVoicePreferences] = useState<UserVoicePreferences | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [expertVoice, setExpertVoice] = useState<string>('matthew_berry');
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    initializeVoiceAssistant();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [userId]);

  useEffect(() => {
    if (sideButtonActivated && !isListening) {
      startListening();
    }
  }, [sideButtonActivated]);

  const initializeVoiceAssistant = async () => {
    try {
      // Check for speech recognition support
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported');
        return;
      }

      // Initialize speech recognition
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        startAudioVisualization();
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setCurrentTranscript(interimTranscript);

        if (finalTranscript) {
          handleVoiceCommand(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setCurrentTranscript('');
        stopAudioVisualization();
      };

      // Load user preferences
      const preferences = await loadUserPreferences();
      setVoicePreferences(preferences);
      setExpertVoice(preferences.expertVoice);

      // Add welcome message
      addWelcomeMessage();

    } catch (error) {
      console.error('Failed to initialize voice assistant:', error);
    }
  };

  const loadUserPreferences = async (): Promise<UserVoicePreferences> => {
    // Mock implementation - would load from API
    return {
      expertVoice: 'matthew_berry',
      responseStyle: 'detailed',
      personalizedGreeting: true,
      quickActions: ['lineup', 'injuries', 'waivers']
    };
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: VoiceMessage = {
      id: `msg_${Date.now()}`,
      type: 'assistant',
      text: `Hey there! I'm your Fantasy AI assistant. ${isLockScreen ? 'Even with your phone locked, ' : ''}I can help you find players, set lineups, check injuries, and more. Just say "Hey Fantasy" followed by what you need!`,
      timestamp: new Date()
    };

    setMessages([welcomeMessage]);
  };

  const startListening = async () => {
    if (!recognitionRef.current) return;

    try {
      setIsListening(true);
      setCurrentTranscript('');
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start listening:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const handleVoiceCommand = async (transcript: string) => {
    setIsProcessing(true);
    setCurrentTranscript('');

    // Add user message
    const userMessage: VoiceMessage = {
      id: `msg_${Date.now()}_user`,
      type: 'user',
      text: transcript,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Process with voice assistant service
      const response = await voiceAssistantService.processVoiceCommand(transcript, userId);
      
      // Add assistant response
      const assistantMessage: VoiceMessage = {
        id: `msg_${Date.now()}_assistant`,
        type: 'assistant',
        text: response.text,
        audioUrl: response.audioUrl,
        timestamp: new Date(),
        data: response.data,
        followUpSuggestions: response.followUpSuggestions
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Play audio response if available
      if (response.audioUrl) {
        await playAudioResponse(response.audioUrl);
      } else {
        // Fallback to text-to-speech
        await speakText(response.text);
      }

    } catch (error) {
      console.error('Voice command processing error:', error);
      
      const errorMessage: VoiceMessage = {
        id: `msg_${Date.now()}_error`,
        type: 'assistant',
        text: "Sorry, I encountered an error processing that command. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudioResponse = async (audioUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadstart = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        resolve();
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        reject(new Error('Audio playback failed'));
      };

      audio.play();
    });
  };

  const speakText = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;

      // Try to use a natural voice
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Natural') || 
        voice.name.includes('Premium') ||
        voice.name.includes('Enhanced')
      );
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };

      speechSynthesis.speak(utterance);
    });
  };

  const startAudioVisualization = () => {
    // Audio visualization for microphone input
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        audioContextRef.current = new AudioContext();
        const analyser = audioContextRef.current.createAnalyser();
        const microphone = audioContextRef.current.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        const updateAudioLevel = () => {
          if (!isListening) return;
          
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          
          drawActivity(dataArray);
          requestAnimationFrame(updateAudioLevel);
        };
        
        updateAudioLevel();
      })
      .catch(console.error);
  };

  const stopAudioVisualization = () => {
    setAudioLevel(0);
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const drawActivity = (dataArray: Uint8Array) => {
    const canvas = waveformRef.current;
    if (!canvas) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.fillStyle = 'rgb(59, 130, 246)';

    const barWidth = (WIDTH / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      barHeight = (dataArray[i] / 255) * HEIGHT;

      canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleVoiceCommand(suggestion);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
    }
  };

  if (isLockScreen) {
    // Minimal lock screen interface
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <GlassCard className="p-8 max-w-md mx-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-neon-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-neon-blue" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Hey Fantasy</h2>
            <p className="text-gray-400 mb-6">Voice assistant active on lock screen</p>
            
            <div className="relative mb-6">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-neon-red/20 border-2 border-neon-red animate-pulse' 
                    : 'bg-neon-blue/20 border-2 border-neon-blue hover:bg-neon-blue/30'
                }`}
              >
                {isListening ? (
                  <Mic className="w-6 h-6 text-neon-red" />
                ) : (
                  <Mic className="w-6 h-6 text-neon-blue" />
                )}
              </button>
              
              {isListening && (
                <div className="absolute inset-0 rounded-full border-2 border-neon-blue/50 animate-ping" />
              )}
            </div>

            {currentTranscript && (
              <div className="mb-4 p-3 bg-white/10 rounded-lg">
                <p className="text-white">{currentTranscript}</p>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-neon-blue">
                <Brain className="w-4 h-4 animate-pulse" />
                <span className="text-sm">Processing...</span>
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <div className={`${isExpanded ? 'fixed inset-0 z-50' : 'relative'}`}>
      {isExpanded && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />}
      
      <motion.div
        layout
        className={`${
          isExpanded 
            ? 'fixed bottom-0 left-0 right-0 max-w-4xl mx-auto' 
            : 'relative'
        }`}
      >
        <GlassCard className={`${isExpanded ? 'rounded-t-2xl rounded-b-none h-[80vh]' : 'rounded-2xl'} overflow-hidden`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isListening ? 'bg-neon-red/20 animate-pulse' : 'bg-neon-blue/20'
              }`}>
                <Brain className={`w-5 h-5 ${isListening ? 'text-neon-red' : 'text-neon-blue'}`} />
              </div>
              <div>
                <h3 className="font-bold text-white">Hey Fantasy</h3>
                <p className="text-xs text-gray-400">
                  {isListening ? 'Listening...' : isProcessing ? 'Processing...' : isSpeaking ? 'Speaking...' : 'Ready'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Smartphone className="w-4 h-4 text-gray-400" />
              </button>
              
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {isSpeaking ? <Volume2 className="w-4 h-4 text-neon-green" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Messages */}
          {isExpanded && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-neon-blue/20 text-white' 
                        : 'bg-white/10 text-gray-100'
                    }`}>
                      <div className="flex items-start gap-2">
                        {message.type === 'assistant' && (
                          <Brain className="w-4 h-4 text-neon-blue mt-0.5 flex-shrink-0" />
                        )}
                        {message.type === 'user' && (
                          <User className="w-4 h-4 text-neon-blue mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.text}</p>
                          <div className="text-xs text-gray-400 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                        {message.audioUrl && (
                          <button
                            onClick={() => playAudioResponse(message.audioUrl!)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                          >
                            <Play className="w-3 h-3 text-neon-green" />
                          </button>
                        )}
                      </div>

                      {/* Follow-up suggestions */}
                      {message.followUpSuggestions && (
                        <div className="mt-3 space-y-2">
                          {message.followUpSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="block w-full text-left px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-neon-blue animate-pulse" />
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-neon-blue rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Current transcript */}
          {currentTranscript && (
            <div className="px-4 py-2 bg-neon-blue/10 border-t border-neon-blue/20">
              <p className="text-sm text-neon-blue italic">"{currentTranscript}"</p>
            </div>
          )}

          {/* Audio visualization */}
          {isListening && (
            <div className="px-4 py-2 border-t border-white/10">
              <canvas
                ref={waveformRef}
                width="300"
                height="40"
                className="w-full h-10 opacity-70"
              />
            </div>
          )}

          {/* Controls */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-center gap-4">
              <NeonButton
                variant={isListening ? "pink" : "blue"}
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isListening ? 'Stop' : 'Hey Fantasy'}
              </NeonButton>

              {!isExpanded && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSuggestionClick("Who should I start this week?")}
                    className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-full transition-colors text-gray-300"
                  >
                    Start/Sit
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("Any injury updates?")}
                    className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-full transition-colors text-gray-300"
                  >
                    Injuries
                  </button>
                  <button
                    onClick={() => handleSuggestionClick("Best waiver pickups?")}
                    className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-full transition-colors text-gray-300"
                  >
                    Waivers
                  </button>
                </div>
              )}
            </div>

            {/* Expert voice selector */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <Headphones className="w-4 h-4 text-gray-400" />
              <select
                value={expertVoice}
                onChange={(e) => setExpertVoice(e.target.value)}
                className="text-xs bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
              >
                <option value="matthew_berry">Matthew Berry</option>
                <option value="adam_schefter">Adam Schefter</option>
                <option value="sarah_analytics">Sarah Analytics</option>
              </select>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

export default VoiceAssistant;