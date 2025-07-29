import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Users,
  Settings
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import AgencyRegistrationModal from '../components/agency/AgencyRegistrationModal';
import { agencyAPI } from '../utils/api';
import toast from 'react-hot-toast';

interface Agency {
  _id: string;
  name: string;
  type: string;
  description?: string;
  email: string;
  phone?: string;
  address?: string;
  issueTypes: string[];
  isActive: boolean;
  contactPerson?: {
    name: string;
    email: string;
    phone?: string;
  };
  priority: number;
  createdAt: string;
  updatedAt: string;
}

const AgencyManagementPage: React.FC = () => {
  const { user, isLoading: userLoading } = useAuth();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  useEffect(() => {
    if (user && !userLoading) {
      fetchAgencies();
    }
  }, [user, userLoading]);

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const agenciesData = await agencyAPI.getAllAgencies();
      setAgencies(agenciesData);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      toast.error('Failed to load agencies');
    } finally {
      setLoading(false);
    }
  };

  const filteredAgencies = agencies.filter(agency => {
    const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agency.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || agency.type === filterType;
    const matchesActive = filterActive === 'all' ||
                         (filterActive === 'active' && agency.isActive) ||
                         (filterActive === 'inactive' && !agency.isActive);

    return matchesSearch && matchesType && matchesActive;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'waste_management': return 'bg-green-100 text-green-800';
      case 'water_authority': return 'bg-blue-100 text-blue-800';
      case 'environmental_protection': return 'bg-purple-100 text-purple-800';
      case 'public_works': return 'bg-orange-100 text-orange-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatIssueTypes = (types: string[]) => {
    return types.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(', ');
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  // Check if user has permission to view agencies
  if (!user || !['authority', 'agency_admin'].includes(user.role)) {
    return (
      <EmptyState
        icon={Building2}
        title="Access Denied"
        description="You don't have permission to view agency management."
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              Agency Management
            </h1>
            <p className="text-gray-600 mt-1">Manage agencies and their assignments</p>
          </div>

          {user.role === 'authority' && (
            <button
              onClick={() => setShowRegistrationModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Agency
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search agencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm min-w-[180px]"
            >
              <option value="all">All Types</option>
              <option value="waste_management">Waste Management</option>
              <option value="water_authority">Water Authority</option>
              <option value="environmental_protection">Environmental Protection</option>
              <option value="public_works">Public Works</option>
              <option value="general">General</option>
            </select>

            {/* Active Filter */}
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Agency Grid */}
      {filteredAgencies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgencies.map((agency) => (
            <div key={agency._id} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {agency.name}
                    </h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(agency.type)}`}>
                      {agency.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {agency.isActive ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-xs font-medium text-gray-500">
                      Priority {agency.priority}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {agency.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {agency.description}
                  </p>
                )}

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{agency.email}</span>
                  </div>
                  {agency.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{agency.phone}</span>
                    </div>
                  )}
                  {agency.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{agency.address}</span>
                    </div>
                  )}
                </div>

                {/* Issue Types */}
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">Handles:</div>
                  <div className="text-sm text-gray-700 font-medium">
                    {formatIssueTypes(agency.issueTypes)}
                  </div>
                </div>

                {/* Contact Person */}
                {agency.contactPerson && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-700">
                        {agency.contactPerson.name}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {agency.contactPerson.email}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors">
                    <Settings className="w-4 h-4" />
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No Agencies Found"
          description="No agencies match your current search criteria."
        />
      )}

      {/* Agency Registration Modal */}
      <AgencyRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSuccess={() => {
          setShowRegistrationModal(false);
          fetchAgencies(); // Refresh the agencies list
        }}
      />
    </div>
  );
};

export default AgencyManagementPage;
