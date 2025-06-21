/**
 * Voice-First Interface - Fantasy.AI Ultimate Voice Experience
 * Natural voice interactions using ElevenLabs MCP + Enhanced AI Orchestrator
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RevolutionaryGlassCard } from "../ui/RevolutionaryGlassCard";
import { unifiedMCPManager } from "@/lib/mcp-integration/unified-mcp-manager";
import { enhancedAIOrchestrator } from "@/lib/ai/enhanced-ai-orchestrator";

interface VoiceCommand {
  id: string;
  transcript: string;
  confidence: number;
  intent: string;
  entities: Record<string, string>;
  timestamp: Date;
  processed: boolean;
  response?: VoiceResponse;
}

interface VoiceResponse {
  text: string;
  audioUrl?: string;
  actions: VoiceAction[];
  visualElements?: any[];
  confidence: number;
  processingTime: number;
}

interface VoiceAction {
  type: "navigate" | "analyze" | "update" | "search" | "recommend";
  target?: string;
  data?: any;
  priority: "high" | "medium" | "low";
}

interface VoicePersona {
  id: string;
  name: string;
  description: string;
  voiceId: string;
  personality: string;
  expertise: string[];
  responseStyle: "professional" | "casual" | "expert" | "friendly";
}

const voicePersonas: VoicePersona[] = [
  {
    id: "expert_analyst",
    name: "Expert Analyst",
    description: "Professional fantasy sports analyst with deep statistical knowledge",
    voiceId: "expert_male_voice",
    personality: "Analytical, precise, data-driven",
    expertise: ["statistics", "matchup_analysis", "player_evaluation"],
    responseStyle: "professional"
  },
  {
    id: "friendly_coach",
    name: "Friendly Coach",
    description: "Encouraging fantasy coach who helps you make confident decisions",
    voiceId: "friendly_female_voice",
    personality: "Supportive, encouraging, motivational",
    expertise: ["lineup_optimization", "strategy", "confidence_building"],
    responseStyle: "friendly"
  },
  {
    id: "sharp_bettor",
    name: "Sharp Bettor",
    description: "Professional bettor with insider market knowledge",
    voiceId: "confident_male_voice",
    personality: "Confident, direct, market-savvy",
    expertise: ["betting_lines", "market_intelligence", "value_identification"],
    responseStyle: "expert"
  },
  {
    id: "casual_friend",
    name: "Fantasy Buddy",
    description: "Your fantasy football friend who keeps things fun and relaxed",
    voiceId: "casual_voice",
    personality: "Laid-back, humorous, relatable",
    expertise: ["general_advice", "fun_facts", "season_long_strategy"],
    responseStyle: "casual"
  }
];

export function VoiceFirstInterface() {
  const [isListening, setIsListening] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<VoicePersona>(voicePersonas[0]);
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<VoiceResponse | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize voice recognition and audio context
  useEffect(() => {
    initializeAudioContext();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initializeAudioContext = async () => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      // Setup audio level monitoring
      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        startAudioLevelMonitoring();
      }

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await processVoiceInput(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsListening(true);

    } catch (error) {
      console.error("Failed to start voice recognition:", error);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setAudioLevel(0);
    }
  };

  const startAudioLevelMonitoring = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(average / 255);

      if (isListening) {
        requestAnimationFrame(updateAudioLevel);
      }
    };

    updateAudioLevel();
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    setIsProcessing(true);

    try {
      // Step 1: Transcribe audio using ElevenLabs MCP
      const transcription = await unifiedMCPManager.executeCapability({
        operation: "speech_to_text",
        servers: ["elevenlabs"],
        priority: "high",
        parameters: {
          audio: audioBlob,
          language: "en",
          enhance_quality: true
        }
      });

      // Step 2: Parse command intent and entities
      const command = await parseVoiceCommand(transcription.text);
      
      // Step 3: Process command with Enhanced AI Orchestrator
      const response = await generateVoiceResponse(command);
      
      // Step 4: Generate voice response using ElevenLabs
      const audioResponse = await generateVoiceAudio(response.text);
      
      // Update state
      const fullResponse: VoiceResponse = {
        ...response,
        audioUrl: audioResponse.audioUrl
      };

      setCurrentResponse(fullResponse);
      
      // Add to command history
      const fullCommand: VoiceCommand = {
        ...command,
        processed: true,
        response: fullResponse
      };
      
      setVoiceCommands(prev => [fullCommand, ...prev.slice(0, 9)]); // Keep last 10

      // Auto-play response
      if (audioResponse.audioUrl) {
        playVoiceResponse(audioResponse.audioUrl);
      }

    } catch (error) {
      console.error("Voice processing error:", error);
      const errorResponse: VoiceResponse = {
        text: "I'm sorry, I had trouble processing that. Could you try again?",
        actions: [],
        confidence: 0.1,
        processingTime: 0
      };
      setCurrentResponse(errorResponse);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseVoiceCommand = async (transcript: string): Promise<VoiceCommand> => {
    // Use Sequential Thinking MCP for natural language understanding
    const analysis = await unifiedMCPManager.executeCapability({
      operation: "parse_voice_command",
      servers: ["sequential_thinking"],
      priority: "high",
      parameters: {
        transcript,
        context: "fantasy_football",
        extract_entities: true,
        determine_intent: true
      }
    });

    return {
      id: `cmd_${Date.now()}`,
      transcript,
      confidence: analysis.confidence || 0.8,
      intent: analysis.intent || "general_query",
      entities: analysis.entities || {},
      timestamp: new Date(),
      processed: false
    };
  };

  const generateVoiceResponse = async (command: VoiceCommand): Promise<VoiceResponse> => {
    const startTime = Date.now();

    // Generate response based on intent
    let responseText = "";
    let actions: VoiceAction[] = [];
    let visualElements: any[] = [];

    switch (command.intent) {
      case "player_analysis":
        const playerName = command.entities.player;
        if (playerName) {
          const analysis = await enhancedAIOrchestrator.orchestrateComprehensiveAnalysis(
            `player_${Date.now()}`,
            playerName,
            {
              position: command.entities.position || "FLEX",
              team: command.entities.team || "Unknown",
              opponent: command.entities.opponent || "Unknown",
              week: parseInt(command.entities.week) || 1
            }
          );

          responseText = `Here's my analysis of ${playerName}: ${analysis.synthesis.overallInsight}`;
          actions.push({
            type: "analyze",
            target: "player_dashboard",
            data: analysis,
            priority: "high"
          });
          visualElements = analysis.multiModalOutput.visualElements;
        } else {
          responseText = "I'd be happy to analyze a player for you. Which player would you like me to look at?";
        }
        break;

      case "lineup_optimization":
        responseText = "Let me help you optimize your lineup. I'll analyze your current roster and suggest improvements based on matchups, projections, and value plays.";
        actions.push({
          type: "navigate",
          target: "lineup_optimizer",
          priority: "high"
        });
        break;

      case "matchup_analysis":
        const team1 = command.entities.team1;
        const team2 = command.entities.team2;
        if (team1 && team2) {
          responseText = `The ${team1} vs ${team2} matchup looks interesting. Let me break down the key factors for fantasy purposes.`;
          actions.push({
            type: "analyze",
            target: "matchup_dashboard",
            data: { team1, team2 },
            priority: "high"
          });
        } else {
          responseText = "Which teams' matchup would you like me to analyze?";
        }
        break;

      case "injury_update":
        responseText = "I'll check the latest injury reports and their fantasy implications for you.";
        actions.push({
          type: "update",
          target: "injury_tracker",
          priority: "high"
        });
        break;

      case "waiver_recommendations":
        responseText = "Based on recent performance trends and upcoming matchups, here are my top waiver wire recommendations.";
        actions.push({
          type: "recommend",
          target: "waiver_wire",
          priority: "high"
        });
        break;

      default:
        responseText = `I understand you're asking about ${command.transcript}. Let me help you with that.`;
        actions.push({
          type: "search",
          target: "general_search",
          data: { query: command.transcript },
          priority: "medium"
        });
    }

    // Personalize response based on current persona
    responseText = personalizeResponse(responseText, currentPersona);

    return {
      text: responseText,
      actions,
      visualElements,
      confidence: command.confidence,
      processingTime: Date.now() - startTime
    };
  };

  const personalizeResponse = (text: string, persona: VoicePersona): string => {
    switch (persona.responseStyle) {
      case "professional":
        return `Based on my analysis, ${text.toLowerCase()}`;
      case "friendly":
        return `Hey there! ${text}`;
      case "expert":
        return `Look, ${text}`;
      case "casual":
        return `So, ${text.toLowerCase()}`;
      default:
        return text;
    }
  };

  const generateVoiceAudio = async (text: string) => {
    try {
      return await unifiedMCPManager.executeCapability({
        operation: "text_to_speech",
        servers: ["elevenlabs"],
        priority: "medium",
        parameters: {
          text,
          voice_id: currentPersona.voiceId,
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.2,
          speed: 1.0
        }
      });
    } catch (error) {
      console.error("Failed to generate voice audio:", error);
      return { audioUrl: null };
    }
  };

  const playVoiceResponse = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const handlePersonaChange = (persona: VoicePersona) => {
    setCurrentPersona(persona);
  };

  return (
    <div className="space-y-6">
      {/* Voice Interface Header */}
      <RevolutionaryGlassCard
        variant="premium"
        neonColor="purple"
        backgroundPattern="neural"
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-white mb-2">
          Hey Fantasy - Voice Command Center
        </h2>
        <p className="text-gray-300">
          Speak naturally to get instant fantasy insights and analysis
        </p>
      </RevolutionaryGlassCard>

      {/* Voice Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Voice Interface */}
        <RevolutionaryGlassCard
          variant="elite"
          neonColor={isListening ? "green" : "blue"}
          pulse={isListening}
          className="text-center"
        >
          <div className="space-y-6">
            {/* Voice Visualization */}
            <div className="relative mx-auto w-32 h-32">
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-blue-500"
                animate={{
                  scale: isListening ? [1, 1.2, 1] : 1,
                  borderColor: isListening ? ["#3b82f6", "#10b981", "#3b82f6"] : "#3b82f6"
                }}
                transition={{
                  duration: isListening ? 1.5 : 0.3,
                  repeat: isListening ? Infinity : 0
                }}
              />
              
              {/* Audio level visualization */}
              <motion.div
                className="absolute inset-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                animate={{
                  scale: 0.8 + (audioLevel * 0.4),
                  opacity: 0.6 + (audioLevel * 0.4)
                }}
                transition={{ duration: 0.1 }}
              />
              
              {/* Microphone icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="text-4xl"
                  animate={{ rotate: isListening ? 360 : 0 }}
                  transition={{ duration: 2, repeat: isListening ? Infinity : 0 }}
                >
                  🎤
                </motion.div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <p className="text-lg font-semibold text-white">
                {isProcessing ? "Processing..." : isListening ? "Listening..." : "Ready"}
              </p>
              
              {currentResponse && (
                <p className="text-gray-300 text-sm max-w-md mx-auto">
                  {currentResponse.text}
                </p>
              )}
            </div>

            {/* Voice Controls */}
            <div className="flex justify-center space-x-4">
              <motion.button
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isListening
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isListening ? "Stop" : "Speak"}
              </motion.button>

              {currentResponse?.audioUrl && (
                <motion.button
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                  onClick={() => playVoiceResponse(currentResponse.audioUrl!)}
                  disabled={isPlaying}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPlaying ? "Playing..." : "Replay"}
                </motion.button>
              )}
            </div>
          </div>
        </RevolutionaryGlassCard>

        {/* Voice Persona Selection */}
        <RevolutionaryGlassCard
          variant="default"
          neonColor="cyan"
          backgroundPattern="grid"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Voice Persona</h3>
          <div className="space-y-3">
            {voicePersonas.map((persona) => (
              <motion.div
                key={persona.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  currentPersona.id === persona.id
                    ? "border-cyan-500 bg-cyan-500/20"
                    : "border-gray-600 hover:border-cyan-400 bg-gray-800/50"
                }`}
                onClick={() => handlePersonaChange(persona)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-white">{persona.name}</p>
                    <p className="text-sm text-gray-400">{persona.description}</p>
                    <p className="text-xs text-cyan-400 mt-1">
                      {persona.expertise.join(" • ")}
                    </p>
                  </div>
                  {currentPersona.id === persona.id && (
                    <div className="text-cyan-500 text-xl">✓</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </RevolutionaryGlassCard>
      </div>

      {/* Recent Commands */}
      {voiceCommands.length > 0 && (
        <RevolutionaryGlassCard
          variant="default"
          neonColor="purple"
          backgroundPattern="waves"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Recent Commands</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {voiceCommands.map((command) => (
              <div key={command.id} className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">"{command.transcript}"</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Intent: {command.intent} • Confidence: {(command.confidence * 100).toFixed(0)}%
                    </p>
                    {command.response && (
                      <p className="text-sm text-cyan-400 mt-2">
                        Response: {command.response.text}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {command.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </RevolutionaryGlassCard>
      )}

      {/* Hidden audio element for playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}