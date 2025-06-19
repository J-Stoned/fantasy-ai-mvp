"use client";

import { useState } from "react";
import LiveBettingDashboard from "@/components/betting/LiveBettingDashboard";

export default function BettingPage() {
  const [userId] = useState('user_123'); // Mock user ID
  const [selectedGameId] = useState('game_1'); // Mock game ID

  return (
    <LiveBettingDashboard
      userId={userId}
      gameId={selectedGameId}
    />
  );
}