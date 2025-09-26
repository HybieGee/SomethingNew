// Solana price tracking service
interface PriceData {
  price: number;
  timestamp: number;
}

export async function getSolanaPrice(cache?: any): Promise<number> {
  // Try to get cached price first
  if (cache) {
    try {
      const cached = await cache.get('solana:price', 'json') as PriceData | null;
      if (cached && (Date.now() - cached.timestamp) < 60000) { // 1 minute cache
        return cached.price;
      }
    } catch (error) {
      console.error('Cache read error for Solana price:', error);
    }
  }

  try {
    // Try alternative free API first (no rate limits)
    try {
      const backupResponse = await fetch('https://api.coincap.io/v2/assets/solana');
      const backupData = await backupResponse.json();

      if (backupData && backupData.data && typeof backupData.data.priceUsd === 'string') {
        const price = parseFloat(backupData.data.priceUsd);
        console.log('✅ Using CoinCap API price:', price);
        return price;
      }
    } catch (backupError) {
      console.log('⚠️ Backup API failed, trying CoinGecko:', backupError);
    }

    // Fallback to CoinGecko
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
    const data = await response.json();

    console.log('🔍 CoinGecko API response:', JSON.stringify(data));

    // Handle rate limit and errors
    if (data && data.status && data.status.error_code === 429) {
      console.log('⚠️ CoinGecko rate limited, using fallback price');
      throw new Error('Rate limited');
    }

    // Handle various possible response structures
    let price: number;
    if (data && data.solana && typeof data.solana.usd === 'number') {
      price = data.solana.usd;
    } else if (data && typeof data.usd === 'number') {
      price = data.usd;
    } else if (data && Array.isArray(data) && data[0] && typeof data[0].current_price === 'number') {
      price = data[0].current_price;
    } else {
      console.error('❌ Unexpected CoinGecko response structure:', data);
      throw new Error('Invalid API response structure');
    }

    // Cache the price
    if (cache) {
      try {
        await cache.put('solana:price', JSON.stringify({
          price,
          timestamp: Date.now()
        }), { expirationTtl: 120 }); // 2 minute expiration
      } catch (error) {
        console.error('Cache write error for Solana price:', error);
      }
    }

    return price;
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
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

  console.log('💾 Storing prediction in database:', {
    predictionId,
    userId,
    questId,
    prediction,
    currentPrice,
    expiresAt: expiresAt.toISOString()
  });

  try {
    console.log('📅 Inserting with CURRENT_TIMESTAMP and relative expiry');

    // First, insert the base record using CURRENT_TIMESTAMP
    const insertResult = await env.DB.prepare(`
      INSERT INTO price_predictions (id, user_id, quest_id, prediction, initial_price, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', '+30 minutes'), datetime('now'))
    `).bind(
      predictionId,
      userId,
      questId,
      prediction,
      currentPrice
    ).run();

    console.log('📊 Insert result:', insertResult);

    console.log('✅ Database insert successful');

    // Store in KV for quick access
    await env.CACHE.put(
      `prediction:${userId}:${questId}`,
      JSON.stringify({
        predictionId,
        prediction,
        initialPrice: currentPrice,
        expiresAt: expiresAt.toISOString()
      }),
      { expirationTtl: 1800 } // 30 minutes
    );

    console.log('✅ KV cache store successful');
  } catch (error) {
    console.error('❌ Error in storePricePrediction:', error);
    throw error;
  }
}

export async function checkPredictionResult(
  env: any,
  userId: string,
  questId: string
): Promise<{ success: boolean; reward?: number; message: string }> {
  // First check cache
  let predictionData = await env.CACHE.get(`prediction:${userId}:${questId}`, 'json');

  // If not in cache, check database for unresolved predictions (including expired ones)
  if (!predictionData) {
    const dbPrediction = await env.DB.prepare(`
      SELECT * FROM price_predictions
      WHERE user_id = ? AND quest_id = ? AND resolved = FALSE
      ORDER BY created_at DESC LIMIT 1
    `).bind(userId, questId).first();

    if (!dbPrediction) {
      // Clean up any stale cache entries
      await env.CACHE.delete(`prediction:${userId}:${questId}`);
      return { success: false, message: 'No active prediction found' };
    }

    predictionData = {
      predictionId: dbPrediction.id,
      prediction: dbPrediction.prediction,
      initialPrice: dbPrediction.initial_price,
      expiresAt: dbPrediction.expires_at
    };
  }

  const expiresAt = new Date(predictionData.expiresAt);
  const now = new Date();

  if (now < expiresAt) {
    const remainingMinutes = Math.ceil((expiresAt.getTime() - now.getTime()) / 60000);
    return { success: false, message: `Prediction still active. Check back in ${remainingMinutes} minutes` };
  }

  const currentPrice = await getSolanaPrice(env.CACHE);
  const priceDiff = currentPrice - predictionData.initialPrice;
  const actualDirection = priceDiff > 0 ? 'up' : 'down';
  const won = actualDirection === predictionData.prediction;

  // Mark prediction as resolved in database
  await env.DB.prepare(`
    UPDATE price_predictions
    SET resolved = TRUE
    WHERE user_id = ? AND quest_id = ? AND resolved = FALSE
  `).bind(userId, questId).run();

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