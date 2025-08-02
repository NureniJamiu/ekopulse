import React, { useEffect, useState } from 'react';
import { useAuthUser } from '../hooks/useAuthUser';
import { issuesAPI, IssueType } from '../utils/api';
import IssueCard from '../components/issues/IssueCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { getStatusConfig } from '../utils/helpers';
import { MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const MyReportsPage: React.FC = () => {
  const { user, isLoading: userLoading } = useAuthUser();
  const [issues, setIssues] = useState<IssueType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadUserIssues();
    }
  }, [user]);

  const loadUserIssues = async () => {
    try {
      setLoading(true);
      const userIssues = await issuesAPI.getUserIssues();
      setIssues(userIssues);
    } catch (error) {
      console.error('Error loading user issues:', error);
      toast.error('Failed to load your reports');
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (filter === 'all') return true;
    return issue.status === filter;
  });

  const statusCounts = {
    all: issues.length,
    reported: issues.filter(i => i.status === 'reported').length,
    under_review: issues.filter(i => i.status === 'under_review').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reports</h1>
        <p className="text-gray-600">
          Track the status of your environmental issue reports
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div
            key={status}
            className={`card cursor-pointer transition-all hover:shadow-md ${
              filter === status ? 'ring-2 ring-emerald-500' : ''
            }`}
            onClick={() => setFilter(status)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 capitalize">
                  {status === 'all' ? 'Total Reports' : status.replace('_', ' ')}
                </p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
              <div className={`p-3 rounded-full ${
                status === 'all' ? 'bg-gray-100' :
                getStatusConfig(status).bgColor
              }`}>
                {status === 'all' ? (
                  <MapPin className="h-6 w-6 text-gray-600" />
                ) : (
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: getStatusConfig(status).color }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(statusCounts).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status === 'all' ? 'All Reports' : status.replace('_', ' ').toUpperCase()}
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-black bg-opacity-10">
              {statusCounts[status as keyof typeof statusCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title={filter === 'all' ? 'No reports yet' : `No ${filter.replace('_', ' ')} reports`}
          description={
            filter === 'all'
              ? 'You haven\'t reported any issues yet. Start by clicking on the map to report an issue.'
              : `You don't have any ${filter.replace('_', ' ')} reports.`
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue._id}
              issue={issue}
              showActions={false}
              onClick={() => {
                // Navigate to home page with this issue selected
                window.location.href = `/?issue=${issue._id}`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
