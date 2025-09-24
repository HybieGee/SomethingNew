import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { Trophy, Medal, Award, Crown, Star, ArrowLeft, Sparkles, Coins } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900">
      {/* Navigation */}
      <div className="p-4">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full mb-6">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-300">Season Leaderboard</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Top Players
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Compete for the ultimate bragging rights and seasonal rewards
          </p>

          {/* Season Info */}
          <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
              <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Current Season</p>
              <p className="font-bold">Season 1</p>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
              <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Prize Pool</p>
              <p className="font-bold text-green-400">$50K</p>
            </div>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
              <Star className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Time Left</p>
              <p className="font-bold">28 days</p>
            </div>
          </div>
        </motion.div>

        {/* Top 3 Podium */}
        {leaderboard?.leaderboard && leaderboard.leaderboard.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {/* 2nd Place */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 backdrop-blur border border-gray-400/30 rounded-2xl p-6 text-center mt-8"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">
                    {leaderboard.leaderboard[1]?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <Medal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-bold text-lg">{leaderboard.leaderboard[1]?.username}</p>
                <p className="text-2xl font-bold text-gray-400 mb-2">
                  {leaderboard.leaderboard[1]?.tickets.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">tickets</p>
              </motion.div>

              {/* 1st Place */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur border border-yellow-500/30 rounded-2xl p-6 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">
                    {leaderboard.leaderboard[0]?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                <p className="font-bold text-xl">{leaderboard.leaderboard[0]?.username}</p>
                <p className="text-3xl font-bold text-yellow-400 mb-2">
                  {leaderboard.leaderboard[0]?.tickets.toLocaleString()}
                </p>
                <p className="text-sm text-gray-400">tickets</p>
                <div className="mt-4 px-3 py-1 bg-yellow-500/20 rounded-full">
                  <p className="text-xs text-yellow-300">👑 CHAMPION</p>
                </div>
              </motion.div>

              {/* 3rd Place */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur border border-orange-600/30 rounded-2xl p-6 text-center mt-8"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-600 to-red-600 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">
                    {leaderboard.leaderboard[2]?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <Award className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="font-bold text-lg">{leaderboard.leaderboard[2]?.username}</p>
                <p className="text-2xl font-bold text-orange-600 mb-2">
                  {leaderboard.leaderboard[2]?.tickets.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">tickets</p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Full Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold mb-6 text-center">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Full Rankings
            </span>
          </h2>

          <div className="space-y-3">
            {leaderboard?.leaderboard.map((entry: any, index: number) => (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.03 }}
                className={`bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border ${getRankStyle(entry.rank)} rounded-xl p-4 hover:border-purple-500/50 transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {entry.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-lg">{entry.username}</p>
                        <div className="flex gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {entry.badges} badges
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {entry.streakDays} day streak
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-transparent bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text flex items-center gap-1">
                      <Coins className="w-5 h-5 text-yellow-400" />
                      {entry.tickets.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400">tickets</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center mt-12"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-shadow">
                Join the Competition
              </button>
            </Link>
            <Link to="/home">
              <button className="px-8 py-3 bg-white/10 border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-colors">
                Back to Games
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}