"use client";

import { useState } from "react";
import MultiSportDashboard from "@/components/multi-sport/MultiSportDashboard";

export default function SportsPage() {
  const [userId] = useState('user_123'); // Mock user ID

  return (
    <MultiSportDashboard userId={userId} />
  );
}