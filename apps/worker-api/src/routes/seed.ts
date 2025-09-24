import { Hono } from 'hono';
import { generateId } from '../shared/index';
import type { Env } from '../types';

export const seedRouter = new Hono<{ Bindings: Env }>();

seedRouter.post('/quests', async (c) => {
  try {
    // Add sample quests
    const quests = [
      {
        id: generateId(),
        slug: 'daily_login',
        title: 'Daily Login Bonus',
        description: 'Claim your daily reward and build your streak!',
        type: 'tap_challenge',
        min_reward: 50,
        max_reward: 100,
        cooldown_minutes: 1440, // 24 hours
        active: true
      },
      {
        id: generateId(),
        slug: 'tap_challenge',
        title: 'Tap Challenge',
        description: 'Test your speed! Tap as fast as you can in 10 seconds',
        type: 'tap_challenge',
        min_reward: 5,
        max_reward: 25,
        cooldown_minutes: 60, // 1 hour
        active: true
      },
      {
        id: generateId(),
        slug: 'price_prediction',
        title: 'Price Prediction',
        description: 'Predict if the crypto price will go up or down in 60 seconds',
        type: 'up_down_call',
        min_reward: 10,
        max_reward: 50,
        cooldown_minutes: 120, // 2 hours
        active: true
      },
      {
        id: generateId(),
        slug: 'crypto_trivia',
        title: 'Crypto Trivia',
        description: 'Answer 5 questions about cryptocurrency and blockchain',
        type: 'trivia',
        min_reward: 15,
        max_reward: 40,
        cooldown_minutes: 180, // 3 hours
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

// Note: Factions table doesn't exist yet - will be created later for faction system

seedRouter.post('/raffles', async (c) => {
  try {
    // Create an active raffle matching actual schema
    const raffleId = generateId();
    const now = new Date();
    const startTime = new Date(now.getTime() - 10 * 60 * 1000); // started 10 minutes ago
    const endTime = new Date(now.getTime() + 50 * 60 * 1000); // ends in 50 minutes
    const drawTime = new Date(endTime.getTime() + 5 * 60 * 1000); // draw 5 minutes after end

    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO raffles (
        id, name, description, prize_pool, max_entries_per_user, ticket_cost,
        start_time, end_time, draw_time, status, winner_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      raffleId,
      'Hourly Raffle',
      'Win big! Enter with tickets for a chance to multiply your winnings',
      5000, // 5000 tickets prize pool
      10, // max 10 entries per user
      10, // 10 tickets per entry
      startTime.toISOString(),
      endTime.toISOString(),
      drawTime.toISOString(),
      'active',
      1 // 1 winner
    ).run();

    return c.json({
      success: true,
      message: 'Raffle created successfully',
      raffleId,
      prizePool: 5000,
      endTime: endTime.toISOString()
    });
  } catch (error: any) {
    console.error('Raffle seeding error:', error);
    return c.json({ error: 'Failed to seed raffle', details: error.message }, 500);
  }
});