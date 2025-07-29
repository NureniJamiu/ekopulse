import React, { useState, useEffect } from 'react';
import { useAgencyAuth } from '../hooks/useAgencyAuth';
import {
  Building2,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  MapPin,
  Filter,
  LogOut
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import IssueCard from '../components/issues/IssueCard';
import EmptyState from '../components/common/EmptyState';
import { agencyAPI } from '../utils/api';
import toast from 'react-hot-toast';

interface Issue {
  _id: string;
  title: string;
  description: string;
  type: 'waste' | 'drainage' | 'pollution' | 'other';
  status: 'reported' | 'under_review' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
  imageUrl?: string;
  reportedBy: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AgencyStats {
  statusBreakdown: Array<{ _id: string; count: number }>;
  typeBreakdown: Array<{ _id: string; count: number }>;
  priorityBreakdown: Array<{ _id: string; count: number }>;
  monthlyTrend: Array<{ _id: { year: number; month: number }; count: number }>;
  avgResolutionTime: number | null;
}

const AgencyDashboardPage: React.FC = () => {
  const { agency, isAuthenticated, isLoading: authLoading, error: authError, logout } = useAgencyAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    type: 'all',
    priority: 'all'
  });

  useEffect(() => {
    if (isAuthenticated && agency && !authLoading) {
      fetchAgencyData();
    } else if (!authLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      toast.error('Please log in to access the agency dashboard');
      window.location.href = '/login?tab=agency';
    }
  }, [isAuthenticated, agency, authLoading]);

  const fetchAgencyData = async () => {
    try {
      setLoading(true);

      if (!agency) {
        throw new Error('No agency session found');
      }

      // Fetch agency issues using the new API
      const issuesData = await agencyAPI.getMyAgencyIssues({
        status: filter.status !== 'all' ? filter.status : undefined,
        type: filter.type !== 'all' ? filter.type : undefined,
        priority: filter.priority !== 'all' ? filter.priority : undefined,
      });
      setIssues(issuesData.issues || []);

      // Fetch agency stats using the new API
      const statsData = await agencyAPI.getMyAgencyStats();
      setStats(statsData || null);

    } catch (error) {
      console.error('Error fetching agency data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error if authentication failed
  if (authError || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access your agency dashboard</p>
          <button
            onClick={() => window.location.href = '/login?tab=agency'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const filteredIssues = issues.filter(issue => {
    return (
      (filter.status === 'all' || issue.status === filter.status) &&
      (filter.type === 'all' || issue.type === filter.type) &&
      (filter.priority === 'all' || issue.priority === filter.priority)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'text-orange-600 bg-orange-100';
      case 'under_review': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{agency?.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-gray-600">
                    {agency?.type?.replace('_', ' ').toUpperCase()} Agency
                  </p>
                  {agency?.issueTypes && agency.issueTypes.length > 0 && (
                    <>
                      <span className="text-gray-400">•</span>
                      <p className="text-sm text-blue-600">
                        Handles: {agency.issueTypes.map(type =>
                          type.charAt(0).toUpperCase() + type.slice(1)
                        ).join(', ')}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Issues</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.statusBreakdown.reduce((total, item) => total + item.count, 0)}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Under Review</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.statusBreakdown.find(s => s._id === 'under_review')?.count || 0}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Resolved</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.statusBreakdown.find(s => s._id === 'resolved')?.count || 0}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Resolution</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.avgResolutionTime ? `${Math.round(stats.avgResolutionTime / (1000 * 60 * 60 * 24))}d` : 'N/A'}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900">Filter Issues</h3>
              </div>
              {agency?.issueTypes && agency.issueTypes.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Note:</span> Only showing issues of types your agency handles: {' '}
                    <span className="font-semibold">
                      {agency.issueTypes.map(type =>
                        type.charAt(0).toUpperCase() + type.slice(1)
                      ).join(', ')}
                    </span>
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filter.status}
                    onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="reported">Reported</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filter.type}
                    onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    {agency?.issueTypes?.map(issueType => (
                      <option key={issueType} value={issueType}>
                        {issueType === 'waste' && 'Waste Management'}
                        {issueType === 'drainage' && 'Drainage Issues'}
                        {issueType === 'pollution' && 'Pollution'}
                        {issueType === 'other' && 'Other'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={filter.priority}
                    onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Issues List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Issues ({filteredIssues.length})
                </h3>
              </div>

              {filteredIssues.length === 0 ? (
                <div className="p-12">
                  <EmptyState
                    icon={FileText}
                    title="No issues found"
                    description="No issues match the current filters or your agency hasn't been assigned any issues yet."
                  />
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredIssues.map((issue) => (
                    <div key={issue._id} className="p-6 hover:bg-gray-50">
                      <IssueCard
                        issue={issue}
                        showActions={true}
                        onStatusUpdate={() => fetchAgencyData()}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyDashboardPage;
