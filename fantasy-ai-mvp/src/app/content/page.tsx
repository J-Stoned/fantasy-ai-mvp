"use client";

import { useState } from "react";
import ContentHub from "@/components/content/ContentHub";

export default function ContentPage() {
  const [userId] = useState('user_123'); // Mock user ID

  return (
    <ContentHub userId={userId} />
  );
}