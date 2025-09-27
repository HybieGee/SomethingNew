/**
 * Contract Configuration
 * Update the CONTRACT_ADDRESS when the token launches
 */

export const CONTRACT_CONFIG = {
  // Token Contract Address - UPDATE THIS WHEN TOKEN LAUNCHES
  CONTRACT_ADDRESS: 'Coming Soon...', // Replace with actual CA like: 'AbCdEf123456789...'

  // Token Symbol
  TOKEN_SYMBOL: 'PAIR',

  // Token Name
  TOKEN_NAME: 'PairCade',

  // Network
  NETWORK: 'mainnet-beta', // or 'devnet' for testing

  // Explorer URLs
  EXPLORER_URL: 'https://solscan.io/token/', // Will append CONTRACT_ADDRESS

  // Show/Hide CA in UI
  SHOW_CONTRACT_ADDRESS: false, // Set to true when ready to display CA

  // Launch status
  IS_LAUNCHED: false, // Set to true when token is live

  // Pre-launch message
  PRE_LAUNCH_MESSAGE: 'Coming Soon...',

  // Social Links (optional)
  SOCIAL: {
    TWITTER: 'https://twitter.com/PairCade',
    TELEGRAM: '',
    DISCORD: '',
  }
};

// Helper function to get formatted CA for display
export const getFormattedCA = () => {
  if (!CONTRACT_CONFIG.IS_LAUNCHED || CONTRACT_CONFIG.CONTRACT_ADDRESS === 'Coming Soon...') {
    return CONTRACT_CONFIG.PRE_LAUNCH_MESSAGE;
  }

  // Return full address for display
  return CONTRACT_CONFIG.CONTRACT_ADDRESS;
};

// Helper function to get full explorer URL
export const getExplorerUrl = () => {
  if (!CONTRACT_CONFIG.IS_LAUNCHED || CONTRACT_CONFIG.CONTRACT_ADDRESS === 'Coming Soon...') {
    return null;
  }
  return `${CONTRACT_CONFIG.EXPLORER_URL}${CONTRACT_CONFIG.CONTRACT_ADDRESS}`;
};
