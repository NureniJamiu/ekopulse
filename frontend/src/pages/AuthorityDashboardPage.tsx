import React, { useEffect, useState } from 'react';
import { useAuthUser } from '../hooks/useAuthUser';
import { issuesAPI, IssueType } from '../utils/api';
import IssueCard from '../components/issues/IssueCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import NotificationAdminPanel from "../components/common/NotificationAdminPanel";
import StatusUpdateModal from "../components/issues/StatusUpdateModal";
import { getStatusConfig, formatRelativeTime } from "../utils/helpers";
import {
    Shield,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const AuthorityDashboardPage: React.FC = () => {
    const { user, isLoading: userLoading, isAuthority } = useAuthUser();
    const [issues, setIssues] = useState<IssueType[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [selectedIssue, setSelectedIssue] = useState<IssueType | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    useEffect(() => {
        if (user && isAuthority) {
            loadIssues();
        }
    }, [user, isAuthority]);

    const loadIssues = async () => {
        try {
            setLoading(true);
            const response = await issuesAPI.getIssues({ limit: 100 });
            setIssues(response.data);
        } catch (error) {
            console.error("Error loading issues:", error);
            toast.error("Failed to load issues");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (issueId: string, newStatus: string) => {
        try {
            const updatedIssue = await issuesAPI.updateIssueStatus(
                issueId,
                newStatus
            );
            setIssues((prev) =>
                prev.map((issue) =>
                    issue._id === issueId ? updatedIssue : issue
                )
            );
            setIsStatusModalOpen(false);
            setSelectedIssue(null);
            toast.success(
                `Issue status updated to ${newStatus.replace("_", " ")}`
            );
        } catch (error) {
            console.error("Error updating issue status:", error);
            toast.error("Failed to update issue status");
        }
    };

    const filteredIssues = issues.filter((issue) => {
        if (filter === "all") return true;
        return issue.status === filter;
    });

    const stats = {
        total: issues.length,
        reported: issues.filter((i) => i.status === "reported").length,
        under_review: issues.filter((i) => i.status === "under_review").length,
        resolved: issues.filter((i) => i.status === "resolved").length,
    };

    // Check if user has authority access
    if (userLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    if (!isAuthority) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Access Restricted
                </h1>
                <p className="text-gray-600 mb-6">
                    This dashboard is only available to authorized personnel.
                </p>
                <button
                    onClick={() => (window.location.href = "/")}
                    className="btn-primary"
                >
                    Return to Map
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Shield className="h-8 w-8 text-emerald-600" />
                    <h1 className="text-3xl font-bold text-gray-900">
                        Authority Dashboard
                    </h1>
                </div>
                <p className="text-gray-600">
                    Monitor and manage environmental issue reports across Lagos
                </p>
            </div>

            {/* Notification Admin Panel */}
            <NotificationAdminPanel />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Total Reports
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats.total}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                New Reports
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                                {stats.reported}
                            </p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-full">
                            <AlertCircle className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Under Review
                            </p>
                            <p className="text-2xl font-bold text-blue-600">
                                {stats.under_review}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Clock className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Resolved
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {stats.resolved}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
                {Object.keys(stats).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filter === status
                                ? "bg-emerald-600 text-white"
                                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        {status === "total"
                            ? "All Reports"
                            : status.replace("_", " ").toUpperCase()}
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-black bg-opacity-10">
                            {stats[status as keyof typeof stats]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Issues List */}
            {filteredIssues.length === 0 ? (
                <EmptyState
                    icon={Shield}
                    title="No issues found"
                    description={`No ${
                        filter === "total" ? "" : filter.replace("_", " ")
                    } issues to display.`}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredIssues.map((issue) => (
                        <IssueCard
                            key={issue._id}
                            issue={issue}
                            showActions={true}
                            onStatusUpdate={(issue) => {
                                setSelectedIssue(issue);
                                setIsStatusModalOpen(true);
                            }}
                            onClick={() => {
                                // Navigate to home page with this issue selected
                                window.location.href = `/?issue=${issue._id}`;
                            }}
                        />
                    ))}
                </div>
            )}

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

export default AuthorityDashboardPage;
