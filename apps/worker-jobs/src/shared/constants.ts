export const GAME_CONFIG = {
  INITIAL_TICKETS: 100,
  DAILY_REWARD_BASE: 50,
  STREAK_MULTIPLIER: 1.1,
  MAX_DAILY_EARN: 5000,

  QUEST_COOLDOWNS: {
    up_down_call: 5,
    tap_challenge: 15,
    trivia: 10
  },

  QUEST_REWARDS: {
    up_down_call: { min: 10, max: 50 },
    tap_challenge: { min: 5, max: 25 },
    trivia: { min: 15, max: 40 }
  },

  RAFFLE_INTERVALS: {
    hourly: 60 * 60 * 1000,
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000
  },

  SESSION_DURATION: 7 * 24 * 60 * 60 * 1000,

  BADGE_TIERS: {
    common: { color: '#9CA3AF', multiplier: 1 },
    rare: { color: '#3B82F6', multiplier: 1.2 },
    epic: { color: '#A855F7', multiplier: 1.5 },
    legendary: { color: '#F59E0B', multiplier: 2 }
  }
};

export const API_ROUTES = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout'
  },
  PROFILE: {
    ME: '/me',
    UPDATE_ADDRESS: '/me/address',
    LEADERBOARD: '/leaderboard'
  },
  ECONOMY: {
    STOREFRONT: '/storefront',
    PURCHASE: '/purchase'
  },
  QUESTS: {
    LIST: '/quests',
    COMPLETE: '/quests/complete'
  },
  RAFFLES: {
    NEXT: '/raffles/next',
    ENTER: '/raffles/enter',
    DETAILS: '/raffles/:id'
  },
  ADMIN: {
    CLAIM: '/admin/claim',
    DRAW: '/admin/draw',
    BOOST: '/admin/boost'
  }
};