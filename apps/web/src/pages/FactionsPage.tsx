import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Shield, Users, Zap } from 'lucide-react';

// Faction icon mapping
const factionIcons: Record<string, string> = {
  'BONK': '/assets/icons/BonkFaction.png',
  'BSC': '/assets/icons/BSCFaction.png',
  'PUMP': '/assets/icons/PumpFaction.png',
  'USD1': '/assets/icons/USD1Faction.png',
};

interface Faction {
  id: string;
  name: string;
  symbol: string;
  description: string;
  bonus_multiplier: number;
  color: string;
  member_count: number;
}

export default function FactionsPage() {
  const queryClient = useQueryClient();

  const { data: factions, isLoading: loadingFactions } = useQuery({
    queryKey: ['factions'],
    queryFn: api.factions.list,
  });

  const { data: userFaction, isLoading: loadingUserFaction } = useQuery({
    queryKey: ['userFaction'],
    queryFn: api.factions.me,
  });

  const joinMutation = useMutation({
    mutationFn: api.factions.join,
    onSuccess: () => {
      toast.success('Successfully joined faction!');
      queryClient.invalidateQueries({ queryKey: ['userFaction'] });
      queryClient.invalidateQueries({ queryKey: ['factions'] });
    },
    onError: (error: any) => {
      if (error.message === 'Unauthorized') {
        toast.error('Authentication required. Try refreshing the page or using the deployed app instead of localhost.');
      } else {
        toast.error(error.message || 'Failed to join faction');
      }
    },
  });

  const leaveMutation = useMutation({
    mutationFn: api.factions.leave,
    onSuccess: () => {
      toast.success('Left faction successfully');
      queryClient.invalidateQueries({ queryKey: ['userFaction'] });
      queryClient.invalidateQueries({ queryKey: ['factions'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to leave faction');
    },
  });

  const handleJoinFaction = (factionId: string) => {
    joinMutation.mutate(factionId);
  };

  const handleLeaveFaction = () => {
    if (confirm('Are you sure you want to leave your current faction?')) {
      leaveMutation.mutate();
    }
  };

  if (loadingFactions || loadingUserFaction) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Choose Your Faction</h1>
          <p className="text-gray-400">Loading factions...</p>
        </div>
      </div>
    );
  }

  const currentFaction = userFaction?.faction;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your Faction</h1>
        <p className="text-gray-400 mb-4">
          Join a faction to earn bonus multipliers and support your favorite tokens!
        </p>
        <div className="bg-arcade-dark/30 border border-white/10 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-sm text-gray-300 mb-2">
            <span className="text-arcade-yellow font-semibold">⚡ Dynamic Multipliers:</span>
            Faction bonus multipliers and benefits change based on how well your chosen tokens perform compared to others.
            Strong token performance = higher rewards for your faction!
          </p>
          {window.location.hostname === 'localhost' && (
            <p className="text-xs text-orange-400 bg-orange-400/10 rounded px-2 py-1">
              <strong>Dev Note:</strong> If you get "Unauthorized" error, use the deployed app instead of localhost for proper authentication
            </p>
          )}
        </div>
      </div>

      {currentFaction && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-arcade-dark/50 backdrop-blur border border-white/20 rounded-lg p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {factionIcons[currentFaction.symbol] ? (
                <img
                  src={factionIcons[currentFaction.symbol]}
                  alt={currentFaction.name}
                  className="w-12 h-12 rounded-lg object-contain"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ backgroundColor: currentFaction.color }}
                >
                  {currentFaction.symbol}
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-white">{currentFaction.name}</h3>
                <p className="text-gray-400">{currentFaction.description}</p>
                <p className="text-arcade-yellow font-semibold">
                  {currentFaction.bonus_multiplier}x multiplier
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-2">Current Faction</p>
              <button
                onClick={handleLeaveFaction}
                disabled={leaveMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {leaveMutation.isPending ? 'Leaving...' : 'Leave Faction'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {factions?.factions.map((faction: Faction, index: number) => (
          <motion.div
            key={faction.id}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-arcade-dark/50 backdrop-blur border rounded-lg p-6 transition-all hover:scale-105 ${
              currentFaction?.id === faction.id
                ? 'border-arcade-yellow shadow-lg shadow-arcade-yellow/20'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {factionIcons[faction.symbol] ? (
                  <img
                    src={factionIcons[faction.symbol]}
                    alt={faction.name}
                    className="w-16 h-16 rounded-lg object-contain"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
                    style={{ backgroundColor: faction.color }}
                  >
                    {faction.symbol}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">{faction.name}</h3>
                  <p className="text-arcade-yellow font-semibold">
                    {faction.bonus_multiplier}x Multiplier
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-gray-400">
                <Users size={16} />
                <span className="text-sm">{faction.member_count}</span>
              </div>
            </div>

            <p className="text-gray-300 mb-6 leading-relaxed">
              {faction.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <Zap size={16} className="text-arcade-yellow" />
                  <span className="text-gray-300">Bonus Rewards</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield size={16} className="text-arcade-blue" />
                  <span className="text-gray-300">Faction Benefits</span>
                </div>
              </div>

              {currentFaction?.id === faction.id ? (
                <div className="px-4 py-2 bg-arcade-yellow/20 text-arcade-yellow rounded-lg font-semibold">
                  Current Faction
                </div>
              ) : (
                <button
                  onClick={() => handleJoinFaction(faction.id)}
                  disabled={!!currentFaction || joinMutation.isPending}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    currentFaction
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'arcade-gradient text-white hover:opacity-90 active:scale-95'
                  }`}
                  style={!currentFaction ? {
                    background: `linear-gradient(135deg, ${faction.color}80, ${faction.color})`
                  } : undefined}
                >
                  {joinMutation.isPending ? 'Joining...' : 'Join Faction'}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {!currentFaction && (
        <div className="text-center mt-8 p-6 bg-arcade-dark/30 rounded-lg border border-white/10">
          <h3 className="text-lg font-semibold mb-2">Ready to Choose?</h3>
          <p className="text-gray-400">
            Each faction offers unique bonus multipliers for different token types.
            Choose wisely - you can only be in one faction at a time!
          </p>
        </div>
      )}
    </div>
  );
}