import React from 'react';
import { useMap } from '../../contexts/MapContext';
import { ISSUE_TYPES, ISSUE_STATUS } from '../../utils/constants';
import { Filter, X } from 'lucide-react';

const MapFilters: React.FC = () => {
  const { filters, setFilters, clearFilters, filteredIssues, issues } = useMap();

  const handleStatusFilter = (status: string) => {
    const newStatusFilters = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];

    setFilters({ ...filters, status: newStatusFilters });
  };

  const handleTypeFilter = (type: string) => {
    const newTypeFilters = filters.type.includes(type)
      ? filters.type.filter(t => t !== type)
      : [...filters.type, type];

    setFilters({ ...filters, type: newTypeFilters });
  };

  const hasActiveFilters = filters.status.length > 0 || filters.type.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredIssues.length} of {issues.length} issues
      </div>

      {/* Status Filters */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
        <div className="space-y-2">
          {Object.entries(ISSUE_STATUS).map(([status, config]) => (
            <label key={status} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.status.includes(status)}
                onChange={() => handleStatusFilter(status)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-gray-700">{config.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Type Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Issue Type</h4>
        <div className="space-y-2">
          {Object.entries(ISSUE_TYPES).map(([type, config]) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.type.includes(type)}
                onChange={() => handleTypeFilter(type)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-gray-700 flex items-center">
                <span className="mr-2">{config.icon}</span>
                {config.label}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapFilters;
