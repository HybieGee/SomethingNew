import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Gift, Timer, Users, Ticket } from 'lucide-react';

export default function RafflesPage() {
  const user = useAuthStore((state) => state.user);
  const updateTickets = useAuthStore((state) => state.updateTickets);
  const [selectedRaffle, setSelectedRaffle] = useState<string | null>(null);
  const [ticketAmount, setTicketAmount] = useState(1);

  const { data: raffles, refetch } = useQuery({
    queryKey: ['raffles'],
    queryFn: api.raffles.next,
    refetchInterval: 30000,
  });

  const handleEnterRaffle = async (raffleId: string) => {
    try {
      const result = await api.raffles.enter({ raffleId, tickets: ticketAmount });
      updateTickets(result.newBalance);
      toast.success(`Entered with ${ticketAmount} tickets! Total entries: ${result.totalEntries}`);
      refetch();
      setSelectedRaffle(null);
      setTicketAmount(1);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) {
      return 'Ended';
    }
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Live Raffles</h1>
        <p className="text-gray-400">Enter raffles and win big prizes!</p>
      </div>

      <div className="grid gap-6">
        {raffles?.raffles.map((raffle: any) => (
          <motion.div
            key={raffle.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-arcade-dark/50 backdrop-blur border border-white/10 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-1">{raffle.name}</h3>
                <p className="text-gray-400 text-sm">{raffle.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-arcade-yellow">
                  {raffle.prize_pool.toLocaleString()} 🎫
                </p>
                <p className="text-sm text-gray-400">Prize Pool</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <Timer className="text-arcade-blue mx-auto mb-1" size={20} />
                <p className="text-sm text-gray-400">Ends in</p>
                <p className="font-bold">{formatTimeRemaining(raffle.timeRemaining)}</p>
              </div>
              <div className="text-center">
                <Users className="text-arcade-green mx-auto mb-1" size={20} />
                <p className="text-sm text-gray-400">Entries</p>
                <p className="font-bold">{raffle.entryCount}</p>
              </div>
              <div className="text-center">
                <Ticket className="text-arcade-purple mx-auto mb-1" size={20} />
                <p className="text-sm text-gray-400">Cost</p>
                <p className="font-bold">{raffle.ticket_cost} 🎫</p>
              </div>
            </div>

            {raffle.status === 'active' && (
              <>
                {selectedRaffle === raffle.id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max={Math.min(raffle.max_entries_per_user, Math.floor((user?.tickets || 0) / raffle.ticket_cost))}
                        value={ticketAmount}
                        onChange={(e) => setTicketAmount(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="w-16 text-center font-bold">{ticketAmount}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEnterRaffle(raffle.id)}
                        className="flex-1 py-2 rounded-lg arcade-gradient text-white font-bold"
                      >
                        Enter ({ticketAmount * raffle.ticket_cost} 🎫)
                      </button>
                      <button
                        onClick={() => setSelectedRaffle(null)}
                        className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedRaffle(raffle.id)}
                    disabled={raffle.status !== 'active' || (user?.tickets || 0) < raffle.ticket_cost}
                    className="w-full py-3 rounded-lg arcade-gradient text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {raffle.status === 'upcoming' ? 'Starting Soon' : 'Enter Raffle'}
                  </button>
                )}
              </>
            )}

            {raffle.status === 'completed' && raffle.winners && (
              <div className="mt-4 p-3 bg-arcade-green/10 border border-arcade-green/30 rounded-lg">
                <p className="text-sm text-arcade-green font-bold mb-2">Winners:</p>
                <div className="space-y-1">
                  {raffle.winners.slice(0, 3).map((winner: any) => (
                    <p key={winner.userId} className="text-sm">
                      #{winner.position} {winner.username} - {winner.prize} 🎫
                    </p>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}