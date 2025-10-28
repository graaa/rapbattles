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
    } catch (err) {
      setError('Error al cargar batalla');
    } finally {
      setLoading(false);
    }
  };

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
  const canVote = isOpen && !voted && !voting;

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
              {voting ? <LoadingSpinner size="sm" /> : `🔥 EMPATE`}
            </Button>
          </div>
        )}

        {/* Vote Confirmation */}
        {voted && (
          <Card className="mb-8">
            <CardContent className="text-center py-6">
              <h2 className="text-xl font-bold text-green-600 mb-2">¡Voto registrado!</h2>
              <p className="text-gray-600">Gracias por votar.</p>
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
                <div className="text-sm text-gray-600">EMPATE</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
