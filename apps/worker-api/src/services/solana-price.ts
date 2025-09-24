// Solana price tracking service
interface PriceData {
  price: number;
  timestamp: number;
}

export async function getSolanaPrice(): Promise<number> {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await response.json() as { solana: { usd: number } };
    return data.solana.usd;
  } catch (error) {
    console.error('Failed to fetch Solana price:', error);
    // Fallback to a default price if API fails
    return 50.0;
  }
}

export async function storePricePrediction(
  env: any,
  userId: string,
  questId: string,
  prediction: 'up' | 'down',
  currentPrice: number
): Promise<void> {
  const predictionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  await env.DB.prepare(`
    INSERT INTO price_predictions (id, user_id, quest_id, prediction, initial_price, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    predictionId,
    userId,
    questId,
    prediction,
    currentPrice,
    expiresAt.toISOString()
  ).run();

  // Store in KV for quick access
  await env.CACHE.put(
    `prediction:${userId}:${questId}`,
    JSON.stringify({
      predictionId,
      prediction,
      initialPrice: currentPrice,
      expiresAt: expiresAt.toISOString()
    }),
    { expirationTtl: 3600 } // 1 hour
  );
}

export async function checkPredictionResult(
  env: any,
  userId: string,
  questId: string
): Promise<{ success: boolean; reward?: number; message: string }> {
  const predictionData = await env.CACHE.get(`prediction:${userId}:${questId}`, 'json');

  if (!predictionData) {
    return { success: false, message: 'No active prediction found' };
  }

  const expiresAt = new Date(predictionData.expiresAt);
  const now = new Date();

  if (now < expiresAt) {
    const remainingMinutes = Math.ceil((expiresAt.getTime() - now.getTime()) / 60000);
    return { success: false, message: `Prediction still active. Check back in ${remainingMinutes} minutes` };
  }

  const currentPrice = await getSolanaPrice();
  const priceDiff = currentPrice - predictionData.initialPrice;
  const actualDirection = priceDiff > 0 ? 'up' : 'down';
  const won = actualDirection === predictionData.prediction;

  // Clear the prediction from cache
  await env.CACHE.delete(`prediction:${userId}:${questId}`);

  if (won) {
    const reward = Math.floor(20 + Math.random() * 60); // 20-80 tickets
    return {
      success: true,
      reward,
      message: `Correct! SOL went ${actualDirection} from $${predictionData.initialPrice.toFixed(2)} to $${currentPrice.toFixed(2)}`
    };
  } else {
    return {
      success: false,
      message: `Wrong! SOL went ${actualDirection} from $${predictionData.initialPrice.toFixed(2)} to $${currentPrice.toFixed(2)}`
    };
  }
}