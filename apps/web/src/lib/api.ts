const API_URL = typeof window !== 'undefined' && window.location.hostname.includes('pages.dev')
  ? 'https://raffle-arcade-api.claudechaindev.workers.dev'
  : '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function fetchApi(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'An error occurred');
  }

  return data;
}

export const api = {
  auth: {
    register: (data: { username: string; password: string; solanaAddress: string }) =>
      fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { username: string; password: string }) =>
      fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    logout: () => fetchApi('/auth/logout', { method: 'POST' }),
  },

  profile: {
    me: () => fetchApi('/me'),
    claimDaily: () => fetchApi('/me/daily', { method: 'POST' }),
    updateAddress: (solanaAddress: string) =>
      fetchApi('/me/address', {
        method: 'POST',
        body: JSON.stringify({ solanaAddress }),
      }),
    leaderboard: (season = 'current') =>
      fetchApi(`/leaderboard?season=${season}`),
  },

  public: {
    stats: () => fetchApi('/public/stats'),
  },

  quests: {
    list: () => fetchApi('/quests'),
    complete: (data: any) =>
      fetchApi('/quests/complete', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  raffles: {
    next: () => fetchApi('/raffles/next'),
    enter: (data: { raffleId: string; tickets: number }) =>
      fetchApi('/raffles/enter', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    details: (id: string) => fetchApi(`/raffles/${id}`),
  },

  store: {
    list: () => fetchApi('/storefront'),
    purchase: (itemId: string) =>
      fetchApi('/storefront/purchase', {
        method: 'POST',
        body: JSON.stringify({ itemId }),
      }),
  },

  admin: {
    claim: (data: any) =>
      fetchApi('/admin/claim', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      }),
    boost: (data: any) =>
      fetchApi('/admin/boost', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      }),
    draw: (raffleId: string) =>
      fetchApi('/admin/draw', {
        method: 'POST',
        body: JSON.stringify({ raffleId }),
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      }),
    stats: () =>
      fetchApi('/admin/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
        },
      }),
  },
};