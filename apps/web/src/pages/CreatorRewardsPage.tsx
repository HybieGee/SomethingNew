import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Rocket, TrendingUp, Users, Coins,
  Star, Zap, Gift, Trophy, Crown, Target,
  Calendar, BarChart3, DollarSign, Sparkles
} from 'lucide-react';

export default function CreatorRewardsPage() {
  const rewardTiers = [
    {
      threshold: "100",
      multiplier: "1.25x",
      prizeBoost: "10%",
      features: ["Global ticket multiplier", "Prize pool boost", "Faction member badge"]
    },
    {
      threshold: "500",
      multiplier: "1.5x",
      prizeBoost: "25%",
      features: ["Enhanced multiplier", "Bigger prize boost", "Special events access"]
    },
    {
      threshold: "1000",
      multiplier: "2x",
      prizeBoost: "50%",
      features: ["Double multiplier", "Major prize boost", "Faction spotlight"]
    },
    {
      threshold: "2500",
      multiplier: "3x",
      prizeBoost: "100%",
      features: ["Triple multiplier", "Prize pool doubling", "VIP faction status"]
    }
  ];

  const rewardMechanics = [
    {
      icon: DollarSign,
      title: "Faction Performance Tracking",
      description: "We monitor your chosen faction's token performance using real-time data",
      details: "Real-time tracking of faction token performance, price movements, and trading activity"
    },
    {
      icon: Zap,
      title: "Automatic Triggers",
      description: "When your faction reaches member milestones, rewards activate instantly",
      details: "No manual claims needed - multipliers and boosts activate when faction grows"
    },
    {
      icon: Users,
      title: "Faction Benefits",
      description: "Every faction member benefits when the faction grows and succeeds",
      details: "Faction multipliers mean all members win more tickets during faction success periods"
    },
    {
      icon: Trophy,
      title: "Seasonal Championships",
      description: "Faction success contributes to massive seasonal prize pools",
      details: "Quarterly championships with prizes funded by faction milestone achievements"
    }
  ];

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

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Custom Faction Rewards Graphic */}
            <motion.div
              className="mb-8 flex justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <img
                src="/assets/icons/PairFaction.png"
                alt="Pair Faction Rewards"
                className="w-48 h-48 md:w-64 md:h-64 object-contain rounded-2xl shadow-2xl shadow-purple-500/20 border-2 border-purple-500/30"
              />
            </motion.div>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full mb-6">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-300">Pair Faction Rewards Program</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                When Factions Grow,
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Members Win
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Our revolutionary reward system connects faction growth and success
              directly to member rewards in PairCade. The more your faction grows,
              the bigger your rewards become.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <BarChart3 className="w-8 h-8 text-green-400 mb-4" />
                <h3 className="text-lg font-bold mb-2">Real-Time Tracking</h3>
                <p className="text-gray-400 text-sm">Monitor token performance across all major metrics</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <Zap className="w-8 h-8 text-yellow-400 mb-4" />
                <h3 className="text-lg font-bold mb-2">Instant Rewards</h3>
                <p className="text-gray-400 text-sm">Automatic activation within minutes of milestones</p>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <Users className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="text-lg font-bold mb-2">Faction Benefits</h3>
                <p className="text-gray-400 text-sm">Every faction member benefits from faction success</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reward Tiers */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Milestone Rewards
              </span>
            </h2>
            <p className="text-xl text-gray-400">More faction members = Bigger member rewards</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rewardTiers.map((tier, index) => (
              <motion.div
                key={tier.threshold}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-yellow-500/50 transition-all hover:transform hover:scale-105"
              >
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">{tier.threshold}</div>
                  <div className="text-sm text-gray-400">Faction Members</div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Ticket Multiplier:</span>
                    <span className="font-bold text-green-400">{tier.multiplier}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Prize Boost:</span>
                    <span className="font-bold text-blue-400">{tier.prizeBoost}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-black/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                How Pair Faction Rewards Work
              </span>
            </h2>
            <p className="text-xl text-gray-400">Seamless integration with faction membership growth</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {rewardMechanics.map((mechanic, index) => (
              <motion.div
                key={mechanic.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-2xl p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                    <mechanic.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{mechanic.title}</h3>
                    <p className="text-gray-300 mb-3">{mechanic.description}</p>
                    <p className="text-sm text-gray-400">{mechanic.details}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Ready to Benefit from Faction Success?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join the only platform where faction growth directly boosts your rewards.
              The more your faction succeeds, the more you earn!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold text-lg flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/25 transition-shadow"
                >
                  Start Playing Now
                  <Rocket className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link to="/home">
                <button className="px-10 py-4 bg-white/10 border border-white/20 rounded-xl font-bold text-lg hover:bg-white/20 transition-colors">
                  Back to Home
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}