import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Zap,
  Users,
  Coins,
  Trophy,
  Sparkles,
  Target,
  TrendingUp,
  Globe,
  Gift,
  Star
} from 'lucide-react';

interface RoadmapItem {
  title: string;
  description: string;
  quarter: string;
  status: 'completed' | 'in-progress' | 'planned';
  category: 'features' | 'marketing' | 'economy';
  icon: any;
}

const roadmapItems: RoadmapItem[] = [
  // Q4 2025
  {
    title: 'Enhanced Quest System',
    description: 'New quest types including DeFi challenges, cross-chain activities, and seasonal events',
    quarter: 'Q4 2025',
    status: 'planned',
    category: 'features',
    icon: Target
  },
  {
    title: 'Advanced Faction Wars',
    description: 'Team-based competitions, faction-exclusive rewards, and dynamic bonus multipliers',
    quarter: 'Q4 2025',
    status: 'planned',
    category: 'features',
    icon: Users
  },
  {
    title: 'Ticket-to-SOL Exchange',
    description: 'Direct conversion system allowing users to cash out accumulated tickets for SOL',
    quarter: 'Q4 2025',
    status: 'planned',
    category: 'economy',
    icon: Coins
  },
  {
    title: 'Partner Marketing Launch',
    description: 'Strategic partnerships with major DeFi protocols and meme coin projects',
    quarter: 'Q4 2025',
    status: 'planned',
    category: 'marketing',
    icon: Globe
  },

  // Q1 2026
  {
    title: 'NFT Integration',
    description: 'Profile NFTs, achievement badges as NFTs, and special edition collectibles',
    quarter: 'Q1 2026',
    status: 'planned',
    category: 'features',
    icon: Star
  },
  {
    title: 'Mobile App Beta',
    description: 'iOS and Android native applications with push notifications and offline features',
    quarter: 'Q1 2026',
    status: 'planned',
    category: 'features',
    icon: Zap
  },
  {
    title: 'Influencer Partnerships',
    description: 'Collaborations with crypto influencers and content creators for user acquisition',
    quarter: 'Q1 2026',
    status: 'planned',
    category: 'marketing',
    icon: TrendingUp
  },
  {
    title: 'Premium Subscription',
    description: 'Premium tier with exclusive quests, higher rewards, and VIP features',
    quarter: 'Q1 2026',
    status: 'planned',
    category: 'economy',
    icon: Trophy
  },

  // Q2 2026
  {
    title: 'Social Features',
    description: 'Friend system, leaderboards sharing, guild creation, and social challenges',
    quarter: 'Q2 2026',
    status: 'planned',
    category: 'features',
    icon: Users
  },
  {
    title: 'Cross-Chain Expansion',
    description: 'Support for Ethereum, Polygon, and other major blockchain networks',
    quarter: 'Q2 2026',
    status: 'planned',
    category: 'features',
    icon: Globe
  },
  {
    title: 'Creator Revenue Share',
    description: 'Revenue sharing program with content creators and community contributors',
    quarter: 'Q2 2026',
    status: 'planned',
    category: 'economy',
    icon: Gift
  },
  {
    title: 'Global Marketing Campaign',
    description: 'International expansion with localized content and regional partnerships',
    quarter: 'Q2 2026',
    status: 'planned',
    category: 'marketing',
    icon: Globe
  },

  // Q3 2026
  {
    title: 'Advanced Analytics',
    description: 'Personal performance dashboards, predictive insights, and advanced statistics',
    quarter: 'Q3 2026',
    status: 'planned',
    category: 'features',
    icon: TrendingUp
  },
  {
    title: 'Governance Token Launch',
    description: 'Community governance token for platform decisions and exclusive benefits',
    quarter: 'Q3 2026',
    status: 'planned',
    category: 'economy',
    icon: Sparkles
  },
  {
    title: 'Institutional Partnerships',
    description: 'Enterprise partnerships with major crypto exchanges and financial institutions',
    quarter: 'Q3 2026',
    status: 'planned',
    category: 'marketing',
    icon: Trophy
  },
  {
    title: 'AR/VR Integration',
    description: 'Augmented and virtual reality experiences for next-generation gaming',
    quarter: 'Q3 2026',
    status: 'planned',
    category: 'features',
    icon: Zap
  }
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'features': return 'from-blue-500 to-purple-500';
    case 'marketing': return 'from-green-500 to-teal-500';
    case 'economy': return 'from-yellow-500 to-orange-500';
    default: return 'from-gray-500 to-gray-600';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'features': return Zap;
    case 'marketing': return TrendingUp;
    case 'economy': return Coins;
    default: return Target;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return CheckCircle;
    case 'in-progress': return Clock;
    case 'planned': return Calendar;
    default: return Clock;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'text-green-400';
    case 'in-progress': return 'text-yellow-400';
    case 'planned': return 'text-blue-400';
    default: return 'text-gray-400';
  }
};

export default function RoadmapPage() {
  const quarters = ['Q4 2025', 'Q1 2026', 'Q2 2026', 'Q3 2026'];

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

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-6">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Development Roadmap</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              The Future
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Our ambitious roadmap for Q4 2025 through Q3 2026
          </p>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300">Features</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-300">Marketing</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-300">Economy</span>
            </div>
          </div>
        </motion.div>

        {/* Roadmap Timeline */}
        <div className="space-y-12">
          {quarters.map((quarter, quarterIndex) => {
            const quarterItems = roadmapItems.filter(item => item.quarter === quarter);

            return (
              <motion.div
                key={quarter}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: quarterIndex * 0.1 }}
                className="relative"
              >
                {/* Quarter Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">{quarter}</h2>
                    <p className="text-gray-400">
                      {quarterItems.length} major initiatives planned
                    </p>
                  </div>
                </div>

                {/* Quarter Items */}
                <div className="ml-6 pl-6 border-l-2 border-gray-700">
                  <div className="grid md:grid-cols-2 gap-6">
                    {quarterItems.map((item, itemIndex) => {
                      const ItemIcon = item.icon;
                      const StatusIcon = getStatusIcon(item.status);
                      const CategoryIcon = getCategoryIcon(item.category);

                      return (
                        <motion.div
                          key={`${quarter}-${itemIndex}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: quarterIndex * 0.1 + itemIndex * 0.05 }}
                          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getCategoryColor(item.category)} flex items-center justify-center`}>
                                <ItemIcon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-white">{item.title}</h3>
                                <div className="flex items-center gap-2">
                                  <CategoryIcon className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-400 capitalize">{item.category}</span>
                                </div>
                              </div>
                            </div>
                            <StatusIcon className={`w-5 h-5 ${getStatusColor(item.status)}`} />
                          </div>

                          <p className="text-gray-300 text-sm leading-relaxed">
                            {item.description}
                          </p>

                          <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Timeline</span>
                              <span className="text-gray-400 font-medium">{item.quarter}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16 p-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl"
        >
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Join the Journey
            </span>
          </h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Be part of the future of crypto gaming. Start earning tickets today and shape the development
            of RAFFLE Arcade through community feedback and governance participation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-shadow">
                Get Started
              </button>
            </Link>
            <Link to="/home">
              <button className="px-8 py-3 bg-white/10 border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-colors">
                Explore Platform
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}