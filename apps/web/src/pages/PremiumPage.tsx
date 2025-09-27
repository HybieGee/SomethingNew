import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import React from 'react';
import {
  Crown,
  Zap,
  Gift,
  CheckCircle,
  Coins,
  Target,
  Sparkles,
  Trophy,
  Star,
  Shield
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface PremiumTier {
  name: string;
  tokenRequired: number;
  color: string;
  icon: any;
  benefits: {
    questMultiplier: number;
    conversionBonus: number;
    exclusiveQuests: boolean;
    prioritySupport: boolean;
    dailyBonus: number;
  };
}

const PREMIUM_TIERS: Record<string, PremiumTier> = {
  bronze: {
    name: 'Bronze',
    tokenRequired: 20000,
    color: 'from-orange-600 to-orange-700',
    icon: Shield,
    benefits: {
      questMultiplier: 1.5,
      conversionBonus: 0.05,
      exclusiveQuests: false,
      prioritySupport: false,
      dailyBonus: 50
    }
  },
  silver: {
    name: 'Silver',
    tokenRequired: 150000,
    color: 'from-gray-400 to-gray-500',
    icon: Star,
    benefits: {
      questMultiplier: 2.0,
      conversionBonus: 0.10,
      exclusiveQuests: true,
      prioritySupport: false,
      dailyBonus: 150
    }
  },
  gold: {
    name: 'Gold',
    tokenRequired: 750000,
    color: 'from-yellow-500 to-yellow-600',
    icon: Crown,
    benefits: {
      questMultiplier: 3.0,
      conversionBonus: 0.20,
      exclusiveQuests: true,
      prioritySupport: true,
      dailyBonus: 500
    }
  }
};

export default function PremiumPage() {
  const user = useAuthStore((state) => state.user);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTier, setActiveTier] = useState<PremiumTier | null>(null);

  useEffect(() => {
    const fetchTokenBalance = async () => {
      try {
        if (!user?.solanaAddress) {
          setTokenBalance(0);
          setActiveTier(null);
          setLoading(false);
          return;
        }

        // TODO: In production, this will call the Solana API to check actual $PAIR token balance
        // For now, we'll set to 0 since the token hasn't been launched yet
        const actualBalance = 0; // Will be replaced with real Solana token balance check
        setTokenBalance(actualBalance);

        // Determine active tier based on balance
        if (actualBalance >= PREMIUM_TIERS.gold.tokenRequired) {
          setActiveTier(PREMIUM_TIERS.gold);
        } else if (actualBalance >= PREMIUM_TIERS.silver.tokenRequired) {
          setActiveTier(PREMIUM_TIERS.silver);
        } else if (actualBalance >= PREMIUM_TIERS.bronze.tokenRequired) {
          setActiveTier(PREMIUM_TIERS.bronze);
        } else {
          setActiveTier(null);
        }
      } catch (error) {
        console.error('Error fetching token balance:', error);
        toast.error('Failed to load token balance');
        setTokenBalance(0);
        setActiveTier(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenBalance();
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchTokenBalance, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const getProgressToNextTier = () => {
    if (!activeTier) {
      // Progress to Bronze
      return (tokenBalance / PREMIUM_TIERS.bronze.tokenRequired) * 100;
    } else if (activeTier.name === 'Bronze') {
      // Progress from Bronze to Silver
      const progress = ((tokenBalance - PREMIUM_TIERS.bronze.tokenRequired) /
        (PREMIUM_TIERS.silver.tokenRequired - PREMIUM_TIERS.bronze.tokenRequired)) * 100;
      return Math.min(100, Math.max(0, progress));
    } else if (activeTier.name === 'Silver') {
      // Progress from Silver to Gold
      const progress = ((tokenBalance - PREMIUM_TIERS.silver.tokenRequired) /
        (PREMIUM_TIERS.gold.tokenRequired - PREMIUM_TIERS.silver.tokenRequired)) * 100;
      return Math.min(100, Math.max(0, progress));
    }
    return 100; // Gold tier - maxed out
  };

  const getNextTierInfo = () => {
    if (!activeTier) return PREMIUM_TIERS.bronze;
    if (activeTier.name === 'Bronze') return PREMIUM_TIERS.silver;
    if (activeTier.name === 'Silver') return PREMIUM_TIERS.gold;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading premium status...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-6">
            <Crown className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Premium Membership</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              Premium Benefits
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Hold $PAIR tokens to automatically unlock premium tiers
          </p>
        </motion.div>

        {/* Current Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Your Premium Status</h2>
              <p className="text-gray-400">
                Token Balance: <span className="text-white font-bold">{tokenBalance.toLocaleString()} $PAIR</span>
              </p>
            </div>
            {activeTier && (
              <div className={`p-4 bg-gradient-to-r ${activeTier.color} rounded-xl`}>
                {React.createElement(activeTier.icon, { className: 'w-8 h-8 text-white' })}
              </div>
            )}
          </div>

          {activeTier ? (
            <>
              <div className={`p-6 bg-gradient-to-r ${activeTier.color} rounded-xl mb-6`}>
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h3 className="text-3xl font-bold">{activeTier.name} Tier Active</h3>
                    <p className="text-sm opacity-90 mt-2">
                      Minimum requirement: {activeTier.tokenRequired.toLocaleString()} $PAIR
                    </p>
                  </div>
                  <CheckCircle className="w-12 h-12" />
                </div>
              </div>

              {/* Active Benefits */}
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <p className="font-bold text-white">{activeTier.benefits.questMultiplier}x</p>
                  <p className="text-xs text-gray-400">Quest Rewards</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <Coins className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="font-bold text-white">+{(activeTier.benefits.conversionBonus * 100).toFixed(0)}%</p>
                  <p className="text-xs text-gray-400">Conversion Bonus</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <Gift className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="font-bold text-white">{activeTier.benefits.dailyBonus}</p>
                  <p className="text-xs text-gray-400">Daily Tickets</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <Target className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="font-bold text-white">{activeTier.benefits.exclusiveQuests ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-gray-400">Exclusive Quests</p>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-lg">
                  <Crown className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                  <p className="font-bold text-white">{activeTier.benefits.prioritySupport ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-gray-400">Priority Support</p>
                </div>
              </div>

              {/* Progress to Next Tier */}
              {getNextTierInfo() && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Progress to {getNextTierInfo()!.name}</span>
                    <span className="text-sm text-gray-400">
                      {(getNextTierInfo()!.tokenRequired - tokenBalance).toLocaleString()} $PAIR needed
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressToNextTier()}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full bg-gradient-to-r ${getNextTierInfo()!.color}`}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="p-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl mb-6">
                <div className="text-center text-white">
                  <h3 className="text-2xl font-bold mb-2">No Premium Tier Active</h3>
                  <p className="text-sm opacity-90">
                    Hold at least {PREMIUM_TIERS.bronze.tokenRequired.toLocaleString()} $PAIR to unlock Bronze tier
                  </p>
                </div>
              </div>

              {/* Progress to Bronze */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Progress to Bronze</span>
                  <span className="text-sm text-gray-400">
                    {(PREMIUM_TIERS.bronze.tokenRequired - tokenBalance).toLocaleString()} $PAIR needed
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressToNextTier()}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-orange-600 to-orange-700"
                  />
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* All Tiers Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-white mb-6">Premium Tiers</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(PREMIUM_TIERS).map(([key, tier]) => {
              const TierIcon = tier.icon;
              const isActive = activeTier?.name === tier.name;
              const isLocked = tokenBalance < tier.tokenRequired;

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`relative p-6 rounded-xl border ${
                    isActive
                      ? `bg-gradient-to-r ${tier.color} border-transparent`
                      : isLocked
                      ? 'bg-white/5 border-white/10 opacity-60'
                      : 'bg-white/10 border-white/20'
                  }`}
                >
                  {isActive && (
                    <div className="absolute -top-3 -right-3 bg-green-500 rounded-full p-2">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className={`text-xl font-bold ${isActive ? 'text-white' : 'text-white'}`}>
                        {tier.name}
                      </h3>
                      <p className={`text-sm ${isActive ? 'text-white/90' : 'text-gray-400'}`}>
                        {tier.tokenRequired.toLocaleString()} $PAIR
                      </p>
                    </div>
                    <TierIcon className={`w-8 h-8 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {tier.benefits.questMultiplier}x Quest Rewards
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        +{(tier.benefits.conversionBonus * 100).toFixed(0)}% Conversion Bonus
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gift className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {tier.benefits.dailyBonus} Daily Bonus Tickets
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {tier.benefits.exclusiveQuests ? 'Exclusive Quests' : 'Standard Quests'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Crown className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {tier.benefits.prioritySupport ? 'Priority Support' : 'Standard Support'}
                      </span>
                    </div>
                  </div>

                  {isLocked && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs text-gray-400">
                        Hold {(tier.tokenRequired - tokenBalance).toLocaleString()} more $PAIR to unlock
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl"
        >
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4 text-center">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              How Premium Works
            </span>
          </h3>
          <p className="text-gray-300 text-center mb-6 max-w-2xl mx-auto">
            Premium tiers are automatically activated based on your $PAIR token holdings.
            The more tokens you hold, the better your benefits! Your tier updates in real-time
            as your balance changes.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <h4 className="font-bold text-white mb-1">Hold to Earn</h4>
              <p className="text-sm text-gray-300">Simply hold $PAIR tokens in your wallet</p>
            </div>
            <div>
              <Zap className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h4 className="font-bold text-white mb-1">Auto-Activation</h4>
              <p className="text-sm text-gray-300">Tiers activate automatically when you qualify</p>
            </div>
            <div>
              <Gift className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h4 className="font-bold text-white mb-1">Instant Benefits</h4>
              <p className="text-sm text-gray-300">Start earning bonuses immediately</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}