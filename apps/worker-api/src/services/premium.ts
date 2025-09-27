import { generateId } from '../shared/index';
import type { Env } from '../types';
import { checkPairTokenEligibility } from './solana';

// Premium tier configuration
export const PREMIUM_TIERS = {
  basic: {
    pairRequired: 250,
    name: 'Basic Premium',
    color: '#4F46E5',
    benefits: {
      questMultiplier: 1.5,
      dailyTicketBonus: 50,
      raffleEntryDiscount: 0.1,
      conversionBonus: 0.0,
      exclusiveQuests: ['premium_trivia']
    }
  },
  premium: {
    pairRequired: 1000,
    name: 'Premium',
    color: '#7C3AED',
    benefits: {
      questMultiplier: 2.0,
      dailyTicketBonus: 150,
      raffleEntryDiscount: 0.25,
      conversionBonus: 0.05, // 5% bonus SOL
      exclusiveQuests: ['whale_prediction', 'insider_intel']
    }
  },
  elite: {
    pairRequired: 5000,
    name: 'Elite',
    color: '#F59E0B',
    benefits: {
      questMultiplier: 3.0,
      dailyTicketBonus: 500,
      raffleEntryDiscount: 0.5,
      conversionBonus: 0.15, // 15% bonus SOL
      exclusiveQuests: ['elite_alpha', 'dev_challenges']
    }
  }
} as const;

export type PremiumTier = keyof typeof PREMIUM_TIERS;

export interface PremiumSubscription {
  id: string;
  userId: string;
  tier: PremiumTier;
  pairLocked: number;
  activatedAt: string;
  expiresAt?: string;
  autoRenew: boolean;
  status: 'active' | 'expired' | 'cancelled';
}

/**
 * Get premium tier based on $PAIR amount
 */
export function getPremiumTier(amount: number): PremiumTier | null {
  const tiers = Object.entries(PREMIUM_TIERS) as [PremiumTier, typeof PREMIUM_TIERS[PremiumTier]][];

  // Sort by pairRequired descending to get highest tier first
  const sortedTiers = tiers.sort((a, b) => b[1].pairRequired - a[1].pairRequired);

  for (const [tier, config] of sortedTiers) {
    if (amount >= config.pairRequired) {
      return tier;
    }
  }

  return null;
}

/**
 * Activate premium subscription
 */
