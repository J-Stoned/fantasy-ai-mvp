import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default function AnalyticsDashboardPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <AnalyticsDashboard 
        userId="user-123" 
        currentWeek={12}
        className="max-w-7xl mx-auto"
      />
    </div>
  );
}

export const metadata = {
  title: "Advanced Analytics | Fantasy.AI",
  description: "AI-powered fantasy analytics with 7 ML models, real-time data visualization, and strategic insights - Maximum Power Mode"
};