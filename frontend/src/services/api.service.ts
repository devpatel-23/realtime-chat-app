import type { ApiResponse, Message, PresenceData } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    let data: ApiResponse<T>;

    try {
      data = await res.json();
    } catch {
      throw new ApiError(`Server responded with ${res.status}: ${res.statusText}`, res.status);
    }

    if (!res.ok || !data.success) {
      const errorMsg = data.error || `HTTP error ${res.status}`;
      throw new ApiError(errorMsg, res.status);
    }

    return data.data;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Network request failed');
  }
}

export const apiService = {
  async login(username: string): Promise<{ username: string }> {
    return request<{ username: string }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  },

  async getMessages(limit = 50, before?: string): Promise<Message[]> {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit.toString());
    if (before) params.set('before', before);

    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Message[]>(`/api/messages${query}`);
  },

  async sendMessage(username: string, text: string): Promise<Message> {
    return request<Message>('/api/messages', {
      method: 'POST',
      body: JSON.stringify({ username, text }),
    });
  },

  async getOnlineUsers(): Promise<PresenceData> {
    return request<PresenceData>('/api/users/online');
  },

  async checkHealth(): Promise<{ status: string }> {
    return request<{ status: string }>('/health');
  },
};
