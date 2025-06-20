"use client";

import { useState } from "react";
import LiveBettingDashboard from "@/components/betting/LiveBettingDashboard";
import { PageHeader } from "@/components/navigation/PageHeader";
import { NeonButton } from "@/components/ui/NeonButton";
import { DollarSign, TrendingUp, BarChart3 } from "lucide-react";

export default function BettingPage() {
  const [userId] = useState('user_123'); // Mock user ID
  const [selectedGameId] = useState('game_1'); // Mock game ID

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Live Betting Hub"
        description="AI-powered sports betting with real-time odds and smart predictions"
        icon={<DollarSign className="w-6 h-6 text-neon-green" />}
        actions={
          <div className="flex items-center gap-3">
            <NeonButton variant="blue" size="sm" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </NeonButton>
            <NeonButton variant="green" size="sm" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Live Odds
            </NeonButton>
          </div>
        }
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <LiveBettingDashboard
          userId={userId}
          gameId={selectedGameId}
        />
      </div>
    </div>
  );
}