'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Target, Zap, BarChart3, Shield, Sparkles, Activity } from 'lucide-react';
import { RealtimeDashboard } from '@/components/realtime/RealtimeDashboard';

interface AIMetric {
  label: string;
  value: number;
  change: number;
  icon: any;
  color: string;
}

interface PredictionResult {
  playerId: string;
  playerName: string;
  prediction: number;
  confidence: number;
  factors: string[];
}

export default function AIAnalyticsPage() {
  const [metrics, setMetrics] = useState<AIMetric[]>([
    {
      label: 'Prediction Accuracy',
      value: 94.5,
      change: 2.3,
      icon: Target,
      color: 'text-green-400'
    },
    {
      label: 'Models Trained',
      value: 1247,
      change: 156,
      icon: Brain,
      color: 'text-blue-400'
    },
    {
      label: 'Daily Predictions',
      value: 89432,
      change: 12.5,
      icon: TrendingUp,
      color: 'text-purple-400'
    },
    {
      label: 'Processing Speed',
      value: 0.023,
      change: -15.2,
      icon: Zap,
      color: 'text-yellow-400'
    }
  ]);

  const [predictions, setPredictions] = useState<PredictionResult[]>([
    {
      playerId: '1',
      playerName: 'Josh Allen',
      prediction: 28.5,
      confidence: 92,
      factors: ['Home game', 'Weak defense', 'Good weather', 'High passing volume']
    },
    {
      playerId: '2',
      playerName: 'Christian McCaffrey',
      prediction: 24.2,
      confidence: 88,
      factors: ['Elite matchup', 'Red zone usage', 'Pass catching role']
    },
    {
      playerId: '3',
      playerName: 'Justin Jefferson',
      prediction: 19.8,
      confidence: 85,
      factors: ['Target share', 'QB play', 'Coverage matchup']
    }
  ]);

  const [selectedModel, setSelectedModel] = useState('performance-predictor');
  const [isTraining, setIsTraining] = useState(false);

  const mlModels = [
    {
      id: 'performance-predictor',
      name: 'Player Performance Predictor',
      accuracy: 94.5,
      version: '3.0',
      status: 'active',
      description: 'Deep neural network for fantasy point predictions'
    },
    {
      id: 'injury-risk',
      name: 'Injury Risk Assessment',
      accuracy: 91.2,
      version: '2.5',
      status: 'active',
      description: 'LSTM model for injury probability analysis'
    },
    {
      id: 'lineup-optimizer',
      name: 'Lineup Optimizer',
      accuracy: 89.7,
      version: '4.1',
      status: 'beta',
      description: 'Reinforcement learning for optimal lineups'
    },
    {
      id: 'trade-analyzer',
      name: 'Trade Value Analyzer',
      accuracy: 87.3,
      version: '1.8',
      status: 'active',
      description: 'Multi-factor trade evaluation model'
    }
  ];

  const runPrediction = async () => {
    setIsTraining(true);
    // Simulate prediction run
    setTimeout(() => {
      setIsTraining(false);
      // Update predictions with new data
      setPredictions(prev => prev.map(p => ({
        ...p,
        prediction: p.prediction + (Math.random() - 0.5) * 2,
        confidence: Math.min(100, p.confidence + (Math.random() - 0.5) * 5)
      })));
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-3">
            <Brain className="w-12 h-12 text-purple-400" />
            AI Analytics Center
            <Brain className="w-12 h-12 text-purple-400" />
          </h1>
          <p className="text-xl text-gray-300">
            Advanced machine learning models powered by RTX 4060 GPU
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`w-8 h-8 ${metric.color}`} />
                  <span className={`text-sm font-medium ${
                    metric.change > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {metric.change > 0 ? '+' : ''}{metric.change}%
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold">
                    {metric.label === 'Processing Speed' 
                      ? `${metric.value}s` 
                      : metric.value.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">{metric.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ML Models Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            Machine Learning Models
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {mlModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    selectedModel === model.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{model.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      model.status === 'active' 
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {model.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{model.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">v{model.version}</span>
                    <span className="text-gray-400">Accuracy: {model.accuracy}%</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Model Performance</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Training Progress</p>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                      style={{ width: isTraining ? '75%' : '100%' }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Epochs</p>
                    <p className="text-2xl font-bold">1,247</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Data Points</p>
                    <p className="text-2xl font-bold">5.2M</p>
                  </div>
                </div>
                
                <button
                  onClick={runPrediction}
                  disabled={isTraining}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    isTraining
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                  }`}
                >
                  {isTraining ? 'Training Model...' : 'Run Predictions'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Predictions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-xl p-6"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-green-400" />
            Latest Predictions
          </h2>
          
          <div className="space-y-4">
            {predictions.map((pred, index) => (
              <motion.div
                key={pred.playerId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{pred.playerName}</h3>
                    <p className="text-sm text-gray-400">Projected Fantasy Points</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-400">{pred.prediction.toFixed(1)}</p>
                    <div className="flex items-center gap-1 justify-end">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-400">{pred.confidence}% confidence</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {pred.factors.map((factor, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-gray-600 rounded-full text-gray-300"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Real-time Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <RealtimeDashboard />
        </motion.div>

        {/* GPU Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-green-900 to-blue-900 rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            GPU Processing Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-300">GPU Model</p>
              <p className="text-lg font-bold">RTX 4060</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">CUDA Cores</p>
              <p className="text-lg font-bold">3,072</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Utilization</p>
              <p className="text-lg font-bold">78%</p>
            </div>
            <div>
              <p className="text-sm text-gray-300">Temperature</p>
              <p className="text-lg font-bold">62°C</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}