export function generateId(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function hashString(str: string, salt: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str + salt);
  return crypto.subtle.digest('SHA-256', data).then(buffer => {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }) as any;
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
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) / 2147483647;
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