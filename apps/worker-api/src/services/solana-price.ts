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

  // Try multiple APIs in sequence with proper error handling
  const apis = [
    {
      name: 'CoinPaprika',
      url: 'https://api.coinpaprika.com/v1/tickers/sol-solana',
      parser: (data: any) => {
        if (data && data.quotes && data.quotes.USD && typeof data.quotes.USD.price === 'number') {
          return data.quotes.USD.price;
        }
        throw new Error('Invalid CoinPaprika response structure');
      }
    },
    {
      name: 'CoinCap',
      url: 'https://api.coincap.io/v2/assets/solana',
      parser: (data: any) => {
        if (data && data.data && typeof data.data.priceUsd === 'string') {
          return parseFloat(data.data.priceUsd);
        }
        throw new Error('Invalid CoinCap response structure');
      }
    },
    {
      name: 'CryptoCompare',
      url: 'https://min-api.cryptocompare.com/data/price?fsym=SOL&tsyms=USD',
      parser: (data: any) => {
        if (data && typeof data.USD === 'number') {
          return data.USD;
        }
        throw new Error('Invalid CryptoCompare response structure');
      }
    },
    {
      name: 'CoinGecko',
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      parser: (data: any) => {
        if (data && data.status && data.status.error_code === 429) {
          throw new Error('Rate limited');
        }
        if (data && data.solana && typeof data.solana.usd === 'number') {
          return data.solana.usd;
        }
        throw new Error('Invalid CoinGecko response structure');
      }
    }
  ];

  for (const api of apis) {
    try {
      console.log(`🔄 Trying ${api.name} API...`);
      const response = await fetch(api.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();

      // Check if response is HTML (blocked/error page)
      if (text.trim().startsWith('<')) {
        throw new Error('API returned HTML instead of JSON (likely blocked)');
      }

      const data = JSON.parse(text);
      const price = api.parser(data);

      if (price && price > 0) {
        console.log(`✅ Using ${api.name} API price: $${price}`);

        // Cache the successful price
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
      }
    } catch (error) {
      console.log(`⚠️ ${api.name} API failed:`, error.message);
      // Continue to next API
    }
  }

  // If all APIs fail, try to get a longer cached price (up to 10 minutes old)
  if (cache) {
    try {
      const staleCache = await cache.get('solana:price', 'json') as PriceData | null;
      if (staleCache && (Date.now() - staleCache.timestamp) < 600000) { // 10 minute stale cache
        console.log('⚠️ Using stale cached price due to API failures:', staleCache.price);
        return staleCache.price;
      }
    } catch (error) {
      console.error('Stale cache read error:', error);
    }
  }

  // Final fallback - use reasonable SOL price
  console.error('❌ All price APIs failed, using fallback price');
  return 160.0; // More realistic fallback price for SOL
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
    console.log('🔍 Database insert parameters:', {
      predictionId,
      userId,
      questId,
      prediction,
      currentPrice,
      typeOfPrice: typeof currentPrice,
      isValidPrice: Number.isFinite(currentPrice)
    });

    // Validate all parameters before database insert
    if (!predictionId || !userId || !questId || !prediction) {
      throw new Error('Missing required parameters for database insert');
    }

    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      throw new Error(`Invalid price for database insert: ${currentPrice}`);
    }

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

    // Invalidate the quest cache for this user to ensure immediate UI updates
    try {
      await env.CACHE.delete(`quests:${userId}`);
      console.log('✅ Quest cache invalidated for immediate UI update');
    } catch (cacheError) {
      console.error('⚠️ Failed to invalidate quest cache:', cacheError);
      // Don't throw - this is not critical
    }
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