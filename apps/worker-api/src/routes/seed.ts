import { Hono } from 'hono';
import { generateId } from '../shared/index';
import type { Env } from '../types';

export const seedRouter = new Hono<{ Bindings: Env }>();

// Create conversions table
seedRouter.post('/init-conversions', async (c) => {
  try {
    console.log('Creating conversions table...');

    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS conversions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        ticket_amount INTEGER NOT NULL,
        sol_amount REAL NOT NULL,
        recipient_address TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        transaction_hash TEXT,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `).run();

    console.log('✅ Conversions table created');

    return c.json({
      success: true,
      message: 'Conversions table initialized successfully'
    });
  } catch (error) {
    console.error('Error creating conversions table:', error);
    return c.json({
      error: 'Failed to create conversions table',
      details: error.message
    }, 500);
  }
});

seedRouter.post('/quests', async (c) => {
  try {
    // Keep working quests + add new ones
    const quests = [
      {
        id: generateId(),
        slug: 'solana_prediction',
        title: 'Solana Price Prediction',
        description: 'Predict if SOL will go up or down in the next hour!',
        type: 'up_down_call',
        min_reward: 20,
        max_reward: 80,
        cooldown_minutes: 60,
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
        cooldown_minutes: 5,
        active: true
      },
      {
        id: generateId(),
        slug: 'memecoin_trivia',
        title: 'Memecoin Trivia',
        description: 'Test your knowledge of memecoins! Answer 5 questions correctly',
        type: 'trivia',
        min_reward: 15,
        max_reward: 40,
        cooldown_minutes: 90,
        active: true
      },
      {
        id: generateId(),
        slug: 'crypto_iq_challenge',
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
        min_reward: 1000,
        max_reward: 1000,
        cooldown_minutes: 1440, // 24 hours
        active: true
      },
      {
        id: generateId(),
        slug: 'whale_hunt',
        title: 'Whale Hunting',
        description: 'Predict which launchpad will have the most volume (Bonk, Pump.fun, Virtual Curve)',
        type: 'volume_prediction',
        min_reward: 30,
        max_reward: 120,
        cooldown_minutes: 120,
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
    // Use fixed IDs to prevent duplicates
    const factions = [
      {
        id: 'faction-usd1',
        name: 'USD1 Faction',
        symbol: 'USD1',
        description: 'The stability seekers - earn bonus rewards for USD-backed tokens',
        bonus_multiplier: 1.2,
        color: '#10B981' // green
      },
      {
        id: 'faction-bonk',
        name: 'BONK Faction',
        symbol: 'BONK',
        description: 'The meme warriors - double rewards for viral token success',
        bonus_multiplier: 1.5,
        color: '#F59E0B' // yellow/orange
      },
      {
        id: 'faction-pump',
        name: 'PUMP Faction',
        symbol: 'PUMP',
        description: 'The trend riders - maximum multipliers for trending tokens',
        bonus_multiplier: 2.0,
        color: '#EF4444' // red
      },
      {
        id: 'faction-bsc',
        name: 'BSC Faction',
        symbol: 'BSC',
        description: 'The builders - consistent rewards for ecosystem growth',
        bonus_multiplier: 1.3,
        color: '#8B5CF6' // purple
      }
    ];

    // Clear user faction associations temporarily
    await c.env.DB.prepare(`DELETE FROM user_factions`).run();

    // Clear existing factions with the same symbols
    for (const faction of factions) {
      await c.env.DB.prepare(`
        DELETE FROM factions WHERE symbol = ?
      `).bind(faction.symbol).run();
    }

    // Then insert the new ones with fixed IDs
    for (const faction of factions) {
      await c.env.DB.prepare(`
        INSERT INTO factions (id, name, symbol, description, bonus_multiplier, color)
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

// Create staking tables
seedRouter.post('/init-staking', async (c) => {
  try {
    console.log('Creating staking tables...');

    // Staking pools table
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS staking_pools (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        pair_amount REAL NOT NULL,
        staked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        unlock_at DATETIME NOT NULL,
        daily_ticket_rate INTEGER NOT NULL,
        last_claim_at DATETIME,
        tier TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `).run();

    // Staking claims table
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS staking_claims (
        id TEXT PRIMARY KEY,
        pool_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        tickets_earned INTEGER NOT NULL,
        claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pool_id) REFERENCES staking_pools (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `).run();

    // Premium subscriptions table
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS premium_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tier TEXT NOT NULL,
        pair_locked REAL NOT NULL,
        activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        auto_renew BOOLEAN DEFAULT true,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `).run();

    // Premium quests table
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS premium_quests (
        id TEXT PRIMARY KEY,
        quest_id TEXT NOT NULL,
        tier_required TEXT NOT NULL,
        multiplier REAL DEFAULT 2.0,
        exclusive BOOLEAN DEFAULT true,
        FOREIGN KEY (quest_id) REFERENCES quests (id)
      )
    `).run();

    console.log('✅ Staking and premium tables created');

    return c.json({
      success: true,
      message: 'Staking and premium tables initialized successfully'
    });
  } catch (error) {
    console.error('Error creating staking tables:', error);
    return c.json({
      error: 'Failed to create staking tables',
      details: error.message
    }, 500);
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

// Clean up duplicate factions
seedRouter.post('/cleanup-factions', async (c) => {
  try {
    // First remove users from factions
    await c.env.DB.prepare(`DELETE FROM user_factions`).run();

    // Then delete all existing factions
    await c.env.DB.prepare(`DELETE FROM factions`).run();

    return c.json({ success: true, message: 'Factions and user faction associations cleaned up successfully' });
  } catch (error: any) {
    console.error('Faction cleanup error:', error);
    return c.json({ error: 'Failed to cleanup factions', details: error.message }, 500);
  }
});

// Add missing USD1 faction
seedRouter.post('/add-usd1-faction', async (c) => {
  try {
    await c.env.DB.prepare(`
      INSERT INTO factions (id, name, symbol, description, bonus_multiplier, color)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      'faction-usd1',
      'USD1 Faction',
      'USD1',
      'The stability seekers - earn bonus rewards for USD-backed tokens',
      1.2,
      '#10B981'
    ).run();

    return c.json({ success: true, message: 'USD1 faction added successfully' });
  } catch (error: any) {
    console.error('USD1 faction add error:', error);
    return c.json({ error: 'Failed to add USD1 faction', details: error.message }, 500);
  }
});