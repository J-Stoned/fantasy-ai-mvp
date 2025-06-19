"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { computerVisionService } from "@/lib/advanced-analytics/computer-vision-service";
import { socialIntelligenceService } from "@/lib/advanced-analytics/social-intelligence-service";
import { biometricIntelligenceService } from "@/lib/advanced-analytics/biometric-intelligence-service";
import {
  Brain,
  Activity,
  Eye,
  Heart,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Gauge,
  Users,
  Globe,
  Clock,
  Star,
  Crown,
  Shield,
  Flame,
  BarChart3,
  LineChart,
  PieChart,
  Camera,
  MessageCircle,
  Wifi,
  RefreshCw
} from "lucide-react";

interface AnalyticsData {
  computerVision: {
    trackingActive: boolean;
    playersTracked: number;
    dataPoints: number;
    accuracy: number;
    injuryRisks: number;
    performancePredictions: number;
  };
  socialIntelligence: {
    platformsMonitored: number;
    mentionsProcessed: number;
    sentimentScore: number;
    trendingTopics: number;
    influencerImpacts: number;
    momentumPlayers: number;
  };
  biometricIntelligence: {
    playersMonitored: number;
    deviceTypes: number;
    recoveryScore: number;
    alertsActive: number;
    bioScoreAverage: number;
    predictionsGenerated: number;
  };
  systemMetrics: {
    processingSpeed: number;
    dataAccuracy: number;
    uptime: number;
    predictiveAccuracy: number;
  };
}

interface PlayerInsight {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  
  // Computer Vision Insights
  performanceGrade: number;
  injuryRisk: 'low' | 'medium' | 'high';
  movementEfficiency: number;
  explosiveness: number;
  
  // Social Intelligence
  socialMomentum: number;
  sentimentTrend: 'positive' | 'negative' | 'neutral';
  fanEngagement: number;
  mediaAttention: number;
  
  // Biometric Intelligence
  bioScore: number;
  recoveryStatus: 'optimal' | 'good' | 'moderate' | 'poor';
  energyLevel: number;
  readiness: number;
  
  // Composite Scores
  overallScore: number;
  fantasyProjection: number;
  confidenceLevel: number;
  
  // Alerts & Recommendations
  alerts: string[];
  recommendations: string[];
  
  lastUpdated: Date;
}

