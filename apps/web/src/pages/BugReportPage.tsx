import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

export default function BugReportPage() {
  const user = useAuthStore((state) => state.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    category: 'bug',
    description: '',
    steps: '',
    expected: '',
    actual: '',
    browser: '',
    device: 'desktop',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions within 5 seconds
    const now = Date.now();
    if (now - lastSubmissionTime < 5000) {
      toast.error('Please wait before submitting another report');
      return;
    }

    if (!formData.title || !formData.description) {
      toast.error('Please provide a title and description');
      return;
    }

    // Prevent concurrent submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setLastSubmissionTime(now);

    try {
      // Add timeout to prevent long waits
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('https://raffle-arcade-api.claudechaindev.workers.dev/bugs/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify({
          ...formData,
          priority: 'medium', // Set default priority on backend
          username: user?.username || 'Anonymous',
          userId: user?.id,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('Failed to submit report');

      setSubmitted(true);
      toast.success('Bug report submitted successfully!');

      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          title: '',
          category: 'bug',
          description: '',
          steps: '',
          expected: '',
          actual: '',
          browser: '',
          device: 'desktop',
          email: ''
        });
      }, 3000);
    } catch (error: any) {
      console.error('Bug report submission error:', error);

      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please check your connection and try again.');
      } else if (error.message?.includes('Failed to fetch') || !navigator.onLine) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Failed to submit bug report. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CheckCircle size={64} className="text-arcade-green mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
          <p className="text-gray-400">Your bug report has been submitted successfully.</p>
          <p className="text-gray-400 text-sm mt-2">We'll review it as soon as possible.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bug size={32} className="text-arcade-red" />
            <h1 className="text-3xl font-bold">Bug Report</h1>
          </div>
          <p className="text-gray-400">
            Help us improve PairCade by reporting any issues you encounter
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-arcade-dark/50 border border-white/10 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Issue Details</h3>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Title <span className="text-arcade-red">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-arcade-darker border border-white/10 rounded-lg focus:border-arcade-purple focus:outline-none"
                placeholder="Brief description of the issue"
                required
              />
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 bg-arcade-darker border border-white/10 rounded-lg focus:border-arcade-purple focus:outline-none"
                >
                  <option value="bug">Bug</option>
                  <option value="ui">UI/UX Issue</option>
                  <option value="performance">Performance</option>
                  <option value="feature">Feature Request</option>
                  <option value="authentication">Login/Auth Issue</option>
                  <option value="quest">Quest Issue</option>
                  <option value="faction">Faction Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description <span className="text-arcade-red">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-arcade-darker border border-white/10 rounded-lg focus:border-arcade-purple focus:outline-none resize-none"
                rows={4}
                placeholder="Detailed description of the issue"
                required
              />
            </div>

            {/* Steps to Reproduce */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Steps to Reproduce
              </label>
              <textarea
                value={formData.steps}
                onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
                className="w-full px-4 py-2 bg-arcade-darker border border-white/10 rounded-lg focus:border-arcade-purple focus:outline-none resize-none"
                rows={3}
                placeholder="1. Go to...\n2. Click on...\n3. See error"
              />
            </div>

            {/* Expected vs Actual */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Expected Behavior</label>
                <textarea
                  value={formData.expected}
                  onChange={(e) => setFormData({ ...formData, expected: e.target.value })}
                  className="w-full px-4 py-2 bg-arcade-darker border border-white/10 rounded-lg focus:border-arcade-purple focus:outline-none resize-none"
                  rows={2}
                  placeholder="What should happen?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Actual Behavior</label>
                <textarea
                  value={formData.actual}
                  onChange={(e) => setFormData({ ...formData, actual: e.target.value })}
                  className="w-full px-4 py-2 bg-arcade-darker border border-white/10 rounded-lg focus:border-arcade-purple focus:outline-none resize-none"
                  rows={2}
                  placeholder="What actually happens?"
                />
              </div>
            </div>
          </div>

          <div className="bg-arcade-dark/50 border border-white/10 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Environment</h3>

            {/* Browser & Device */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Browser</label>
                <input
                  type="text"
                  value={formData.browser}
                  onChange={(e) => setFormData({ ...formData, browser: e.target.value })}
                  className="w-full px-4 py-2 bg-arcade-darker border border-white/10 rounded-lg focus:border-arcade-purple focus:outline-none"
                  placeholder="e.g. Google Chrome"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Device</label>
                <select
                  value={formData.device}
                  onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                  className="w-full px-4 py-2 bg-arcade-darker border border-white/10 rounded-lg focus:border-arcade-purple focus:outline-none"
                >
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                  <option value="tablet">Tablet</option>
                </select>
              </div>
            </div>

            {/* Contact Email (optional) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-arcade-darker border border-white/10 rounded-lg focus:border-arcade-purple focus:outline-none"
                placeholder="For follow-up questions"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <AlertCircle size={16} />
              <span>Reports are reviewed within 24-48 hours</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.description}
              className="px-6 py-3 bg-gradient-to-r from-arcade-red to-arcade-purple text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}