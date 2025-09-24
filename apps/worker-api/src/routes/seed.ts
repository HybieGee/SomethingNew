import { Hono } from 'hono';
import { generateId } from '../shared/index';
import type { Env } from '../types';

export const seedRouter = new Hono<{ Bindings: Env }>();

seedRouter.post('/quests', async (c) => {
  try {
    // Add diverse quest types
    const quests = [
      {
        id: generateId(),
        slug: 'solana_prediction',
        title: 'SOL Price Oracle',
        description: 'Predict if Solana will go up or down in the next hour!',
        type: 'up_down_call',
        min_reward: 20,
        max_reward: 80,
        cooldown_minutes: 60,
        active: true
      },
      {
        id: generateId(),
        slug: 'tap_challenge',
        title: 'Lightning Reflexes',
        description: 'Test your speed! Tap as fast as you can in 10 seconds',
        type: 'tap_challenge',
        min_reward: 5,
        max_reward: 25,
        cooldown_minutes: 45,
        active: true
      },
      {
        id: generateId(),
        slug: 'memecoin_trivia',
        title: 'Crypto IQ Challenge',
        description: 'Test your crypto knowledge! Answer 5 questions about DeFi & memecoins',
        type: 'trivia',
        min_reward: 15,
        max_reward: 40,
        cooldown_minutes: 90,
        active: true
      },
      {
        id: generateId(),
        slug: 'faction_loyalty',
        title: 'Faction Loyalty Bonus',
        description: 'Stay loyal to your faction for 24 hours to earn bonus tickets!',
        type: 'loyalty_streak',
        min_reward: 100,
        max_reward: 200,
        cooldown_minutes: 1440, // 24 hours
        active: true
      },
      {
        id: generateId(),
        slug: 'whale_hunt',
        title: 'Whale Hunting',
        description: 'Spot the biggest wallet movements! Predict which token will have highest volume',
        type: 'volume_prediction',
        min_reward: 30,
        max_reward: 120,
        cooldown_minutes: 120,
        active: true
      },
      {
        id: generateId(),
        slug: 'diamond_hands',
        title: 'Diamond Hands Test',
        description: 'Hold your prediction for the full duration without changing it!',
        type: 'hold_challenge',
        min_reward: 50,
        max_reward: 150,
        cooldown_minutes: 180,
        active: true
      },
      {
        id: generateId(),
        slug: 'faction_battle',
        title: 'Faction Battle Arena',
        description: 'Compete against other factions in this hourly showdown!',
        type: 'faction_vs_faction',
        min_reward: 40,
        max_reward: 200,
        cooldown_minutes: 60,
        active: true
      },
      {
        id: generateId(),
        slug: 'streak_master',
        title: 'Streak Master',
        description: 'Complete 3 different quests in a row without failing any!',
        type: 'quest_streak',
        min_reward: 75,
        max_reward: 300,
        cooldown_minutes: 240,
        active: true
      },
      {
        id: generateId(),
        slug: 'market_timing',
        title: 'Market Timing Expert',
        description: 'Predict the exact minute when SOL will hit a new hourly high/low!',
        type: 'precise_timing',
        min_reward: 60,
        max_reward: 250,
        cooldown_minutes: 120,
        active: true
      },
      {
        id: generateId(),
        slug: 'social_prophet',
        title: 'Social Media Prophet',
        description: 'Predict which crypto will trend most on social media in the next 2 hours!',
        type: 'social_prediction',
        min_reward: 35,
        max_reward: 140,
        cooldown_minutes: 150,
        active: true
      }
    ];

    for (const quest of quests) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO quests (id, slug, name, description, type, min_reward, max_reward, cooldown_minutes, active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        quest.id,
        quest.slug,
        quest.title, // title maps to name in DB
        quest.description,
        quest.type,
        quest.min_reward,
        quest.max_reward,
        quest.cooldown_minutes,
        quest.active
      ).run();
    }

    return c.json({ success: true, message: 'Quests seeded successfully', count: quests.length });
  } catch (error: any) {
    console.error('Quest seeding error:', error);
    return c.json({ error: 'Failed to seed quests', details: error.message }, 500);
  }
});

