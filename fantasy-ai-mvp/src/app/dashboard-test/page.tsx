"use client";

import { useEffect, useState } from "react";

export default function DashboardTest() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/test-live-players')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">🏈 Fantasy.AI Live Data Test</h1>
      
      <div className="mb-8 p-4 bg-green-900/20 border border-green-500 rounded">
        <h2 className="text-xl font-bold text-green-400">✅ Database Status</h2>
        <p className="text-2xl mt-2">{data?.playerCount?.toLocaleString()} Players</p>
        <p className="text-sm text-gray-400 mt-1">{data?.message}</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">📊 Position Breakdown</h2>
        <div className="grid grid-cols-5 gap-2">
          {data?.positionBreakdown?.map((pos: any) => (
            <div key={pos.position} className="p-3 bg-gray-800 rounded">
              <div className="font-bold">{pos.position}</div>
              <div className="text-2xl">{pos.count}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">⭐ Sample Players</h2>
        <div className="grid gap-2">
          {data?.samplePlayers?.slice(0, 10).map((player: any) => (
            <div key={player.id} className="p-3 bg-gray-800 rounded flex justify-between items-center">
              <div>
                <span className="font-bold">{player.name}</span>
                <span className="text-sm text-gray-400 ml-2">{player.position}</span>
              </div>
              <div className="text-sm text-gray-400">{player.team}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500 rounded">
        <p className="text-sm">
          <strong>Next Steps:</strong> Test the main dashboard at <a href="/dashboard" className="text-blue-400 underline">/dashboard</a>
        </p>
      </div>
    </div>
  );
}