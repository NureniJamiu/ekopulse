import React from 'react';
import { IssueType } from '../../utils/api';
import { ISSUE_STATUS } from '../../utils/constants';
import { X, CheckCircle } from 'lucide-react';

interface StatusUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: IssueType;
  onUpdate: (issueId: string, newStatus: string) => void;
}

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
  isOpen,
  onClose,
  issue,
  onUpdate
}) => {
  const [selectedStatus, setSelectedStatus] = React.useState(issue.status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(issue._id, selectedStatus);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Update Status</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{issue.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{issue.description}</p>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Select New Status
              </label>
              {Object.entries(ISSUE_STATUS).map(([status, config]) => (
                <label key={status} className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mr-3 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">{config.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
            >
              Update Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
