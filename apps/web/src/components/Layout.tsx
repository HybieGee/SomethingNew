import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Gamepad2, Gift, ShoppingBag, User, BarChart3, Sparkles, Shield, Calendar, Coins, Bug } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { CONTRACT_CONFIG, getFormattedCA } from '@/config/contract';

const navItems = [
  { path: '/home', label: 'Home', icon: Gamepad2 },
  { path: '/quests', label: 'Quests', icon: Sparkles },
  { path: '/raffles', label: 'Raffles', icon: Gift },
  { path: '/factions', label: 'Factions', icon: Shield },
  { path: '/conversion', label: 'Conversion', icon: Coins },
  { path: '/store', label: 'Store', icon: ShoppingBag },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/roadmap', label: 'Roadmap', icon: Calendar },
  { path: '/bug-report', label: 'Bug Report', icon: Bug },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-arcade-darker">
      <header className="border-b border-white/10 bg-arcade-dark/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/assets/icons/PairLogo.png"
                alt="PairCade Logo"
                className="w-16 h-16 object-contain"
              />
              <h1 className="text-2xl font-bold arcade-gradient bg-clip-text text-transparent">
                PairCade
              </h1>
            </Link>

            {/* CA Display - Controlled by config */}
            {CONTRACT_CONFIG.SHOW_CONTRACT_ADDRESS && (
              <div className="lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
                <span className="text-sm text-yellow-300">CA:</span>
                <code className="text-xs font-mono text-yellow-200 bg-black/20 px-2 py-1 rounded">
                  {getFormattedCA()}
                </code>
              </div>
            )}

            <div className="flex items-center gap-6">
              {user && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Tickets</p>
                    <p className="text-xl font-bold text-arcade-yellow">
                      🎫 {user.tickets.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Streak</p>
                    <p className="text-xl font-bold text-arcade-green">
                      {user.streakDays} 🔥
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-40 border-b border-white/10 bg-arcade-dark/80 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-arcade-purple text-white'
                      : 'hover:bg-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}