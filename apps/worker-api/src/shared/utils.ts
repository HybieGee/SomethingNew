export function generateId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function generateRecoveryCode(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function hashString(str: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str + salt);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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

export async function determinicRandom(seed: string): Promise<number> {
  const encoder = new TextEncoder();
  const data = encoder.encode(seed);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const array = new Uint8Array(hash);
  const view = new DataView(array.buffer);
  return view.getUint32(0, false) / 0xFFFFFFFF;
}

export async function shuffleArray<T>(array: T[], seed: string): Promise<T[]> {
  const shuffled = [...array];
  let currentIndex = shuffled.length;

  while (currentIndex !== 0) {
    const randomValue = await determinicRandom(seed + currentIndex);
    const randomIndex = Math.floor(randomValue * currentIndex);
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }

  return shuffled;
}

export async function calculateRaffleWinners(
  entries: Array<{ userId: string; ticketCount: number }>,
  winnerCount: number,
  serverSeed: string,
  raffleId: string
): Promise<string[]> {
  const pool: string[] = [];
  entries.forEach(entry => {
    for (let i = 0; i < entry.ticketCount; i++) {
      pool.push(entry.userId);
    }
  });

  const shuffled = await shuffleArray(pool, serverSeed + raffleId);
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