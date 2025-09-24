import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Sparkles, Timer, TrendingUp, TrendingDown, Brain, MousePointer, CheckCircle, XCircle } from 'lucide-react';

interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
}

export default function QuestsPage() {
  const queryClient = useQueryClient();
  const updateTickets = useAuthStore((state) => state.updateTickets);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [tapCount, setTapCount] = useState(0);
  const [tapping, setTapping] = useState(false);
  const [activeQuestSlug, setActiveQuestSlug] = useState<string | null>(null);

  // Trivia state
  const [triviaSession, setTriviaSession] = useState<{
    sessionId: string;
    questions: TriviaQuestion[];
    answers: number[];
    currentQuestion: number;
  } | null>(null);

  const { data: quests, refetch, isLoading, error } = useQuery({
    queryKey: ['quests', Date.now()], // Cache busting key
    queryFn: api.quests.list,
    refetchInterval: 10000,
    retry: 3,
    retryDelay: 1000,
    staleTime: 0, // Force fresh requests
    cacheTime: 0, // Don't cache responses
  });

  // Debug logging
  console.log('Quests data:', quests);
  console.log('Quests error:', error);
  console.log('Quests loading:', isLoading);
  console.log('Auth state - user:', user);
  console.log('Auth state - isAuthenticated:', isAuthenticated);

  const handleSolanaPrediction = async (questSlug: string, choice: 'up' | 'down') => {
    try {
      const result = await api.quests.complete({ questSlug, choice });
      toast.info(result.message || 'Prediction recorded! Check back in 1 hour for results.');
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCheckPrediction = async (questSlug: string) => {
    try {
      const response = await fetch(`https://raffle-arcade-api.claudechaindev.workers.dev/quests/prediction/check?quest=${questSlug}`, {
        credentials: 'include'
      });
      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        updateTickets(result.newTickets);
      } else {
        toast.info(result.message);
      }
      refetch();
    } catch (error: any) {
      toast.error('Failed to check prediction');
    }
  };

  const handleStartTapChallenge = (questSlug: string) => {
    setActiveQuestSlug(questSlug);
    setTapping(true);
    setTapCount(0);

    // 10 second timer
    setTimeout(() => {
      setTapping(false);
      // Auto-submit immediately when timer ends
      const finalScore = tapCount;
      setTapCount(0);
      if (finalScore > 0) {
        submitTapScore(questSlug, finalScore);
      } else {
        setActiveQuestSlug(null);
      }
    }, 10000);
  };

  const submitTapScore = async (questSlug: string, score: number) => {
    try {
      const result = await api.quests.complete({ questSlug, score });
      updateTickets((result as any).newTickets);
      toast.success(`Earned ${result.reward} tickets! Score: ${score}`);
      setTapCount(0);
      setActiveQuestSlug(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message);
      setTapCount(0);
      setActiveQuestSlug(null);
    }
  };

  const startTrivia = async (questSlug: string) => {
    try {
      const response = await fetch('https://raffle-arcade-api.claudechaindev.workers.dev/quests/trivia', {
        credentials: 'include'
      });
      const data = await response.json();

      setTriviaSession({
        sessionId: data.sessionId,
        questions: data.questions,
        answers: [],
        currentQuestion: 0
      });
      setActiveQuestSlug(questSlug);
    } catch (error) {
      toast.error('Failed to start trivia');
    }
  };

  const answerTriviaQuestion = (answerIndex: number) => {
    if (!triviaSession) return;

    const newAnswers = [...triviaSession.answers, answerIndex];

    if (triviaSession.currentQuestion < triviaSession.questions.length - 1) {
      // Move to next question
      setTriviaSession({
        ...triviaSession,
        answers: newAnswers,
        currentQuestion: triviaSession.currentQuestion + 1
      });
    } else {
      // Submit trivia
      submitTrivia(newAnswers);
    }
  };

  const submitTrivia = async (answers: number[]) => {
    if (!triviaSession || !activeQuestSlug) return;

    try {
      const response = await fetch('https://raffle-arcade-api.claudechaindev.workers.dev/quests/trivia/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sessionId: triviaSession.sessionId,
          answers,
          questSlug: activeQuestSlug
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Scored ${result.correctAnswers}/${result.totalQuestions}! Earned ${result.reward} tickets`);
        updateTickets(result.newTickets);

        // Show results briefly
        setTimeout(() => {
          setTriviaSession(null);
          setActiveQuestSlug(null);
          refetch();
        }, 3000);
      }
    } catch (error) {
      toast.error('Failed to submit trivia');
    }
  };

  const handleLaunchpadPrediction = async (questSlug: string, choice: 'bonk' | 'pump' | 'curve') => {
    try {
      const result = await api.quests.complete({ questSlug, choice });
      toast.success(`Prediction recorded! You chose ${choice.toUpperCase()}. Check back in 2 hours for results.`);
      updateTickets(result.newTickets);
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFactionLoyalty = async (questSlug: string) => {
    try {
      const result = await api.quests.complete({ questSlug });

      if (result.trackingStarted) {
        toast.success(result.message || 'Faction loyalty tracking started! Stay in your faction for 24 hours');
      } else {
        toast.success(`Earned ${result.reward} tickets! Faction loyalty bonus complete!`);
        updateTickets(result.newTickets);
      }

      refetch();
    } catch (error: any) {
      // Handle specific error cases
      if (error.message.includes('hours remaining')) {
        toast.info(error.message);
      } else {
        toast.error(error.message);
      }
    }
  };

  const formatCooldown = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Quick Quests</h1>
          <p className="text-gray-400">Loading quests...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arcade-purple"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    const isAuthError = error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('401'));

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Quick Quests</h1>
          <p className="text-gray-400">Complete challenges to earn tickets!</p>
        </div>
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">
            {isAuthError ? 'Authentication Error' : 'Failed to Load Quests'}
          </h2>
          <p className="text-red-300 mb-4">
            {isAuthError ?
              'Your session has expired. Please refresh the page and log in again.' :
              (error instanceof Error ? error.message : 'Unknown error occurred')
            }
          </p>
          <div className="space-y-2">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors mr-2"
            >
              Try Again
            </button>
            {isAuthError && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Refresh Page
              </button>
            )}
          </div>
          <div className="mt-4 p-3 bg-gray-800/50 rounded text-xs text-gray-400 text-left">
            <strong>Debug Info:</strong><br />
            Error: {error instanceof Error ? error.message : 'Unknown error'}<br />
            Auth State: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}<br />
            User: {user ? `${user.username} (${user.tickets} tickets)` : 'No user data'}
          </div>
        </div>
      </div>
    );
  }

  // Show authentication required state
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Quick Quests</h1>
          <p className="text-gray-400">Complete challenges to earn tickets!</p>
        </div>
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-yellow-400 mb-2">Authentication Required</h2>
          <p className="text-yellow-300 mb-4">
            Please log in to access quests and earn tickets!
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
          >
            Go to Login
          </button>
          <div className="mt-4 p-3 bg-gray-800/50 rounded text-xs text-gray-400 text-left">
            <strong>Debug Info:</strong><br />
            Auth State: Not Authenticated<br />
            User: No user data
          </div>
        </div>
      </div>
    );
  }

  // Show no quests state
  if (!quests?.quests || quests.quests.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Quick Quests</h1>
          <p className="text-gray-400">Complete challenges to earn tickets!</p>
        </div>
        <div className="bg-arcade-dark/50 border border-white/20 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2">No Quests Available</h2>
          <p className="text-gray-400 mb-4">Check back later for new quests!</p>
          <div className="mt-4 p-3 bg-gray-800/50 rounded text-xs text-gray-400 text-left">
            <strong>Debug Info:</strong><br />
            Auth State: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}<br />
            User: {user ? `${user.username} (${user.tickets} tickets)` : 'No user data'}<br />
            Quests Response: {JSON.stringify(quests)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Quick Quests</h1>
        <p className="text-gray-400">Complete challenges to earn tickets!</p>
      </div>

      {/* Trivia Modal */}
      {triviaSession && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-arcade-dark border border-white/20 rounded-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">
              Memecoin Trivia - Question {triviaSession.currentQuestion + 1}/{triviaSession.questions.length}
            </h2>
            <p className="text-lg mb-6">{triviaSession.questions[triviaSession.currentQuestion].question}</p>
            <div className="space-y-3">
              {triviaSession.questions[triviaSession.currentQuestion].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => answerTriviaQuestion(idx)}
                  className="w-full p-3 text-left rounded-lg bg-arcade-dark/50 border border-white/10 hover:border-arcade-purple transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

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

                {/* Show active prediction status */}
                {quest.activePrediction && (
                  <div className="mt-2 p-2 bg-arcade-purple/20 rounded">
                    <p className="text-sm text-arcade-purple">
                      Active prediction: {quest.activePrediction.prediction.toUpperCase()}
                      from ${quest.activePrediction.initialPrice.toFixed(2)}
                    </p>
                  </div>
                )}
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

            {/* Solana Prediction */}
            {quest.slug === 'solana_prediction' && (
              <div>
                {quest.activePrediction ? (
                  <button
                    onClick={() => handleCheckPrediction(quest.slug)}
                    className="w-full py-3 rounded-lg bg-arcade-purple text-white font-bold hover:opacity-90"
                  >
                    Check Prediction Result
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSolanaPrediction(quest.slug, 'up')}
                      disabled={!quest.available}
                      className="flex-1 py-3 rounded-lg bg-arcade-green/20 border border-arcade-green/50 hover:bg-arcade-green/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <TrendingUp className="inline mr-2" size={18} />
                      SOL Goes UP
                    </button>
                    <button
                      onClick={() => handleSolanaPrediction(quest.slug, 'down')}
                      disabled={!quest.available}
                      className="flex-1 py-3 rounded-lg bg-arcade-red/20 border border-arcade-red/50 hover:bg-arcade-red/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <TrendingDown className="inline mr-2" size={18} />
                      SOL Goes DOWN
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tap Challenge */}
            {quest.slug === 'tap_challenge' && (
              <div>
                {!tapping || activeQuestSlug !== quest.slug ? (
                  <button
                    onClick={() => handleStartTapChallenge(quest.slug)}
                    disabled={!quest.available}
                    className="w-full py-3 rounded-lg arcade-gradient text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    <MousePointer className="inline mr-2" size={18} />
                    Start Tapping Challenge!
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
              </div>
            )}

            {/* Memecoin Trivia */}
            {quest.slug === 'memecoin_trivia' && (
              <button
                onClick={() => startTrivia(quest.slug)}
                disabled={!quest.available}
                className="w-full py-3 rounded-lg arcade-gradient text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <Brain className="inline mr-2" size={18} />
                Start Memecoin Trivia
              </button>
            )}

            {/* Crypto IQ Challenge */}
            {quest.slug === 'crypto_iq_challenge' && (
              <button
                onClick={() => startTrivia(quest.slug)}
                disabled={!quest.available}
                className="w-full py-3 rounded-lg arcade-gradient text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <Brain className="inline mr-2" size={18} />
                Start Crypto IQ Challenge
              </button>
            )}

            {/* Whale Hunting */}
            {quest.slug === 'whale_hunt' && (
              <div>
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-3">Which launchpad will have the most volume?</p>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => handleLaunchpadPrediction(quest.slug, 'bonk')}
                      disabled={!quest.available}
                      className="py-2 rounded-lg bg-orange-500/20 border border-orange-500/50 hover:bg-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      🟠 Bonk
                    </button>
                    <button
                      onClick={() => handleLaunchpadPrediction(quest.slug, 'pump')}
                      disabled={!quest.available}
                      className="py-2 rounded-lg bg-purple-500/20 border border-purple-500/50 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      🟣 Pump.fun
                    </button>
                    <button
                      onClick={() => handleLaunchpadPrediction(quest.slug, 'curve')}
                      disabled={!quest.available}
                      className="py-2 rounded-lg bg-blue-500/20 border border-blue-500/50 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      🔵 Virtual Curve
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Faction Loyalty Bonus */}
            {quest.slug === 'faction_loyalty' && (
              <div>
                <button
                  onClick={() => handleFactionLoyalty(quest.slug)}
                  disabled={!quest.available}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  <Sparkles className="inline mr-2" size={18} />
                  Claim Faction Loyalty Bonus
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Stay in your current faction for 24 hours to earn bonus tickets
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}