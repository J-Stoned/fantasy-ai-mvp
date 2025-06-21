'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function HeyFantasyDemo() {
  const [isListening, setIsListening] = useState(false);
  const [currentCommand, setCurrentCommand] = useState('');
  const [demoStep, setDemoStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const demoCommands = [
    {
      command: "Hey Fantasy, optimize my lineup",
      response: {
        type: "lineup",
        changes: [
          {
            playerOut: "Zach Moss",
            playerIn: "Kenneth Walker III", 
            reasoning: "Walker has a better matchup vs LAR and trending on 3 podcasts this week",
            confidence: 87
          }
        ],
        projectedGain: "+8.3 points"
      }
    },
    {
      command: "Hey Fantasy, what are podcasts saying about Josh Allen?",
      response: {
        type: "multimedia",
        insights: [
          { source: "Fantasy Football Today", quote: "Josh Allen is a must-start this week", sentiment: "positive" },
          { source: "The Fantasy Footballers", quote: "Allen's rushing upside gives him elite ceiling", sentiment: "positive" }
        ],
        socialBuzz: "Trending with 2.3K mentions",
        youtubeViews: "450K views on highlight reel"
      }
    },
    {
      command: "Hey Fantasy, check weather impact",
      response: {
        type: "weather",
        alerts: [
          { game: "Bills vs Dolphins", condition: "Snow expected", impact: "Favor running game, reduced passing yards" },
          { game: "Packers vs Bears", condition: "High winds", impact: "Difficult kicking conditions" }
        ]
      }
    }
  ];

  const startDemo = () => {
    setIsListening(true);
    setDemoStep(0);
    setShowResults(false);
    simulateVoiceCommand();
  };

  const simulateVoiceCommand = () => {
    const command = demoCommands[demoStep % demoCommands.length];
    
    // Simulate typing the command
    let i = 0;
    const typing = setInterval(() => {
      setCurrentCommand(command.command.slice(0, i));
      i++;
      if (i > command.command.length) {
        clearInterval(typing);
        setTimeout(() => {
          setIsListening(false);
          setShowResults(true);
        }, 1000);
      }
    }, 50);
  };

  const nextDemo = () => {
    setDemoStep(prev => prev + 1);
    setCurrentCommand('');
    setShowResults(false);
    setTimeout(startDemo, 500);
  };

  const currentResponse = demoCommands[demoStep % demoCommands.length]?.response;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            🎙️ Hey Fantasy Demo
          </h1>
          <p className="text-xl text-indigo-200 mb-8">
            Experience the world's first voice-powered fantasy sports assistant
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3">
              <span className="text-white font-semibold">✅ 63 Database Tables</span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3">
              <span className="text-white font-semibold">✅ Multimedia AI</span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3">
              <span className="text-white font-semibold">✅ Voice Commands</span>
            </div>
          </div>
        </motion.div>

        {/* Demo Interface */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8">
            {/* Voice Orb */}
            <div className="text-center mb-8">
              <motion.div
                className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                  isListening 
                    ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' 
                    : 'bg-indigo-500 hover:bg-indigo-400 shadow-lg shadow-indigo-500/50'
                }`}
                onClick={startDemo}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-4xl">🎤</span>
              </motion.div>
              
              <p className="text-white mt-4 text-lg">
                {isListening ? 'Listening...' : 'Click to start demo'}
              </p>
            </div>

            {/* Command Display */}
            {currentCommand && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/30 rounded-lg p-4 mb-6"
              >
                <p className="text-white text-lg font-mono">
                  {currentCommand}
                  {isListening && <span className="animate-pulse">|</span>}
                </p>
              </motion.div>
            )}

            {/* Results Display */}
            {showResults && currentResponse && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {currentResponse.type === 'lineup' && (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      🏆 Lineup Optimization Complete
                    </h3>
                    {currentResponse.changes?.map((change, i) => (
                      <div key={i} className="bg-white/10 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-red-300 line-through">Bench: {change.playerOut}</span>
                          <span className="text-green-300">Start: {change.playerIn}</span>
                        </div>
                        <p className="text-indigo-200 text-sm">{change.reasoning}</p>
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-white/60">Confidence: {change.confidence}%</span>
                          <span className="text-green-400 font-semibold">{currentResponse.projectedGain}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {currentResponse.type === 'multimedia' && (
                  <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      🎬 Multimedia Intelligence
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-white mb-2">📻 Podcast Mentions</h4>
                        {currentResponse.insights?.map((insight, i) => (
                          <div key={i} className="bg-white/10 rounded p-3 mb-2">
                            <p className="text-white text-sm">"{insight.quote}"</p>
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-indigo-300">{insight.source}</span>
                              <span className={`text-xs ${insight.sentiment === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                                {insight.sentiment}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded p-3">
                          <span className="text-xs text-indigo-300">Social Media</span>
                          <p className="text-white font-semibold">{currentResponse.socialBuzz}</p>
                        </div>
                        <div className="bg-white/10 rounded p-3">
                          <span className="text-xs text-indigo-300">YouTube</span>
                          <p className="text-white font-semibold">{currentResponse.youtubeViews}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentResponse.type === 'weather' && (
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-6">
                    <h3 className="text-xl font-bold text-white mb-4">
                      🌦️ Weather Impact Analysis
                    </h3>
                    {currentResponse.alerts?.map((alert, i) => (
                      <div key={i} className="bg-white/10 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-semibold">{alert.game}</span>
                          <span className="text-yellow-400">{alert.condition}</span>
                        </div>
                        <p className="text-indigo-200 text-sm">{alert.impact}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-center">
                  <button
                    onClick={nextDemo}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Try Next Command
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur rounded-lg p-6"
            >
              <div className="text-4xl mb-4">🎙️</div>
              <h3 className="text-xl font-bold text-white mb-2">Voice-First</h3>
              <p className="text-indigo-200">Natural language commands with "Hey Fantasy" wake word</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur rounded-lg p-6"
            >
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-bold text-white mb-2">AI-Powered</h3>
              <p className="text-indigo-200">Advanced machine learning with 63 database tables</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur rounded-lg p-6"
            >
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold text-white mb-2">Universal</h3>
              <p className="text-indigo-200">Works on Yahoo, ESPN, Sleeper, DraftKings, and more</p>
            </motion.div>
          </div>

          {/* Browser Extension Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur rounded-lg p-8 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4">
              Ready to Install the Browser Extension?
            </h2>
            <p className="text-indigo-200 mb-6">
              Get the Hey Fantasy Chrome extension and start dominating your leagues with voice commands!
            </p>
            
            <div className="flex justify-center gap-4 flex-wrap">
              <a 
                href="/extensions/hey-fantasy"
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
              >
                📥 Download Extension
              </a>
              
              <a 
                href="https://github.com/fantasy-ai/hey-fantasy"
                className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
              >
                🔗 View Source Code
              </a>
            </div>

            <div className="mt-8 grid md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-white font-semibold">Platform Support</div>
                <div className="text-indigo-300">Yahoo, ESPN, CBS, Sleeper, NFL, DraftKings, FanDuel</div>
              </div>
              <div>
                <div className="text-white font-semibold">Voice Commands</div>
                <div className="text-indigo-300">Natural language processing with GPT-4</div>
              </div>
              <div>
                <div className="text-white font-semibold">Data Sources</div>
                <div className="text-indigo-300">Podcasts, YouTube, Social Media, Weather</div>
              </div>
              <div>
                <div className="text-white font-semibold">AI Features</div>
                <div className="text-indigo-300">Lineup optimization, trade analysis, injury tracking</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}