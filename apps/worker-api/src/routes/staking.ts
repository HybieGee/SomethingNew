import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimit';
import { z } from 'zod';
import type { Env } from '../types';
import {
  STAKING_TIERS,
  getStakingTier,
  createStakingPool,
  claimStakingRewards,
  getUserStakingPools,
  getUserStakingStats
} from '../services/staking';

const StakeRequestSchema = z.object({
  pairAmount: z.number().min(100).max(100000), // Minimum 100 $PAIR, max 100k
});

const ClaimRequestSchema = z.object({
  poolId: z.string().min(1)
});

export const stakingRouter = new Hono<{ Bindings: Env }>();

// Get staking tiers and configuration
stakingRouter.get('/tiers', async (c) => {
  return c.json({
    tiers: STAKING_TIERS,
    minimumStake: STAKING_TIERS.bronze.minAmount
  });
});

// Get user's staking dashboard
stakingRouter.get('/dashboard', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const [pools, stats] = await Promise.all([
      getUserStakingPools(c.env, user.id),
      getUserStakingStats(c.env, user.id)
    ]);

    return c.json({
      pools,
      stats,
      tiers: STAKING_TIERS
    });
  } catch (error) {
    console.error('Error getting staking dashboard:', error);
    return c.json({
      error: 'Failed to load staking dashboard',
      details: error.message
    }, 500);
  }
});

// Create new staking pool
stakingRouter.post('/stake', authMiddleware, generalRateLimit, async (c) => {
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const data = StakeRequestSchema.parse(body);

    // Check if amount meets minimum tier requirements
    const tier = getStakingTier(data.pairAmount);
    if (!tier) {
      return c.json({
        error: 'Invalid staking amount',
        minimumRequired: STAKING_TIERS.bronze.minAmount
      }, 400);
    }

    // Create staking pool
    const result = await createStakingPool(
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

    const tierConfig = STAKING_TIERS[tier];

    return c.json({
      success: true,
      pool: result.pool,
      tier: {
        name: tier,
        dailyTickets: tierConfig.dailyTickets,
        lockDays: tierConfig.lockDays,
        color: tierConfig.color
      },
      message: `Successfully staked ${data.pairAmount} $PAIR in ${tierConfig.name} tier`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Invalid request data',
        details: error.errors
      }, 400);
    }

    console.error('Staking error:', error);
    return c.json({
      error: 'Failed to create staking pool',
      details: error.message
    }, 500);
  }
});

// Claim rewards from staking pool
stakingRouter.post('/claim', authMiddleware, generalRateLimit, async (c) => {
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const data = ClaimRequestSchema.parse(body);

    const result = await claimStakingRewards(c.env, user.id, data.poolId);

    if (!result.success) {
      return c.json({
        error: result.error
      }, 400);
    }

    return c.json({
      success: true,
      ticketsClaimed: result.ticketsClaimed,
      message: `Successfully claimed ${result.ticketsClaimed} tickets from staking rewards`
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({
        error: 'Invalid request data',
        details: error.errors
      }, 400);
    }

    console.error('Claim error:', error);
    return c.json({
      error: 'Failed to claim staking rewards',
      details: error.message
    }, 500);
  }
});

// Claim all available rewards
stakingRouter.post('/claim-all', authMiddleware, generalRateLimit, async (c) => {
  const user = c.get('user');

  try {
    const pools = await getUserStakingPools(c.env, user.id);
    const activePools = pools.filter(p => p.status === 'active');

    let totalClaimed = 0;
    const results = [];

    for (const pool of activePools) {
      const result = await claimStakingRewards(c.env, user.id, pool.id);
      if (result.success && result.ticketsClaimed > 0) {
        totalClaimed += result.ticketsClaimed;
        results.push({
          poolId: pool.id,
          tier: pool.tier,
          ticketsClaimed: result.ticketsClaimed
        });
      }
    }

    if (totalClaimed === 0) {
      return c.json({
        error: 'No rewards available to claim'
      }, 400);
    }

    return c.json({
      success: true,
      totalTicketsClaimed: totalClaimed,
      claimedPools: results,
      message: `Successfully claimed ${totalClaimed} tickets from ${results.length} staking pools`
    });
  } catch (error) {
    console.error('Claim all error:', error);
    return c.json({
      error: 'Failed to claim all rewards',
      details: error.message
    }, 500);
  }
});

// Get staking history and statistics
stakingRouter.get('/history', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const claimsResult = await c.env.DB.prepare(`
      SELECT sc.*, sp.tier, sp.pair_amount
      FROM staking_claims sc
      JOIN staking_pools sp ON sc.pool_id = sp.id
      WHERE sc.user_id = ?
      ORDER BY sc.claimed_at DESC
      LIMIT 50
    `).bind(user.id).all();

    return c.json({
      claims: claimsResult.results
    });
  } catch (error) {
    console.error('Error getting staking history:', error);
    return c.json({
      error: 'Failed to fetch staking history'
    }, 500);
  }
});