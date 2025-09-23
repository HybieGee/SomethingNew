import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { User, Key, Wallet } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [solanaAddress, setSolanaAddress] = useState('');
  const [savedRecoveryCode, setSavedRecoveryCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(username, recoveryCode);
        toast.success('Welcome back!');
      } else {
        await register(username, solanaAddress);
        const newRecoveryCode = useAuthStore.getState().recoveryCode;
        setSavedRecoveryCode(newRecoveryCode);
        toast.success('Account created successfully!');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.h1
            className="text-6xl font-bold arcade-gradient bg-clip-text text-transparent mb-2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            RAFFLE Arcade
          </motion.h1>
          <p className="text-gray-400">Win Big, Play Quick!</p>
        </div>

        <div className="bg-arcade-dark/50 backdrop-blur border border-white/10 rounded-xl p-6 card-glow">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-arcade-purple text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-arcade-purple text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-arcade-purple"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            {mode === 'login' ? (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Recovery Code</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-arcade-purple"
                    placeholder="Enter recovery code"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Solana Address</label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={solanaAddress}
                    onChange={(e) => setSolanaAddress(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-arcade-purple"
                    placeholder="Enter Solana address"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg arcade-gradient font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </form>

          {savedRecoveryCode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-arcade-green/20 border border-arcade-green/50 rounded-lg"
            >
              <p className="text-sm text-arcade-green font-bold mb-2">Save Your Recovery Code!</p>
              <code className="block p-2 bg-black/30 rounded text-xs break-all">
                {savedRecoveryCode}
              </code>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}