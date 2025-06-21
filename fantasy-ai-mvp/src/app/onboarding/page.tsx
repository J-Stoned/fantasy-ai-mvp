"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserOnboarding } from "@/components/onboarding/UserOnboarding";

export default function OnboardingPage() {
  const router = useRouter();

  const handleOnboardingComplete = () => {
    // Set user as onboarded in localStorage or database
    localStorage.setItem('fantasy-ai-onboarded', 'true');
    
    // Redirect to dashboard
    router.push('/dashboard');
  };

  return (
    <UserOnboarding onComplete={handleOnboardingComplete} />
  );
}