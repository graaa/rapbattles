'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ApiClient, Battle, Tally } from '@rapbattles/core';
import { Card, CardContent, BarChart, LoadingSpinner } from '@rapbattles/ui';

export default function PresenterPage() {
  const params = useParams();
  const battleId = params.id as string;

  const [battle, setBattle] = useState<Battle | null>(null);
  const [tally, setTally] = useState<Tally>({ A: 0, B: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = new ApiClient();

  useEffect(() => {
    loadBattle();
  }, [battleId]);

  const loadBattle = async () => {
    try {
      const battleData = await api.getBattle(battleId);
      setBattle(battleData);
      
      // Load initial tally
      const tallyData = await api.getTallies(battleId);
      setTally(tallyData);
      
      // Set up SSE connection for live updates
      setupSSE();
    } catch (err) {
      setError('Failed to load battle');
    } finally {
      setLoading(false);
    }
  };

  const setupSSE = () => {
    const eventSource = api.createSSEConnection(battleId);
    
    eventSource.onmessage = (event) => {
      try {
        const newTally = JSON.parse(event.data);
        setTally(newTally);
      } catch (err) {
        console.error('Failed to parse SSE data:', err);
      }
    };
    
    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        eventSource.close();
        setupSSE();
      }, 5000);
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center">
            <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600">{error || 'Battle not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Rap Battle Live Results</h1>
          <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div>
              <h2 className="text-2xl font-semibold text-blue-400 mb-2">MC A</h2>
              <p className="text-xl">{battle.mc_a}</p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-red-400 mb-2">MC B</h2>
              <p className="text-xl">{battle.mc_b}</p>
            </div>
          </div>
        </div>

        {/* Live Tally Chart */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="py-12">
              <BarChart
                data={tally}
                labels={{
                  A: battle.mc_a,
                  B: battle.mc_b,
                }}
                className="text-white"
              />
            </CardContent>
          </Card>
        </div>

        {/* Status Indicator */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-lg font-medium">
              {battle.status === 'open' ? 'Voting Open' : 
               battle.status === 'closed' ? 'Voting Closed' : 'Scheduled'}
            </span>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="fixed top-4 right-4">
          <div className="flex items-center bg-red-600 text-white px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
            <span className="text-sm font-medium">LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
