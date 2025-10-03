import { VoteRequest, VoteResponse, Tally, Battle, AdminOpenBattle } from './schemas';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000') {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error = await response.json();
        if (error.detail) {
          errorMessage = Array.isArray(error.detail) 
            ? error.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ')
            : error.detail;
        }
      } catch {
        // If we can't parse the error, use the status text
        errorMessage = response.statusText || `HTTP ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/healthz');
  }

  // Vote
  async vote(voteData: VoteRequest, eventToken: string): Promise<VoteResponse> {
    return this.request('/vote', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${eventToken}`,
      },
      body: JSON.stringify(voteData),
    });
  }

  // Get tallies
  async getTallies(battleId: string): Promise<Tally> {
    return this.request(`/tallies/${battleId}`);
  }

  // Get battle details
  async getBattle(battleId: string): Promise<Battle> {
    return this.request(`/battles/${battleId}`);
  }

  // Admin endpoints

  async closeBattle(battleId: string, adminKey: string): Promise<void> {
    return this.request(`/admin/battles/${battleId}/close`, {
      method: 'POST',
      headers: {
        'X-Admin-Key': adminKey,
      },
    });
  }

  async create_event_token_endpoint(eventId: string, adminKey: string): Promise<{ token: string }> {
    return this.request(`/admin/events/${eventId}/token`, {
      method: 'POST',
      headers: {
        'X-Admin-Key': adminKey,
      },
    });
  }

  // Create battle
  async createBattle(data: {
    event_id: string;
    mc_a: string;
    mc_b: string;
    starts_at: string;
    ends_at: string;
  }): Promise<Battle> {
    console.log('API Client - createBattle called with:', data);
    console.log('API Client - JSON.stringify(data):', JSON.stringify(data));
    
    return this.request('/admin/battles', {
      method: 'POST',
      headers: {
        'X-Admin-Key': 'change-me',
      },
      body: JSON.stringify(data),
    });
  }

  // Get battles by event
  async getAllEvents(): Promise<Event[]> {
    return this.request('/admin/events', {
      headers: {
        'X-Admin-Key': 'change-me',
      },
    });
  }

  async createEvent(name: string): Promise<Event> {
    return this.request('/admin/events', {
      method: 'POST',
      headers: {
        'X-Admin-Key': 'change-me',
      },
      body: JSON.stringify({ name }),
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    return this.request(`/admin/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Key': 'change-me',
      },
    });
  }

  async getBattlesByEvent(eventId: string): Promise<Battle[]> {
    return this.request(`/admin/events/${eventId}/battles`, {
      headers: {
        'X-Admin-Key': 'change-me',
      },
    });
  }

  // Open battle (updated signature)
  async openBattle(battleId: string, adminKey: string): Promise<void> {
    return this.request(`/admin/battles/${battleId}/open`, {
      method: 'POST',
      headers: {
        'X-Admin-Key': adminKey,
      },
      body: JSON.stringify({ admin_key: adminKey }),
    });
  }

  // SSE for live updates
  createSSEConnection(battleId: string): EventSource {
    return new EventSource(`${this.baseUrl}/sse/battles/${battleId}`);
  }
}
