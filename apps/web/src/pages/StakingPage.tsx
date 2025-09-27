import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  Clock,
  Shield,
  Zap,
  Gift,
  AlertCircle,
  CheckCircle,
  Coins,
  Calendar,
  Star
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface StakingTier {
  name: string;
  minAmount: number;
  dailyTickets: number;
  lockDays: number;
  color: string;
}

interface StakingPool {
  id: string;
  tier: string;
  pairAmount: number;
  dailyTickets: number;
  status: 'active' | 'completed' | 'cancelled';
  stakedAt: string;
  unlocksAt: string;
  lastClaimedAt: string | null;
  totalClaimed: number;
}

interface StakingStats {
  totalStaked: number;
  totalClaimed: number;
  activePools: number;
  nextUnlock: string | null;
}

export default function StakingPage() {
  const user = useAuthStore((state) => state.user);
  const [tiers, setTiers] = useState<Record<string, StakingTier>>({});
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [stats, setStats] = useState<StakingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState(100);
  const [isStaking, setIsStaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tiers
        const tiersResponse = await fetch('/api/staking/tiers', {
          credentials: 'include'
        });
        const tiersData = await tiersResponse.json();
        setTiers(tiersData.tiers);

        // Fetch dashboard data
        const dashboardResponse = await fetch('/api/staking/dashboard', {
          credentials: 'include'
        });
        const dashboardData = await dashboardResponse.json();
        setPools(dashboardData.pools || []);
        setStats(dashboardData.stats);
      } catch (error) {
        console.error('Error fetching staking data:', error);
        toast.error('Failed to load staking data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSelectedTier = (): StakingTier | null => {
    const tierEntries = Object.entries(tiers);
    for (let i = tierEntries.length - 1; i >= 0; i--) {
      const [, tier] = tierEntries[i];
      if (stakeAmount >= tier.minAmount) {
        return tier;
      }
    }
    return null;
  };

  const handleStake = async () => {
    if (!user?.solanaAddress) {
      toast.error('Please connect your Solana wallet first');
      return;
    }

    const selectedTier = getSelectedTier();
    if (!selectedTier) {
      toast.error(`Minimum stake amount is ${Math.min(...Object.values(tiers).map(t => t.minAmount))} $PAIR`);
      return;
    }

    setIsStaking(true);
    try {
      const response = await fetch('/api/staking/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pairAmount: stakeAmount })
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
      toast.error('Failed to stake tokens');
    } finally {
      setIsStaking(false);
    }
  };

  const handleClaim = async (poolId: string) => {
    setIsClaiming(true);
    try {
      const response = await fetch('/api/staking/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ poolId })
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
      toast.error('Failed to claim rewards');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClaimAll = async () => {
    setIsClaiming(true);
    try {
      const response = await fetch('/api/staking/claim-all', {
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
      toast.error('Failed to claim all rewards');
    } finally {
      setIsClaiming(false);
    }
  };

  const getTierColor = (tierName: string) => {
    const tier = Object.values(tiers).find(t => t.name.toLowerCase() === tierName.toLowerCase());
    return tier?.color || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading staking data...</div>
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full mb-6">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-300">$PAIR Staking</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Stake & Earn
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Lock your $PAIR tokens to earn daily ticket rewards
          </p>
        </motion.div>

        {/* Stats Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-4 gap-6 mb-12"
          >
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Total Staked</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalStaked.toLocaleString()} $PAIR</p>
            </div>
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Gift className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">Total Claimed</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalClaimed.toLocaleString()} 🎫</p>
            </div>
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-400">Active Pools</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.activePools}</p>
            </div>
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-400">Next Unlock</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.nextUnlock ? new Date(stats.nextUnlock).toLocaleDateString() : 'None'}
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Staking Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-8"
          >
            <h2 className="text-2xl font-bold mb-6 text-white">Create New Stake</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stake Amount ($PAIR)
                </label>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  min="100"
                  max="100000"
                />
              </div>

              {/* Selected Tier Display */}
              {getSelectedTier() && (
                <div className={`p-4 bg-gradient-to-r ${getTierColor(getSelectedTier()!.name)} rounded-lg`}>
                  <div className="flex items-center justify-between text-white">
                    <div>
                      <h3 className="font-bold capitalize">{getSelectedTier()!.name} Tier</h3>
                      <p className="text-sm opacity-90">
                        {getSelectedTier()!.dailyTickets} tickets/day for {getSelectedTier()!.lockDays} days
                      </p>
                    </div>
                    <Trophy className="w-8 h-8" />
                  </div>
                </div>
              )}

              <button
                onClick={handleStake}
                disabled={isStaking || !getSelectedTier()}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg font-bold text-white hover:shadow-lg hover:shadow-yellow-500/25 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStaking ? 'Staking...' : 'Stake Tokens'}
              </button>
            </div>

            {/* Tier Information */}
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4 text-white">Staking Tiers</h3>
              <div className="space-y-3">
                {Object.entries(tiers).map(([key, tier]) => (
                  <div key={key} className={`p-3 bg-gradient-to-r ${tier.color} rounded-lg`}>
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <h4 className="font-bold capitalize">{tier.name}</h4>
                        <p className="text-sm opacity-90">
                          Min: {tier.minAmount} $PAIR • {tier.dailyTickets} tickets/day • {tier.lockDays} days lock
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Active Stakes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Your Stakes</h2>
              {pools.filter(p => p.status === 'active').length > 0 && (
                <button
                  onClick={handleClaimAll}
                  disabled={isClaiming}
                  className="px-4 py-2 bg-green-500 rounded-lg font-bold text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isClaiming ? 'Claiming...' : 'Claim All'}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {pools.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active stakes yet</p>
                  <p className="text-sm">Create your first stake to start earning daily rewards</p>
                </div>
              ) : (
                pools.map((pool) => (
                  <div key={pool.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          pool.status === 'active' ? 'bg-green-400' :
                          pool.status === 'completed' ? 'bg-blue-400' : 'bg-red-400'
                        }`} />
                        <span className="font-bold text-white capitalize">{pool.tier} Tier</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        pool.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        pool.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {pool.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Staked Amount</p>
                        <p className="text-white font-bold">{pool.pairAmount.toLocaleString()} $PAIR</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Daily Rewards</p>
                        <p className="text-white font-bold">{pool.dailyTickets} 🎫</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Total Claimed</p>
                        <p className="text-white font-bold">{pool.totalClaimed.toLocaleString()} 🎫</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Unlocks</p>
                        <p className="text-white font-bold">
                          {new Date(pool.unlocksAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {pool.status === 'active' && (
                      <button
                        onClick={() => handleClaim(pool.id)}
                        disabled={isClaiming}
                        className="w-full mt-4 py-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg font-bold text-white hover:shadow-lg transition-shadow disabled:opacity-50"
                      >
                        {isClaiming ? 'Claiming...' : 'Claim Rewards'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}