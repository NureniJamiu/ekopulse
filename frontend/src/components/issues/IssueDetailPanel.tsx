import React from 'react';
import { IssueType } from '../../utils/api';
import { getIssueTypeConfig, getStatusConfig, formatRelativeTime } from '../../utils/helpers';
import { X, MapPin, Calendar, User, Camera, Settings2 } from 'lucide-react';
import { useMap } from '../../contexts/MapContext';

interface IssueDetailPanelProps {
  issue: IssueType;
  onUpdate: (issue: IssueType) => void;
}

const IssueDetailPanel: React.FC<IssueDetailPanelProps> = ({ issue, onUpdate }) => {
  const { setSelectedIssue } = useMap();
  const typeConfig = getIssueTypeConfig(issue.type);
  const statusConfig = getStatusConfig(issue.status);

  const handleClose = () => {
    setSelectedIssue(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Issue Details</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Image */}
          {issue.imageUrl && (
            <div className="w-full">
              <img
                src={issue.imageUrl}
                alt="Issue"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Title and Status */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{typeConfig.icon}</span>
              <h3 className="text-xl font-bold text-gray-900">{issue.title}</h3>
            </div>
            <span
              className="status-badge"
              style={{
                backgroundColor: statusConfig.bgColor,
                color: statusConfig.color
              }}
            >
              {statusConfig.label}
            </span>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Description</h4>
            <p className="text-gray-600">{issue.description}</p>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Details</h4>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Settings2 className="h-4 w-4" />
                <span>Type: {typeConfig.label}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{issue.address}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4" />
                <span>
                  Reported by {
                    issue.reportedBy.firstName && issue.reportedBy.lastName
                      ? `${issue.reportedBy.firstName} ${issue.reportedBy.lastName}`
                      : issue.reportedBy.email
                  }
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{formatRelativeTime(issue.createdAt)}</span>
              </div>

              {issue.assignedTo && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Settings2 className="h-4 w-4" />
                  <span>
                    Assigned to {
                      issue.assignedTo.firstName && issue.assignedTo.lastName
                        ? `${issue.assignedTo.firstName} ${issue.assignedTo.lastName}`
                        : issue.assignedTo.email
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Coordinates */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Location</h4>
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>
                  {issue.location.coordinates[1].toFixed(6)}, {issue.location.coordinates[0].toFixed(6)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailPanel;
