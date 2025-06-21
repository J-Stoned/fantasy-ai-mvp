"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

interface AISystemStatus {
  overview: {
    isOperational: boolean;
    totalAIWorkers: number;
    processingCapacity: string;
    averageAccuracy: string;
    activeSystems: string;
  };
  systems: Array<{
    name: string;
    status: string;
    workers: number;
    performance: {
      processingRate: string;
      accuracy: string;
    };
    healthScore: number;
  }>;
  performance: {
    averageResponseTime: string;
    uptime: string;
    predictionsServed: string;
  };
}

interface AIPrediction {
  source: string;
  fantasyPoints: number;
  confidence: number;
  reasoning: string;
}

export function SimpleDashboard() {
  const [aiStatus, setAiStatus] = useState<AISystemStatus | null>(null);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIStatus();
    fetchPredictions();
  }, []);

  const fetchAIStatus = async () => {
    try {
      const response = await fetch('/api/ai/status');
      const data = await response.json();
      setAiStatus(data);
    } catch (error) {
      console.error('Failed to fetch AI status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/ai/predictions?playerId=demo');
      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    }
  };

  if (loading) {
    return (
      <div className="main-container flex items-center justify-center">
        <div className="text-center">
          <div className="neon-text text-3xl font-bold mb-4">Fantasy.AI</div>
          <div className="animate-pulse">Loading AI Systems...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="neon-text text-3xl font-bold">Fantasy.AI</h1>
        <p className="text-lg mt-2">Revolutionary Fantasy Sports AI with {aiStatus?.overview.totalAIWorkers || 1375}+ Workers</p>
      </motion.div>

      {/* AI Status Overview */}
      <div className="dashboard-grid">
        <GlassCard className="text-center">
          <div className="neon-text text-2xl font-bold">
            {aiStatus?.overview.totalAIWorkers || 1375}
          </div>
          <div className="text-sm">AI Workers Active</div>
        </GlassCard>

        <GlassCard className="text-center">
          <div className="text-blue text-2xl font-bold">
            {aiStatus?.overview.processingCapacity || "24,750 tasks/hour"}
          </div>
          <div className="text-sm">Processing Capacity</div>
        </GlassCard>

        <GlassCard className="text-center">
          <div className="text-purple text-2xl font-bold">
            {aiStatus?.overview.averageAccuracy || "96.7%"}
          </div>
          <div className="text-sm">Average Accuracy</div>
        </GlassCard>

        <GlassCard className="text-center">
          <div className="text-blue text-2xl font-bold">
            {aiStatus?.performance.averageResponseTime || "47ms"}
          </div>
          <div className="text-sm">Response Time</div>
        </GlassCard>
      </div>

      {/* AI Systems Status */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">AI Systems Status</h2>
        <div className="space-y-4">
          {aiStatus?.systems.map((system, index) => (
            <GlassCard key={index}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold neon-text">{system.name}</h3>
                  <div className="text-sm">
                    {system.workers} workers • {system.performance.processingRate} • {system.performance.accuracy} accuracy
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-blue font-bold">Health: {system.healthScore}%</div>
                  <div className={`text-sm ${system.status === 'active' ? 'text-blue' : 'text-white'}`}>
                    {system.status.toUpperCase()}
                  </div>
                </div>
              </div>
            </GlassCard>
          )) || (
            <GlassCard>
              <div className="text-center">Loading AI systems...</div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* Live AI Predictions */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Live AI Predictions</h2>
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <GlassCard key={index}>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-blue">{prediction.source}</h3>
                  <div className="text-sm">{prediction.reasoning}</div>
                </div>
                <div className="text-right">
                  <div className="neon-text text-xl font-bold">{prediction.fantasyPoints} pts</div>
                  <div className="text-sm">{prediction.confidence}% confidence</div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Performance Stats */}
      {aiStatus?.performance && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Performance Metrics</h2>
          <GlassCard>
            <div className="dashboard-grid">
              <div className="text-center">
                <div className="text-blue text-xl font-bold">{aiStatus.performance.uptime}</div>
                <div className="text-sm">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-purple text-xl font-bold">{aiStatus.performance.predictionsServed}</div>
                <div className="text-sm">Predictions Served</div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8 justify-center">
        <NeonButton onClick={fetchAIStatus} variant="blue">
          Refresh AI Status
        </NeonButton>
        <NeonButton onClick={fetchPredictions} variant="purple">
          Get New Predictions
        </NeonButton>
      </div>
    </div>
  );
}