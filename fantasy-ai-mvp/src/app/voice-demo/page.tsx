"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/navigation/PageHeader';
import { VoiceAssistant } from '@/components/voice/VoiceAssistant';
import { GlassCard } from '@/components/ui/GlassCard';
import { NeonButton } from '@/components/ui/NeonButton';
import VoiceService from '@/lib/voice/VoiceService';
import { 
  Mic, 
  Volume2, 
  AudioWaveform, 
  Sparkles, 
  Bot, 
  PlayCircle,
  Users,
  Trophy,
  Zap,
  Crown
} from 'lucide-react';

export default function VoiceDemoPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<string>('');
  const [voiceService] = useState(() => new VoiceService());

  const demoScenarios = [
    {
      id: 'lineup_advice',
      title: 'Lineup Optimization',
      description: 'Get AI-powered lineup recommendations',
      icon: Trophy,
      command: 'Hey Fantasy, who should I start at running back this week?',
      response: 'Based on matchup analysis, I recommend starting Christian McCaffrey. He has an excellent matchup against Seattle\'s 28th-ranked run defense, and he\'s been averaging 22.3 points over the last 4 games.'
    },
    {
      id: 'trade_analysis',
      title: 'Trade Evaluation',
      description: 'Analyze trade proposals instantly',
      icon: Users,
      command: 'Hey Fantasy, should I trade Tyreek Hill for Travis Kelce?',
      response: 'That\'s an interesting trade proposal! Travis Kelce offers more consistency at tight end, but Tyreek Hill has higher upside at wide receiver. Given your current roster construction, I\'d lean towards keeping Hill for his explosive potential.'
    },
    {
      id: 'waiver_wire',
      title: 'Waiver Wire Gems',
      description: 'Discover hidden breakout candidates',
      icon: Zap,
      command: 'Hey Fantasy, who are the best waiver wire pickups this week?',
      response: 'Great question! The top waiver targets this week are: Jordan Mason with a 78% breakout probability, Rashid Shaheed with excellent target share trends, and Tyler Boyd who has a juicy matchup. I\'ll prioritize Mason first.'
    },
    {
      id: 'injury_alerts',
      title: 'Injury Impact Analysis',
      description: 'Real-time injury updates and alternatives',
      icon: Bot,
      command: 'Hey Fantasy, what\'s the impact of the Mahomes injury news?',
      response: 'Patrick Mahomes is listed as questionable with an ankle injury. Historical data shows he plays through minor injuries 85% of the time. However, consider Tua Tagovailoa as a backup option - he has a great matchup this week.'
    }
  ];

  const playDemo = async (scenario: typeof demoScenarios[0]) => {
    setSelectedDemo(scenario.id);
    setIsPlaying(true);

    try {
      // Simulate voice command processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate and play the response
      const audioBuffer = await voiceService.synthesizeSpeech(
        scenario.response,
        'voice_fantasy_expert'
      );

      if (audioBuffer) {
        const audioContext = new AudioContext();
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        source.onended = () => {
          setIsPlaying(false);
          setSelectedDemo('');
        };
        
        source.start();
      } else {
        // Fallback if ElevenLabs isn't configured
        setTimeout(() => {
          setIsPlaying(false);
          setSelectedDemo('');
        }, 3000);
      }
    } catch (error) {
      console.error('Demo playback failed:', error);
      setIsPlaying(false);
      setSelectedDemo('');
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Voice AI Demo"
        description="Experience the future of fantasy sports with ElevenLabs-powered voice assistance"
        icon={<Mic className="w-6 h-6 text-neon-purple" />}
        actions={
          <NeonButton variant="purple" size="sm" className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Pro Feature
          </NeonButton>
        }
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded-full border border-neon-purple/30 mb-6">
            <Sparkles className="w-5 h-5 text-neon-purple" />
            <span className="text-neon-purple font-medium">Powered by ElevenLabs AI</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold neon-text mb-4">
            Say Hello to Your New
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-pink">
              Fantasy Coach
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Experience natural voice conversations with your AI fantasy assistant. 
            Get instant advice, analyze trades, and manage your team hands-free.
          </p>
        </motion.div>

        {/* Demo Scenarios Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          {demoScenarios.map((scenario, index) => (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className={`p-6 cursor-pointer transition-all duration-300 ${
                selectedDemo === scenario.id 
                  ? 'ring-2 ring-neon-purple/50 bg-neon-purple/5' 
                  : 'hover:bg-white/5'
              }`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded-xl flex items-center justify-center border border-neon-purple/30">
                    <scenario.icon className="w-6 h-6 text-neon-purple" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{scenario.title}</h3>
                    <p className="text-gray-400 text-sm mb-4">{scenario.description}</p>
                    
                    {/* Voice Command Preview */}
                    <div className="bg-gray-900/50 rounded-lg p-3 mb-4 border border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Mic className="w-4 h-4 text-neon-blue" />
                        <span className="text-xs text-neon-blue font-medium">Voice Command</span>
                      </div>
                      <p className="text-sm text-gray-300 italic">"{scenario.command}"</p>
                    </div>
                    
                    {/* Play Button */}
                    <NeonButton
                      variant="purple"
                      size="sm"
                      onClick={() => playDemo(scenario)}
                      disabled={isPlaying}
                      className="flex items-center gap-2"
                    >
                      {selectedDemo === scenario.id && isPlaying ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                          >
                            <AudioWaveform className="w-4 h-4" />
                          </motion.div>
                          Playing...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          Try Demo
                        </>
                      )}
                    </NeonButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Live Voice Assistant */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Interactive Voice Assistant */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Volume2 className="w-6 h-6 text-neon-green" />
              Live Voice Assistant
            </h2>
            <VoiceAssistant 
              onCommand={(command) => {
                console.log("Live command:", command);
              }}
            />
          </motion.div>

          {/* Features & Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-neon-yellow" />
              Voice AI Features
            </h2>
            
            <div className="space-y-4">
              <GlassCard className="p-4">
                <h3 className="font-semibold text-neon-blue mb-2">Natural Language Processing</h3>
                <p className="text-sm text-gray-400">
                  Speak naturally - no need to memorize specific commands. Our AI understands context and intent.
                </p>
              </GlassCard>
              
              <GlassCard className="p-4">
                <h3 className="font-semibold text-neon-green mb-2">Expert Voice Personalities</h3>
                <p className="text-sm text-gray-400">
                  Choose from sports commentator, fantasy expert, or clone your own voice for personalized responses.
                </p>
              </GlassCard>
              
              <GlassCard className="p-4">
                <h3 className="font-semibold text-neon-purple mb-2">Hands-Free Management</h3>
                <p className="text-sm text-gray-400">
                  Perfect for busy schedules - manage your team while driving, working out, or multitasking.
                </p>
              </GlassCard>
              
              <GlassCard className="p-4">
                <h3 className="font-semibold text-neon-pink mb-2">Wake Word Detection</h3>
                <p className="text-sm text-gray-400">
                  Simply say "Hey Fantasy" to activate your assistant - no buttons, no hassle.
                </p>
              </GlassCard>
            </div>
          </motion.div>
        </div>

        {/* Technical Integration Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <GlassCard className="p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
              <Bot className="w-6 h-6 text-neon-cyan" />
              ElevenLabs Integration Showcase
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-neon-blue/20 to-neon-cyan/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-neon-cyan/30">
                  <AudioWaveform className="w-8 h-8 text-neon-cyan" />
                </div>
                <h4 className="font-semibold text-neon-cyan mb-2">High-Quality TTS</h4>
                <p className="text-sm text-gray-400">
                  Ultra-realistic voice synthesis with emotional intelligence and natural speech patterns.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-neon-purple/30">
                  <Users className="w-8 h-8 text-neon-purple" />
                </div>
                <h4 className="font-semibold text-neon-purple mb-2">Voice Cloning</h4>
                <p className="text-sm text-gray-400">
                  Clone your voice or choose from premium voice personas for a personalized experience.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-neon-green/20 to-neon-yellow/20 rounded-xl flex items-center justify-center mx-auto mb-3 border border-neon-green/30">
                  <Zap className="w-8 h-8 text-neon-green" />
                </div>
                <h4 className="font-semibold text-neon-green mb-2">Real-Time Processing</h4>
                <p className="text-sm text-gray-400">
                  Lightning-fast voice processing with sub-second response times for fluid conversations.
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-neon-purple/10 to-neon-pink/10 rounded-lg border border-neon-purple/30">
              <p className="text-center text-sm text-gray-300">
                <strong className="text-neon-purple">Fantasy.AI</strong> leverages ElevenLabs' cutting-edge voice AI 
                to deliver the most natural and engaging fantasy sports assistant experience available.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}