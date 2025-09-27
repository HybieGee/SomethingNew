import { generateId } from '../shared/index';
import type { Env } from '../types';
import { checkPairTokenEligibility } from './solana';

// Staking tier configuration
export const STAKING_TIERS = {
  bronze: {
    minAmount: 100,
    dailyTickets: 10,
    lockDays: 7,
    name: 'Bronze Staker',
    color: '#CD7F32'
  },
  silver: {
    minAmount: 500,
    dailyTickets: 60,
    lockDays: 14,
    name: 'Silver Staker',
    color: '#C0C0C0'
  },
  gold: {
    minAmount: 1000,
    dailyTickets: 150,
    lockDays: 30,
    name: 'Gold Staker',
    color: '#FFD700'
  },
  diamond: {
    minAmount: 5000,
    dailyTickets: 800,
    lockDays: 60,
    name: 'Diamond Staker',
    color: '#B9F2FF'
  }
} as const;

export type StakingTier = keyof typeof STAKING_TIERS;

export interface StakingPool {
  id: string;
  userId: string;
  pairAmount: number;
  stakedAt: string;
  unlockAt: string;
  dailyTicketRate: number;
  lastClaimAt?: string;
  tier: StakingTier;
  status: 'active' | 'unlocked' | 'withdrawn';
}

export interface StakingClaim {
  id: string;
  poolId: string;
  userId: string;
  ticketsEarned: number;
  claimedAt: string;
}

/**
 * Get staking tier based on amount
 */
export function getStakingTier(amount: number): StakingTier | null {
  const tiers = Object.entries(STAKING_TIERS) as [StakingTier, typeof STAKING_TIERS[StakingTier]][];

  // Sort by minAmount descending to get highest tier first
  const sortedTiers = tiers.sort((a, b) => b[1].minAmount - a[1].minAmount);

  for (const [tier, config] of sortedTiers) {
    if (amount >= config.minAmount) {
      return tier;
    }
  }

  return null;
}

/**
 * Calculate unlock date based on tier
 */
export function calculateUnlockDate(tier: StakingTier): Date {
  const config = STAKING_TIERS[tier];
  const unlockDate = new Date();
  unlockDate.setDate(unlockDate.getDate() + config.lockDays);
  return unlockDate;
}

/**
 * Calculate available tickets to claim
 */
