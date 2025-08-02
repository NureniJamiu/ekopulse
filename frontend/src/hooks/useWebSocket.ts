import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../utils/constants';
import { IssueType } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import logger from '../utils/logger';

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  subscribeToIssue: (issueId: string) => void;
  unsubscribeFromIssue: (issueId: string) => void;
  subscribeToLocation: (bounds: { north: number; south: number; east: number; west: number }) => void;
}

interface NotificationData {
    _id: string;
    title: string;
    message: string;
    type: string;
    status: string;
    createdAt: string;
    data?: any;
}

export const useWebSocket = (
    onNewIssue?: (issue: IssueType) => void,
    onIssueUpdate?: (issue: IssueType) => void,
    onMapUpdate?: (data: { type: string; data: IssueType }) => void,
    onNotification?: (notification: NotificationData) => void
): UseWebSocketReturn => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();

    const onNewIssueRef = useRef(onNewIssue);
    const onIssueUpdateRef = useRef(onIssueUpdate);
    const onMapUpdateRef = useRef(onMapUpdate);
    const onNotificationRef = useRef(onNotification);

    useEffect(() => {
        onNewIssueRef.current = onNewIssue;
    }, [onNewIssue]);

    useEffect(() => {
        onIssueUpdateRef.current = onIssueUpdate;
    }, [onIssueUpdate]);

    useEffect(() => {
        onMapUpdateRef.current = onMapUpdate;
    }, [onMapUpdate]);

    useEffect(() => {
        onNotificationRef.current = onNotification;
    }, [onNotification]);

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io(WS_URL, {
            transports: ["websocket", "polling"],
        });

        newSocket.on("connect", () => {
            logger.info("Connected to WebSocket server");
            setIsConnected(true);

            // Join appropriate room based on user role
            if (user) {
                newSocket.emit("join_room", {
                    role: user.role,
                    userId: user._id,
                });
            }
        });

        newSocket.on("disconnect", () => {
            logger.info("Disconnected from WebSocket server");
            setIsConnected(false);
        });

        newSocket.on("connect_error", (error) => {
            console.error("❌ WebSocket connection error:", error);
            setIsConnected(false);
        });

        // Listen for new issues
        newSocket.on("new_issue", (issue: IssueType) => {
            logger.info("New issue received", { issueId: issue._id });
            if (onNewIssueRef.current) {
                onNewIssueRef.current(issue);
            }

            // Show notification for authorities
            if (user?.role === "authority") {
                toast.success(
                    `New ${issue.type} issue reported in ${issue.address}`
                );
            }
        });

        // Listen for issue updates
        newSocket.on("issue_updated", (issue: IssueType) => {
            logger.info("Issue updated", { issueId: issue._id });
            if (onIssueUpdateRef.current) {
                onIssueUpdateRef.current(issue);
            }
        });

        // Listen for specific issue status updates
        newSocket.on("issue_status_updated", (issue: IssueType) => {
            logger.info("Issue status updated", { issueId: issue._id, status: issue.status });
            if (onIssueUpdateRef.current) {
                onIssueUpdateRef.current(issue);
            }

            // Show notification to issue reporter
            if (user && issue.reportedBy._id === user._id) {
                toast.success(
                    `Your issue status updated to: ${issue.status.replace(
                        "_",
                        " "
                    )}`
                );
            }
        });

        // Listen for map updates
        newSocket.on(
            "map_update",
            (data: { type: string; data: IssueType }) => {
                logger.info("Map update received", { type: data.type });
                if (onMapUpdateRef.current) {
                    onMapUpdateRef.current(data);
                }
            }
        );

        // Listen for real-time notifications
        newSocket.on("notification", (notification: NotificationData) => {
            logger.info("Notification received", { type: notification.type });

            // Show toast notification
            const notificationTypeIcons = {
                issue_assigned: "📋",
                status_updated: "✅",
                new_report: "📢",
                agency_mention: "🏢",
                issue_reminder: "⏰",
                agency_summary: "📊",
            };

            const icon =
                notificationTypeIcons[
                    notification.type as keyof typeof notificationTypeIcons
                ] || "🔔";
            toast.success(`${icon} ${notification.title}`, {
                duration: 5000,
            });

            // Call custom handler if provided
            if (onNotificationRef.current) {
                onNotificationRef.current(notification);
            }
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
            newSocket.close();
        };
    }, [user]); // Only depend on user, not the callback functions

    const subscribeToIssue = useCallback(
        (issueId: string) => {
            if (socket) {
                socket.emit("subscribe_to_issue", issueId);
            }
        },
        [socket]
    );

    const unsubscribeFromIssue = useCallback(
        (issueId: string) => {
            if (socket) {
                socket.emit("unsubscribe_from_issue", issueId);
            }
        },
        [socket]
    );

    const subscribeToLocation = useCallback(
        (bounds: {
            north: number;
            south: number;
            east: number;
            west: number;
        }) => {
            if (socket) {
                socket.emit("subscribe_to_location", bounds);
            }
        },
        [socket]
    );

    return {
        socket,
        isConnected,
        subscribeToIssue,
        unsubscribeFromIssue,
        subscribeToLocation,
    };
};
