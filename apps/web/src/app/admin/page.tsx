'use client';

import { useState, useEffect } from 'react';
import { ApiClient, Battle } from '@rapbattles/core';
import { Button, Card, CardContent, LoadingSpinner } from '@rapbattles/ui';

// Import Event type from core
type Event = {
  id: string;
  name: string;
  created_at: string;
};

interface EventWithBattles extends Event {
  battles: Battle[];
}

export default function AdminPanel() {
  const [events, setEvents] = useState<EventWithBattles[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithBattles | null>(null);
  const [newEventName, setNewEventName] = useState('');
  const [newBattleMcA, setNewBattleMcA] = useState('');
  const [newBattleMcB, setNewBattleMcB] = useState('');

  const api = new ApiClient();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      // Load all events from the API
      const allEvents = await api.getAllEvents();
      
      // Load battles for each event
      const eventsWithBattles: EventWithBattles[] = [];
      for (const event of allEvents) {
        const battles = await api.getBattlesByEvent((event as any).id);
        eventsWithBattles.push({
          ...(event as any),
          battles
        } as EventWithBattles);
      }
      
      setEvents(eventsWithBattles);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async () => {
    if (!newEventName.trim()) return;
    
    setCreatingEvent(true);
    try {
      // Create event via API
      const newEvent = await api.createEvent(newEventName);
      
      // Add battles array to match our interface
      const eventWithBattles: EventWithBattles = {
        ...(newEvent as any),
        battles: []
      };
      
      setEvents(prev => [...prev, eventWithBattles]);
      setNewEventName('');
      
      // Reload all events to get fresh data
      await loadEvents();
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setCreatingEvent(false);
    }
  };

  const createBattle = async (eventId: string) => {
    if (!newBattleMcA.trim() || !newBattleMcB.trim()) return;
    
    try {
      const battleData = {
        event_id: eventId,
        mc_a: newBattleMcA,
        mc_b: newBattleMcB,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      };
      
      console.log('Creating battle with data:', battleData);
      console.log('Data type:', typeof battleData);
      console.log('JSON stringified:', JSON.stringify(battleData));
      const battle = await api.createBattle(battleData);
      
      // Update events with new battle
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, battles: [...event.battles, battle] }
          : event
      ));
      
      setNewBattleMcA('');
      setNewBattleMcB('');
      
      // Reload events to show the new battle
      await loadEvents();
    } catch (err) {
      console.error('Failed to create battle:', err);
    }
  };

  const openBattle = async (battleId: string) => {
    try {
      await api.openBattle(battleId, 'change-me');
      await loadEvents(); // Reload to get updated status
    } catch (err) {
      console.error('Failed to open battle:', err);
    }
  };

  const closeBattle = async (battleId: string) => {
    try {
      await api.closeBattle(battleId, 'change-me');
      await loadEvents(); // Reload to get updated status
    } catch (err) {
      console.error('Failed to close battle:', err);
    }
  };

  const generateEventToken = async (eventId: string) => {
    try {
      const response = await api.create_event_token_endpoint(eventId, 'change-me');
      return response.token;
    } catch (err) {
      console.error('Failed to generate token:', err);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Panel - Event Management</h1>
        
        {/* Create New Event */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Event Name"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                onClick={createEvent}
                disabled={creatingEvent || !newEventName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {creatingEvent ? <LoadingSpinner size="sm" /> : 'Create Event'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600">Create your first event to get started!</p>
          </div>
        ) : (
          events.map((event) => (
          <Card key={event.id} className="mb-8">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{event.name}</h2>
                  <p className="text-gray-600">Event ID: {event.id}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        const token = await generateEventToken(event.id);
                        if (token) {
                          const url = `${window.location.protocol}//${window.location.host}/event/${event.id}?token=${token}`;
                          alert(`Event Link:\n\n${url}\n\nCopy this link to share the event!`);
                        }
                      } catch (error) {
                        console.error('Failed to get event link:', error);
                        alert('Failed to generate event link. Please try again.');
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Show Event Link
                  </Button>
                  
                  <Button
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete the event "${event.name}" and all ${event.battles.length} battles in it? This action cannot be undone.`)) {
                        try {
                          await api.deleteEvent(event.id);
                          alert('Event deleted successfully!');
                          await loadEvents(); // Reload events
                        } catch (error: any) {
                          console.error('Failed to delete event:', error);
                          alert(`Failed to delete event: ${error.message || 'Unknown error'}`);
                        }
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete Event
                  </Button>
                </div>
              </div>

              {/* Create Battle */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Add New Battle</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="MC A Name"
                    value={newBattleMcA}
                    onChange={(e) => setNewBattleMcA(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="MC B Name"
                    value={newBattleMcB}
                    onChange={(e) => setNewBattleMcB(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={() => createBattle(event.id)}
                    disabled={!newBattleMcA.trim() || !newBattleMcB.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    Create Battle
                  </Button>
                </div>
              </div>

              {/* Battles List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Battles ({event.battles.length})</h3>
                {event.battles.length === 0 ? (
                  <p className="text-gray-500 italic">No battles created yet</p>
                ) : (
                  <div className="space-y-4">
                    {event.battles.map((battle) => (
                      <div key={battle.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {battle.mc_a} vs {battle.mc_b}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Status: <span className={`font-medium ${
                                battle.status === 'open' ? 'text-green-600' :
                                battle.status === 'closed' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                                {battle.status.toUpperCase()}
                              </span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {battle.status === 'scheduled' && (
                              <Button
                                onClick={() => openBattle(battle.id)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                              >
                                Open Voting
                              </Button>
                            )}
                            {battle.status === 'open' && (
                              <Button
                                onClick={() => closeBattle(battle.id)}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                              >
                                Close Voting
                              </Button>
                            )}
                            <Button
                              onClick={async () => {
                                try {
                                  const token = await generateEventToken(event.id);
                                  if (token) {
                                    const url = `${window.location.protocol}//${window.location.host}/battle/${battle.id}?token=${token}`;
                                    alert(`Battle Link:\n\n${url}\n\nCopy this link to share the battle!`);
                                  }
                                } catch (error) {
                                  console.error('Failed to get battle link:', error);
                                  alert('Failed to generate battle link. Please try again.');
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Show Link
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
        )}
      </div>
    </div>
  );
}