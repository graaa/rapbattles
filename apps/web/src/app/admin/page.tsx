'use client';

import { useState, useEffect } from 'react';
import { ApiClient, Battle } from '@rapbattles/core';
import { Button, Card, CardContent, CardHeader, LoadingSpinner } from '@rapbattles/ui';

interface BattleFormData {
  mc_a: string;
  mc_b: string;
  event_id: string;
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<BattleFormData>({
    mc_a: '',
    mc_b: '',
    event_id: '',
  });

  const api = new ApiClient();

  useEffect(() => {
    // Check if admin key is stored in localStorage
    const storedKey = localStorage.getItem('admin_key');
    if (storedKey) {
      setAdminKey(storedKey);
      setAuthenticated(true);
    }
  }, []);

  const handleAuthenticate = () => {
    if (adminKey.trim()) {
      localStorage.setItem('admin_key', adminKey);
      setAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_key');
    setAdminKey('');
    setAuthenticated(false);
    setBattles([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const createBattle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // For demo purposes, we'll create a mock battle
      // In a real app, you'd have a proper endpoint for this
      const newBattle: Battle = {
        id: crypto.randomUUID(),
        event_id: formData.event_id || crypto.randomUUID(),
        mc_a: formData.mc_a,
        mc_b: formData.mc_b,
        starts_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        status: 'scheduled' as any,
      };

      setBattles(prev => [...prev, newBattle]);
      setFormData({ mc_a: '', mc_b: '', event_id: '' });
    } catch (err) {
      setError('Failed to create battle');
    } finally {
      setLoading(false);
    }
  };

  const openBattle = async (battleId: string) => {
    setLoading(true);
    try {
      await api.openBattle(battleId, {}, adminKey);
      setBattles(prev => prev.map(battle => 
        battle.id === battleId ? { ...battle, status: 'open' as any } : battle
      ));
    } catch (err) {
      setError('Failed to open battle');
    } finally {
      setLoading(false);
    }
  };

  const closeBattle = async (battleId: string) => {
    setLoading(true);
    try {
      await api.closeBattle(battleId, adminKey);
      setBattles(prev => prev.map(battle => 
        battle.id === battleId ? { ...battle, status: 'closed' as any } : battle
      ));
    } catch (err) {
      setError('Failed to close battle');
    } finally {
      setLoading(false);
    }
  };

  const generateEventToken = async (eventId: string) => {
    try {
      const result = await api.create_event_token_endpoint(eventId, adminKey);
      return result.token;
    } catch (err) {
      setError('Failed to generate event token');
      return null;
    }
  };

  const copyQRCode = (battleId: string, eventId: string) => {
    const token = generateEventToken(eventId);
    if (token) {
      const qrUrl = `${window.location.origin}/battle/${battleId}?t=${token}`;
      navigator.clipboard.writeText(qrUrl);
      alert('QR Code URL copied to clipboard!');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <h1 className="text-2xl font-bold text-center">Admin Login</h1>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Key
                </label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter admin key"
                />
              </div>
              <Button
                onClick={handleAuthenticate}
                disabled={!adminKey.trim()}
                className="w-full"
              >
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <Button variant="secondary" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Create Battle Form */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Create New Battle</h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={createBattle} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MC A
                  </label>
                  <input
                    type="text"
                    name="mc_a"
                    value={formData.mc_a}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    MC B
                  </label>
                  <input
                    type="text"
                    name="mc_b"
                    value={formData.mc_b}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event ID (optional)
                  </label>
                  <input
                    type="text"
                    name="event_id"
                    value={formData.event_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Create Battle'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Battles List */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Battles</h2>
          </CardHeader>
          <CardContent>
            {battles.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No battles created yet</p>
            ) : (
              <div className="space-y-4">
                {battles.map((battle) => (
                  <div key={battle.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {battle.mc_a} vs {battle.mc_b}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Status: <span className={`font-medium ${
                            battle.status === 'open' ? 'text-green-600' :
                            battle.status === 'closed' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {battle.status}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ID: {battle.id}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {battle.status === 'scheduled' && (
                          <Button
                            size="sm"
                            onClick={() => openBattle(battle.id)}
                            disabled={loading}
                          >
                            Open
                          </Button>
                        )}
                        {battle.status === 'open' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => closeBattle(battle.id)}
                            disabled={loading}
                          >
                            Close
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => copyQRCode(battle.id, battle.event_id)}
                        >
                          Copy QR
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
