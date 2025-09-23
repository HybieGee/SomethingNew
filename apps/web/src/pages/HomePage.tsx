import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Gift, Sparkles, Trophy, Timer, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const updateTickets = useAuthStore((state) => state.updateTickets);

  const { data: profile, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: api.profile.me,
    refetchInterval: 30000,
  });

  const handleClaimDaily = async () => {
    try {
      const result = await api.profile.claimDaily();
      updateTickets(result.newTickets);
      toast.success(`Claimed ${result.reward} tickets! Streak: ${result.streakDays} days`);
      refetch();
    } catch (error: any) {
      if (error.status === 429) {
        toast.error(`Already claimed! Next claim in ${error.message.nextClaimIn} hours`);
      } else {
        toast.error(error.message);
      }
    }
  };

  const quickStats = [
    { label: 'Total Tickets', value: user?.tickets || 0, icon: Trophy, color: 'text-arcade-yellow' },
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-arcade-dark/50 backdrop-blur border border-white/10 rounded-lg p-4"
            >
              <Icon className={`${stat.color} mb-2`} size={24} />
              <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClaimDaily}
        className="w-full py-6 rounded-xl arcade-gradient font-bold text-xl text-white hover:opacity-90 transition-opacity"
      >
        Claim Daily Reward 🎁
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
            <Gift className="text-arcade-pink mb-3" size={32} />
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