seedRouter.post('/factions', async (c) => {
  try {
    const factions = [
      {
        id: generateId(),
        name: 'USD1 Faction',
        symbol: 'USD1',
        description: 'The stability seekers - earn bonus rewards for USD-backed tokens',
        bonus_multiplier: 1.2,
        color: '#10B981' // green
      },
      {
        id: generateId(),
        name: 'BONK Faction',
        symbol: 'BONK',
        description: 'The meme warriors - double rewards for viral token success',
        bonus_multiplier: 1.5,
        color: '#F59E0B' // yellow/orange
      },
      {
        id: generateId(),
        name: 'PUMP Faction',
        symbol: 'PUMP',
        description: 'The trend riders - maximum multipliers for trending tokens',
        bonus_multiplier: 2.0,
        color: '#EF4444' // red
      },
      {
        id: generateId(),
        name: 'BSC Faction',
        symbol: 'BSC',
        description: 'The builders - consistent rewards for ecosystem growth',
        bonus_multiplier: 1.3,
        color: '#8B5CF6' // purple
      }
    ];

    for (const faction of factions) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO factions (id, name, symbol, description, bonus_multiplier, color)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        faction.id,
        faction.name,
        faction.symbol,
        faction.description,
        faction.bonus_multiplier,
        faction.color
      ).run();
    }

    return c.json({ success: true, message: 'Factions seeded successfully', count: factions.length });
  } catch (error: any) {
    console.error('Faction seeding error:', error);
    return c.json({ error: 'Failed to seed factions', details: error.message }, 500);
  }
});

seedRouter.post('/raffles', async (c) => {
  try {
    // Clear existing raffles first
    await c.env.DB.prepare('DELETE FROM raffles').run();

    const raffles = [
      {
        id: generateId(),
        name: 'Hourly Jackpot',
        description: 'Win big every hour! The more tickets you enter, the higher your chances',
        prize_pool: 5000,
        max_entries_per_user: 10,
        ticket_cost: 10,
        duration_minutes: 60 // 1 hour
      },
      {
        id: generateId(),
        name: 'Daily Mega Prize',
        description: 'Massive daily rewards for the luckiest players',
        prize_pool: 25000,
        max_entries_per_user: 50,
        ticket_cost: 25,
        duration_minutes: 1440 // 24 hours
      },
      {
        id: generateId(),
        name: 'Speed Raffle',
        description: 'Quick 15-minute raffle for instant gratification',
        prize_pool: 1000,
        max_entries_per_user: 5,
        ticket_cost: 5,
        duration_minutes: 15 // 15 minutes
      }
    ];

    const now = new Date();

    for (const raffle of raffles) {
      const startTime = now;
      const endTime = new Date(now.getTime() + raffle.duration_minutes * 60 * 1000);
      const drawTime = new Date(endTime.getTime() + 5 * 60 * 1000);

      await c.env.DB.prepare(`
        INSERT INTO raffles (
          id, name, description, prize_pool, max_entries_per_user, ticket_cost,
          start_time, end_time, draw_time, status, winner_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        raffle.id,
        raffle.name,
        raffle.description,
        raffle.prize_pool,
        raffle.max_entries_per_user,
        raffle.ticket_cost,
        startTime.toISOString(),
        endTime.toISOString(),
        drawTime.toISOString(),
        'active',
        1
      ).run();
    }

    return c.json({
      success: true,
      message: 'Raffles seeded successfully',
      count: raffles.length
    });
  } catch (error: any) {
    console.error('Raffle seeding error:', error);
    return c.json({ error: 'Failed to seed raffles', details: error.message }, 500);
  }
});