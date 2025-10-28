'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ApiClient, Battle } from '@rapbattles/core';
import { Button, Card, CardContent, LoadingSpinner } from '@rapbattles/ui';

export default function EventPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const eventId = params.id as string;
  const eventToken = searchParams.get('token');

  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(eventToken);
  const [eventName, setEventName] = useState<string>('🎤 Evento de Rap Battle');

  const api = new ApiClient();

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    try {
      // Obtener información del evento
      const eventResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://167.71.80.114:8000'}/events/${eventId}`);
      if (eventResponse.ok) {
        const eventData = await eventResponse.json();
        setEventName(eventData.name);
      }
      
      // Si no hay token, obtenerlo del API
      let currentToken = token;
      if (!currentToken) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://167.71.80.114:8000'}/admin/events/${eventId}/token`, {
            method: 'POST',
            headers: {
              'X-Admin-Key': 'change-me'
            }
          });
          if (response.ok) {
            const data = await response.json();
            currentToken = data.token;
            setToken(currentToken);
          }
        } catch (e) {
          console.error('Could not get token:', e);
        }
      }

      // Load battles (doesn't require token for listing)
      const battlesData = await api.getBattlesByEvent(eventId);
      setBattles(battlesData);
    } catch (err) {
      setError('Error al cargar batallas');
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Event Header */}
        <Card className="mb-8">
          <CardContent className="text-center py-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{eventName}</h1>
            <p className="text-lg text-gray-600">Elige una batalla para votar</p>
          </CardContent>
        </Card>

        {/* Battles List */}
        {battles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-600 mb-2">Aún no hay batallas</h2>
              <p className="text-gray-500">Las batallas aparecerán aquí una vez que se creen.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {battles.map((battle) => {
              const isOpen = battle.status === 'open';
              const isClosed = battle.status === 'closed';
              
              return (
                <Card key={battle.id} className={`transition-all duration-200 hover:shadow-lg ${
                  isOpen ? 'border-green-200 bg-green-50' : 
                  isClosed ? 'border-red-200 bg-red-50' : 
                  'border-yellow-200 bg-yellow-50'
                }`}>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        {battle.mc_a} vs {battle.mc_b}
                      </h2>
                      
                      {/* Status Badge */}
                      <div className="mb-4">
                        {isOpen ? (
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            🔥 Votación Abierta
                          </span>
                        ) : isClosed ? (
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            ❌ Votación Cerrada
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            ⏰ Programada
                          </span>
                        )}
                      </div>

                      {/* Battle Info */}
                      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <div>
                          <p className="font-semibold text-blue-600">MC A</p>
                          <p className="text-gray-700">{battle.mc_a}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-red-600">MC B</p>
                          <p className="text-gray-700">{battle.mc_b}</p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => {
                          // Usar el token que obtuvimos
                          const tokenParam = token ? `?token=${token}` : '';
                          window.location.href = `/battle/${battle.id}${tokenParam}`;
                        }}
                        disabled={!isOpen}
                        className={`w-full py-3 text-lg font-bold rounded-lg transition-all duration-200 ${
                          isOpen 
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isOpen ? '🔥 Votar Ahora' : 
                         isClosed ? '❌ Votación Cerrada' : 
                         '⏰ Próximamente'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Potenciado por RapBattle Voter
          </p>
        </div>
      </div>
    </div>
  );
}
