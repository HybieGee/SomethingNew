import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { User, Wallet, Award, TrendingUp, Calendar, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [newAddress, setNewAddress] = useState('');
  const [editing, setEditing] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: api.profile.me,
  });

  const handleUpdateAddress = async () => {
    try {
      await api.profile.updateAddress(newAddress);
      toast.success('Solana address updated!');
      setEditing(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-gray-400">Manage your account and view stats</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-arcade-dark/50 backdrop-blur border border-white/10 rounded-lg p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full arcade-gradient flex items-center justify-center text-3xl font-bold">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user?.username}</h2>
            <p className="text-gray-400">Member since {new Date(profile?.profile?.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <TrendingUp className="text-arcade-green mb-2" size={24} />
            <p className="text-2xl font-bold">{user?.streakDays}</p>
            <p className="text-sm text-gray-400">Day Streak</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <Award className="text-arcade-purple mb-2" size={24} />
            <p className="text-2xl font-bold">{profile?.profile?.badge_count || 0}</p>
            <p className="text-sm text-gray-400">Badges</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Wallet size={16} />
              Solana Address
            </label>
            {editing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-arcade-purple"
                  placeholder="Enter new address"
                />
                <button
                  onClick={handleUpdateAddress}
                  className="px-4 py-2 rounded-lg bg-arcade-green text-white font-bold"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-lg bg-white/10"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                <code className="text-sm">{profile?.profile?.solana_address}</code>
                <button
                  onClick={() => setEditing(true)}
                  className="text-arcade-purple hover:text-arcade-pink"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {profile?.profile?.badges && profile.profile.badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-arcade-dark/50 backdrop-blur border border-white/10 rounded-lg p-6"
        >
          <h3 className="text-xl font-bold mb-4">Your Badges</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
            {profile.profile.badges.map((badge: any) => (
              <div
                key={badge.id}
                className="text-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="text-3xl mb-2">🏆</div>
                <p className="text-sm font-bold">{badge.name}</p>
                <p className="text-xs text-gray-400 capitalize">{badge.tier}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-lg bg-arcade-red/20 border border-arcade-red/50 text-arcade-red font-bold hover:bg-arcade-red/30 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
}