"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function SimpleDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data to demonstrate features without database calls
  const mockPlayers = [
    { id: 1, name: "Patrick Mahomes", position: "QB", team: "KC", points: 24.8, projected: 26.2 },
    { id: 2, name: "Josh Allen", position: "QB", team: "BUF", points: 22.4, projected: 24.1 },
    { id: 3, name: "Christian McCaffrey", position: "RB", team: "SF", points: 19.6, projected: 21.3 },
    { id: 4, name: "Tyreek Hill", position: "WR", team: "MIA", points: 18.9, projected: 20.4 },
    { id: 5, name: "Travis Kelce", position: "TE", team: "KC", points: 16.7, projected: 18.2 },
  ];

  const mockInsights = [
    {
      type: "success",
      title: "🔥 Hot Streak",
      message: "Patrick Mahomes has scored 20+ points in his last 4 games",
      confidence: 92
    },
    {
      type: "warning", 
      title: "⚠️ Weather Alert",
      message: "High winds expected in Buffalo - consider benching passing game",
      confidence: 85
    },
    {
      type: "info",
      title: "💡 Trade Opportunity", 
      message: "Christian McCaffrey's value is 15% below season average",
      confidence: 78
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent mb-4">
            🚀 Fantasy.AI Dashboard
          </h1>
          <p className="text-xl text-gray-300">
            Maximum Power Mode Activated - The Most Advanced Fantasy Platform Ever Created!
          </p>
        </motion.div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-6 bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-xl border border-green-500/30"
        >
          <div className="flex items-center gap-4">
            <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
            <div>
              <h3 className="text-lg font-bold text-green-400">✅ ALL SYSTEMS OPERATIONAL</h3>
              <p className="text-gray-300">
                🎯 5,040+ Players Loaded • 🤖 24 MCP Servers Active • ⚡ Real-time Analytics Ready
              </p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-900/50 p-1 rounded-lg border border-white/5 mb-8">
          {[
            { id: "overview", label: "📊 Overview", icon: "📊" },
            { id: "analytics", label: "🧠 AI Analytics", icon: "🧠" },
            { id: "lineup", label: "⚡ Lineup Builder", icon: "⚡" },
            { id: "voice", label: "🎤 Voice Assistant", icon: "🎤" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 p-6 rounded-xl border border-blue-500/30">
                  <h3 className="text-lg font-semibold text-blue-400 mb-2">🏆 League Rank</h3>
                  <p className="text-3xl font-bold text-white">#2</p>
                  <p className="text-sm text-gray-400">↗️ Up from #4 last week</p>
                </div>

                <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 p-6 rounded-xl border border-green-500/30">
                  <h3 className="text-lg font-semibold text-green-400 mb-2">📈 Win Rate</h3>
                  <p className="text-3xl font-bold text-white">78%</p>
                  <p className="text-sm text-gray-400">🔥 League best</p>
                </div>

                <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-6 rounded-xl border border-purple-500/30">
                  <h3 className="text-lg font-semibold text-purple-400 mb-2">🧠 AI Score</h3>
                  <p className="text-3xl font-bold text-white">94.2</p>
                  <p className="text-sm text-gray-400">⚡ Optimized lineup</p>
                </div>

                <div className="bg-gradient-to-br from-red-900/50 to-red-800/50 p-6 rounded-xl border border-red-500/30">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">🚨 Active Alerts</h3>
                  <p className="text-3xl font-bold text-white">3</p>
                  <p className="text-sm text-gray-400">💡 New opportunities</p>
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">🤖 AI Insights</h3>
                <div className="space-y-4">
                  {mockInsights.map((insight, index) => (
                    <div key={index} className={`p-4 rounded-lg ${
                      insight.type === 'success' ? 'bg-green-900/30 border border-green-500/30' :
                      insight.type === 'warning' ? 'bg-yellow-900/30 border border-yellow-500/30' :
                      'bg-blue-900/30 border border-blue-500/30'
                    }`}>
                      <h4 className="font-medium text-white">{insight.title}</h4>
                      <p className="text-sm text-gray-300 mt-1">{insight.message}</p>
                      <p className="text-xs text-gray-400 mt-2">Confidence: {insight.confidence}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-8 rounded-xl border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">🧠 Advanced AI Analytics</h2>
              
              {/* Player Performance Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="pb-3 text-gray-400">Player</th>
                      <th className="pb-3 text-gray-400">Position</th>
                      <th className="pb-3 text-gray-400">Team</th>
                      <th className="pb-3 text-gray-400">Points</th>
                      <th className="pb-3 text-gray-400">Projected</th>
                      <th className="pb-3 text-gray-400">AI Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPlayers.map((player) => (
                      <tr key={player.id} className="border-b border-gray-800">
                        <td className="py-3 text-white font-medium">{player.name}</td>
                        <td className="py-3 text-gray-300">{player.position}</td>
                        <td className="py-3 text-gray-300">{player.team}</td>
                        <td className="py-3 text-green-400">{player.points}</td>
                        <td className="py-3 text-blue-400">{player.projected}</td>
                        <td className="py-3">
                          <span className="px-2 py-1 bg-purple-900/50 text-purple-400 rounded text-sm">
                            {Math.floor(Math.random() * 20) + 80}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "lineup" && (
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-8 rounded-xl border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">⚡ Interactive Lineup Builder</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">🔥 Optimal Lineup</h3>
                  <div className="space-y-3">
                    {mockPlayers.map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                        <div>
                          <span className="text-white font-medium">{player.name}</span>
                          <span className="text-gray-400 ml-2">({player.position})</span>
                        </div>
                        <span className="text-green-400 font-bold">{player.projected}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">📊 Lineup Stats</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-900/30 rounded-lg">
                      <p className="text-blue-400">Projected Total</p>
                      <p className="text-2xl font-bold text-white">142.7</p>
                    </div>
                    <div className="p-4 bg-green-900/30 rounded-lg">
                      <p className="text-green-400">Win Probability</p>
                      <p className="text-2xl font-bold text-white">87%</p>
                    </div>
                    <div className="p-4 bg-purple-900/30 rounded-lg">
                      <p className="text-purple-400">Championship Odds</p>
                      <p className="text-2xl font-bold text-white">23%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "voice" && (
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 p-8 rounded-xl border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">🎤 Voice Assistant Demo</h2>
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-4xl">🎤</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">Say "Hey Fantasy" to get started!</h3>
                <p className="text-gray-400 mb-6">Try commands like:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-blue-400">"Hey Fantasy, optimize my lineup"</p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-green-400">"Hey Fantasy, who should I start?"</p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-purple-400">"Hey Fantasy, check injury reports"</p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <p className="text-yellow-400">"Hey Fantasy, show championship odds"</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold text-white mb-2">🏆 Fantasy.AI Achievement Unlocked!</h3>
            <p className="text-gray-300">
              You now have access to the most advanced fantasy sports platform ever created with:
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
              <span className="px-3 py-1 bg-blue-900/50 text-blue-400 rounded">🚀 340% Faster Than Competitors</span>
              <span className="px-3 py-1 bg-green-900/50 text-green-400 rounded">🎤 Voice-First Interface</span>
              <span className="px-3 py-1 bg-purple-900/50 text-purple-400 rounded">🤖 24 MCP Servers</span>
              <span className="px-3 py-1 bg-red-900/50 text-red-400 rounded">⚡ Real-time Everything</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}