import { Server as SocketIOServer } from 'socket.io';
import { sendSSEMessage, sendSSEMessageToAgency, broadcastSSE } from '../routes/sseRoutes';
import logger from '../utils/logger';

export class UniversalNotificationService {
    private io: SocketIOServer | null;

    constructor(io?: SocketIOServer | null) {
        this.io = io || null;
    }

    // Send notification to a specific user
    sendToUser(userId: string, event: string, data: any) {
        logger.info(`Sending notification to user ${userId}: ${event}`);

        // Try WebSocket first (for development)
        if (this.io) {
            this.io.to(`user_${userId}`).emit(event, data);
            logger.info(`WebSocket message sent to user ${userId}`);
        }

        // Always try SSE (for production fallback)
        sendSSEMessage(userId, event, data);
    }

    // Send notification to a specific agency
    sendToAgency(agencyId: string, event: string, data: any) {
        logger.info(`Sending notification to agency ${agencyId}: ${event}`);

        // Try WebSocket first (for development)
        if (this.io) {
            this.io.to(`agency_${agencyId}`).emit(event, data);
            logger.info(`WebSocket message sent to agency ${agencyId}`);
        }

        // Always try SSE (for production fallback)
        sendSSEMessageToAgency(agencyId, event, data);
    }

    // Broadcast to all users
    broadcastToUsers(event: string, data: any, excludeUserId?: string) {
        logger.info(`Broadcasting to all users: ${event}`);

        // Try WebSocket first (for development)
        if (this.io) {
            if (excludeUserId) {
                this.io.except(`user_${excludeUserId}`).emit(event, data);
            } else {
                this.io.emit(event, data);
            }
            logger.info(`WebSocket broadcast sent to all users`);
        }

        // Always try SSE (for production fallback)
        broadcastSSE(event, data, excludeUserId);
    }

    // Broadcast to all agencies
    broadcastToAgencies(event: string, data: any) {
        logger.info(`Broadcasting to all agencies: ${event}`);

        // Try WebSocket first (for development)
        if (this.io) {
            this.io.to('agencies').emit(event, data);
            logger.info(`WebSocket broadcast sent to all agencies`);
        }

        // SSE broadcast to agencies would need to be implemented if needed
        // For now, we'll handle agency-specific notifications individually
    }

    // Send to users in a specific geographical area
    sendToLocationUsers(bounds: { north: number; south: number; east: number; west: number }, event: string, data: any) {
        logger.info(`Sending to users in location bounds: ${event}`);

        // Try WebSocket first (for development)
        if (this.io) {
            this.io
                .to(
                    `location_${bounds.north}_${bounds.south}_${bounds.east}_${bounds.west}`
                )
                .emit(event, data);
            logger.info(`WebSocket message sent to location users`);
        }

        // For SSE, we'll need to track user locations separately
        // This would require additional implementation if needed
    }

    // Handle new issue notifications
    notifyNewIssue(issue: any, excludeUserId?: string) {
        this.broadcastToUsers('new_issue', issue, excludeUserId);

        // Notify relevant agencies based on issue location or type
        if (issue.assignedAgency) {
            this.sendToAgency(issue.assignedAgency, 'new_assigned_issue', issue);
        }
    }

    // Handle issue update notifications
    notifyIssueUpdate(issue: any, excludeUserId?: string) {
        this.broadcastToUsers('issue_updated', issue, excludeUserId);

        // Notify the assigned agency
        if (issue.assignedAgency) {
            this.sendToAgency(issue.assignedAgency, 'issue_updated', issue);
        }

        // Notify the original reporter
        if (issue.reportedBy && issue.reportedBy !== excludeUserId) {
            this.sendToUser(issue.reportedBy, 'your_issue_updated', issue);
        }
    }

    // Handle status change notifications
    notifyStatusChange(issue: any, oldStatus: string, newStatus: string) {
        const statusData = { ...issue, oldStatus, newStatus };

        this.broadcastToUsers('issue_status_changed', statusData);

        // Notify the original reporter
        if (issue.reportedBy) {
            this.sendToUser(issue.reportedBy, 'your_issue_status_changed', statusData);
        }
    }

    // Handle general notifications
    sendNotification(notification: any) {
        // Send to specific user if specified
        if (notification.userId) {
            this.sendToUser(notification.userId, 'notification', notification);
        }

        // Send to specific agency if specified
        if (notification.agencyId) {
            this.sendToAgency(notification.agencyId, 'notification', notification);
        }

        // Broadcast if it's a general notification
        if (notification.broadcast) {
            this.broadcastToUsers('notification', notification);
        }
    }
}

// Singleton instance
let universalNotificationService: UniversalNotificationService | null = null;

export const getUniversalNotificationService = (io?: SocketIOServer | null): UniversalNotificationService => {
    if (!universalNotificationService) {
        universalNotificationService = new UniversalNotificationService(io);
    }
    return universalNotificationService;
};

export default UniversalNotificationService;
