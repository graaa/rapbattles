'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ApiClient, Battle, VoteChoice, BattleStatus } from '@rapbattles/core';
import { Button, Card, CardContent, LoadingSpinner } from '@rapbattles/ui';
import { getDeviceHash } from '@/lib/device';

export default function BattlePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const battleId = params.id as string;
  const eventToken = searchParams.get('token');

  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tally, setTally] = useState({ A: 0, B: 0, REPLICA: 0 });

  const api = new ApiClient();

  useEffect(() => {
    if (!eventToken) {
      setError('Token de evento faltante');
      setLoading(false);
      return;
    }

    loadBattle();
  }, [battleId, eventToken]);

  const loadBattle = async () => {
    try {
      const battleData = await api.getBattle(battleId);
      setBattle(battleData);
      
      // Load initial tally
      const tallyData = await api.getTallies(battleId);
      setTally(tallyData);
      
      // Check if already voted
      const deviceHash = getDeviceHash();
      const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://167.71.80.114:8000'}/votes/${battleId}/check/${deviceHash}`);
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.has_voted) {
          setVoted(true);
        }
      }
    } catch (err) {
      setError('Error al cargar batalla');
    } finally {
      setLoading(false);
    }
  };
  
  // Poll for tally updates every 2 seconds
  useEffect(() => {
    if (!battle || battle.status !== 'open') return;
    
    const interval = setInterval(async () => {
      try {
        const tallyData = await api.getTallies(battleId);
        setTally(tallyData);
      } catch (err) {
        // Silently fail
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [battle, battleId]);

  const handleVote = async (choice: VoteChoice) => {
    if (!battle || !eventToken || battle.status !== 'open') {
      return;
    }

    setVoting(true);
    setError(null);

    try {
      const deviceHash = getDeviceHash();
      const result = await api.vote(
        {
          battle_id: battleId,
          choice,
          device_hash: deviceHash,
        },
        eventToken
      );

      if (result.success) {
        setVoted(true);
        if (result.tally) {
          setTally(result.tally);
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al votar');
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center">
            <h1 className="text-xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Batalla no encontrada</h1>
            <p className="text-gray-600">La batalla solicitada no se pudo encontrar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOpen = battle.status === 'open';
  const isClosed = battle.status === 'closed';
  const canVote = isOpen && !voted && !voting;
  
  // Calculate winner when closed
  const getWinner = () => {
    if (!isClosed) return null;
    
    const votes = { A: tally.A, B: tally.B, REPLICA: tally.REPLICA };
    const maxVotes = Math.max(votes.A, votes.B, votes.REPLICA);
    const winners = Object.entries(votes).filter(([_, count]) => count === maxVotes);
    
    if (winners.length === 1) {
      const winnerKey = winners[0][0];
      if (winnerKey === 'A') return { name: battle.mc_a, choice: 'A' };
      if (winnerKey === 'B') return { name: battle.mc_b, choice: 'B' };
      return { name: 'REPLICA', choice: 'REPLICA' };
    }
    
    // Tie
    return { name: 'REPLICA', choice: 'REPLICA' };
  };
  
  const winner = getWinner();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 py-4 px-4">
      <div className="max-w-md mx-auto">
        {/* Battle Info */}
        <Card className="mb-8">
          <CardContent className="text-center py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Batalla de Rap</h1>
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-blue-600 mb-2">MC A</h2>
                <p className="text-lg">{battle.mc_a}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-red-600 mb-2">MC B</h2>
                <p className="text-lg">{battle.mc_b}</p>
              </div>
            </div>
            
            {/* Status */}
            <div className="mb-4">
              {isOpen ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Votación Abierta
                </span>
              ) : battle.status === 'closed' ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Votación Cerrada
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  Programada
                </span>
              )}
            </div>

            {/* Current Tally */}
            <div className="text-sm text-gray-600">
              Votos actuales: {tally.A + tally.B + tally.REPLICA}
            </div>
          </CardContent>
        </Card>

        {/* Vote Buttons */}
        {isOpen && (
          <div className="space-y-4 mb-8">
            <Button
              className={`w-full h-16 text-lg font-bold vote-button vote-button-a ${!canVote ? 'vote-button-disabled' : ''}`}
              onClick={() => handleVote('A')}
              disabled={!canVote}
              style={{
                background: canVote ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
                border: 'none',
                borderRadius: '15px',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                padding: '20px',
                boxShadow: canVote ? '0 8px 25px rgba(102, 126, 234, 0.3)' : 'none'
              }}
            >
              {voting ? <LoadingSpinner size="sm" /> : `🔥 ${battle.mc_a}`}
            </Button>
            
            <Button
              className={`w-full h-16 text-lg font-bold vote-button vote-button-b ${!canVote ? 'vote-button-disabled' : ''}`}
              onClick={() => handleVote('B')}
              disabled={!canVote}
              style={{
                background: canVote ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : '#ccc',
                border: 'none',
                borderRadius: '15px',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                padding: '20px',
                boxShadow: canVote ? '0 8px 25px rgba(240, 147, 251, 0.3)' : 'none'
              }}
            >
              {voting ? <LoadingSpinner size="sm" /> : `🔥 ${battle.mc_b}`}
            </Button>
            
            <Button
              className={`w-full h-16 text-lg font-bold vote-button vote-button-replica ${!canVote ? 'vote-button-disabled' : ''}`}
              onClick={() => handleVote('REPLICA')}
              disabled={!canVote}
              style={{
                background: canVote ? 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)' : '#ccc',
                border: 'none',
                borderRadius: '15px',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                padding: '20px',
                boxShadow: canVote ? '0 8px 25px rgba(132, 250, 176, 0.3)' : 'none'
              }}
            >
              {voting ? <LoadingSpinner size="sm" /> : `🔥 REPLICA`}
            </Button>
          </div>
        )}

        {/* Vote Confirmation */}
        {voted && !isClosed && (
          <Card className="mb-8">
            <CardContent className="text-center py-6">
              <h2 className="text-xl font-bold text-green-600 mb-2">¡Voto registrado!</h2>
              <p className="text-gray-600">Gracias por votar.</p>
            </CardContent>
          </Card>
        )}

        {/* Winner Announcement */}
        {isClosed && winner && (
          <Card className="mb-8 border-4 border-yellow-400 bg-yellow-50">
            <CardContent className="text-center py-8">
              <h2 className="text-3xl font-bold text-yellow-600 mb-4">🏆 VOTACIÓN CERRADA</h2>
              <div className="text-4xl font-bold text-yellow-700 mb-2">
                {winner.choice === 'REPLICA' ? '🤝 REPLICA' : '🥇 GANADOR'}
              </div>
              <div className="text-2xl font-bold text-gray-800 mt-4">{winner.name}</div>
              {winner.choice !== 'REPLICA' && (
                <div className="text-lg text-gray-600 mt-2">
                  {winner.choice === 'A' ? battle.mc_a : battle.mc_b}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Live Tally */}
        <Card>
          <CardContent className="py-6">
            <h2 className="text-xl font-bold text-center mb-4">Resultados en Tiempo Real</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">{tally.A}</div>
                <div className="text-sm text-gray-600">{battle.mc_a}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-600">{tally.B}</div>
                <div className="text-sm text-gray-600">{battle.mc_b}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{tally.REPLICA}</div>
                <div className="text-sm text-gray-600">REPLICA</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
