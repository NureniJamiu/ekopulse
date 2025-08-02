import Notification, { INotification, NotificationType } from '../models/Notification';
import User, { IUser } from '../models/User';
import Agency, { IAgency } from '../models/Agency';
import { IIssueReport } from '../models/IssueReport';
import { Server as SocketIOServer } from 'socket.io';

export interface NotificationOptions {
  title: string;
  message: string;
  type: NotificationType;
  recipientId: string;
  recipientType: 'user' | 'agency';
  relatedIssue?: string;
  relatedAgency?: string;
  data?: any;
  expiresIn?: number; // Days until expiration
}

export class NotificationService {
    private io: SocketIOServer;

    constructor(io: SocketIOServer) {
        this.io = io;
    }

    /**
     * Create and send a notification
     */
    async createNotification(
        options: NotificationOptions
    ): Promise<INotification | null> {
        try {
            const expiresAt = options.expiresIn
                ? new Date(Date.now() + options.expiresIn * 24 * 60 * 60 * 1000)
                : undefined;

            const notification = new Notification({
                title: options.title,
                message: options.message,
                type: options.type,
                recipientType: options.recipientType,
                recipientId: options.recipientId,
                relatedIssue: options.relatedIssue,
                relatedAgency: options.relatedAgency,
                data: options.data,
                expiresAt,
            });

            const savedNotification = await notification.save();

            // Send real-time notification
            await this.sendRealtimeNotification(savedNotification);

            return savedNotification;
        } catch (error) {
            console.error("Error creating notification:", error);
            return null;
        }
    }

    /**
     * Send real-time notification via WebSocket
     */
    private async sendRealtimeNotification(
        notification: INotification
    ): Promise<void> {
        try {
            const populatedNotification = await Notification.findById(
                notification._id
            )
                .populate("relatedIssue")
                .populate("relatedAgency");

            if (notification.recipientType === "user") {
                // Send to specific user
                this.io
                    .to(`user_${notification.recipientId}`)
                    .emit("notification", populatedNotification);
            } else if (notification.recipientType === "agency") {
                // Send to all users of the agency
                this.io
                    .to(`agency_${notification.recipientId}`)
                    .emit("notification", populatedNotification);
            }
        } catch (error) {
            console.error("Error sending real-time notification:", error);
        }
    }

    /**
     * Notify citizen when their issue status is updated
     */
    async notifyIssueStatusUpdate(
        issue: IIssueReport,
        updatedBy: IUser
    ): Promise<void> {
        try {
            const citizen = await User.findById(issue.reportedBy);
            if (!citizen) return;

            const agencyName = issue.assignedAgency
                ? (await Agency.findById(issue.assignedAgency))?.name ||
                  "Unknown Agency"
                : "Authority";

            const statusMessages = {
                reported:
                    "Your issue has been reported and is awaiting review.",
                under_review: `Your issue is now under review by ${agencyName}.`,
                resolved: `Your issue has been resolved by ${agencyName}. Thank you for your report!`,
            };

            await this.createNotification({
                title: "Issue Status Updated",
                message:
                    statusMessages[issue.status] ||
                    "Your issue status has been updated.",
                type: "status_updated",
                recipientId: citizen._id.toString(),
                recipientType: "user",
                relatedIssue: issue._id.toString(),
                relatedAgency: issue.assignedAgency?.toString(),
                data: {
                    issueId: issue._id,
                    newStatus: issue.status,
                    updatedBy: updatedBy._id,
                    agencyName,
                },
                expiresIn: 30,
            });
        } catch (error) {
            console.error("Error notifying issue status update:", error);
        }
    }

    /**
     * Notify agency when a new issue is assigned to them
     */
    async notifyIssueAssignment(
        issue: IIssueReport,
        agency: IAgency
    ): Promise<void> {
        try {
            await this.createNotification({
                title: "New Issue Assigned",
                message: `New ${issue.type} issue assigned: "${issue.title}" at ${issue.address}`,
                type: "issue_assigned",
                recipientId: agency._id.toString(),
                recipientType: "agency",
                relatedIssue: issue._id.toString(),
                relatedAgency: agency._id.toString(),
                data: {
                    issueId: issue._id,
                    issueType: issue.type,
                    priority: issue.priority,
                    location: issue.location,
                    autoAssigned: issue.autoAssigned,
                },
                expiresIn: 30,
            });
        } catch (error) {
            console.error("Error notifying issue assignment:", error);
        }
    }