export async function activatePremiumSubscription(
  env: Env,
  userId: string,
  userWalletAddress: string,
  pairAmount: number,
  pairTokenMint: string
): Promise<{ success: boolean; subscription?: PremiumSubscription; error?: string }> {
  try {
    // Verify user has enough $PAIR tokens
    const eligibility = await checkPairTokenEligibility(userWalletAddress, 0, pairTokenMint);

    if (eligibility.balance < pairAmount) {
      return {
        success: false,
        error: `Insufficient $PAIR balance. Required: ${pairAmount}, Available: ${eligibility.balance}`
      };
    }

    // Determine premium tier
    const tier = getPremiumTier(pairAmount);
    if (!tier) {
      return {
        success: false,
        error: `Minimum premium amount is ${PREMIUM_TIERS.basic.pairRequired} $PAIR`
      };
    }

    const config = PREMIUM_TIERS[tier];

    // Check if user already has active subscription
    const existingResult = await env.DB.prepare(`
      SELECT * FROM premium_subscriptions
      WHERE user_id = ? AND status = 'active'
    `).bind(userId).first();

    if (existingResult) {
      return {
        success: false,
        error: 'User already has an active premium subscription'
      };
    }

    const subscriptionId = generateId();
    const now = new Date();

    const subscription: PremiumSubscription = {
      id: subscriptionId,
      userId,
      tier,
      pairLocked: pairAmount,
      activatedAt: now.toISOString(),
      autoRenew: true,
      status: 'active'
    };

    // Insert premium subscription into database
    await env.DB.prepare(`
      INSERT INTO premium_subscriptions (
        id, user_id, tier, pair_locked, activated_at, auto_renew, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      subscriptionId,
      userId,
      tier,
      pairAmount,
      now.toISOString(),
      true,
      'active'
    ).run();

    console.log(`✅ Activated ${tier} premium subscription for user ${userId}: ${pairAmount} $PAIR`);

    return { success: true, subscription };
  } catch (error) {
    console.error('Error activating premium subscription:', error);
    return {
      success: false,
      error: error.message || 'Failed to activate premium subscription'
    };
  }
}

/**
 * Get user's premium subscription
 */
export async function getUserPremiumSubscription(env: Env, userId: string): Promise<PremiumSubscription | null> {
  try {
    const result = await env.DB.prepare(`
      SELECT * FROM premium_subscriptions
      WHERE user_id = ? AND status = 'active'
      ORDER BY activated_at DESC
      LIMIT 1
    `).bind(userId).first();

    return result as PremiumSubscription | null;
  } catch (error) {
    console.error('Error getting premium subscription:', error);
    return null;
  }
}

/**
 * Check if user has premium tier access
 */
export async function hasPremiumAccess(env: Env, userId: string, requiredTier?: PremiumTier): Promise<boolean> {
  try {
    const subscription = await getUserPremiumSubscription(env, userId);

    if (!subscription) {
      return false;
    }

    // If no specific tier required, any premium is enough
    if (!requiredTier) {
      return true;
    }

    // Check if user's tier meets requirement
    const userTierValue = getTierValue(subscription.tier);
    const requiredTierValue = getTierValue(requiredTier);

    return userTierValue >= requiredTierValue;
  } catch (error) {
    console.error('Error checking premium access:', error);
    return false;
  }
}

/**
 * Get tier value for comparison (higher number = higher tier)
 */
function getTierValue(tier: PremiumTier): number {
  const tierValues = { basic: 1, premium: 2, elite: 3 };
  return tierValues[tier];
}

/**
 * Apply premium multiplier to rewards
 */
export async function applyPremiumMultiplier(
  env: Env,
  userId: string,
  baseReward: number
): Promise<number> {
  try {
    const subscription = await getUserPremiumSubscription(env, userId);

    if (!subscription) {
      return baseReward;
    }

    const config = PREMIUM_TIERS[subscription.tier];
    return Math.floor(baseReward * config.benefits.questMultiplier);
  } catch (error) {
    console.error('Error applying premium multiplier:', error);
    return baseReward;
  }
}

/**
 * Get conversion bonus for premium users
 */
export async function getPremiumConversionBonus(env: Env, userId: string): Promise<number> {
  try {
    const subscription = await getUserPremiumSubscription(env, userId);

    if (!subscription) {
      return 0;
    }

    const config = PREMIUM_TIERS[subscription.tier];
    return config.benefits.conversionBonus;
  } catch (error) {
    console.error('Error getting conversion bonus:', error);
    return 0;
  }
}

/**
 * Get raffle entry discount for premium users
 */
export async function getPremiumRaffleDiscount(env: Env, userId: string): Promise<number> {
  try {
    const subscription = await getUserPremiumSubscription(env, userId);

    if (!subscription) {
      return 0;
    }

    const config = PREMIUM_TIERS[subscription.tier];
    return config.benefits.raffleEntryDiscount;
  } catch (error) {
    console.error('Error getting raffle discount:', error);
    return 0;
  }
}

/**
 * Cancel premium subscription
 */
export async function cancelPremiumSubscription(
  env: Env,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await env.DB.prepare(`
      UPDATE premium_subscriptions
      SET status = 'cancelled', auto_renew = false
      WHERE user_id = ? AND status = 'active'
    `).bind(userId).run();

    if (result.changes === 0) {
      return {
        success: false,
        error: 'No active premium subscription found'
      };
    }

    console.log(`✅ Cancelled premium subscription for user ${userId}`);

    return { success: true };
  } catch (error) {
    console.error('Error cancelling premium subscription:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel subscription'
    };
  }
}

/**
 * Get premium benefits summary for user
 */
export async function getPremiumBenefits(env: Env, userId: string) {
  try {
    const subscription = await getUserPremiumSubscription(env, userId);

    if (!subscription) {
      return null;
    }

    const config = PREMIUM_TIERS[subscription.tier];

    return {
      tier: subscription.tier,
      tierName: config.name,
      tierColor: config.color,
      questMultiplier: config.benefits.questMultiplier,
      dailyTicketBonus: config.benefits.dailyTicketBonus,
      raffleDiscount: config.benefits.raffleEntryDiscount,
      conversionBonus: config.benefits.conversionBonus,
      exclusiveQuests: config.benefits.exclusiveQuests,
      pairLocked: subscription.pairLocked,
      activatedAt: subscription.activatedAt
    };
  } catch (error) {
    console.error('Error getting premium benefits:', error);
    return null;
  }
}