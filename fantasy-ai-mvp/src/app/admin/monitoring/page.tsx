'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function MonitoringDashboard() {
  const [systemStatus, setSystemStatus] = useState({
    gpu: { status: 'ACTIVE', utilization: 85, tflops: 15.7 },
    workers: { active: 500, total: 500, tasksPerHour: 268656 },
    database: { recordsPerHour: 8600000, connections: 45, maxConnections: 100 },
    api: { callsPerMin: 25000, responseTime: 87, errorRate: 0 },
    ml: { accuracy: 94.2, modelsTraining: 4, predictionsPerSec: 10000 },
    memory: { usage: 72, total: 32 }
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setSystemStatus(prev => ({
        ...prev,
        gpu: {
          ...prev.gpu,
          utilization: 70 + Math.random() * 25
        },
        workers: {
          ...prev.workers,
          tasksPerHour: Math.floor(250000 + Math.random() * 20000)
        },
        api: {
          ...prev.api,
          callsPerMin: Math.floor(23000 + Math.random() * 4000),
          responseTime: Math.floor(70 + Math.random() * 40)
        },
        ml: {
          ...prev.ml,
          accuracy: Math.min(95, prev.ml.accuracy + Math.random() * 0.1),
          predictionsPerSec: Math.floor(9000 + Math.random() * 2000)
        }
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
        🚀 FANTASY.AI COMMAND CENTER 🚀
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
        {/* GPU Status */}
        <Card className="bg-gray-900 border-purple-500">
          <CardHeader>
            <CardTitle className="text-xl text-purple-400">🎮 GPU Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Status</span>
                  <span className="gpu-status text-green-400">{systemStatus.gpu.status}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Utilization</span>
                  <span className="gpu-utilization">{systemStatus.gpu.utilization.toFixed(1)}%</span>
                </div>
                <Progress value={systemStatus.gpu.utilization} className="h-2" />
                <div className="flex justify-between mt-2">
                  <span>Compute Power</span>
                  <span className="tflops">{systemStatus.gpu.tflops} TFLOPS</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ML Accuracy */}
        <Card className="bg-gray-900 border-green-500">
          <CardHeader>
            <CardTitle className="text-xl text-green-400">🧠 ML Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Current Accuracy</span>
                  <span className="accuracy-percentage">{systemStatus.ml.accuracy.toFixed(1)}%</span>
                </div>
                <Progress value={systemStatus.ml.accuracy} className="h-2" />
                <div className="flex justify-between mt-2">
                  <span>Models Training</span>
                  <span className="model-status training">{systemStatus.ml.modelsTraining}</span>
                </div>
                <div className="flex justify-between">
                  <span>Predictions/sec</span>
                  <span className="predictions-per-second">{systemStatus.ml.predictionsPerSec.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card className="bg-gray-900 border-blue-500">
          <CardHeader>
            <CardTitle className="text-xl text-blue-400">💾 Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Records/hour</span>
                <span className="record-count">{systemStatus.database.recordsPerHour.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Connections</span>
                <span>{systemStatus.database.connections}/{systemStatus.database.maxConnections}</span>
              </div>
              <Progress value={(systemStatus.database.connections / systemStatus.database.maxConnections) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Workers */}
        <Card className="bg-gray-900 border-orange-500">
          <CardHeader>
            <CardTitle className="text-xl text-orange-400">🚀 Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Active Workers</span>
                <span className="active-workers">{systemStatus.workers.active}/{systemStatus.workers.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Tasks/hour</span>
                <span className="tasks-per-hour">{systemStatus.workers.tasksPerHour.toLocaleString()}</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* API Calls */}
        <Card className="bg-gray-900 border-cyan-500">
          <CardHeader>
            <CardTitle className="text-xl text-cyan-400">📊 API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Calls/min</span>
                <span>{systemStatus.api.callsPerMin.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Response Time</span>
                <span className="response-time">{systemStatus.api.responseTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Error Rate</span>
                <span className="error-rate">{systemStatus.api.errorRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Memory */}
        <Card className="bg-gray-900 border-pink-500">
          <CardHeader>
            <CardTitle className="text-xl text-pink-400">⚡ System Memory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Usage</span>
                <span className="memory-usage">{systemStatus.memory.usage}%</span>
              </div>
              <Progress value={systemStatus.memory.usage} className="h-2" />
              <div className="flex justify-between">
                <span>Total RAM</span>
                <span>{systemStatus.memory.total}GB</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <div className="inline-flex gap-4">
          <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
            View Details
          </button>
          <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
            Logs
          </button>
          <button className="px-6 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors">
            Restart
          </button>
          <button className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
            Scale
          </button>
        </div>
      </div>

      <div className="mt-8 text-center text-gray-400">
        <p className="pulse">🔥 FANTASY.AI OPERATING AT MAXIMUM POWER 🔥</p>
      </div>
    </div>
  );
}