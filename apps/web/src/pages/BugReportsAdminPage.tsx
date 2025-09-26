import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Bug,
  Filter,
  Eye,
  Edit3,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react';

export default function BugReportsAdminPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    adminNotes: ''
  });

  const limit = 20;

  // Fetch bug reports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['bugReports', filters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...filters,
        limit: limit.toString(),
        offset: (currentPage * limit).toString()
      });

      const response = await fetch(
        `https://raffle-arcade-api.claudechaindev.workers.dev/bugs/admin/reports?${params}`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Fetch bug report statistics
  const { data: stats } = useQuery({
    queryKey: ['bugReportStats'],
    queryFn: async () => {
      const response = await fetch(
        'https://raffle-arcade-api.claudechaindev.workers.dev/bugs/admin/stats',
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: 60000,
  });

  // Update bug report mutation
  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, data }: { reportId: string, data: any }) => {
      const response = await fetch(
        `https://raffle-arcade-api.claudechaindev.workers.dev/bugs/admin/reports/${reportId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) throw new Error('Failed to update report');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Bug report updated successfully');
      queryClient.invalidateQueries({ queryKey: ['bugReports'] });
      queryClient.invalidateQueries({ queryKey: ['bugReportStats'] });
      setIsUpdateModalOpen(false);
      setSelectedReport(null);
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleViewReport = async (reportId: string) => {
    try {
      const response = await fetch(
        `https://raffle-arcade-api.claudechaindev.workers.dev/bugs/admin/reports/${reportId}`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch report details');
      const data = await response.json();
      setSelectedReport(data.report);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateReport = (report: any) => {
    setUpdateData({
      status: report.status,
      adminNotes: report.admin_notes || ''
    });
    setSelectedReport(report);
    setIsUpdateModalOpen(true);
  };

  const submitUpdate = () => {
    if (!selectedReport) return;

    updateReportMutation.mutate({
      reportId: selectedReport.id,
      data: updateData
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'text-arcade-red bg-arcade-red/20',
      in_progress: 'text-arcade-yellow bg-arcade-yellow/20',
      resolved: 'text-arcade-green bg-arcade-green/20',
      closed: 'text-gray-400 bg-gray-400/20',
      duplicate: 'text-arcade-purple bg-arcade-purple/20'
    };
    return colors[status as keyof typeof colors] || 'text-gray-400 bg-gray-400/20';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-orange-400',
      critical: 'text-red-400'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bug size={32} className="text-arcade-red" />
          <div>
            <h1 className="text-3xl font-bold">Bug Reports Admin</h1>
            <p className="text-gray-400">Manage and review bug reports</p>
          </div>
        </div>

        {/* Stats Summary */}
        {stats?.success && (
          <div className="flex gap-4">
            <div className="bg-arcade-dark/50 border border-white/10 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-400">Open</p>
              <p className="text-xl font-bold text-arcade-red">
                {stats.stats.byStatus.find((s: any) => s.status === 'open')?.count || 0}
              </p>
            </div>
            <div className="bg-arcade-dark/50 border border-white/10 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-400">Recent (7d)</p>
              <p className="text-xl font-bold text-arcade-yellow">
                {stats.stats.recentCount}
              </p>
            </div>
            <div className="bg-arcade-dark/50 border border-white/10 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-400">Resolved</p>
              <p className="text-xl font-bold text-arcade-green">
                {stats.stats.byStatus.find((s: any) => s.status === 'resolved')?.count || 0}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-arcade-dark/50 border border-white/10 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} />
          <h3 className="font-semibold">Filters</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setCurrentPage(0);
              }}
              className="w-full px-3 py-2 bg-arcade-darker border border-white/10 rounded focus:border-arcade-purple focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="duplicate">Duplicate</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => {
                setFilters({ ...filters, category: e.target.value });
                setCurrentPage(0);
              }}
              className="w-full px-3 py-2 bg-arcade-darker border border-white/10 rounded focus:border-arcade-purple focus:outline-none"
            >
              <option value="all">All Categories</option>
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
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => {
                setFilters({ ...filters, priority: e.target.value });
                setCurrentPage(0);
              }}
              className="w-full px-3 py-2 bg-arcade-darker border border-white/10 rounded focus:border-arcade-purple focus:outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-arcade-dark/50 border border-white/10 rounded-lg">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-semibold">Bug Reports</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-arcade-purple mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading reports...</p>
          </div>
        ) : !reportsData?.success || reportsData.reports.length === 0 ? (
          <div className="p-8 text-center">
            <Bug size={48} className="text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No bug reports found</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-white/10">
              {reportsData.reports.map((report: any) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{report.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status.replace('_', ' ')}
                        </span>
                        <span className={`text-sm font-medium ${getPriorityColor(report.priority)}`}>
                          {report.priority}
                        </span>
                      </div>

                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                        {report.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>By: {report.username}</span>
                        <span>Category: {report.category}</span>
                        <span>Device: {report.device}</span>
                        <span>{formatDate(report.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewReport(report.id)}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleUpdateReport(report)}
                        className="p-2 bg-arcade-purple/20 text-arcade-purple rounded hover:bg-arcade-purple/30 transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {reportsData.pagination.total > limit && (
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Showing {currentPage * limit + 1} to {Math.min((currentPage + 1) * limit, reportsData.pagination.total)} of {reportsData.pagination.total} reports
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="p-2 rounded bg-arcade-dark border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 py-1 bg-arcade-dark border border-white/10 rounded">
                    {currentPage + 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!reportsData.pagination.hasMore}
                    className="p-2 rounded bg-arcade-dark border border-white/10 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* View Report Modal */}
      {selectedReport && !isUpdateModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-arcade-dark border border-white/10 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedReport.title}</h2>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReport.status)}`}>
                      {selectedReport.status.replace('_', ' ')}
                    </span>
                    <span className={`text-sm font-medium ${getPriorityColor(selectedReport.priority)}`}>
                      {selectedReport.priority} priority
                    </span>
                    <span className="text-sm text-gray-400">{selectedReport.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-300 bg-arcade-darker p-3 rounded">{selectedReport.description}</p>
                </div>

                {selectedReport.steps && (
                  <div>
                    <h3 className="font-semibold mb-2">Steps to Reproduce</h3>
                    <p className="text-gray-300 bg-arcade-darker p-3 rounded whitespace-pre-line">{selectedReport.steps}</p>
                  </div>
                )}

                {(selectedReport.expected_behavior || selectedReport.actual_behavior) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedReport.expected_behavior && (
                      <div>
                        <h3 className="font-semibold mb-2">Expected Behavior</h3>
                        <p className="text-gray-300 bg-arcade-darker p-3 rounded">{selectedReport.expected_behavior}</p>
                      </div>
                    )}
                    {selectedReport.actual_behavior && (
                      <div>
                        <h3 className="font-semibold mb-2">Actual Behavior</h3>
                        <p className="text-gray-300 bg-arcade-darker p-3 rounded">{selectedReport.actual_behavior}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Reporter Information</h3>
                    <div className="bg-arcade-darker p-3 rounded space-y-2">
                      <p><strong>Username:</strong> {selectedReport.username}</p>
                      {selectedReport.email && <p><strong>Email:</strong> {selectedReport.email}</p>}
                      <p><strong>Device:</strong> {selectedReport.device}</p>
                      {selectedReport.browser && <p><strong>Browser:</strong> {selectedReport.browser}</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Report Details</h3>
                    <div className="bg-arcade-darker p-3 rounded space-y-2">
                      <p><strong>Created:</strong> {formatDate(selectedReport.created_at)}</p>
                      <p><strong>Updated:</strong> {formatDate(selectedReport.updated_at)}</p>
                      {selectedReport.resolved_at && (
                        <p><strong>Resolved:</strong> {formatDate(selectedReport.resolved_at)}</p>
                      )}
                      {selectedReport.url && <p><strong>Page URL:</strong> <a href={selectedReport.url} target="_blank" rel="noopener noreferrer" className="text-arcade-purple hover:underline">{selectedReport.url}</a></p>}
                    </div>
                  </div>
                </div>

                {selectedReport.admin_notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Admin Notes</h3>
                    <p className="text-gray-300 bg-arcade-darker p-3 rounded">{selectedReport.admin_notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpdateReport(selectedReport)}
                    className="px-4 py-2 bg-arcade-purple text-white rounded hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <Edit3 size={16} />
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Update Report Modal */}
      {isUpdateModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-arcade-dark border border-white/10 rounded-lg max-w-lg w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Update Bug Report</h2>
                <button
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-arcade-darker border border-white/10 rounded focus:border-arcade-purple focus:outline-none"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                    <option value="duplicate">Duplicate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Admin Notes</label>
                  <textarea
                    value={updateData.adminNotes}
                    onChange={(e) => setUpdateData({ ...updateData, adminNotes: e.target.value })}
                    className="w-full px-3 py-2 bg-arcade-darker border border-white/10 rounded focus:border-arcade-purple focus:outline-none resize-none"
                    rows={4}
                    placeholder="Add notes about this bug report..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={submitUpdate}
                    disabled={updateReportMutation.isPending}
                    className="px-4 py-2 bg-arcade-green text-white rounded hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                  >
                    {updateReportMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Update Report
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsUpdateModalOpen(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:opacity-90 transition-opacity"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}