import React from 'react';
import { IssueType } from '../../utils/api';
import { getIssueTypeConfig, getStatusConfig, formatRelativeTime } from '../../utils/helpers';
import { MapPin, Clock, User, Settings } from 'lucide-react';

interface IssueCardProps {
  issue: IssueType;
  showActions?: boolean;
  onStatusUpdate?: (issue: IssueType) => void;
  onClick?: () => void;
}

const IssueCard: React.FC<IssueCardProps> = ({
  issue,
  showActions = false,
  onStatusUpdate,
  onClick
}) => {
  const typeConfig = getIssueTypeConfig(issue.type);
  const statusConfig = getStatusConfig(issue.status);

  return (
    <div
      className={`card hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{typeConfig.icon}</span>
            <h3 className="font-semibold text-gray-900">{issue.title}</h3>
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
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {issue.description}
          </p>

          {/* Metadata */}
          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{issue.address}</span>
            </div>

            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>
                Reported by {
                  issue.reportedBy.firstName && issue.reportedBy.lastName
                    ? `${issue.reportedBy.firstName} ${issue.reportedBy.lastName}`
                    : issue.reportedBy.email
                }
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(issue.createdAt)}</span>
            </div>

            {issue.assignedTo && (
              <div className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
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

        {/* Image */}
        {issue.imageUrl && (
          <div className="ml-4 flex-shrink-0">
            <img
              src={issue.imageUrl}
              alt="Issue"
              className="w-16 h-16 object-cover rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && onStatusUpdate && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusUpdate(issue);
            }}
            className="btn-secondary text-sm"
          >
            Update Status
          </button>
        </div>
      )}
    </div>
  );
};

export default IssueCard;
