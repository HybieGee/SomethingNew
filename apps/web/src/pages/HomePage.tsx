import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Gift, Sparkles, Trophy, Timer, TrendingUp, Shield, type LucideIcon } from 'lucide-react';

type StatItem = {
  label: string;
  value: number;
  color: string;
  icon: LucideIcon | string;
  isImage?: boolean;
};

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const updateTickets = useAuthStore((state) => state.updateTickets);

  const { data: profile, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: api.profile.me,
    refetchInterval: 30000,
  });

  const { data: userFaction } = useQuery({
    queryKey: ['userFaction'],
    queryFn: api.factions.me,
  });

  // Check if daily reward has been claimed today
  const canClaimDaily = () => {
    if (!profile?.profile?.last_daily_claim_at) return true;

    const lastClaim = new Date(profile.profile.last_daily_claim_at);
    const now = new Date();
    const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastClaim >= 24;
  };

  const getTimeUntilNextClaim = () => {
    if (!profile?.profile?.last_daily_claim_at) return 0;

    const lastClaim = new Date(profile.profile.last_daily_claim_at);
    const now = new Date();
    const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

    return Math.max(0, Math.ceil(24 - hoursSinceLastClaim));
  };

  const handleClaimDaily = async () => {
    if (!canClaimDaily()) {
      const hoursLeft = getTimeUntilNextClaim();
      toast.error(`Already claimed! Next claim in ${hoursLeft} hours`);
      return;
    }

    try {
      const result = await api.profile.claimDaily();
      updateTickets(result.newTickets);
      toast.success(`Claimed ${result.reward} tickets! Streak: ${result.streakDays} days`);
      // Force immediate refetch to update the button state
      await refetch();
    } catch (error: any) {
      if (error.message && error.message.includes('Already claimed')) {
        // Extract hours from error message if available, otherwise default to 20
        const hoursMatch = error.message.match(/(\d+)/);
        const hours = hoursMatch ? hoursMatch[1] : '20';
        toast.error(`Already claimed! Next claim in ${hours} hours`);
        // Refetch to ensure UI is in sync with server state
        await refetch();
      } else {
        toast.error(error.message || 'Failed to claim daily reward');
      }
    }
  };

  const quickStats: StatItem[] = [
    { label: 'Total Tickets', value: user?.tickets || 0, icon: '/assets/icons/TotalTicketsIcon.png', isImage: true, color: 'text-arcade-yellow' },
    { label: 'Streak Days', value: user?.streakDays || 0, icon: TrendingUp, color: 'text-arcade-green' },
    { label: 'Badges', value: profile?.profile?.badge_count || 0, icon: Sparkles, color: 'text-arcade-purple' },
    { label: 'Quests Today', value: profile?.profile?.quests_today || 0, icon: Timer, color: 'text-arcade-blue' },
  ];

  return (
    <div className="space-y-8">
      {profile?.activeBoost && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-arcade-green/20 border border-arcade-green/50 rounded-lg"
        >
          <p className="text-arcade-green font-bold">
            🚀 Active Boost: {profile.activeBoost.multiplier}x Tickets for all activities!
          </p>
          <p className="text-sm text-arcade-green/80">
            Ends at {new Date(profile.activeBoost.end_time).toLocaleTimeString()}
          </p>
        </motion.div>
      )}

      {!userFaction?.faction && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-r from-arcade-purple/20 to-arcade-blue/20 border border-arcade-purple/50 rounded-lg"
        >
          <div className="flex items-start gap-4">
            <Shield className="text-arcade-purple mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Join a Faction!</h3>
              <p className="text-gray-300 mb-4">
                Choose your faction to earn bonus multipliers and support your favorite tokens.
                Each faction offers unique benefits and increased rewards!
              </p>
              <Link
                to="/factions"
                className="inline-flex items-center gap-2 px-6 py-3 arcade-gradient rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
              >
                <Shield size={18} />
                Choose Faction
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-arcade-dark/50 backdrop-blur border border-white/10 rounded-lg p-4"
            >
              {stat.isImage ? (
                <img src={stat.icon as string} alt={stat.label} className="w-6 h-6 mb-2" />
              ) : (
                React.createElement(stat.icon as LucideIcon, {
                  className: `${stat.color} mb-2`,
                  size: 24
                })
              )}
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.button
        whileHover={{ scale: canClaimDaily() ? 1.05 : 1 }}
        whileTap={{ scale: canClaimDaily() ? 0.95 : 1 }}
        onClick={handleClaimDaily}
        disabled={!canClaimDaily()}
        className={`w-full py-6 rounded-xl font-bold text-xl transition-all ${
          canClaimDaily()
            ? 'arcade-gradient text-white hover:opacity-90 cursor-pointer'
            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
        }`}
      >
        {canClaimDaily() ? (
          'Claim Daily Reward 🎁'
        ) : (
          `Claimed ✓ (${getTimeUntilNextClaim()}h until next)`
        )}
      </motion.button>

      <div className="grid md:grid-cols-3 gap-6">
        <Link to="/quests">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-arcade-dark/50 backdrop-blur border border-arcade-purple/50 rounded-lg p-6 hover:border-arcade-purple transition-colors"
          >
            <Sparkles className="text-arcade-purple mb-3" size={32} />
            <h3 className="text-xl font-bold mb-2">Quick Quests</h3>
            <p className="text-gray-400">Complete 5-15min challenges</p>
          </motion.div>
        </Link>

        <Link to="/raffles">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-arcade-dark/50 backdrop-blur border border-arcade-pink/50 rounded-lg p-6 hover:border-arcade-pink transition-colors"
          >
            <img src="/assets/icons/LiveRaffle.png" alt="Live Raffles" className="w-8 h-8 mb-3" />
            <h3 className="text-xl font-bold mb-2">Live Raffles</h3>
            <p className="text-gray-400">Enter to win big prizes</p>
          </motion.div>
        </Link>

        <Link to="/leaderboard">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-arcade-dark/50 backdrop-blur border border-arcade-yellow/50 rounded-lg p-6 hover:border-arcade-yellow transition-colors"
          >
            <Trophy className="text-arcade-yellow mb-3" size={32} />
            <h3 className="text-xl font-bold mb-2">Leaderboard</h3>
            <p className="text-gray-400">Compete for top spots</p>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}