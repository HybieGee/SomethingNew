import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import React from 'react';
import {
  ArrowLeft,
  Star,
  TrendingUp,
  Clock,
  Crown,
  Zap,
  Gift,
  AlertCircle,
  CheckCircle,
  Coins,
  Target,
  Sparkles,
  Diamond
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface PremiumTier {
  name: string;
  pairRequired: number;
  color: string;
  benefits: {
    questMultiplier: number;
    conversionBonus: number;
    exclusiveQuests: boolean;
    prioritySupport: boolean;
  };
}

interface PremiumSubscription {
  tier: string;
  pairAmount: number;
  activatedAt: string;
  status: 'active' | 'cancelled';
}

interface PremiumBenefits {
  tier: string;
  questMultiplier: number;
  conversionBonus: number;
  exclusiveQuests: boolean;
  prioritySupport: boolean;
  activatedAt: string;
}

export default function PremiumPage() {
  const user = useAuthStore((state) => state.user);
  const [tiers, setTiers] = useState<Record<string, PremiumTier>>({});
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null);
  const [benefits, setBenefits] = useState<PremiumBenefits | null>(null);
  const [loading, setLoading] = useState(true);
  const [pairAmount, setPairAmount] = useState(250);
  const [isActivating, setIsActivating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tiers
        const tiersResponse = await fetch('/api/premium/tiers', {
          credentials: 'include'
        });
        const tiersData = await tiersResponse.json();
        setTiers(tiersData.tiers);

        // Fetch premium status
        const statusResponse = await fetch('/api/premium/status', {
          credentials: 'include'
        });
        const statusData = await statusResponse.json();
        setSubscription(statusData.subscription);
        setBenefits(statusData.benefits);
      } catch (error) {
        console.error('Error fetching premium data:', error);
        toast.error('Failed to load premium data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSelectedTier = (): PremiumTier | null => {
    const tierEntries = Object.entries(tiers);
    for (let i = tierEntries.length - 1; i >= 0; i--) {
      const [, tier] = tierEntries[i];
      if (pairAmount >= tier.pairRequired) {
        return tier;
      }
    }
    return null;
  };

  const handleActivate = async () => {
    if (!user?.solanaAddress) {
      toast.error('Please connect your Solana wallet first');
      return;
    }

    const selectedTier = getSelectedTier();
    if (!selectedTier) {
      toast.error(`Minimum premium amount is ${Math.min(...Object.values(tiers).map(t => t.pairRequired))} $PAIR`);
      return;
    }

    setIsActivating(true);
    try {
      const response = await fetch('/api/premium/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pairAmount })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        // Refresh data
        window.location.reload();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Failed to activate premium subscription');
    } finally {
      setIsActivating(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your premium subscription? You will lose all premium benefits.')) {
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch('/api/premium/cancel', {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        // Refresh data
        window.location.reload();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Failed to cancel premium subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'basic': return Star;
      case 'premium': return Crown;
      case 'elite': return Diamond;
      default: return Star;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading premium data...</div>
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
            <span className="text-sm text-purple-300">Premium Subscriptions</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              Go Premium
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Unlock exclusive benefits and multiply your quest rewards
          </p>
        </motion.div>

        {subscription ? (
          // Active Premium Dashboard
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Current Subscription */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${tiers[subscription.tier]?.color || 'from-purple-500 to-pink-500'} flex items-center justify-center`}>
                    {React.createElement(getTierIcon(subscription.tier), { className: 'w-6 h-6 text-white' })}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white capitalize">{subscription.tier} Premium</h2>
                    <p className="text-gray-400">{subscription.pairAmount.toLocaleString()} $PAIR staked</p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              </div>

              {/* Benefits Display */}
              {benefits && (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <h3 className="font-bold text-white">{benefits.questMultiplier}x</h3>
                    <p className="text-sm text-gray-400">Quest Multiplier</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Coins className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <h3 className="font-bold text-white">{(benefits.conversionBonus * 100).toFixed(1)}%</h3>
                    <p className="text-sm text-gray-400">Conversion Bonus</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <h3 className="font-bold text-white">{benefits.exclusiveQuests ? 'Yes' : 'No'}</h3>
                    <p className="text-sm text-gray-400">Exclusive Quests</p>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <Crown className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <h3 className="font-bold text-white">{benefits.prioritySupport ? 'Yes' : 'No'}</h3>
                    <p className="text-sm text-gray-400">Priority Support</p>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-bold">Premium Active</span>
                </div>
                <p className="text-sm text-green-300 mt-1">
                  Activated on {new Date(subscription.activatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          // Premium Activation Interface
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Activation Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6 text-white">Activate Premium</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    $PAIR Amount
                  </label>
                  <input
                    type="number"
                    value={pairAmount}
                    onChange={(e) => setPairAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="250"
                    max="100000"
                  />
                </div>

                {/* Selected Tier Display */}
                {getSelectedTier() && (
                  <div className={`p-4 bg-gradient-to-r ${getSelectedTier()!.color} rounded-lg`}>
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <h3 className="font-bold capitalize">{getSelectedTier()!.name} Premium</h3>
                        <p className="text-sm opacity-90">
                          {getSelectedTier()!.benefits.questMultiplier}x quest rewards • {(getSelectedTier()!.benefits.conversionBonus * 100).toFixed(1)}% conversion bonus
                        </p>
                      </div>
                      {React.createElement(getTierIcon(getSelectedTier()!.name), { className: 'w-8 h-8' })}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleActivate}
                  disabled={isActivating || !getSelectedTier()}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-purple-500/25 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isActivating ? 'Activating...' : 'Activate Premium'}
                </button>
              </div>
            </motion.div>

            {/* Tier Comparison */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Premium Tiers</h2>

              {Object.entries(tiers).map(([key, tier]) => {
                const TierIcon = getTierIcon(tier.name);
                return (
                  <div key={key} className={`p-6 bg-gradient-to-r ${tier.color} rounded-xl`}>
                    <div className="flex items-center justify-between text-white mb-4">
                      <div className="flex items-center gap-3">
                        <TierIcon className="w-8 h-8" />
                        <div>
                          <h3 className="text-xl font-bold capitalize">{tier.name}</h3>
                          <p className="text-sm opacity-90">{tier.pairRequired.toLocaleString()} $PAIR minimum</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-white">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm">{tier.benefits.questMultiplier}x Quest Rewards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Coins className="w-4 h-4" />
                        <span className="text-sm">{(tier.benefits.conversionBonus * 100).toFixed(1)}% Conversion Bonus</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span className="text-sm">{tier.benefits.exclusiveQuests ? 'Exclusive Quests' : 'Standard Quests'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        <span className="text-sm">{tier.benefits.prioritySupport ? 'Priority Support' : 'Standard Support'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        )}

        {/* Features Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl"
        >
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4 text-center">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Premium Benefits
            </span>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <h4 className="font-bold text-white mb-1">Quest Multipliers</h4>
              <p className="text-sm text-gray-300">Earn 1.5x to 3x more tickets from quests</p>
            </div>
            <div className="text-center">
              <Coins className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h4 className="font-bold text-white mb-1">Conversion Bonuses</h4>
              <p className="text-sm text-gray-300">Get extra SOL when converting tickets</p>
            </div>
            <div className="text-center">
              <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h4 className="font-bold text-white mb-1">Exclusive Quests</h4>
              <p className="text-sm text-gray-300">Access premium-only challenges</p>
            </div>
            <div className="text-center">
              <Crown className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h4 className="font-bold text-white mb-1">Priority Support</h4>
              <p className="text-sm text-gray-300">Fast-track customer service</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}