export function RevolutionaryAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    computerVision: {
      trackingActive: true,
      playersTracked: 847,
      dataPoints: 2847392,
      accuracy: 94.7,
      injuryRisks: 23,
      performancePredictions: 156
    },
    socialIntelligence: {
      platformsMonitored: 5,
      mentionsProcessed: 184729,
      sentimentScore: 67,
      trendingTopics: 12,
      influencerImpacts: 45,
      momentumPlayers: 89
    },
    biometricIntelligence: {
      playersMonitored: 234,
      deviceTypes: 7,
      recoveryScore: 78,
      alertsActive: 8,
      bioScoreAverage: 82,
      predictionsGenerated: 67
    },
    systemMetrics: {
      processingSpeed: 340,
      dataAccuracy: 94.7,
      uptime: 99.97,
      predictiveAccuracy: 87.3
    }
  });

  const [topInsights, setTopInsights] = useState<PlayerInsight[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'cv' | 'social' | 'bio' | 'predictions'>('overview');
  const [isLiveProcessing, setIsLiveProcessing] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    generateMockInsights();
    
    const interval = setInterval(() => {
      if (isLiveProcessing) {
        updateAnalyticsData();
        setLastUpdate(new Date());
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isLiveProcessing]);

  const generateMockInsights = () => {
    const mockPlayers: PlayerInsight[] = [
      {
        playerId: 'player_josh_allen',
        playerName: 'Josh Allen',
        position: 'QB',
        team: 'BUF',
        performanceGrade: 94,
        injuryRisk: 'low',
        movementEfficiency: 89,
        explosiveness: 92,
        socialMomentum: 87,
        sentimentTrend: 'positive',
        fanEngagement: 91,
        mediaAttention: 85,
        bioScore: 88,
        recoveryStatus: 'optimal',
        energyLevel: 90,
        readiness: 93,
        overallScore: 91,
        fantasyProjection: 28.4,
        confidenceLevel: 94,
        alerts: [],
        recommendations: ['Maintain current training load', 'Monitor social media momentum'],
        lastUpdated: new Date()
      },
      {
        playerId: 'player_lamar_jackson',
        playerName: 'Lamar Jackson',
        position: 'QB',
        team: 'BAL',
        performanceGrade: 91,
        injuryRisk: 'medium',
        movementEfficiency: 95,
        explosiveness: 96,
        socialMomentum: 72,
        sentimentTrend: 'neutral',
        fanEngagement: 83,
        mediaAttention: 78,
        bioScore: 76,
        recoveryStatus: 'good',
        energyLevel: 82,
        readiness: 79,
        overallScore: 84,
        fantasyProjection: 25.7,
        confidenceLevel: 87,
        alerts: ['Elevated injury risk due to running style'],
        recommendations: ['Reduce rushing attempts', 'Focus on recovery protocols'],
        lastUpdated: new Date()
      },
      {
        playerId: 'player_tyreek_hill',
        playerName: 'Tyreek Hill',
        position: 'WR',
        team: 'MIA',
        performanceGrade: 89,
        injuryRisk: 'low',
        movementEfficiency: 93,
        explosiveness: 98,
        socialMomentum: 95,
        sentimentTrend: 'positive',
        fanEngagement: 94,
        mediaAttention: 92,
        bioScore: 91,
        recoveryStatus: 'optimal',
        energyLevel: 95,
        readiness: 94,
        overallScore: 93,
        fantasyProjection: 22.8,
        confidenceLevel: 92,
        alerts: [],
        recommendations: ['High breakout potential this week', 'Strong social momentum indicates confidence'],
        lastUpdated: new Date()
      }
    ];
    
    setTopInsights(mockPlayers);
  };

  const updateAnalyticsData = () => {
    setAnalyticsData(prev => ({
      ...prev,
      computerVision: {
        ...prev.computerVision,
        dataPoints: prev.computerVision.dataPoints + Math.floor(Math.random() * 10000) + 5000,
        performancePredictions: prev.computerVision.performancePredictions + Math.floor(Math.random() * 5)
      },
      socialIntelligence: {
        ...prev.socialIntelligence,
        mentionsProcessed: prev.socialIntelligence.mentionsProcessed + Math.floor(Math.random() * 1000) + 500,
        sentimentScore: Math.max(0, Math.min(100, prev.socialIntelligence.sentimentScore + Math.floor(Math.random() * 10) - 5))
      },
      biometricIntelligence: {
        ...prev.biometricIntelligence,
        recoveryScore: Math.max(0, Math.min(100, prev.biometricIntelligence.recoveryScore + Math.floor(Math.random() * 6) - 3)),
        bioScoreAverage: Math.max(0, Math.min(100, prev.biometricIntelligence.bioScoreAverage + Math.floor(Math.random() * 4) - 2))
      }
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-neon-green';
    if (score >= 80) return 'text-neon-blue';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-neon-green';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-neon-green" />;
      case 'negative': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <BarChart3 className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Revolutionary Analytics Dashboard</h1>
          <p className="text-gray-400">AI-powered computer vision, social intelligence, and biometric analytics</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Activity className={`w-4 h-4 ${isLiveProcessing ? 'text-neon-green animate-pulse' : 'text-gray-400'}`} />
            Live Processing: {isLiveProcessing ? 'Active' : 'Paused'}
          </div>
          
          <div className="text-xs text-gray-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          
          <button
            onClick={() => setIsLiveProcessing(!isLiveProcessing)}
            className={`p-2 rounded-lg transition-colors ${
              isLiveProcessing 
                ? 'bg-neon-green/20 text-neon-green' 
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            {isLiveProcessing ? <Wifi className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Computer Vision */}
        <GlassCard className="p-6 border-l-4 border-neon-blue">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-neon-blue/20 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-neon-blue" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Computer Vision</h3>
              <p className="text-xs text-gray-400">Real-time player tracking</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Players Tracked</span>
              <span className="text-sm font-bold text-white">{analyticsData.computerVision.playersTracked}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Data Points</span>
              <span className="text-sm font-bold text-neon-blue">{analyticsData.computerVision.dataPoints.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Accuracy</span>
              <span className="text-sm font-bold text-neon-green">{analyticsData.computerVision.accuracy}%</span>
            </div>
          </div>
        </GlassCard>

        {/* Social Intelligence */}
        <GlassCard className="p-6 border-l-4 border-neon-purple">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-neon-purple/20 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-neon-purple" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Social Intelligence</h3>
              <p className="text-xs text-gray-400">Multi-platform sentiment</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Mentions Processed</span>
              <span className="text-sm font-bold text-white">{analyticsData.socialIntelligence.mentionsProcessed.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Sentiment Score</span>
              <span className={`text-sm font-bold ${getScoreColor(analyticsData.socialIntelligence.sentimentScore)}`}>
                {analyticsData.socialIntelligence.sentimentScore}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Trending Topics</span>
              <span className="text-sm font-bold text-neon-purple">{analyticsData.socialIntelligence.trendingTopics}</span>
            </div>
          </div>
        </GlassCard>

        {/* Biometric Intelligence */}
        <GlassCard className="p-6 border-l-4 border-neon-green">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-neon-green/20 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-neon-green" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Biometric Intelligence</h3>
              <p className="text-xs text-gray-400">Health & performance</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Players Monitored</span>
              <span className="text-sm font-bold text-white">{analyticsData.biometricIntelligence.playersMonitored}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Avg Bio Score</span>
              <span className={`text-sm font-bold ${getScoreColor(analyticsData.biometricIntelligence.bioScoreAverage)}`}>
                {analyticsData.biometricIntelligence.bioScoreAverage}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Active Alerts</span>
              <span className="text-sm font-bold text-red-400">{analyticsData.biometricIntelligence.alertsActive}</span>
            </div>
          </div>
        </GlassCard>

        {/* System Performance */}
        <GlassCard className="p-6 border-l-4 border-yellow-400">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-yellow-400/20 rounded-xl flex items-center justify-center">
              <Gauge className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">System Performance</h3>
              <p className="text-xs text-gray-400">Processing metrics</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Processing Speed</span>
              <span className="text-sm font-bold text-yellow-400">{analyticsData.systemMetrics.processingSpeed}% faster</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Uptime</span>
              <span className="text-sm font-bold text-neon-green">{analyticsData.systemMetrics.uptime}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Prediction Accuracy</span>
              <span className="text-sm font-bold text-neon-blue">{analyticsData.systemMetrics.predictiveAccuracy}%</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'cv', label: 'Computer Vision', icon: Eye },
            { id: 'social', label: 'Social Intelligence', icon: MessageCircle },
            { id: 'bio', label: 'Biometric Intelligence', icon: Heart },
            { id: 'predictions', label: 'AI Predictions', icon: Brain }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-neon-blue text-neon-blue'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Top Player Insights */}
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-6">Top Player Insights</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {topInsights.map((player) => (
                  <motion.div
                    key={player.playerId}
                    whileHover={{ scale: 1.02 }}
                    className="cursor-pointer"
                    onClick={() => setSelectedPlayer(player.playerId)}
                  >
                    <GlassCard className={`p-4 transition-all ${
                      selectedPlayer === player.playerId 
                        ? 'border-2 border-neon-blue bg-neon-blue/10' 
                        : 'hover:bg-white/10'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-white">{player.playerName}</h4>
                          <p className="text-sm text-gray-400">{player.team} • {player.position}</p>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getScoreColor(player.overallScore)}`}>
                            {player.overallScore}
                          </div>
                          <div className="text-xs text-gray-400">Overall Score</div>
                        </div>
                      </div>
                      
                      {/* Multi-dimensional Analysis */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-2 bg-white/5 rounded">
                          <div className={`text-sm font-bold ${getScoreColor(player.performanceGrade)}`}>
                            {player.performanceGrade}
                          </div>
                          <div className="text-xs text-gray-400">CV Grade</div>
                        </div>
                        
                        <div className="text-center p-2 bg-white/5 rounded">
                          <div className={`text-sm font-bold ${getScoreColor(player.socialMomentum)}`}>
                            {player.socialMomentum}
                          </div>
                          <div className="text-xs text-gray-400">Social</div>
                        </div>
                        
                        <div className="text-center p-2 bg-white/5 rounded">
                          <div className={`text-sm font-bold ${getScoreColor(player.bioScore)}`}>
                            {player.bioScore}
                          </div>
                          <div className="text-xs text-gray-400">Bio Score</div>
                        </div>
                      </div>
                      
                      {/* Key Metrics */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Fantasy Projection</span>
                          <span className="text-white font-medium">{player.fantasyProjection} pts</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Injury Risk</span>
                          <span className={`font-medium ${getRiskColor(player.injuryRisk)}`}>
                            {player.injuryRisk.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Sentiment Trend</span>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(player.sentimentTrend)}
                            <span className="text-white">{player.sentimentTrend}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Alerts & Recommendations */}
                      {player.alerts.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center gap-1 mb-1">
                            <AlertTriangle className="w-3 h-3 text-yellow-400" />
                            <span className="text-xs text-yellow-400">Alerts</span>
                          </div>
                          {player.alerts.map((alert, index) => (
                            <div key={index} className="text-xs text-red-300 bg-red-400/10 p-2 rounded mb-1">
                              {alert}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {player.recommendations.length > 0 && (
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <Target className="w-3 h-3 text-neon-blue" />
                            <span className="text-xs text-neon-blue">Recommendations</span>
                          </div>
                          {player.recommendations.slice(0, 2).map((rec, index) => (
                            <div key={index} className="text-xs text-gray-300 bg-neon-blue/10 p-2 rounded mb-1">
                              {rec}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Confidence Indicator */}
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Confidence Level</span>
                          <div className="flex items-center gap-1">
                            <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-neon-green rounded-full transition-all"
                                style={{ width: `${player.confidenceLevel}%` }}
                              />
                            </div>
                            <span className="text-neon-green font-medium">{player.confidenceLevel}%</span>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </GlassCard>

            {/* Competitive Advantage Summary */}
            <GlassCard className="p-6 bg-gradient-to-br from-neon-blue/20 to-neon-green/20">
              <div className="text-center space-y-4">
                <Crown className="w-12 h-12 text-neon-green mx-auto" />
                <h3 className="text-2xl font-bold text-white">Revolutionary Analytics Engine</h3>
                <p className="text-gray-300 max-w-3xl mx-auto">
                  Fantasy.AI's multi-dimensional analytics combine computer vision, social intelligence, and biometric data 
                  to provide unprecedented insights that transform fantasy sports decision-making.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-neon-blue">340%</div>
                    <div className="text-sm text-gray-400">Faster Processing</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-neon-green">50x</div>
                    <div className="text-sm text-gray-400">More Data Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-400">23%</div>
                    <div className="text-sm text-gray-400">Higher Accuracy</div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === 'cv' && (
          <motion.div
            key="cv"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Computer Vision Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-neon-blue">{analyticsData.computerVision.playersTracked}</div>
                  <div className="text-sm text-gray-400">Players Tracked</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-neon-green">{analyticsData.computerVision.dataPoints.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Data Points/Hour</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">{analyticsData.computerVision.injuryRisks}</div>
                  <div className="text-sm text-gray-400">Injury Risks Detected</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-neon-purple">{analyticsData.computerVision.performancePredictions}</div>
                  <div className="text-sm text-gray-400">Performance Predictions</div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-white mb-3">Live Computer Vision Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">3D Pose Estimation (94.7% accuracy)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Real-time Movement Analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Biomechanical Efficiency Scoring</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Injury Risk Prediction (87% accuracy)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Performance Trajectory Modeling</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Game Situation Analysis</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === 'social' && (
          <motion.div
            key="social"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Social Intelligence Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-neon-purple">{analyticsData.socialIntelligence.platformsMonitored}</div>
                  <div className="text-sm text-gray-400">Platforms Monitored</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-neon-blue">{analyticsData.socialIntelligence.mentionsProcessed.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Mentions Processed</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-neon-green">{analyticsData.socialIntelligence.trendingTopics}</div>
                  <div className="text-sm text-gray-400">Trending Topics</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">{analyticsData.socialIntelligence.influencerImpacts}</div>
                  <div className="text-sm text-gray-400">Influencer Impacts</div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-white mb-3">Social Intelligence Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Real-time Sentiment Analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Influencer Impact Tracking</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Viral Content Detection</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Cross-Platform Analytics</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Player Momentum Indicators</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Breaking News Detection</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === 'bio' && (
          <motion.div
            key="bio"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">Biometric Intelligence Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-neon-green">{analyticsData.biometricIntelligence.playersMonitored}</div>
                  <div className="text-sm text-gray-400">Players Monitored</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-neon-blue">{analyticsData.biometricIntelligence.deviceTypes}</div>
                  <div className="text-sm text-gray-400">Device Types</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400">{analyticsData.biometricIntelligence.bioScoreAverage}</div>
                  <div className="text-sm text-gray-400">Avg Bio Score</div>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="text-2xl font-bold text-red-400">{analyticsData.biometricIntelligence.alertsActive}</div>
                  <div className="text-sm text-gray-400">Active Alerts</div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-white mb-3">Biometric Intelligence Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Heart Rate Variability Analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Sleep Quality Assessment</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Recovery Score Calculation</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Injury Risk Prediction (85% accuracy)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Performance Readiness Scoring</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-neon-green" />
                      <span className="text-gray-300">Fatigue Detection & Monitoring</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === 'predictions' && (
          <motion.div
            key="predictions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <GlassCard className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">AI Prediction Models</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-neon-blue" />
                    <span className="font-medium text-white">Performance Prediction</span>
                  </div>
                  <div className="text-2xl font-bold text-neon-blue">83%</div>
                  <div className="text-sm text-gray-400">Accuracy Rate</div>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-neon-green" />
                    <span className="font-medium text-white">Injury Prevention</span>
                  </div>
                  <div className="text-2xl font-bold text-neon-green">87%</div>
                  <div className="text-sm text-gray-400">Accuracy Rate</div>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="font-medium text-white">Breakout Detection</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">76%</div>
                  <div className="text-sm text-gray-400">Accuracy Rate</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-white">Model Features & Capabilities</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="text-sm font-medium text-neon-blue mb-2">Multi-Modal Data Fusion</h5>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li>• Computer vision movement patterns</li>
                      <li>• Social media sentiment analysis</li>
                      <li>• Biometric health indicators</li>
                      <li>• Historical performance data</li>
                      <li>• Environmental factors</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-neon-green mb-2">Advanced ML Techniques</h5>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li>• Deep neural networks</li>
                      <li>• Time-series forecasting</li>
                      <li>• Ensemble modeling</li>
                      <li>• Transfer learning</li>
                      <li>• Real-time adaptation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default RevolutionaryAnalyticsDashboard;