"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { multiSportService } from "@/lib/multi-sport-service";

interface MultiSportDashboardProps {
  userId: string;
}

export function MultiSportDashboard({ userId }: MultiSportDashboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 relative overflow-hidden">
      <div className="relative z-10">
        <MultiSportDashboardContent userId={userId} />
      </div>
    </div>
  );
}

function MultiSportDashboardContent({ userId }: MultiSportDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'schedule' | 'stats'>('overview');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Loading Multi-Sport Universe</h2>
          <p className="text-gray-300">Connecting to global sports data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white mb-2">
          Multi-Sport Fantasy Universe
        </h1>
        <p className="text-gray-300 text-lg">
          🌍 Global Sports Expansion • Cricket/Soccer/F1/Esports/AFL/Rugby
        </p>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GlassCard className="p-6">
              <h2 className="text-2xl font-bold text-white">Overview</h2>
              <p className="text-gray-400">Dashboard overview content</p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// MultiSportDashboard should be imported, not exported from test file