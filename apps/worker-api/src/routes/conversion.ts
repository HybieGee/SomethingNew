import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { generalRateLimit } from '../middleware/rateLimit';
import { z } from 'zod';
import type { Env } from '../types';

const ConversionRequestSchema = z.object({
  ticketAmount: z.number().min(1000).max(1000000), // Minimum 1000 tickets, max 1M
  solanaAddress: z.string().min(32).max(44), // Valid Solana address format
});

// Configuration constants
const TICKETS_PER_SOL = 100000; // 100k tickets = 1 SOL
const MIN_PAIR_HOLD_HOURS = 1; // Must hold $PAIR for 1 hour
const PAIR_TOKEN_ADDRESS = 'YOUR_PAIR_TOKEN_MINT_ADDRESS'; // Replace with actual $PAIR token address
const DEV_WALLET_PRIVATE_KEY = 'YOUR_DEV_WALLET_PRIVATE_KEY'; // Store in environment variables

export const conversionRouter = new Hono<{ Bindings: Env }>();

// Get conversion rate and user eligibility
conversionRouter.get('/rate', authMiddleware, async (c) => {
  const user = c.get('user');

  return c.json({
    ticketsPerSOL: TICKETS_PER_SOL,
    minTicketsRequired: 1000,
    maxTicketsAllowed: 1000000,
    userTickets: user.tickets,
    pairHoldRequirement: `${MIN_PAIR_HOLD_HOURS} hour(s)`,
    estimatedSOL: user.tickets / TICKETS_PER_SOL
  });
});

// Check if user is eligible for conversion (holds $PAIR token for required time)
conversionRouter.get('/eligibility', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    // Check $PAIR token holding history
    const eligibility = await checkPairTokenEligibility(user.solana_address);

    return c.json({
      eligible: eligibility.eligible,
      pairBalance: eligibility.balance,
      holdingDuration: eligibility.holdingHours,
      requiredHours: MIN_PAIR_HOLD_HOURS,
      message: eligibility.message
    });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return c.json({
      error: 'Failed to check eligibility',
      eligible: false
    }, 500);
  }
});

