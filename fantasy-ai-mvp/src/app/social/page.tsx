"use client";

import { useState } from "react";
import SocialDashboard from "@/components/social/SocialDashboard";

export default function SocialPage() {
  const [userId] = useState('user_123'); // Mock user ID
  const [userName] = useState('You'); // Mock user name
  const [selectedLeagueId] = useState('league_1'); // Mock league ID

  return (
    <SocialDashboard
      leagueId={selectedLeagueId}
      userId={userId}
      userName={userName}
    />
  );
}