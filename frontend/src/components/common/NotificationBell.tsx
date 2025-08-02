import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Clock, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationAPI } from '../../utils/api';
import toast from 'react-hot-toast';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type:
        | "issue_assigned"
        | "status_updated"
        | "new_report"
        | "agency_mention"
        | "issue_reminder"
        | "agency_summary";
    status: "unread" | "read" | "archived";
    createdAt: string;
    data?: any;
}

interface NotificationBellProps {
    recipientType?: "user" | "agency";
    forceShow?: boolean; // Allow parent to force showing the bell even without Clerk user
}

const NotificationBell: React.FC<NotificationBellProps> = ({
    recipientType = "user",
    forceShow = false,
}) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Show the bell if user exists (Clerk auth) or if parent forces it (for agency auth)
    const shouldShow = user !== null || forceShow;

    useEffect(() => {
        if (shouldShow) {
            fetchUnreadCount();

            // Poll for updates every 30 seconds
            const interval = setInterval(fetchUnreadCount, 30000);
            return () => clearInterval(interval);
        }
    }, [shouldShow, recipientType]);

    useEffect(() => {
        if (isOpen && notifications.length === 0) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchUnreadCount = async () => {
        try {
            const data = await notificationAPI.getUnreadCount(recipientType);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationAPI.getNotifications({
                recipientType,
                limit: 10,
            });
            setNotifications(data.notifications);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast.error("Failed to load notifications");
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await notificationAPI.markAsRead(notificationId);
            setNotifications((prev) =>
                prev.map((n) =>
                    n._id === notificationId
                        ? { ...n, status: "read" as const }
                        : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead(recipientType);
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, status: "read" as const }))
            );
            setUnreadCount(0);
            toast.success("All notifications marked as read");
        } catch (error) {
            console.error("Error marking all as read:", error);
            toast.error("Failed to mark all as read");
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "issue_assigned":
                return <FileText className="w-4 h-4 text-blue-500" />;
            case "status_updated":
                return <Check className="w-4 h-4 text-green-500" />;
            case "new_report":
                return <AlertCircle className="w-4 h-4 text-orange-500" />;
            case "agency_mention":
                return <Bell className="w-4 h-4 text-purple-500" />;
            case "issue_reminder":
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case "agency_summary":
                return <FileText className="w-4 h-4 text-indigo-500" />;
            default:
                return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (!shouldShow) return null;

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg bg-white shadow-sm border hover:shadow-md transition-shadow"
            >
                <Bell className="w-6 h-6 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Content */}
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-20 max-h-96 overflow-hidden">
                        {/* Header */}
                        <div className="p-4 border-b bg-gray-50">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">
                                    Notifications
                                </h3>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="max-h-64 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center p-8">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : notifications.length > 0 ? (
                                <div className="divide-y">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                                                notification.status === "unread"
                                                    ? "bg-blue-50"
                                                    : ""
                                            }`}
                                            onClick={() => {
                                                if (
                                                    notification.status ===
                                                    "unread"
                                                ) {
                                                    markAsRead(
                                                        notification._id
                                                    );
                                                }
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {getNotificationIcon(
                                                        notification.type
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className={`text-sm font-medium ${
                                                            notification.status ===
                                                            "unread"
                                                                ? "text-gray-900"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Clock className="w-3 h-3 text-gray-400" />
                                                        <span className="text-xs text-gray-500">
                                                            {formatTime(
                                                                notification.createdAt
                                                            )}
                                                        </span>
                                                        {notification.status ===
                                                            "unread" && (
                                                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">
                                        No notifications
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t bg-gray-50">
                                <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
                                    View all notifications
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
