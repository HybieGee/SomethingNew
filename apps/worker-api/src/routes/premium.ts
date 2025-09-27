import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimit';
import { z } from 'zod';
import type { Env } from '../types';
import {
  PREMIUM_TIERS,
  getPremiumTier,
  activatePremiumSubscription,
  getUserPremiumSubscription,
  hasPremiumAccess,
  cancelPremiumSubscription,
  getPremiumBenefits
} from '../services/premium';

const ActivatePremiumSchema = z.object({
  pairAmount: z.number().min(250).max(100000), // Minimum 250 $PAIR for basic, max 100k
});

export const premiumRouter = new Hono<{ Bindings: Env }>();

// Get premium tiers and pricing
premiumRouter.get('/tiers', async (c) => {
  return c.json({
    tiers: PREMIUM_TIERS,
    minimumPremium: PREMIUM_TIERS.basic.pairRequired
  });
});

// Get user's premium status and benefits
premiumRouter.get('/status', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const [subscription, benefits] = await Promise.all([
      getUserPremiumSubscription(c.env, user.id),
      getPremiumBenefits(c.env, user.id)
    ]);

    return c.json({
      hasPremium: !!subscription,
      subscription,
      benefits,
      availableTiers: PREMIUM_TIERS
    });
  } catch (error) {
    console.error('Error getting premium status:', error);
    return c.json({
      error: 'Failed to load premium status',
      details: error.message
    }, 500);
  }
});

// Activate premium subscription
premiumRouter.post('/activate', authMiddleware, generalRateLimit, async (c) => {
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const data = ActivatePremiumSchema.parse(body);

    // Check if amount meets minimum tier requirements
    const tier = getPremiumTier(data.pairAmount);
    if (!tier) {
      return c.json({
        error: 'Invalid premium amount',
        minimumRequired: PREMIUM_TIERS.basic.pairRequired
      }, 400);
    }

    // Activate premium subscription
    const result = await activatePremiumSubscription(
      c.env,
      user.id,
      user.solanaAddress,
      data.pairAmount,
      c.env.PAIR_TOKEN_MINT
    );

    if (!result.success) {
      return c.json({
        error: result.error
      }, 400);
    }

    const tierConfig = PREMIUM_TIERS[tier];

    return c.json({
      success: true,
      subscription: result.subscription,
      tier: {
        name: tier,
        displayName: tierConfig.name,
        color: tierConfig.color,
        benefits: tierConfig.benefits
      },
      message: `Successfully activated ${tierConfig.name} subscription with ${data.pairAmount} $PAIR`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Invalid request data',
        details: error.errors
      }, 400);
    }

    console.error('Premium activation error:', error);
    return c.json({
      error: 'Failed to activate premium subscription',
      details: error.message
    }, 500);
  }
});

// Cancel premium subscription
premiumRouter.post('/cancel', authMiddleware, generalRateLimit, async (c) => {
  const user = c.get('user');

  try {
    const result = await cancelPremiumSubscription(c.env, user.id);

    if (!result.success) {
      return c.json({
        error: result.error
      }, 400);
    }

    return c.json({
      success: true,
      message: 'Premium subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Premium cancellation error:', error);
    return c.json({
      error: 'Failed to cancel premium subscription',
      details: error.message
    }, 500);
  }
});

// Get exclusive premium quests
premiumRouter.get('/quests', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const subscription = await getUserPremiumSubscription(c.env, user.id);

    if (!subscription) {
      return c.json({
        error: 'Premium subscription required',
        message: 'You need an active premium subscription to access exclusive quests'
      }, 403);
    }

    // Get premium quests available for user's tier
    const premiumQuests = await c.env.DB.prepare(`
      SELECT q.*, pq.tier_required, pq.multiplier, pq.exclusive
      FROM quests q
      JOIN premium_quests pq ON q.id = pq.quest_id
      WHERE pq.tier_required IN ('basic', 'premium', 'elite')
      AND q.active = true
      ORDER BY pq.tier_required DESC, q.name ASC
    `).all();

    // Filter quests based on user's tier
    const tierConfig = PREMIUM_TIERS[subscription.tier];
    const accessibleQuests = premiumQuests.results.filter(quest => {
      const requiredTier = quest.tier_required;
      const userTierValue = getTierValue(subscription.tier);
      const requiredTierValue = getTierValue(requiredTier);
      return userTierValue >= requiredTierValue;
    });

    return c.json({
      quests: accessibleQuests,
      userTier: subscription.tier,
      questMultiplier: tierConfig.benefits.questMultiplier
    });
  } catch (error) {
    console.error('Error getting premium quests:', error);
    return c.json({
      error: 'Failed to fetch premium quests'
    }, 500);
  }
});

// Get premium dashboard with benefits summary
premiumRouter.get('/dashboard', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const benefits = await getPremiumBenefits(c.env, user.id);

    if (!benefits) {
      return c.json({
        hasPremium: false,
        availableTiers: PREMIUM_TIERS,
        message: 'No active premium subscription'
      });
    }

    // Get usage statistics
    const questCompletions = await c.env.DB.prepare(`
      SELECT COUNT(*) as count, SUM(tickets_earned) as total_tickets
      FROM quest_completions
      WHERE user_id = ? AND completed_at >= ?
    `).bind(user.id, benefits.activatedAt).first();

    const conversions = await c.env.DB.prepare(`
      SELECT COUNT(*) as count, SUM(sol_amount) as total_sol
      FROM conversions
      WHERE user_id = ? AND status = 'completed' AND created_at >= ?
    `).bind(user.id, benefits.activatedAt).first();

    return c.json({
      hasPremium: true,
      benefits,
      usage: {
        questsCompleted: questCompletions?.count || 0,
        bonusTicketsEarned: Math.floor((questCompletions?.total_tickets || 0) * (benefits.questMultiplier - 1)),
        conversionsCompleted: conversions?.count || 0,
        bonusSOLEarned: (conversions?.total_sol || 0) * benefits.conversionBonus
      },
      availableUpgrades: getAvailableUpgrades(benefits.tier)
    });
  } catch (error) {
    console.error('Error getting premium dashboard:', error);
    return c.json({
      error: 'Failed to load premium dashboard'
    }, 500);
  }
});

/**
 * Helper function to get tier value for comparison
 */
function getTierValue(tier: string): number {
  const tierValues = { basic: 1, premium: 2, elite: 3 };
  return tierValues[tier] || 0;
}

/**
 * Helper function to get available tier upgrades
 */
function getAvailableUpgrades(currentTier: string) {
  const tiers = Object.entries(PREMIUM_TIERS);
  const currentTierValue = getTierValue(currentTier);

  return tiers
    .filter(([, config]) => getTierValue(config.name.toLowerCase()) > currentTierValue)
    .map(([tierKey, config]) => ({
      tier: tierKey,
      name: config.name,
      pairRequired: config.pairRequired,
      benefits: config.benefits
    }));
}