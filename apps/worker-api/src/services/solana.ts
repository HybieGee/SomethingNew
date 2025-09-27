import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction
} from '@solana/web3.js';
import {
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  AccountLayout
} from '@solana/spl-token';

// Configuration constants
const SOLANA_RPC_URL = 'https://api.devnet.solana.com'; // Use devnet for testing

// Initialize Solana connection
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

export interface TokenHoldingInfo {
  balance: number;
  holdingDurationHours: number;
  eligible: boolean;
  message: string;
}

export interface SolTransferResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

/**
 * Check if user holds $PAIR tokens for the required duration
 */
export async function checkPairTokenEligibility(
  userWalletAddress: string,
  requiredHours: number = 1,
  pairTokenMint?: string
): Promise<TokenHoldingInfo> {
  try {
    console.log(`🔍 Checking $PAIR token eligibility for ${userWalletAddress}`);

    if (!pairTokenMint) {
      throw new Error('PAIR_TOKEN_MINT not configured');
    }

    const userPublicKey = new PublicKey(userWalletAddress);
    const pairTokenMintKey = new PublicKey(pairTokenMint);

    // Get the user's associated token account for $PAIR token
    const associatedTokenAccount = await getAssociatedTokenAddress(
      pairTokenMintKey,
      userPublicKey
    );

    try {
      // Check if the token account exists and get balance
      const tokenAccount = await getAccount(connection, associatedTokenAccount);
      const balance = Number(tokenAccount.amount) / Math.pow(10, 6); // Assuming 6 decimals for $PAIR

      if (balance === 0) {
        return {
          balance: 0,
          holdingDurationHours: 0,
          eligible: false,
          message: 'No $PAIR tokens found in wallet'
        };
      }

      // Check transaction history to determine holding duration
      const holdingDuration = await getTokenHoldingDuration(
        connection,
        associatedTokenAccount,
        balance
      );

      const eligible = holdingDuration >= requiredHours;

      return {
        balance,
        holdingDurationHours: holdingDuration,
        eligible,
        message: eligible
          ? `✅ Eligible: Held ${balance.toFixed(2)} $PAIR for ${holdingDuration.toFixed(1)} hours`
          : `❌ Not eligible: Only held $PAIR for ${holdingDuration.toFixed(1)} hours (required: ${requiredHours}h)`
      };

    } catch (accountError) {
      // Token account doesn't exist
      return {
        balance: 0,
        holdingDurationHours: 0,
        eligible: false,
        message: 'No $PAIR token account found'
      };
    }

  } catch (error) {
    console.error('Error checking $PAIR token eligibility:', error);
    return {
      balance: 0,
      holdingDurationHours: 0,
      eligible: false,
      message: 'Error checking token eligibility'
    };
  }
}

/**
 * Get holding duration by analyzing transaction history
 */
async function getTokenHoldingDuration(
  connection: Connection,
  tokenAccount: PublicKey,
  currentBalance: number
): Promise<number> {
  try {
    // Get transaction signatures for the token account
    const signatures = await connection.getSignaturesForAddress(tokenAccount, { limit: 50 });

    if (signatures.length === 0) {
      return 0;
    }

    // Find the most recent transaction where balance became >= current balance
    let holdingStartTime: number | null = null;

    for (const sigInfo of signatures.reverse()) { // Process oldest first
      try {
        const tx = await connection.getTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0
        });

        if (tx && tx.blockTime) {
          // This is a simplified approach - in production you'd want to parse
          // the transaction details to see actual balance changes
          holdingStartTime = tx.blockTime * 1000; // Convert to milliseconds
          break;
        }
      } catch (txError) {
        console.log('Could not fetch transaction:', sigInfo.signature);
        continue;
      }
    }

    if (!holdingStartTime) {
      // If we can't determine start time, assume they just got the tokens
      return 0;
    }

    const now = Date.now();
    const holdingDurationMs = now - holdingStartTime;
    const holdingDurationHours = holdingDurationMs / (1000 * 60 * 60);

    return Math.max(0, holdingDurationHours);

  } catch (error) {
    console.error('Error getting token holding duration:', error);
    return 0;
  }
}

/**
 * Transfer SOL from dev wallet to user wallet
 */
export async function transferSOLFromDevWallet(
  recipientAddress: string,
  solAmount: number,
  devWalletPrivateKey: string
): Promise<SolTransferResult> {
  try {
    console.log(`💰 Transferring ${solAmount} SOL to ${recipientAddress}`);

    // Create keypair from dev wallet private key
    const devKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(devWalletPrivateKey))
    );

    const recipientPublicKey = new PublicKey(recipientAddress);
    const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

    // Check dev wallet balance
    const devBalance = await connection.getBalance(devKeypair.publicKey);
    if (devBalance < lamports) {
      return {
        success: false,
        error: `Insufficient dev wallet balance. Required: ${solAmount} SOL, Available: ${devBalance / LAMPORTS_PER_SOL} SOL`
      };
    }

    // Create transfer transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: devKeypair.publicKey,
        toPubkey: recipientPublicKey,
        lamports: lamports
      })
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = devKeypair.publicKey;

    // Sign and send transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [devKeypair],
      {
        commitment: 'confirmed',
        maxRetries: 3
      }
    );

    console.log(`✅ SOL transfer successful. Signature: ${signature}`);

    return {
      success: true,
      transactionHash: signature
    };

  } catch (error) {
    console.error('SOL transfer failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown transfer error'
    };
  }
}

/**
 * Get dev wallet balance
 */
export async function getDevWalletBalance(devWalletPrivateKey: string): Promise<number> {
  try {
    const devKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(devWalletPrivateKey))
    );

    const balance = await connection.getBalance(devKeypair.publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting dev wallet balance:', error);
    return 0;
  }
}

/**
 * Validate Solana wallet address
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get account info for debugging
 */
export async function getAccountInfo(address: string) {
  try {
    const publicKey = new PublicKey(address);
    const accountInfo = await connection.getAccountInfo(publicKey);
    return {
      exists: accountInfo !== null,
      lamports: accountInfo?.lamports || 0,
      owner: accountInfo?.owner.toString(),
      executable: accountInfo?.executable
    };
  } catch (error) {
    return { error: error.message };
  }
}