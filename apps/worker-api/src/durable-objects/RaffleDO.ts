import { calculateRaffleWinners } from './shared';

export class RaffleDO {
  private state: DurableObjectState;
  private env: any;
  private entries: Map<string, { userId: string; ticketCount: number }> = new Map();
  private raffleId: string = '';
  private serverSeed: string = '';

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/init' && request.method === 'POST') {
        const { raffleId, serverSeed } = await request.json();
        this.raffleId = raffleId;
        this.serverSeed = serverSeed;
        await this.state.storage.put('raffleId', raffleId);
        await this.state.storage.put('serverSeed', serverSeed);
        await this.state.storage.put('entries', []);
        return new Response(JSON.stringify({ success: true }));
      }

      if (path === '/enter' && request.method === 'POST') {
        const { userId, ticketCount } = await request.json();

        const existingEntry = this.entries.get(userId);
        if (existingEntry) {
          existingEntry.ticketCount += ticketCount;
        } else {
          this.entries.set(userId, { userId, ticketCount });
        }

        const entriesArray = Array.from(this.entries.values());
        await this.state.storage.put('entries', entriesArray);

        return new Response(JSON.stringify({
          success: true,
          totalEntries: this.entries.size,
          userTickets: this.entries.get(userId)?.ticketCount
        }));
      }

      if (path === '/draw' && request.method === 'POST') {
        const { winnerCount } = await request.json();

        const raffleId = await this.state.storage.get('raffleId') as string;
        const serverSeed = await this.state.storage.get('serverSeed') as string;
        const entries = await this.state.storage.get('entries') as any[] || [];

        if (entries.length === 0) {
          return new Response(JSON.stringify({ error: 'No entries' }), { status: 400 });
        }

        const winners = calculateRaffleWinners(entries, winnerCount, serverSeed, raffleId);

        await this.env.DB.prepare(`
          UPDATE raffles
          SET status = 'completed',
              winners = ?,
              server_seed = ?
          WHERE id = ?
        `).bind(
          JSON.stringify(winners),
          serverSeed,
          raffleId
        ).run();

        const prizePool = await this.env.DB.prepare(
          'SELECT prize_pool FROM raffles WHERE id = ?'
        ).bind(raffleId).first();

        const prizePerWinner = Math.floor(prizePool.prize_pool / winners.length);

        for (const winnerId of winners) {
          await this.env.DB.prepare(`
            UPDATE users SET tickets = tickets + ? WHERE id = ?
          `).bind(prizePerWinner, winnerId).run();

          await this.env.DB.prepare(`
            INSERT INTO earn_log (id, user_id, amount, source, metadata)
            VALUES (?, ?, ?, 'raffle_win', ?)
          `).bind(
            crypto.randomUUID(),
            winnerId,
            prizePerWinner,
            JSON.stringify({ raffleId, position: winners.indexOf(winnerId) + 1 })
          ).run();
        }

        return new Response(JSON.stringify({
          success: true,
          winners,
          prizePerWinner
        }));
      }

      if (path === '/status' && request.method === 'GET') {
        const entries = await this.state.storage.get('entries') as any[] || [];
        return new Response(JSON.stringify({
          raffleId: await this.state.storage.get('raffleId'),
          totalEntries: entries.length,
          totalTickets: entries.reduce((sum, e) => sum + e.ticketCount, 0)
        }));
      }

      return new Response('Not found', { status: 404 });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }
}