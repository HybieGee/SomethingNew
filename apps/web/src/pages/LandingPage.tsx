import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  Sparkles, Gift, Trophy, Zap, Clock, Users,
  TrendingUp, Coins, Gamepad2, Star, ArrowRight,
  ChevronRight, Check, Rocket, Timer, User
} from 'lucide-react';

interface LiveStats {
  totalUsers: number;
  activeUsers: number;
  totalPrizePool: number;
  activeRaffles: number;
}

export default function LandingPage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await api.public.stats();
        setLiveStats(stats);
      } catch (error) {
        console.error('Failed to fetch live stats:', error);
        // Fallback to mock data if API fails
        setLiveStats({
          totalUsers: 1250,
          activeUsers: 180,
          totalPrizePool: 75000,
          activeRaffles: 3
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Clock,
      title: "5-Minute Games",
      description: "Quick challenges that fit your schedule. Play, earn, repeat!",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Gift,
      title: "Hourly Raffles",
      description: "Enter massive prize pools every few hours with your tickets",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Trophy,
      title: "Season Rewards",
      description: "Compete for top spots and win from the season prize pool",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Zap,
      title: "Creator Boosts",
      description: "When creators win, everyone wins with global multipliers",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const games = [
    {
      name: "Price Predictions",
      time: "60 seconds",
      reward: "10-50 tickets",
      description: "Predict if crypto prices go up or down"
    },
    {
      name: "Tap Challenge",
      time: "10 seconds",
      reward: "5-25 tickets",
      description: "Test your speed in rapid-tap games"
    },
    {
      name: "Crypto Trivia",
      time: "2 minutes",
      reward: "15-40 tickets",
      description: "Answer questions, earn rewards"
    },
    {
      name: "Daily Login",
      time: "Instant",
      reward: "50+ tickets",
      description: "Build streaks for bigger rewards"
    }
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatCurrency = (num: number) => {
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num}`;
  };

  const stats = loading ? [
    { value: "...", label: "Active Players" },
    { value: "...", label: "Prize Pool" },
    { value: "...", label: "Live Games" },
    { value: "...", label: "Quick Plays" }
  ] : [
    {
      value: formatNumber(liveStats?.activeUsers || 0) + "+",
      label: "Active Players",
      subtext: `${formatNumber(liveStats?.totalUsers || 0)} total`
    },
    {
      value: "100%",
      label: "Creator Rewards",
      subtext: "All fees to prize pool"
    },
    { value: "24/7", label: "Live Games", subtext: "Always available" },
    { value: "5 Min", label: "Quick Plays", subtext: "Fast rewards" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900">
      {/* Navigation Header */}
      <nav className="relative z-50 px-4 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/assets/icons/PairLogo.png" alt="PairCade Logo" className="w-16 h-16 object-contain" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              PairCade
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <button className="px-6 py-2 bg-white/10 border border-white/20 rounded-lg font-medium hover:bg-white/20 transition-colors">
                Login
              </button>
            </Link>
            <Link to="/auth">
              <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-shadow">
                Sign Up Free
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: -10
              }}
              animate={{
                y: window.innerHeight + 10,
                x: Math.random() * window.innerWidth
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 5
              }}
            />
          ))}
        </div>

        <div className="relative container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">Powered by Solana</span>
            </motion.div>

            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Play Fast.
              </span>
              <br />
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Win Big.
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
              The ultimate arcade where every click counts. Play 5-minute games,
              <br className="hidden md:block" />
              earn tickets, and enter massive raffles every hour!
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-lg flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-shadow"
                >
                  Start Playing Free
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link to="/leaderboard">
                <button className="px-8 py-4 bg-white/10 border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-colors">
                  View Leaderboard
                </button>
              </Link>
            </div>

            {/* Live stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4"
                >
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                  {stat.subtext && (
                    <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-400">Get started in 3 simple steps</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                title: "Sign Up Free",
                desc: "Create account with username & Solana address. Get 100 free tickets!",
                icon: User
              },
              {
                step: "02",
                title: "Play Quick Games",
                desc: "Complete 5-minute challenges. Earn tickets with every win!",
                icon: Gamepad2
              },
              {
                step: "03",
                title: "Win Prizes",
                desc: "Enter raffles with tickets. Bigger pools every hour!",
                icon: Trophy
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-colors h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-4xl font-bold text-purple-400/30">{item.step}</span>
                    <item.icon className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
                {index < 2 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-8 h-8 text-purple-400/50" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Why Players Love Us
              </span>
            </h2>
            <p className="text-xl text-gray-400">Built for speed, designed for fun</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className="relative group"
              >
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 h-full hover:border-purple-500/50 transition-all hover:transform hover:scale-105">
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.color} mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
                {hoveredFeature === index && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl -z-10" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Games Showcase */}
      <section className="py-20 bg-black/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Quick Games, Big Rewards
              </span>
            </h2>
            <p className="text-xl text-gray-400">Always something to play, every 5 minutes</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game, index) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-green-500/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <Timer className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-400">{game.time}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{game.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{game.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Reward:</span>
                  <span className="text-yellow-400 font-bold">{game.reward}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur border border-purple-500/30 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    Pair Faction Rewards
                  </span>
                </h2>
                <p className="text-lg text-gray-300 mb-6">
                  When your Pair Faction succeeds, the entire faction shares in the benefits. All rewards automatically trigger:
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Bigger raffle prize pools",
                    "Global ticket multipliers (1.25x - 3x)",
                    "Seasonal championship rewards",
                    "Exclusive Pair Faction Events"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/creator-rewards">
                  <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/25 transition-shadow">
                    Learn About Pair Faction Rewards
                  </button>
                </Link>
              </div>
              <div className="relative">
                <div className="relative w-full h-64 md:h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl overflow-hidden">
                  {/* Background pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-4 left-4 w-20 h-20 border-2 border-white/30 rounded-lg rotate-12"></div>
                    <div className="absolute top-8 right-8 w-16 h-16 border-2 border-yellow-400/30 rounded-full"></div>
                    <div className="absolute bottom-8 left-8 w-12 h-12 border-2 border-purple-400/30 rounded-lg -rotate-12"></div>
                    <div className="absolute bottom-4 right-4 w-24 h-24 border-2 border-pink-400/30 rounded-full"></div>
                  </div>

                  {/* Main content layout */}
                  <div className="relative h-full flex items-center justify-between p-8">
                    {/* Left side - Image and title */}
                    <div className="flex flex-col items-center space-y-4">
                      <motion.img
                        src="/assets/icons/PairFaction.png"
                        alt="Pair Faction Rewards"
                        className="w-32 h-32 md:w-40 md:h-40 object-contain rounded-2xl"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      <div className="text-center">
                        <h4 className="text-lg md:text-xl font-bold text-white mb-1">Faction Rewards</h4>
                        <p className="text-sm text-purple-300">Unlock Team Benefits</p>
                      </div>
                    </div>

                    {/* Right side - Stats and benefits */}
                    <div className="flex-1 max-w-xs ml-8">
                      <div className="space-y-4">
                        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">Multiplier Range</span>
                            <span className="text-yellow-400 font-bold">1.25x - 3x</span>
                          </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">Prize Boost</span>
                            <span className="text-green-400 font-bold">Up to 100%</span>
                          </div>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">Faction Events</span>
                            <span className="text-purple-400 font-bold">Exclusive</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Animated background glow */}
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Ready to Start Winning?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of players earning tickets and winning prizes every day.
              Your first 100 tickets are on us!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-lg flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/25 transition-shadow"
                >
                  Play Now - It's Free!
                  <Sparkles className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              No wallet required • No download • Play instantly
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}