    /**
     * Notify citizen when their issue has been reported successfully
     */
    async notifyIssueReported(issue: IIssueReport): Promise<void> {
        try {
            const citizen = await User.findById(issue.reportedBy);
            if (!citizen) return;

            await this.createNotification({
                title: "Issue Reported Successfully",
                message: `Your ${issue.type} report "${issue.title}" has been received and is being reviewed.`,
                type: "new_report",
                recipientId: citizen._id.toString(),
                recipientType: "user",
                relatedIssue: issue._id.toString(),
                data: {
                    issueId: issue._id,
                    issueType: issue.type,
                    reportedAt: issue.createdAt,
                },
                expiresIn: 30,
            });
        } catch (error) {
            console.error("Error notifying issue reported:", error);
        }
    }

    /**
     * Notify citizen when their issue gets assigned to an agency
     */
    async notifyIssueAssignedToCitizen(
        issue: IIssueReport,
        agency: IAgency
    ): Promise<void> {
        try {
            const citizen = await User.findById(issue.reportedBy);
            if (!citizen) return;

            await this.createNotification({
                title: "Issue Assigned to Agency",
                message: `Your issue "${issue.title}" has been assigned to ${agency.name} for resolution.`,
                type: "issue_assigned",
                recipientId: citizen._id.toString(),
                recipientType: "user",
                relatedIssue: issue._id.toString(),
                relatedAgency: agency._id.toString(),
                data: {
                    issueId: issue._id,
                    agencyName: agency.name,
                    agencyType: agency.type,
                    assignedAt: new Date(),
                },
                expiresIn: 30,
            });
        } catch (error) {
            console.error("Error notifying citizen about assignment:", error);
        }
    }

    /**
     * Notify relevant agencies about critical issues in their area
     */
    async notifyAgenciesAboutCriticalIssue(
        issue: IIssueReport,
        agencies: IAgency[]
    ): Promise<void> {
        try {
            for (const agency of agencies) {
                await this.createNotification({
                    title: "Critical Issue Alert",
                    message: `Critical ${issue.type} issue reported in your service area: "${issue.title}" at ${issue.address}`,
                    type: "new_report",
                    recipientId: agency._id.toString(),
                    recipientType: "agency",
                    relatedIssue: issue._id.toString(),
                    relatedAgency: agency._id.toString(),
                    data: {
                        issueId: issue._id,
                        issueType: issue.type,
                        priority: issue.priority,
                        location: issue.location,
                        urgent: true,
                    },
                    expiresIn: 7, // Shorter expiry for critical issues
                });
            }
        } catch (error) {
            console.error(
                "Error notifying agencies about critical issue:",
                error
            );
        }
    }

    /**
     * Notify citizen about overdue issues (reminder notifications)
     */
    async notifyOverdueIssues(): Promise<void> {
        try {
            // Find issues that are older than 7 days without resolution
            const overdueDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const overdueIssues = await (
                await import("../models/IssueReport")
            ).default
                .find({
                    status: { $in: ["reported", "under_review"] },
                    createdAt: { $lt: overdueDate },
                })
                .populate("reportedBy")
                .populate("assignedAgency");

            for (const issue of overdueIssues) {
                const citizen = issue.reportedBy as any;
                if (!citizen) continue;

                const daysSinceReported = Math.floor(
                    (Date.now() - issue.createdAt.getTime()) /
                        (24 * 60 * 60 * 1000)
                );

                await this.createNotification({
                    title: "Issue Update Reminder",
                    message: `Your issue "${issue.title}" has been pending for ${daysSinceReported} days. We're working on it!`,
                    type: "status_updated",
                    recipientId: citizen._id.toString(),
                    recipientType: "user",
                    relatedIssue: issue._id.toString(),
                    relatedAgency: issue.assignedAgency?.toString(),
                    data: {
                        issueId: issue._id,
                        daysPending: daysSinceReported,
                        reminder: true,
                    },
                    expiresIn: 7,
                });
            }
        } catch (error) {
            console.error("Error notifying overdue issues:", error);
        }
    }

    /**
     * Notify agencies about unassigned issues in their area
     */
    async notifyUnassignedIssues(): Promise<void> {
        try {
            // Find issues that are older than 1 hour without assignment
            const unassignedCutoff = new Date(Date.now() - 60 * 60 * 1000); // 1 hour

            const unassignedIssues = await (
                await import("../models/IssueReport")
            ).default.find({
                assignedAgency: null,
                createdAt: { $lt: unassignedCutoff },
            });

            if (unassignedIssues.length === 0) return;

            // Get all active agencies
            const agencies = await Agency.find({ isActive: true });

            for (const agency of agencies) {
                // Filter issues relevant to this agency
                const relevantIssues = unassignedIssues.filter((issue) =>
                    agency.issueTypes.includes(issue.type)
                );

                if (relevantIssues.length > 0) {
                    await this.createNotification({
                        title: "Unassigned Issues Alert",
                        message: `${relevantIssues.length} unassigned issue(s) in your area need attention.`,
                        type: "agency_mention",
                        recipientId: agency._id.toString(),
                        recipientType: "agency",
                        data: {
                            unassignedCount: relevantIssues.length,
                            issueIds: relevantIssues.map((i) => i._id),
                            alertType: "unassigned_issues",
                        },
                        expiresIn: 3,
                    });
                }
            }
        } catch (error) {
            console.error("Error notifying unassigned issues:", error);
        }
    }

