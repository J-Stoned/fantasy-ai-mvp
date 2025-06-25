import { LiveDataDashboard } from '@/components/live-data/LiveDataDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Data Pipeline | Fantasy.AI',
  description: 'Real-time sports data collection powered by MCP servers',
};

export default function LiveDataPage() {
  return (
    <div className="container mx-auto py-8">
      <LiveDataDashboard />
    </div>
  );
}