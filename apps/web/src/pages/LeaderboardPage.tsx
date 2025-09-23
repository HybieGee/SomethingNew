import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Trophy, Medal, Award } from 'lucide-react';

export default function LeaderboardPage() {
  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.profile.leaderboard('current'),
    refetchInterval: 60000,
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={24} />;
    if (rank === 2) return <Medal className="text-gray-400" size={24} />;
    if (rank === 3) return <Award className="text-orange-600" size={24} />;
    return <span className="text-xl font-bold text-gray-500">#{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'border-yellow-500/50 bg-yellow-500/10';
    if (rank === 2) return 'border-gray-400/50 bg-gray-400/10';
    if (rank === 3) return 'border-orange-600/50 bg-orange-600/10';
    return 'border-white/10';
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-gray-400">Top players this season</p>
      </div>

      <div className="space-y-3">
        {leaderboard?.leaderboard.map((entry: any, index: number) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-arcade-dark/50 backdrop-blur border ${getRankStyle(entry.rank)} rounded-lg p-4`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div>
                  <p className="font-bold text-lg">{entry.username}</p>
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>{entry.badges} badges</span>
                    <span>{entry.streakDays} day streak</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-arcade-yellow">
                  {entry.tickets.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">tickets</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}