    /**
     * Send weekly summary notifications to agencies
     */
    async sendWeeklySummary(agencyId: string): Promise<void> {
        try {
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            const agency = await Agency.findById(agencyId);
            if (!agency) return;

            // Get agency's issues from the past week
            const weeklyIssues = await (
                await import("../models/IssueReport")
            ).default.find({
                assignedAgency: agencyId,
                createdAt: { $gte: oneWeekAgo },
            });

            const resolvedCount = weeklyIssues.filter(
                (i) => i.status === "resolved"
            ).length;
            const pendingCount = weeklyIssues.filter(
                (i) => i.status !== "resolved"
            ).length;

            await this.createNotification({
                title: "Weekly Summary Report",
                message: `This week: ${resolvedCount} issues resolved, ${pendingCount} still pending. Keep up the great work!`,
                type: "agency_mention",
                recipientId: agencyId,
                recipientType: "agency",
                data: {
                    weeklyStats: {
                        total: weeklyIssues.length,
                        resolved: resolvedCount,
                        pending: pendingCount,
                        weekStart: oneWeekAgo,
                        weekEnd: new Date(),
                    },
                    summaryType: "weekly",
                },
                expiresIn: 14,
            });
        } catch (error) {
            console.error("Error sending weekly summary:", error);
        }
    }

    /**
     * Get notifications for a user or agency
     */
    async getNotifications(
        recipientId: string,
        recipientType: "user" | "agency",
        options: {
            status?: "unread" | "read" | "archived";
            limit?: number;
            skip?: number;
            type?: NotificationType;
        } = {}
    ): Promise<{ notifications: INotification[]; total: number }> {
        try {
            const query: any = {
                recipientId,
                recipientType,
            };

            if (options.status) {
                query.status = options.status;
            }

            if (options.type) {
                query.type = options.type;
            }

            const total = await Notification.countDocuments(query);

            const notifications = await Notification.find(query)
                .populate("relatedIssue")
                .populate("relatedAgency")
                .sort({ createdAt: -1 })
                .limit(options.limit || 20)
                .skip(options.skip || 0);

            return { notifications, total };
        } catch (error) {
            console.error("Error getting notifications:", error);
            return { notifications: [], total: 0 };
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(
        notificationId: string,
        recipientId: string
    ): Promise<boolean> {
        try {
            const result = await Notification.findOneAndUpdate(
                {
                    _id: notificationId,
                    recipientId,
                    status: "unread",
                },
                {
                    status: "read",
                    readAt: new Date(),
                },
                { new: true }
            );

            return !!result;
        } catch (error) {
            console.error("Error marking notification as read:", error);
            return false;
        }
    }

    /**
     * Mark all notifications as read for a recipient
     */
    async markAllAsRead(
        recipientId: string,
        recipientType: "user" | "agency"
    ): Promise<number> {
        try {
            const result = await Notification.updateMany(
                {
                    recipientId,
                    recipientType,
                    status: "unread",
                },
                {
                    status: "read",
                    readAt: new Date(),
                }
            );

            return result.modifiedCount;
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            return 0;
        }
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(
        recipientId: string,
        recipientType: "user" | "agency"
    ): Promise<number> {
        try {
            return await Notification.countDocuments({
                recipientId,
                recipientType,
                status: "unread",
            });
        } catch (error) {
            console.error("Error getting unread count:", error);
            return 0;
        }
    }

    /**
     * Delete old notifications
     */
    async cleanupOldNotifications(olderThanDays: number = 90): Promise<number> {
        try {
            const cutoffDate = new Date(
                Date.now() - olderThanDays * 24 * 60 * 60 * 1000
            );

            const result = await Notification.deleteMany({
                createdAt: { $lt: cutoffDate },
                status: { $in: ["read", "archived"] },
            });

            return result.deletedCount;
        } catch (error) {
            console.error("Error cleaning up old notifications:", error);
            return 0;
        }
    }
}

export default NotificationService;