// Process ticket-to-SOL conversion
conversionRouter.post('/convert', authMiddleware, generalRateLimit, async (c) => {
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const data = ConversionRequestSchema.parse(body);

    // Validate user has enough tickets
    if (user.tickets < data.ticketAmount) {
      return c.json({
        error: 'Insufficient tickets',
        userTickets: user.tickets,
        requestedTickets: data.ticketAmount
      }, 400);
    }

    // Check $PAIR token eligibility
    const eligibility = await checkPairTokenEligibility(user.solana_address);
    if (!eligibility.eligible) {
      return c.json({
        error: 'Not eligible for conversion',
        reason: eligibility.message,
        pairHoldRequirement: `${MIN_PAIR_HOLD_HOURS} hour(s)`
      }, 403);
    }

    // Calculate SOL amount
    const solAmount = data.ticketAmount / TICKETS_PER_SOL;

    // Record conversion in database
    const conversionId = crypto.randomUUID();
    const conversionRecord = {
      id: conversionId,
      userId: user.id,
      ticketAmount: data.ticketAmount,
      solAmount,
      recipientAddress: data.solanaAddress,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Insert conversion record
    await c.env.DB.prepare(`
      INSERT INTO conversions (id, user_id, ticket_amount, sol_amount, recipient_address, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      conversionId,
      user.id,
      data.ticketAmount,
      solAmount,
      data.solanaAddress,
      'pending'
    ).run();

    // Deduct tickets from user account
    await c.env.DB.prepare(`
      UPDATE users SET tickets = tickets - ? WHERE id = ?
    `).bind(data.ticketAmount, user.id).run();

    // Process SOL transfer from dev wallet
    try {
      const transferResult = await transferSOLFromDevWallet(
        data.solanaAddress,
        solAmount,
        c.env
      );

      if (transferResult.success) {
        // Mark conversion as completed
        await c.env.DB.prepare(`
          UPDATE conversions SET status = 'completed', transaction_hash = ?, completed_at = datetime('now')
          WHERE id = ?
        `).bind(transferResult.transactionHash, conversionId).run();

        console.log(`✅ Conversion completed: ${data.ticketAmount} tickets → ${solAmount} SOL for user ${user.id}`);

        return c.json({
          success: true,
          conversionId,
          ticketsConverted: data.ticketAmount,
          solReceived: solAmount,
          transactionHash: transferResult.transactionHash,
          recipientAddress: data.solanaAddress,
          message: `Successfully converted ${data.ticketAmount.toLocaleString()} tickets to ${solAmount.toFixed(4)} SOL`
        });
      } else {
        // SOL transfer failed - refund tickets
        await c.env.DB.prepare(`
          UPDATE users SET tickets = tickets + ? WHERE id = ?
        `).bind(data.ticketAmount, user.id).run();

        await c.env.DB.prepare(`
          UPDATE conversions SET status = 'failed', error_message = ? WHERE id = ?
        `).bind(transferResult.error, conversionId).run();

        return c.json({
          error: 'SOL transfer failed',
          details: transferResult.error,
          ticketsRefunded: data.ticketAmount
        }, 500);
      }
    } catch (transferError) {
      console.error('SOL transfer error:', transferError);

      // Refund tickets on transfer failure
      await c.env.DB.prepare(`
        UPDATE users SET tickets = tickets + ? WHERE id = ?
      `).bind(data.ticketAmount, user.id).run();

      await c.env.DB.prepare(`
        UPDATE conversions SET status = 'failed', error_message = ? WHERE id = ?
      `).bind(transferError.message, conversionId).run();

      return c.json({
        error: 'Conversion failed during SOL transfer',
        details: transferError.message,
        ticketsRefunded: data.ticketAmount
      }, 500);
    }
  } catch (error) {
    console.error('Conversion error:', error);
    return c.json({
      error: 'Conversion failed',
      details: error.message
    }, 500);
  }
});

// Get conversion history for user
conversionRouter.get('/history', authMiddleware, async (c) => {
  const user = c.get('user');

  try {
    const conversions = await c.env.DB.prepare(`
      SELECT * FROM conversions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(user.id).all();

    return c.json({
      conversions: conversions.results
    });
  } catch (error) {
    console.error('Error fetching conversion history:', error);
    return c.json({ error: 'Failed to fetch conversion history' }, 500);
  }
});

// Helper function to check $PAIR token holding eligibility
async function checkPairTokenEligibility(solanaAddress: string) {
  // TODO: Implement actual Solana blockchain check for $PAIR token
  // This would involve:
  // 1. Query Solana RPC for token account balance
  // 2. Check transaction history to determine holding duration
  // 3. Verify user has held tokens for at least MIN_PAIR_HOLD_HOURS

  // For now, returning mock data - replace with actual implementation
  console.log(`🔍 Checking $PAIR token eligibility for ${solanaAddress}`);

  // Mock implementation - replace with actual token checking logic
  return {
    eligible: true, // Set to false to test eligibility requirements
    balance: 1000, // Mock $PAIR token balance
    holdingHours: 2, // Mock holding duration
    message: `User has held $PAIR tokens for 2 hours (required: ${MIN_PAIR_HOLD_HOURS} hour)`
  };
}

// Helper function to transfer SOL from dev wallet
async function transferSOLFromDevWallet(recipientAddress: string, solAmount: number, env: Env) {
  // TODO: Implement actual SOL transfer using Solana Web3.js
  // This would involve:
  // 1. Create connection to Solana network
  // 2. Load dev wallet from private key
  // 3. Create and send transfer transaction
  // 4. Return transaction hash on success

  console.log(`💰 Transferring ${solAmount} SOL to ${recipientAddress}`);

  // Mock implementation - replace with actual Solana transaction
  return {
    success: true,
    transactionHash: `mock_tx_${Date.now()}`, // Replace with actual transaction hash
    error: null
  };
}