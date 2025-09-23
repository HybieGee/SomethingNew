import { generateId } from '@raffle-arcade/shared';

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  RAFFLE_DO: DurableObjectNamespace;
  SERVER_SEED: string;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const cron = event.cron;

    try {
      if (cron === '*/5 * * * *') {
        await handleRaffleDraws(env);
      } else if (cron === '0 * * * *') {
        await createHourlyRaffles(env);
      } else if (cron === '0 0 * * *') {
        await handleDailyTasks(env);
      } else if (cron === '0 0 * * 1') {
        await handleWeeklyTasks(env);
      }
    } catch (error) {
      console.error('Scheduled task error:', error);
    }
  },
};

async function handleRaffleDraws(env: Env) {
  const now = new Date().toISOString();

  const readyRaffles = await env.DB.prepare(`
    SELECT id, winner_count FROM raffles
    WHERE status = 'active' AND draw_time <= ?
  `).bind(now).all();

  for (const raffle of readyRaffles.results) {
    try {
      await env.DB.prepare(`
        UPDATE raffles SET status = 'drawing' WHERE id = ?
      `).bind(raffle.id).run();

      const doId = env.RAFFLE_DO.idFromName(raffle.id as string);
      const doStub = env.RAFFLE_DO.get(doId);

      await doStub.fetch(new Request('http://do/init', {
        method: 'POST',
        body: JSON.stringify({
          raffleId: raffle.id,
          serverSeed: env.SERVER_SEED + raffle.id + now,
        }),
      }));

      const entries = await env.DB.prepare(`
        SELECT user_id, ticket_count FROM raffle_entries
        WHERE raffle_id = ?
      `).bind(raffle.id).all();

      for (const entry of entries.results) {
        await doStub.fetch(new Request('http://do/enter', {
          method: 'POST',
          body: JSON.stringify({
            userId: entry.user_id,
            ticketCount: entry.ticket_count,
          }),
        }));
      }

      await doStub.fetch(new Request('http://do/draw', {
        method: 'POST',
        body: JSON.stringify({ winnerCount: raffle.winner_count }),
      }));

      console.log(`Drew raffle ${raffle.id}`);
    } catch (error) {
      console.error(`Failed to draw raffle ${raffle.id}:`, error);

      await env.DB.prepare(`
        UPDATE raffles SET status = 'active' WHERE id = ?
      `).bind(raffle.id).run();
    }
  }
}

async function createHourlyRaffles(env: Env) {
  const now = new Date();
  const startTime = new Date(now.getTime() + 5 * 60 * 1000);
  const endTime = new Date(now.getTime() + 60 * 60 * 1000);
  const drawTime = new Date(now.getTime() + 65 * 60 * 1000);

  const raffleId = generateId();

  await env.DB.prepare(`
    INSERT INTO raffles (
      id, name, description, prize_pool, max_entries_per_user,
      ticket_cost, start_time, end_time, draw_time, status, winner_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?)
  `).bind(
    raffleId,
    `Hourly Jackpot #${Math.floor(Math.random() * 1000)}`,
    'Win big every hour!',
    1000,
    10,
    10,
    startTime.toISOString(),
    endTime.toISOString(),
    drawTime.toISOString(),
    3
  ).run();

  await env.DB.prepare(`
    UPDATE raffles SET status = 'active'
    WHERE status = 'upcoming' AND start_time <= ?
  `).bind(now.toISOString()).run();

  console.log(`Created hourly raffle ${raffleId}`);
}

async function handleDailyTasks(env: Env) {
  const now = new Date();

  await env.DB.prepare(`
    UPDATE users SET last_daily_claim_at = NULL
    WHERE date(last_daily_claim_at) < date('now')
  `).run();

  const dailyRaffleId = generateId();
  const startTime = new Date(now.getTime() + 60 * 60 * 1000);
  const endTime = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const drawTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await env.DB.prepare(`
    INSERT INTO raffles (
      id, name, description, prize_pool, max_entries_per_user,
      ticket_cost, start_time, end_time, draw_time, status, winner_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?)
  `).bind(
    dailyRaffleId,
    'Daily Mega Draw',
    'Huge daily prizes!',
    5000,
    25,
    25,
    startTime.toISOString(),
    endTime.toISOString(),
    drawTime.toISOString(),
    5
  ).run();

  await env.DB.prepare(`
    UPDATE boosts SET active = false
    WHERE end_time < datetime('now')
  `).run();

  console.log('Completed daily tasks');
}

async function handleWeeklyTasks(env: Env) {
  const now = new Date();

  const weeklyRaffleId = generateId();
  const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const endTime = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  const drawTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await env.DB.prepare(`
    INSERT INTO raffles (
      id, name, description, prize_pool, max_entries_per_user,
      ticket_cost, start_time, end_time, draw_time, status, winner_count
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?)
  `).bind(
    weeklyRaffleId,
    'Weekly Bonanza',
    'The biggest weekly raffle',
    25000,
    50,
    50,
    startTime.toISOString(),
    endTime.toISOString(),
    drawTime.toISOString(),
    10
  ).run();

  const currentSeason = await env.DB.prepare(`
    SELECT id, end_date FROM seasons WHERE active = true LIMIT 1
  `).first();

  if (currentSeason && new Date(currentSeason.end_date) < now) {
    await env.DB.prepare(`
      UPDATE seasons SET active = false WHERE id = ?
    `).bind(currentSeason.id).run();

    const newSeasonId = generateId();
    const seasonStart = now.toISOString();
    const seasonEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await env.DB.prepare(`
      INSERT INTO seasons (id, name, start_date, end_date, prize_pool, active)
      VALUES (?, ?, ?, ?, 0, true)
    `).bind(
      newSeasonId,
      `Season ${Math.floor(Math.random() * 100)}`,
      seasonStart,
      seasonEnd
    ).run();

    console.log(`Started new season ${newSeasonId}`);
  }

  console.log('Completed weekly tasks');
}