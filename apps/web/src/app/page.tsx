'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ApiClient } from '@rapbattles/core';
import { Card, CardContent, Button, LoadingSpinner } from '@rapbattles/ui';

type Event = {
  id: string;
  name: string;
  created_at: string;
};

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const api = new ApiClient();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const allEvents = await api.getAllEvents();
      // Solo eventos de hoy
      const today = new Date().toDateString();
      const todayEvents = allEvents.filter(event => {
        const eventDate = new Date(event.created_at).toDateString();
        return eventDate === today;
      });
      setEvents(todayEvents);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            RapBattle Voter
          </h1>
          <p className="text-gray-600">
            Sistema de votación en vivo para batallas de rap
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Eventos de Hoy
              </h2>
              
              {events.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">
                    <p>No hay eventos hoy</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {events.map(event => (
                    <Link href={`/event/${event.id}`} key={event.id}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {event.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Ver batallas
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t">
              <Link 
                href="/admin"
                className="inline-flex items-center justify-center w-full bg-gray-800 text-white py-3 px-6 rounded-lg hover:bg-gray-900 transition-colors"
              >
                Panel de Administración
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}