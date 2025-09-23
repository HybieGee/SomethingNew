import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Sparkles, Timer, TrendingUp, TrendingDown, Hash } from 'lucide-react';

export default function QuestsPage() {
  const updateTickets = useAuthStore((state) => state.updateTickets);
  const [tapCount, setTapCount] = useState(0);
  const [tapping, setTapping] = useState(false);
  const [prediction, setPrediction] = useState<'up' | 'down' | null>(null);

  const { data: quests, refetch } = useQuery({
    queryKey: ['quests'],
    queryFn: api.quests.list,
    refetchInterval: 10000,
  });

  const handleUpDownCall = async (questSlug: string, choice: 'up' | 'down') => {
    setPrediction(choice);
    try {
      const result = await api.quests.complete({ questSlug, choice });
      toast.info('Prediction recorded! Check back in 60 seconds for results.');
      setTimeout(() => {
        refetch();
        setPrediction(null);
      }, 60000);
    } catch (error: any) {
      toast.error(error.message);
      setPrediction(null);
    }
  };

  const handleTapChallenge = async (questSlug: string) => {
    setTapping(true);
    setTapCount(0);

    const interval = setInterval(() => {
      setTapCount(0);
      setTapping(false);
      clearInterval(interval);
    }, 10000);
  };

  const submitTapScore = async (questSlug: string) => {
    try {
      const result = await api.quests.complete({ questSlug, score: tapCount });
      updateTickets((result as any).newTickets);
      toast.success(`Earned ${result.reward} tickets! Score: ${tapCount}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const formatCooldown = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Quick Quests</h1>
        <p className="text-gray-400">Complete challenges every 5-15 minutes!</p>
      </div>

      <div className="grid gap-6">
        {quests?.quests.map((quest: any) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-arcade-dark/50 backdrop-blur border border-white/10 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">{quest.name}</h3>
                <p className="text-gray-400 text-sm">{quest.description}</p>
              </div>
              <div className="text-right">
                <p className="text-arcade-yellow font-bold">
                  {quest.min_reward} - {quest.max_reward} 🎫
                </p>
                {!quest.available && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <Timer size={14} />
                    {formatCooldown(quest.cooldownRemaining)}
                  </p>
                )}
              </div>
            </div>

            {quest.type === 'up_down_call' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpDownCall(quest.slug, 'up')}
                  disabled={!quest.available || prediction !== null}
                  className="flex-1 py-3 rounded-lg bg-arcade-green/20 border border-arcade-green/50 hover:bg-arcade-green/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <TrendingUp className="inline mr-2" size={18} />
                  Predict UP
                </button>
                <button
                  onClick={() => handleUpDownCall(quest.slug, 'down')}
                  disabled={!quest.available || prediction !== null}
                  className="flex-1 py-3 rounded-lg bg-arcade-red/20 border border-arcade-red/50 hover:bg-arcade-red/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <TrendingDown className="inline mr-2" size={18} />
                  Predict DOWN
                </button>
              </div>
            )}

            {quest.type === 'tap_challenge' && (
              <div>
                {!tapping ? (
                  <button
                    onClick={() => handleTapChallenge(quest.slug)}
                    disabled={!quest.available}
                    className="w-full py-3 rounded-lg arcade-gradient text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    Start Tapping!
                  </button>
                ) : (
                  <div className="text-center">
                    <motion.button
                      animate={{ scale: [1, 0.95, 1] }}
                      transition={{ duration: 0.1 }}
                      onClick={() => setTapCount(tapCount + 1)}
                      className="w-32 h-32 rounded-full arcade-gradient text-white text-3xl font-bold mx-auto mb-4"
                    >
                      TAP!
                    </motion.button>
                    <p className="text-2xl font-bold mb-2">Score: {tapCount}</p>
                    <p className="text-sm text-gray-400">Keep tapping for 10 seconds!</p>
                  </div>
                )}
                {tapCount > 0 && !tapping && (
                  <button
                    onClick={() => submitTapScore(quest.slug)}
                    className="w-full py-3 rounded-lg bg-arcade-purple text-white font-bold mt-4"
                  >
                    Submit Score: {tapCount}
                  </button>
                )}
              </div>
            )}

            {quest.type === 'trivia' && (
              <button
                disabled={!quest.available}
                className="w-full py-3 rounded-lg arcade-gradient text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                Start Trivia
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}