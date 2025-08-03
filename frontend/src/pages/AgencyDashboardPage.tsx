import React, { useState, useEffect } from 'react';
import { useAgencyAuth } from '../hooks/useAgencyAuth';
import {
    Building2,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Filter,
    LogOut,
} from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import IssueCard from "../components/issues/IssueCard";
import EmptyState from "../components/common/EmptyState";
import StatusUpdateModal from "../components/issues/StatusUpdateModal";
import { agencyAPI, IssueType } from "../utils/api";
import toast from "react-hot-toast";

interface AgencyStats {
    statusBreakdown: Array<{ _id: string; count: number }>;
    typeBreakdown: Array<{ _id: string; count: number }>;
    priorityBreakdown: Array<{ _id: string; count: number }>;
    monthlyTrend: Array<{
        _id: { year: number; month: number };
        count: number;
    }>;
    avgResolutionTime: number | null;
}

const AgencyDashboardPage: React.FC = () => {
    const {
        agency,
        isAuthenticated,
        isLoading: authLoading,
        error: authError,
        logout,
    } = useAgencyAuth();
    const [issues, setIssues] = useState<IssueType[]>([]);
    const [stats, setStats] = useState<AgencyStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        status: "all",
        type: "all",
        priority: "all",
    });
    const [selectedIssue, setSelectedIssue] = useState<IssueType | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated && agency && !authLoading) {
            fetchAgencyData();
        } else if (!authLoading && !isAuthenticated && authError) {
            // Only redirect if there's an actual authentication error and we're not loading
            // Wait a bit longer to ensure auth check is complete
            if (
                authError.includes("expired") ||
                authError.includes("No agency session found")
            ) {
                console.error("Agency authentication error:", authError);
                toast.error("Authentication failed. Please log in again.");

                // Delay redirect to prevent race conditions
                setTimeout(() => {
                    window.location.href = "/login?tab=agency";
                }, 1000);
            }
        }
    }, [isAuthenticated, agency, authLoading, authError]);

    const fetchAgencyData = async () => {
        try {
            setLoading(true);

            if (!agency) {
                throw new Error("No agency session found");
            }

            // Fetch agency issues using the new API
            const issuesData = await agencyAPI.getMyAgencyIssues({
                status: filter.status !== "all" ? filter.status : undefined,
                type: filter.type !== "all" ? filter.type : undefined,
                priority:
                    filter.priority !== "all" ? filter.priority : undefined,
            });
            setIssues(issuesData.issues || []);

            // Fetch agency stats using the new API
            const statsData = await agencyAPI.getMyAgencyStats();
            setStats(statsData || null);
        } catch (error) {
            console.error("Error fetching agency data:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (issueId: string, newStatus: string) => {
        try {
            const updatedIssue = await agencyAPI.updateIssueStatus(
                issueId,
                newStatus
            );

            // Update the issue in the local state
            setIssues((prevIssues) =>
                prevIssues.map((issue) =>
                    issue._id === issueId ? updatedIssue : issue
                )
            );

            // Close the modal
            setIsStatusModalOpen(false);
            setSelectedIssue(null);

            toast.success(
                `Issue status updated to ${newStatus.replace("_", " ")}`
            );

            // Optionally refresh the agency stats
            fetchAgencyData();
        } catch (error) {
            console.error("Error updating issue status:", error);
            toast.error("Failed to update issue status");
        }
    };

    const handleIssueStatusUpdate = (issue: IssueType) => {
        setSelectedIssue(issue);
        setIsStatusModalOpen(true);
    };

    // Show loading spinner while checking authentication
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // Show error if authentication failed with actual error (not just loading complete)
    if (
        !authLoading &&
        authError &&
        (authError.includes("expired") ||
            authError.includes("No agency session found"))
    ) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Authentication Required
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Your session has expired. Please log in again.
                    </p>
                    <button
                        onClick={() =>
                            (window.location.href = "/login?tab=agency")
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // Show error page for network errors with retry option - but don't show immediately, give more time
    if (
        !authLoading &&
        authError &&
        !authError.includes("expired") &&
        !authError.includes("No agency session found") &&
        !authError.includes("retrying")
    ) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Connection Error
                    </h2>
                    <p className="text-gray-600 mb-4">{authError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mr-2"
                    >
                        Retry
                    </button>
                    <button
                        onClick={() =>
                            (window.location.href = "/login?tab=agency")
                        }
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // If not authenticated but no error, continue loading (might be in progress)
    if (!authLoading && !isAuthenticated && !authError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    const filteredIssues = issues.filter((issue) => {
        return (
            (filter.status === "all" || issue.status === filter.status) &&
            (filter.type === "all" || issue.type === filter.type) &&
            (filter.priority === "all" || issue.priority === filter.priority)
        );
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                                <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                                    {agency?.name}
                                </h1>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 mt-1">
                                    <p className="text-xs sm:text-sm text-gray-600 flex-shrink-0">
                                        {agency?.type
                                            ?.replace("_", " ")
                                            .toUpperCase()}{" "}
                                        Agency
                                    </p>
                                    {agency?.issueTypes &&
                                        agency.issueTypes.length > 0 && (
                                            <>
                                                <span className="text-gray-400 hidden sm:inline">
                                                    •
                                                </span>
                                                <p className="text-xs sm:text-sm text-blue-600 truncate">
                                                    <span className="hidden sm:inline">
                                                        Handles:{" "}
                                                    </span>
                                                    <span className="sm:hidden">
                                                        📋{" "}
                                                    </span>
                                                    {agency.issueTypes
                                                        .map(
                                                            (type) =>
                                                                type
                                                                    .charAt(0)
                                                                    .toUpperCase() +
                                                                type.slice(1)
                                                        )
                                                        .join(", ")}
                                                </p>
                                            </>
                                        )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end sm:justify-start gap-3 sm:gap-4 flex-shrink-0">
                            <button
                                onClick={logout}
                                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                            >
                                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="hidden sm:inline">Logout</span>
                                <span className="sm:hidden">Exit</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Stats Cards */}
                        {stats && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                                                Total Issues
                                            </p>
                                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                                {stats.statusBreakdown.reduce(
                                                    (total, item) =>
                                                        total + item.count,
                                                    0
                                                )}
                                            </p>
                                        </div>
                                        <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0 ml-2" />
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                                                Under Review
                                            </p>
                                            <p className="text-xl sm:text-2xl font-bold text-blue-600">
                                                {stats.statusBreakdown.find(
                                                    (s) =>
                                                        s._id === "under_review"
                                                )?.count || 0}
                                            </p>
                                        </div>
                                        <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0 ml-2" />
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                                                Resolved
                                            </p>
                                            <p className="text-xl sm:text-2xl font-bold text-green-600">
                                                {stats.statusBreakdown.find(
                                                    (s) => s._id === "resolved"
                                                )?.count || 0}
                                            </p>
                                        </div>
                                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0 ml-2" />
                                    </div>
                                </div>

                                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                                                Avg Resolution
                                            </p>
                                            <p className="text-xl sm:text-2xl font-bold text-purple-600">
                                                {stats.avgResolutionTime
                                                    ? `${Math.round(
                                                          stats.avgResolutionTime /
                                                              (1000 *
                                                                  60 *
                                                                  60 *
                                                                  24)
                                                      )}d`
                                                    : "N/A"}
                                            </p>
                                        </div>
                                        <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0 ml-2" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Filters */}
                        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                            <div className="flex items-center gap-3 sm:gap-4 mb-4">
                                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                                    Filter Issues
                                </h3>
                            </div>
                            {agency?.issueTypes &&
                                agency.issueTypes.length > 0 && (
                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-xs sm:text-sm text-blue-800">
                                            <span className="font-medium">
                                                Note:
                                            </span>{" "}
                                            Only showing issues of types your
                                            agency handles:{" "}
                                            <span className="font-semibold break-words">
                                                {agency.issueTypes
                                                    .map(
                                                        (type) =>
                                                            type
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                            type.slice(1)
                                                    )
                                                    .join(", ")}
                                            </span>
                                        </p>
                                    </div>
                                )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={filter.status}
                                        onChange={(e) =>
                                            setFilter((prev) => ({
                                                ...prev,
                                                status: e.target.value,
                                            }))
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">
                                            All Statuses
                                        </option>
                                        <option value="reported">
                                            Reported
                                        </option>
                                        <option value="under_review">
                                            Under Review
                                        </option>
                                        <option value="resolved">
                                            Resolved
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type
                                    </label>
                                    <select
                                        value={filter.type}
                                        onChange={(e) =>
                                            setFilter((prev) => ({
                                                ...prev,
                                                type: e.target.value,
                                            }))
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Types</option>
                                        {agency?.issueTypes?.map(
                                            (issueType) => (
                                                <option
                                                    key={issueType}
                                                    value={issueType}
                                                >
                                                    {issueType === "waste" &&
                                                        "Waste Management"}
                                                    {issueType === "drainage" &&
                                                        "Drainage Issues"}
                                                    {issueType ===
                                                        "pollution" &&
                                                        "Pollution"}
                                                    {issueType === "other" &&
                                                        "Other"}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Priority
                                    </label>
                                    <select
                                        value={filter.priority}
                                        onChange={(e) =>
                                            setFilter((prev) => ({
                                                ...prev,
                                                priority: e.target.value,
                                            }))
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">
                                            All Priorities
                                        </option>
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
                            <div className="p-4 sm:p-6 border-b border-gray-200">
                                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                                    Issues ({filteredIssues.length})
                                </h3>
                            </div>

                            {filteredIssues.length === 0 ? (
                                <div className="p-8 sm:p-12">
                                    <EmptyState
                                        icon={FileText}
                                        title="No issues found"
                                        description="No issues match the current filters or your agency hasn't been assigned any issues yet."
                                    />
                                </div>
                            ) : (
                                <div className="p-4 sm:p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                        {filteredIssues.map((issue) => (
                                            <IssueCard
                                                key={issue._id}
                                                issue={issue}
                                                showActions={true}
                                                onStatusUpdate={
                                                    handleIssueStatusUpdate
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Status Update Modal */}
            {selectedIssue && (
                <StatusUpdateModal
                    isOpen={isStatusModalOpen}
                    onClose={() => {
                        setIsStatusModalOpen(false);
                        setSelectedIssue(null);
                    }}
                    issue={selectedIssue}
                    onUpdate={handleStatusUpdate}
                />
            )}
        </div>
    );
};

export default AgencyDashboardPage;
