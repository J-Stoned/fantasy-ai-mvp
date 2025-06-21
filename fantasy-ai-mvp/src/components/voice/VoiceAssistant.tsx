"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Settings, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import VoiceService, { VoiceSettings } from '@/lib/voice/VoiceService';

interface VoiceAssistantProps {
  className?: string;
  isMinimized?: boolean;
  onCommand?: (command: string) => void;
}

export function VoiceAssistant({ 
  className = "", 
  isMinimized = false,
  onCommand 
}: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [currentMessage, setCurrentMessage] = useState('');
  const [voiceSettings, setVoiceSettings] = useState<Partial<VoiceSettings>>({
    stability: 0.75,
    similarityBoost: 0.85,
    style: 0.8
  });
  const [showSettings, setShowSettings] = useState(false);
  
  const voiceService = useRef(new VoiceService());
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isEnabled) {
      initializeVoiceAssistant();
    }
    return () => {
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, [isEnabled]);

  const initializeVoiceAssistant = async () => {
    try {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Start wake word detection
      await voiceService.current.startWakeWordDetection(handleVoiceCommand);
      
      // Play welcome message
      await playWelcomeMessage();
    } catch (error) {
      console.error('Voice assistant initialization failed:', error);
    }
  };

  const handleVoiceCommand = async (command: string) => {
    setCurrentMessage(`Processing: "${command}"`);
    setIsListening(true);

    try {
      // Analyze the command
      const response = await processFantasyCommand(command);
      
      // Speak the response
      if (response) {
        await speakResponse(response);
      }
      
      // Notify parent component
      onCommand?.(command);
    } catch (error) {
      console.error('Command processing failed:', error);
      await speakResponse("Sorry, I didn't understand that command. Try asking about your lineup or player stats.");
    } finally {
      setIsListening(false);
      setTimeout(() => setCurrentMessage(''), 3000);
    }
  };

  const processFantasyCommand = async (command: string): Promise<string> => {
    const lowerCommand = command.toLowerCase();

    // Lineup commands
    if (lowerCommand.includes('lineup') || lowerCommand.includes('who should i start')) {
      return "Let me analyze your optimal lineup for this week. Checking player projections and matchups...";
    }

    // Player information
    if (lowerCommand.includes('how is') || lowerCommand.includes('stats for')) {
      const playerMatch = lowerCommand.match(/(?:how is|stats for)\s+([a-z\s]+)/);
      const player = playerMatch?.[1]?.trim() || 'that player';
      return `Looking up current stats and projections for ${player}. Give me a moment...`;
    }

    // Trade analysis
    if (lowerCommand.includes('trade') || lowerCommand.includes('should i trade')) {
      return "I'll analyze potential trades based on your team needs and player values. This could be a game changer!";
    }

    // Waiver wire
    if (lowerCommand.includes('waiver') || lowerCommand.includes('pickup')) {
      return "Scanning the waiver wire for hidden gems and breakout candidates. I've found some interesting options!";
    }

    // Injury updates
    if (lowerCommand.includes('injury') || lowerCommand.includes('hurt')) {
      return "Checking the latest injury reports and impact analysis. Player health is crucial for your success!";
    }

    // Matchup analysis
    if (lowerCommand.includes('matchup') || lowerCommand.includes('opponent')) {
      return "Analyzing your matchup for this week. I'm looking at strength of schedules and key player comparisons.";
    }

    // Draft help
    if (lowerCommand.includes('draft') || lowerCommand.includes('pick')) {
      return "Draft strategy coming right up! I'll help you dominate your draft with data-driven recommendations.";
    }

    // Default response
    return "I'm here to help with all your fantasy needs. Ask me about lineups, trades, waivers, injuries, or draft strategy!";
  };

  const speakResponse = async (text: string): Promise<void> => {
    if (!isEnabled || !audioContext.current) return;

    setIsSpeaking(true);
    setCurrentMessage(text);

    try {
      const audioBuffer = await voiceService.current.synthesizeSpeech(
        text,
        'voice_fantasy_expert',
        voiceSettings
      );

      if (audioBuffer && audioContext.current) {
        const source = audioContext.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.current.destination);
        
        source.onended = () => {
          setIsSpeaking(false);
        };
        
        source.start();
      }
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      setIsSpeaking(false);
    }
  };

  const playWelcomeMessage = async (): Promise<void> => {
    const welcomeText = "Hey there, fantasy champion! I'm your AI-powered fantasy assistant. Say 'Hey Fantasy' followed by your question, and I'll help you dominate your league!";
    await speakResponse(welcomeText);
  };

  const toggleListening = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setCurrentMessage("Listening for commands...");
    } else {
      setCurrentMessage("");
    }
  };

  if (isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`fixed bottom-6 right-6 z-50 ${className}`}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleListening}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
            isListening 
              ? 'bg-gradient-to-r from-neon-pink to-neon-purple' 
              : 'bg-gradient-to-r from-neon-blue to-neon-purple'
          } border border-white/20`}
        >
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="listening"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center justify-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Mic className="w-6 h-6 text-white" />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="not-listening"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    );
  }

  return (
    <GlassCard className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-neon-purple to-neon-pink rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Fantasy AI Assistant</h3>
            <p className="text-sm text-gray-400">Say "Hey Fantasy" to get started</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsEnabled(!isEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              isEnabled 
                ? 'text-neon-green hover:bg-neon-green/10' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {isEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>
        </div>
      </div>

      {/* Status Display */}
      <div className="mb-6">
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          isListening 
            ? 'bg-neon-pink/10 border-neon-pink/30 text-neon-pink' 
            : isSpeaking 
            ? 'bg-neon-blue/10 border-neon-blue/30 text-neon-blue'
            : 'bg-white/5 border-white/10 text-gray-400'
        }`}>
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="mic"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  <Mic className="w-5 h-5" />
                </motion.div>
              </motion.div>
            ) : isSpeaking ? (
              <motion.div
                key="volume"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                >
                  <Volume2 className="w-5 h-5" />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="sparkles"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Sparkles className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex-1">
            <p className="text-sm font-medium">
              {isListening 
                ? 'Listening...' 
                : isSpeaking 
                ? 'Speaking...' 
                : 'Ready for commands'
              }
            </p>
            {currentMessage && (
              <p className="text-xs opacity-75 mt-1">{currentMessage}</p>
            )}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3">
        <NeonButton
          variant={isListening ? "pink" : "purple"}
          onClick={toggleListening}
          className="flex-1 flex items-center justify-center gap-2"
          disabled={!isEnabled}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {isListening ? 'Stop Listening' : 'Start Listening'}
        </NeonButton>
      </div>

      {/* Voice Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10"
          >
            <h4 className="text-sm font-medium text-white mb-4">Voice Settings</h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Stability</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.stability}
                  onChange={(e) => setVoiceSettings(prev => ({ 
                    ...prev, 
                    stability: parseFloat(e.target.value) 
                  }))}
                  className="w-full accent-neon-purple"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-400 block mb-1">Similarity Boost</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.similarityBoost}
                  onChange={(e) => setVoiceSettings(prev => ({ 
                    ...prev, 
                    similarityBoost: parseFloat(e.target.value) 
                  }))}
                  className="w-full accent-neon-purple"
                />
              </div>
              
              <div>
                <label className="text-xs text-gray-400 block mb-1">Style</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceSettings.style}
                  onChange={(e) => setVoiceSettings(prev => ({ 
                    ...prev, 
                    style: parseFloat(e.target.value) 
                  }))}
                  className="w-full accent-neon-purple"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}