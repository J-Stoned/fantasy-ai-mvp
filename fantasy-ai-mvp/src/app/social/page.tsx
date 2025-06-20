"use client";

import { useState } from "react";
import SocialDashboard from "@/components/social/SocialDashboard";
import { PageHeader } from "@/components/navigation/PageHeader";
import { NeonButton } from "@/components/ui/NeonButton";
import { MessageCircle, Users, Bell, Plus } from "lucide-react";

export default function SocialPage() {
  const [userId] = useState('user_123'); // Mock user ID
  const [userName] = useState('You'); // Mock user name
  const [selectedLeagueId] = useState('league_1'); // Mock league ID

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Social Hub"
        description="Connect with your league, share insights, and compete with friends"
        icon={<MessageCircle className="w-6 h-6 text-neon-pink" />}
        actions={
          <div className="flex items-center gap-3">
            <NeonButton variant="pink" size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Post
            </NeonButton>
            <NeonButton variant="purple" size="sm" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Find Friends
            </NeonButton>
          </div>
        }
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SocialDashboard
          leagueId={selectedLeagueId}
          userId={userId}
          userName={userName}
        />
      </div>
    </div>
  );
}