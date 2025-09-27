import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Coins,
  ArrowRight,
  Calculator,
  TrendingUp,
  Clock,
  Shield,
  Zap,
  Gift,
  AlertCircle,
  CheckCircle,
  Wallet
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export default function ConversionPage() {
  const user = useAuthStore((state) => state.user);
  const currentTickets = user?.tickets || 0;

  const [conversionRate, setConversionRate] = useState({
    ticketsPerSOL: 100000,
    minTicketsRequired: 1000,
    maxTicketsAllowed: 1000000
  });
  const [eligibility, setEligibility] = useState({
    eligible: false,
    pairBalance: 0,
    holdingDuration: 0,
    requiredHours: 1,
    message: 'Checking eligibility...'
  });
  const [ticketsToConvert, setTicketsToConvert] = useState(Math.min(100000, currentTickets));
  const [isConverting, setIsConverting] = useState(false);
  const [loading, setLoading] = useState(true);

  const estimatedSOL = ticketsToConvert / conversionRate.ticketsPerSOL;

  // Fetch conversion rate and eligibility on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get conversion rate
        const rateResponse = await fetch('/api/conversion/rate', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (rateResponse.ok) {
          const rateData = await rateResponse.json();
          setConversionRate(rateData);
        }

        // Check eligibility
        const eligibilityResponse = await fetch('/api/conversion/eligibility', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (eligibilityResponse.ok) {
          const eligibilityData = await eligibilityResponse.json();
          setEligibility(eligibilityData);
        }
      } catch (error) {
        console.error('Error fetching conversion data:', error);
        toast.error('Failed to load conversion data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleConversion = async () => {
    if (!eligibility.eligible) {
      toast.error('You must hold $PAIR tokens for at least 1 hour to convert tickets');
      return;
    }

    if (ticketsToConvert < conversionRate.minTicketsRequired) {
      toast.error(`Minimum conversion is ${conversionRate.minTicketsRequired.toLocaleString()} tickets`);
      return;
    }

    if (ticketsToConvert > currentTickets) {
      toast.error('Insufficient tickets for conversion');
      return;
    }

    setIsConverting(true);

    try {
      const response = await fetch('/api/conversion/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticketAmount: ticketsToConvert,
          solanaAddress: user?.solanaAddress
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`Successfully converted ${result.ticketsConverted.toLocaleString()} tickets to ${result.solReceived} SOL!`);
        // Update user tickets in auth store if needed
        window.location.reload(); // Simple refresh for now
      } else {
        toast.error(result.error || 'Conversion failed');
      }
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error('Failed to process conversion');
    } finally {
      setIsConverting(false);
    }
  };

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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full mb-6">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-300">Ticket Conversion</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Cash Out
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Convert your PairCade tickets directly to SOL
          </p>
        </motion.div>

        {/* Current Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 mb-8"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-300">Your Balance</h2>
            <div className="grid md:grid-cols-2 gap-8 mb-6">
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6">
                <Gift className="w-8 h-8 text-purple-400 mx-auto mb-4" />
                <p className="text-sm text-gray-400 mb-2">Available Tickets</p>
                <p className="text-3xl font-bold text-purple-400">
                  🎫 {currentTickets.toLocaleString()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl p-6">
                <Coins className="w-8 h-8 text-yellow-400 mx-auto mb-4" />
                <p className="text-sm text-gray-400 mb-2">Estimated Value</p>
                <p className="text-3xl font-bold text-yellow-400">
                  ◎ {estimatedSOL.toFixed(4)} SOL
                </p>
              </div>
            </div>

            {/* $PAIR Token Requirement Notice */}
            <div className={`p-4 rounded-lg border mb-6 ${
              eligibility.eligible
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                {eligibility.eligible ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                )}
                <h3 className={`font-bold ${
                  eligibility.eligible ? 'text-green-400' : 'text-red-400'
                }`}>
                  $PAIR Token Requirement
                </h3>
              </div>
              <p className="text-sm text-gray-300 mb-2">
                {eligibility.message}
              </p>
              <div className="text-xs text-gray-400">
                <p>• Must hold $PAIR tokens for at least 1 hour</p>
                <p>• Current balance: {eligibility.pairBalance} $PAIR</p>
                <p>• Holding duration: {eligibility.holdingDuration} hours</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Conversion Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="w-6 h-6 text-blue-400" />
            <h3 className="text-2xl font-bold">Conversion Calculator</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-center">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🎫</div>
              <input
                type="number"
                placeholder="Enter tickets"
                min={conversionRate.minTicketsRequired}
                max={Math.min(conversionRate.maxTicketsAllowed, currentTickets)}
                value={ticketsToConvert}
                onChange={(e) => setTicketsToConvert(parseInt(e.target.value) || 0)}
                className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-3 text-center text-xl font-bold focus:outline-none focus:border-purple-500"
              />
              <p className="text-sm text-gray-400 mt-2">Tickets to Convert</p>
              <p className="text-xs text-gray-500 mt-1">
                Min: {conversionRate.minTicketsRequired.toLocaleString()} | Max: {Math.min(conversionRate.maxTicketsAllowed, currentTickets).toLocaleString()}
              </p>
            </div>

            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">◎</div>
              <div className="text-xl font-bold text-yellow-400 py-3">
                {estimatedSOL.toFixed(4)} SOL
              </div>
              <p className="text-sm text-gray-400 mt-2">You'll Receive</p>
              <p className="text-xs text-gray-500 mt-1">
                ≈ ${(estimatedSOL * 150).toFixed(2)} USD
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-300">Current Rate</span>
            </div>
            <p className="text-sm text-gray-300">
              1 SOL = {conversionRate.ticketsPerSOL.toLocaleString()} Tickets • Updated in real-time
            </p>
          </div>
        </motion.div>

        {/* Conversion Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mb-8"
        >
          <button
            onClick={handleConversion}
            disabled={isConverting || !eligibility.eligible || ticketsToConvert < conversionRate.minTicketsRequired || ticketsToConvert > currentTickets}
            className="px-12 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold text-xl text-white hover:shadow-lg hover:shadow-yellow-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
          >
            {isConverting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5" />
                Convert to SOL
              </>
            )}
          </button>
          {!eligibility.eligible ? (
            <p className="text-sm text-red-400 mt-3">
              ⚠️ You must hold $PAIR tokens for at least 1 hour to convert
            </p>
          ) : ticketsToConvert < conversionRate.minTicketsRequired ? (
            <p className="text-sm text-yellow-400 mt-3">
              ⚠️ Minimum conversion: {conversionRate.minTicketsRequired.toLocaleString()} tickets
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-3">
              ✅ Ready to convert {ticketsToConvert.toLocaleString()} tickets to {estimatedSOL.toFixed(4)} SOL
            </p>
          )}
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-6 text-center">
            <Shield className="w-8 h-8 text-green-400 mx-auto mb-4" />
            <h4 className="font-bold mb-2 text-green-400">Secure</h4>
            <p className="text-sm text-gray-400">
              All conversions are processed on-chain with full transparency
            </p>
          </div>

          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-6 text-center">
            <Zap className="w-8 h-8 text-purple-400 mx-auto mb-4" />
            <h4 className="font-bold mb-2 text-purple-400">Instant</h4>
            <p className="text-sm text-gray-400">
              Receive SOL in your wallet within seconds of conversion
            </p>
          </div>

          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 text-blue-400 mx-auto mb-4" />
            <h4 className="font-bold mb-2 text-blue-400">24/7</h4>
            <p className="text-sm text-gray-400">
              Convert anytime with real-time market rates
            </p>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/10 rounded-2xl p-8"
        >
          <h3 className="text-2xl font-bold mb-6 text-center">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              How It Works
            </span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 font-bold text-white">
                1
              </div>
              <div>
                <h4 className="font-bold mb-1">Enter Conversion Amount</h4>
                <p className="text-gray-400 text-sm">
                  Choose how many tickets you want to convert to SOL
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 font-bold text-white">
                2
              </div>
              <div>
                <h4 className="font-bold mb-1">Confirm Transaction</h4>
                <p className="text-gray-400 text-sm">
                  Review the conversion rate and confirm your wallet transaction
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 font-bold text-white">
                3
              </div>
              <div>
                <h4 className="font-bold mb-1">Receive SOL</h4>
                <p className="text-gray-400 text-sm">
                  SOL is instantly transferred to your connected wallet
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-200 font-semibold mb-1">
              💡 Pro Tip
            </p>
            <p className="text-sm text-gray-300">
              Keep earning tickets daily for bigger conversions! The more you play, the more you earn.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}