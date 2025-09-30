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
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
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
  async openBattle(battleId: string, data: AdminOpenBattle, adminKey: string): Promise<void> {
    return this.request(`/admin/battles/${battleId}/open`, {
      method: 'POST',
      headers: {
        'X-Admin-Key': adminKey,
      },
      body: JSON.stringify(data),
    });
  }

  async closeBattle(battleId: string, adminKey: string): Promise<void> {
    return this.request(`/admin/battles/${battleId}/close`, {
      method: 'POST',
      headers: {
        'X-Admin-Key': adminKey,
      },
    });
  }

  // SSE for live updates
  createSSEConnection(battleId: string): EventSource {
    return new EventSource(`${this.baseUrl}/sse/battles/${battleId}`);
  }
}
