import React, { useState } from 'react';
import { Bell, Clock, AlertTriangle, BarChart3 } from 'lucide-react';
import { notificationAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const NotificationAdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  // Only show for authorities and admins
  if (!user || !['authority', 'admin'].includes(user.role)) {
    return null;
  }

  const triggerAction = async (action: string, apiCall: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [action]: true }));
    try {
      const result = await apiCall();
      toast.success(result.message || `${action} triggered successfully`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to trigger ${action}`);
    } finally {
      setLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  const handleTriggerOverdue = () => {
    triggerAction('overdue', notificationAPI.triggerOverdueNotifications);
  };

  const handleTriggerUnassigned = () => {
    triggerAction('unassigned', notificationAPI.triggerUnassignedNotifications);
  };

  const handleTriggerSummary = (agencyId: string) => {
    if (!agencyId.trim()) {
      toast.error('Please enter a valid agency ID');
      return;
    }
    triggerAction('summary', () => notificationAPI.triggerWeeklySummary(agencyId));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          Notification Administration
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Overdue Issues */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <h3 className="font-medium text-gray-900">Overdue Issues</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Send reminders for issues pending more than 7 days
          </p>
          <button
            onClick={handleTriggerOverdue}
            disabled={loading.overdue}
            className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading.overdue ? 'Triggering...' : 'Trigger Overdue Alerts'}
          </button>
        </div>

        {/* Unassigned Issues */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="font-medium text-gray-900">Unassigned Issues</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Alert agencies about unassigned issues in their area
          </p>
          <button
            onClick={handleTriggerUnassigned}
            disabled={loading.unassigned}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading.unassigned ? 'Triggering...' : 'Trigger Unassigned Alerts'}
          </button>
        </div>

        {/* Weekly Summary */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h3 className="font-medium text-gray-900">Weekly Summary</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Send performance summary to a specific agency
          </p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Agency ID"
              id="agencyId"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={() => {
                const agencyId = (document.getElementById('agencyId') as HTMLInputElement)?.value;
                handleTriggerSummary(agencyId);
              }}
              disabled={loading.summary}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading.summary ? 'Triggering...' : 'Send Summary'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These actions are for testing and emergency use.
          The system automatically handles these notifications on scheduled intervals.
        </p>
      </div>
    </div>
  );
};

export default NotificationAdminPanel;
