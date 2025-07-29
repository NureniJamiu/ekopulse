import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'issue_assigned' | 'status_updated' | 'new_report' | 'agency_mention';
export type NotificationStatus = 'unread' | 'read' | 'archived';
export type RecipientType = 'user' | 'agency';

export interface INotification extends Document {
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  recipientType: RecipientType;
  recipientId: mongoose.Types.ObjectId; // User ID or Agency ID
  relatedIssue?: mongoose.Types.ObjectId;
  relatedAgency?: mongoose.Types.ObjectId;
  data?: any; // Additional notification data
  expiresAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    enum: ['issue_assigned', 'status_updated', 'new_report', 'agency_mention']
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  recipientType: {
    type: String,
    required: true,
    enum: ['user', 'agency']
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientType === "user" ? "User" : "Agency"'
  },
  relatedIssue: {
    type: Schema.Types.ObjectId,
    ref: 'IssueReport'
  },
  relatedAgency: {
    type: Schema.Types.ObjectId,
    ref: 'Agency'
  },
  data: {
    type: Schema.Types.Mixed
  },
  expiresAt: {
    type: Date
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// TTL index for automatic cleanup of expired notifications
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Indexes for efficient querying
NotificationSchema.index({ recipientId: 1, recipientType: 1, status: 1 });
NotificationSchema.index({ type: 1, createdAt: -1 });
NotificationSchema.index({ relatedIssue: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
