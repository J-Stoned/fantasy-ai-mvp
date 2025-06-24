'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, Settings, Sparkles, Brain, TrendingUp } from 'lucide-react';
import { voiceAssistantService } from '@/lib/voice-assistant-service';
import { elevenLabsIntegration } from '@/lib/voice/elevenlabs-integration';

export default function VoiceAssistantDemo() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('fantasy_ai');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceAnalytics, setVoiceAnalytics] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const expertVoices = [
    { id: 'fantasy_ai', name: 'Fantasy AI Assistant', description: 'Default AI voice' },
    { id: 'matthew_berry', name: 'Matthew Berry', description: 'Enthusiastic expert' },
    { id: 'adam_schefter', name: 'Adam Schefter', description: 'NFL insider' },
    { id: 'sarah_analytics', name: 'Sarah Analytics', description: 'Data analyst' }
  ];

  const sampleCommands = [
    "Hey Fantasy, find me a speedy receiver from a high-scoring team",
    "Who should I start at running back this week?",
    "Any injury updates on my players?",
    "Should I trade Kelce for Adams and Jacobs?",
    "Optimize my lineup for tonight",
    "Find me a young running back who catches passes",
    "What's the weather like for the Chiefs game?",
    "Best waiver wire pickups this week"
  ];

  useEffect(() => {
    // Set up voice assistant event listeners
    voiceAssistantService.on('commandProcessed', (data) => {
      setVoiceAnalytics(data.voiceAnalysis);
    });

    return () => {
      voiceAssistantService.removeAllListeners();
    };
  }, []);

  const startListening = async () => {
    try {
      setIsListening(true);
      await voiceAssistantService.startListening('demo-user');
      
      // Mock speech recognition for demo
      setTimeout(() => {
        const randomCommand = sampleCommands[Math.floor(Math.random() * sampleCommands.length)];
        handleVoiceCommand(randomCommand);
      }, 2000);
    } catch (error) {
      console.error('Error starting voice assistant:', error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    voiceAssistantService.deactivateVoiceAssistant();
  };

  const handleVoiceCommand = async (command: string) => {
    setTranscript(command);
    setIsProcessing(true);
    setResponse('');
    setAudioUrl(null);

    try {
      // Process voice command
      const result = await voiceAssistantService.processVoiceCommand(command, 'demo-user');
      setResponse(result.text);

      // Generate speech with ElevenLabs
      const { audioUrl, audioBuffer } = await elevenLabsIntegration.generateSpeech(
        result.text,
        selectedVoice,
        {
          emotion: voiceAnalytics?.emotionalState || 'neutral',
          frustration: voiceAnalytics?.frustrationLevel || 0,
          urgency: voiceAnalytics?.urgencyLevel || 50
        }
      );

      setAudioUrl(audioUrl);
      
      // Auto-play the response
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      setResponse('Sorry, I had trouble processing that command. Please try again.');
    } finally {
      setIsProcessing(false);
      setIsListening(false);
    }
  };

  const playResponse = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-yellow-400" />
            Fantasy.AI Voice Assistant
            <Sparkles className="w-10 h-10 text-yellow-400" />
          </h1>
          <p className="text-xl text-gray-300">
            Experience the future of fantasy sports with voice commands
          </p>
        </motion.div>

        {/* Voice Selection */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-gray-800 rounded-xl p-6"
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Select Expert Voice
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {expertVoices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`p-4 rounded-lg transition-all ${
                  selectedVoice === voice.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="font-semibold">{voice.name}</div>
                <div className="text-sm opacity-80">{voice.description}</div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Voice Interface */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-2xl p-8 mb-8"
        >
          <div className="flex flex-col items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isListening ? stopListening : startListening}
              disabled={isProcessing}
              className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 animate-pulse'
                  : isProcessing
                  ? 'bg-yellow-500'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isListening ? (
                <MicOff className="w-16 h-16" />
              ) : isProcessing ? (
                <Brain className="w-16 h-16 animate-spin" />
              ) : (
                <Mic className="w-16 h-16" />
              )}
            </motion.button>
            
            <p className="mt-4 text-lg">
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Click to speak'}
            </p>
          </div>

          {/* Transcript */}
          {transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-black/30 rounded-lg"
            >
              <p className="text-sm text-gray-300 mb-1">You said:</p>
              <p className="text-lg">{transcript}</p>
            </motion.div>
          )}

          {/* Response */}
          {response && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-white/10 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-300">Response:</p>
                {audioUrl && (
                  <button
                    onClick={playResponse}
                    className="p-2 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-lg">{response}</p>
            </motion.div>
          )}

          {/* Voice Analytics */}
          {voiceAnalytics && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 grid grid-cols-3 gap-4 text-center"
            >
              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-sm text-gray-400">Frustration</p>
                <p className="text-xl font-semibold">{voiceAnalytics.frustrationLevel}%</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-sm text-gray-400">Emotion</p>
                <p className="text-xl font-semibold">{voiceAnalytics.emotionalState}</p>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-sm text-gray-400">Satisfaction</p>
                <p className="text-xl font-semibold">{voiceAnalytics.satisfactionLevel}%</p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Sample Commands */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Try These Commands
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sampleCommands.map((command, index) => (
              <button
                key={index}
                onClick={() => handleVoiceCommand(command)}
                disabled={isProcessing}
                className="text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <p className="text-sm">{command}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2">Natural Language</h3>
            <p className="text-gray-300">
              Speak naturally - our AI understands context and intent
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-800 to-purple-900 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2">Expert Voices</h3>
            <p className="text-gray-300">
              Choose from multiple expert personas with unique insights
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-800 to-green-900 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-2">Emotional Intelligence</h3>
            <p className="text-gray-300">
              Adapts responses based on your emotional state and needs
            </p>
          </div>
        </motion.div>

        {/* Hidden audio element */}
        <audio ref={audioRef} />
      </div>
    </div>
  );
}