import crypto from 'crypto';

export function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateRecoveryCode(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashString(str: string, salt: string): string {
  return crypto.createHash('sha256').update(str + salt).digest('hex');
}

export function calculateStreakBonus(days: number): number {
  return Math.min(Math.pow(1.1, days), 3);
}

export function isWithinTimeWindow(startTime: string, endTime: string): boolean {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  return now >= start && now <= end;
}

export function determinicRandom(seed: string): number {
  const hash = crypto.createHash('sha256').update(seed).digest();
  return hash.readUInt32BE(0) / 0xFFFFFFFF;
}

export function shuffleArray<T>(array: T[], seed: string): T[] {
  const shuffled = [...array];
  let currentIndex = shuffled.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(determinicRandom(seed + currentIndex) * currentIndex);
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }

  return shuffled;
}

export function calculateRaffleWinners(
  entries: Array<{ userId: string; ticketCount: number }>,
  winnerCount: number,
  serverSeed: string,
  raffleId: string
): string[] {
  const pool: string[] = [];
  entries.forEach(entry => {
    for (let i = 0; i < entry.ticketCount; i++) {
      pool.push(entry.userId);
    }
  });

  const shuffled = shuffleArray(pool, serverSeed + raffleId);
  const winners = new Set<string>();

  for (const userId of shuffled) {
    winners.add(userId);
    if (winners.size >= winnerCount) break;
  }

  return Array.from(winners);
}

export function formatTimeRemaining(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function calculateDailyReward(baseReward: number, streakDays: number): number {
  const streakBonus = calculateStreakBonus(streakDays);
  return Math.floor(baseReward * streakBonus);
}