export function calculateClaimableTickets(pool: StakingPool): number {
  const now = new Date();
  const lastClaim = pool.lastClaimAt ? new Date(pool.lastClaimAt) : new Date(pool.stakedAt);

  const daysSinceLastClaim = Math.floor((now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(0, daysSinceLastClaim * pool.dailyTicketRate);
}

/**
 * Create a new staking pool
 */
export async function createStakingPool(
  env: Env,
  userId: string,
  userWalletAddress: string,
  pairAmount: number,
  pairTokenMint: string
): Promise<{ success: boolean; pool?: StakingPool; error?: string }> {
  try {
    // Verify user has enough $PAIR tokens
    const eligibility = await checkPairTokenEligibility(userWalletAddress, 0, pairTokenMint);

    if (eligibility.balance < pairAmount) {
      return {
        success: false,
        error: `Insufficient $PAIR balance. Required: ${pairAmount}, Available: ${eligibility.balance}`
      };
    }

    // Determine staking tier
    const tier = getStakingTier(pairAmount);
    if (!tier) {
      return {
        success: false,
        error: `Minimum staking amount is ${STAKING_TIERS.bronze.minAmount} $PAIR`
      };
    }

    const config = STAKING_TIERS[tier];
    const poolId = generateId();
    const now = new Date();
    const unlockAt = calculateUnlockDate(tier);

    const pool: StakingPool = {
      id: poolId,
      userId,
      pairAmount,
      stakedAt: now.toISOString(),
      unlockAt: unlockAt.toISOString(),
      dailyTicketRate: config.dailyTickets,
      tier,
      status: 'active'
    };

    // Insert staking pool into database
    await env.DB.prepare(`
      INSERT INTO staking_pools (
        id, user_id, pair_amount, staked_at, unlock_at,
        daily_ticket_rate, tier, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      poolId,
      userId,
      pairAmount,
      now.toISOString(),
      unlockAt.toISOString(),
      config.dailyTickets,
      tier,
      'active'
    ).run();

    console.log(`✅ Created ${tier} staking pool for user ${userId}: ${pairAmount} $PAIR`);

    return { success: true, pool };
  } catch (error) {
    console.error('Error creating staking pool:', error);
    return {
      success: false,
      error: error.message || 'Failed to create staking pool'
    };
  }
}

/**
 * Claim rewards from staking pool
 */
export async function claimStakingRewards(
  env: Env,
  userId: string,
  poolId: string
): Promise<{ success: boolean; ticketsClaimed?: number; error?: string }> {
  try {
    // Get staking pool
    const poolResult = await env.DB.prepare(`
      SELECT * FROM staking_pools
      WHERE id = ? AND user_id = ? AND status = 'active'
    `).bind(poolId, userId).first();

    if (!poolResult) {
      return {
        success: false,
        error: 'Staking pool not found or inactive'
      };
    }

    const pool = poolResult as StakingPool;
    const claimableTickets = calculateClaimableTickets(pool);

    if (claimableTickets <= 0) {
      return {
        success: false,
        error: 'No tickets available to claim'
      };
    }

    const claimId = generateId();
    const now = new Date();

    // Record the claim
    await env.DB.prepare(`
      INSERT INTO staking_claims (id, pool_id, user_id, tickets_earned, claimed_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(claimId, poolId, userId, claimableTickets, now.toISOString()).run();

    // Update pool last claim time
    await env.DB.prepare(`
      UPDATE staking_pools SET last_claim_at = ? WHERE id = ?
    `).bind(now.toISOString(), poolId).run();

    // Add tickets to user account
    await env.DB.prepare(`
      UPDATE users SET tickets = tickets + ? WHERE id = ?
    `).bind(claimableTickets, userId).run();

    console.log(`✅ User ${userId} claimed ${claimableTickets} tickets from staking pool ${poolId}`);

    return { success: true, ticketsClaimed: claimableTickets };
  } catch (error) {
    console.error('Error claiming staking rewards:', error);
    return {
      success: false,
      error: error.message || 'Failed to claim rewards'
    };
  }
}

/**
 * Get user's staking pools
 */
export async function getUserStakingPools(env: Env, userId: string): Promise<StakingPool[]> {
  try {
    const result = await env.DB.prepare(`
      SELECT * FROM staking_pools
      WHERE user_id = ?
      ORDER BY staked_at DESC
    `).bind(userId).all();

    return result.results as StakingPool[];
  } catch (error) {
    console.error('Error getting user staking pools:', error);
    return [];
  }
}

/**
 * Get staking statistics for user
 */
export async function getUserStakingStats(env: Env, userId: string) {
  try {
    const pools = await getUserStakingPools(env, userId);

    const totalStaked = pools
      .filter(p => p.status === 'active')
      .reduce((sum, p) => sum + p.pairAmount, 0);

    const totalClaimable = pools
      .filter(p => p.status === 'active')
      .reduce((sum, p) => sum + calculateClaimableTickets(p), 0);

    const claimsResult = await env.DB.prepare(`
      SELECT SUM(tickets_earned) as total_claimed
      FROM staking_claims
      WHERE user_id = ?
    `).bind(userId).first();

    const totalClaimed = claimsResult?.total_claimed || 0;

    return {
      totalStaked,
      totalClaimable,
      totalClaimed,
      activePools: pools.filter(p => p.status === 'active').length,
      highestTier: pools.length > 0 ? pools[0].tier : null
    };
  } catch (error) {
    console.error('Error getting staking stats:', error);
    return {
      totalStaked: 0,
      totalClaimable: 0,
      totalClaimed: 0,
      activePools: 0,
      highestTier: null
    };
  }
}