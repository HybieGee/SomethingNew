export interface User {
  id: string;
  username: string;
  solanaAddress: string;
  tickets: number;
  createdAt: string;
  lastLoginAt: string;
  recoveryCode: string;
  streakDays: number;
  lastDailyClaimAt?: string;
}

export interface Quest {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: 'up_down_call' | 'tap_challenge' | 'trivia';
  cooldownMinutes: number;
  minReward: number;
  maxReward: number;
  active: boolean;
  metadata?: Record<string, any>;
}

export interface QuestCompletion {
  id: string;
  userId: string;
  questId: string;
  completedAt: string;
  ticketsEarned: number;
  result?: Record<string, any>;
}

export interface Raffle {
  id: string;
  name: string;
  description: string;
  prizePool: number;
  maxEntriesPerUser: number;
  ticketCost: number;
  startTime: string;
  endTime: string;
  drawTime: string;
  status: 'upcoming' | 'active' | 'drawing' | 'completed';
  winnerCount: number;
  serverSeed?: string;
  clientSeed?: string;
  winners?: RaffleWinner[];
}

export interface RaffleEntry {
  id: string;
  raffleId: string;
  userId: string;
  ticketCount: number;
  enteredAt: string;
}

export interface RaffleWinner {
  userId: string;
  username: string;
  prize: number;
  position: number;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  tier: 'common' | 'rare' | 'epic' | 'legendary';
  requirements?: Record<string, any>;
}

export interface UserBadge {
  userId: string;
  badgeId: string;
  earnedAt: string;
}

export interface EarnLog {
  id: string;
  userId: string;
  amount: number;
  source: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Boost {
  id: string;
  type: 'global' | 'personal';
  multiplier: number;
  startTime: string;
  endTime: string;
  source: string;
  active: boolean;
}

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  prizePool: number;
  active: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  tickets: number;
  badges: number;
  streakDays: number;
}

export interface StoreItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  cost: number;
  type: 'badge' | 'boost' | 'cosmetic';
  imageUrl?: string;
  metadata?: Record<string, any>;
  available: boolean;
}