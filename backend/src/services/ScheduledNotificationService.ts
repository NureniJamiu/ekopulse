import NotificationService from './NotificationService';
import Agency from '../models/Agency';
import { Server as SocketIOServer } from 'socket.io';

export class ScheduledNotificationService {
  private notificationService: NotificationService;
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.notificationService = new NotificationService(io);
  }

  /**
   * Start all scheduled notification tasks
   */
  startScheduledTasks(): void {
    // Check for overdue issues every 6 hours
    setInterval(() => {
      this.notificationService.notifyOverdueIssues().catch(console.error);
    }, 6 * 60 * 60 * 1000);

    // Check for unassigned issues every 30 minutes
    setInterval(() => {
      this.notificationService.notifyUnassignedIssues().catch(console.error);
    }, 30 * 60 * 1000);

    // Send weekly summaries every Monday at 9 AM
    // This is a simplified version - in production, use a proper cron job
    setInterval(async () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
      const hour = now.getHours();

      if (dayOfWeek === 1 && hour === 9) { // Monday at 9 AM
        await this.sendWeeklySummariesToAllAgencies();
      }
    }, 60 * 60 * 1000); // Check every hour

    // Clean up old notifications every day at midnight
    setInterval(() => {
      this.notificationService.cleanupOldNotifications().catch(console.error);
    }, 24 * 60 * 60 * 1000);

    console.log('[ScheduledNotificationService] All scheduled tasks started');
  }

  /**
   * Send weekly summaries to all active agencies
   */
  private async sendWeeklySummariesToAllAgencies(): Promise<void> {
    try {
      const agencies = await Agency.find({ isActive: true });

      for (const agency of agencies) {
        await this.notificationService.sendWeeklySummary(
            agency._id?.toString() || ""
        );
      }

      console.log(`[ScheduledNotificationService] Weekly summaries sent to ${agencies.length} agencies`);
    } catch (error) {
      console.error('Error sending weekly summaries:', error);
    }
  }

  /**
   * Manually trigger overdue notifications (for testing or admin use)
   */
  async triggerOverdueNotifications(): Promise<void> {
    await this.notificationService.notifyOverdueIssues();
  }

  /**
   * Manually trigger unassigned issue notifications (for testing or admin use)
   */
  async triggerUnassignedNotifications(): Promise<void> {
    await this.notificationService.notifyUnassignedIssues();
  }

  /**
   * Manually trigger weekly summary for a specific agency (for testing or admin use)
   */
  async triggerWeeklySummary(agencyId: string): Promise<void> {
    await this.notificationService.sendWeeklySummary(agencyId);
  }
}

export default ScheduledNotificationService;
