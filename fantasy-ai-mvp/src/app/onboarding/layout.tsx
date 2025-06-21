import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Welcome to Fantasy.AI | Get Started",
  description: "Set up your Fantasy.AI account and connect your fantasy leagues for AI-powered insights"
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}