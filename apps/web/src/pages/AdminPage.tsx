import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Shield, DollarSign, Zap, ChartBar } from 'lucide-react';

export default function AdminPage() {
  const [adminToken, setAdminToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [claimData, setClaimData] = useState({
    tx: '',
    amount: 0,
    token: 'SOL',
    split: { seasonPool: 0.5, raffles: 0.3, boost: 0.2 },
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setAdminToken(token);
      setAuthenticated(true);
    }
  }, []);

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: api.admin.stats,
    enabled: authenticated,
    refetchInterval: 30000,
  });

  const handleAdminLogin = () => {
    if (adminToken) {
      localStorage.setItem('adminToken', adminToken);
      setAuthenticated(true);
      toast.success('Admin authenticated');
    }
  };

  const handleClaim = async () => {
    try {
      const result = await api.admin.claim(claimData);
      toast.success(`Claim processed! Season pool: ${result.seasonPool}`);
      setClaimData({
        tx: '',
        amount: 0,
        token: 'SOL',
        split: { seasonPool: 0.5, raffles: 0.3, boost: 0.2 },
      });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleBoost = async (multiplier: number, hours: number) => {
    try {
      const now = Date.now();
      await api.admin.boost({
        multiplier,
        startMs: now,
        endMs: now + hours * 60 * 60 * 1000,
      });
      toast.success(`${multiplier}x boost activated for ${hours} hours!`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <div className="bg-arcade-dark/50 backdrop-blur border border-white/10 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-arcade-red" size={24} />
            <h2 className="text-xl font-bold">Admin Authentication</h2>
          </div>
          <input
            type="password"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-arcade-purple"
            placeholder="Enter admin token"
          />
          <button
            onClick={handleAdminLogin}
            className="w-full py-3 rounded-lg arcade-gradient text-white font-bold"
          >
            Authenticate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Manage rewards and system</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-arcade-dark/50 border border-white/10 rounded-lg p-4">
            <ChartBar className="text-arcade-blue mb-2" size={20} />
            <p className="text-2xl font-bold">{stats.stats.totalUsers}</p>
            <p className="text-sm text-gray-400">Total Users</p>
          </div>
          <div className="bg-arcade-dark/50 border border-white/10 rounded-lg p-4">
            <DollarSign className="text-arcade-yellow mb-2" size={20} />
            <p className="text-2xl font-bold">{stats.stats.totalTickets?.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Total Tickets</p>
          </div>
          <div className="bg-arcade-dark/50 border border-white/10 rounded-lg p-4">
            <Zap className="text-arcade-purple mb-2" size={20} />
            <p className="text-2xl font-bold">{stats.stats.questsToday}</p>
            <p className="text-sm text-gray-400">Quests Today</p>
          </div>
          <div className="bg-arcade-dark/50 border border-white/10 rounded-lg p-4">
            <Shield className="text-arcade-green mb-2" size={20} />
            <p className="text-2xl font-bold">{stats.stats.completedRaffles}</p>
            <p className="text-sm text-gray-400">Raffles Done</p>
          </div>
          <div className="bg-arcade-dark/50 border border-white/10 rounded-lg p-4">
            <DollarSign className="text-arcade-pink mb-2" size={20} />
            <p className="text-2xl font-bold">{stats.stats.currentPrizePool?.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Prize Pool</p>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-arcade-dark/50 backdrop-blur border border-white/10 rounded-lg p-6"
      >
        <h2 className="text-xl font-bold mb-4">Process Creator Reward</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Transaction Hash</label>
            <input
              type="text"
              value={claimData.tx}
              onChange={(e) => setClaimData({ ...claimData, tx: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-arcade-purple"
              placeholder="0x..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount</label>
            <input
              type="number"
              value={claimData.amount}
              onChange={(e) => setClaimData({ ...claimData, amount: Number(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-arcade-purple"
              placeholder="1000"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Split Configuration</label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500">Season Pool</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={claimData.split.seasonPool}
                onChange={(e) =>
                  setClaimData({
                    ...claimData,
                    split: { ...claimData.split, seasonPool: Number(e.target.value) },
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Raffles</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={claimData.split.raffles}
                onChange={(e) =>
                  setClaimData({
                    ...claimData,
                    split: { ...claimData.split, raffles: Number(e.target.value) },
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Boost</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={claimData.split.boost}
                onChange={(e) =>
                  setClaimData({
                    ...claimData,
                    split: { ...claimData.split, boost: Number(e.target.value) },
                  })
                }
                className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleClaim}
          className="w-full py-3 rounded-lg arcade-gradient text-white font-bold"
        >
          Process Claim
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-arcade-dark/50 backdrop-blur border border-white/10 rounded-lg p-6"
      >
        <h2 className="text-xl font-bold mb-4">Quick Boosts</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleBoost(1.25, 1)}
            className="py-3 rounded-lg bg-arcade-green/20 border border-arcade-green/50 hover:bg-arcade-green/30"
          >
            1.25x for 1h
          </button>
          <button
            onClick={() => handleBoost(1.5, 2)}
            className="py-3 rounded-lg bg-arcade-blue/20 border border-arcade-blue/50 hover:bg-arcade-blue/30"
          >
            1.5x for 2h
          </button>
          <button
            onClick={() => handleBoost(2, 4)}
            className="py-3 rounded-lg bg-arcade-purple/20 border border-arcade-purple/50 hover:bg-arcade-purple/30"
          >
            2x for 4h
          </button>
          <button
            onClick={() => handleBoost(3, 1)}
            className="py-3 rounded-lg bg-arcade-pink/20 border border-arcade-pink/50 hover:bg-arcade-pink/30"
          >
            3x for 1h
          </button>
        </div>
      </motion.div>
    </div>
  );
}