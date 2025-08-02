import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from '../models/Notification';
import User from '../models/User';
import Agency from '../models/Agency';
import IssueReport from '../models/IssueReport';

// Load environment variables
dotenv.config();

const seedNotifications = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('📦 Connected to MongoDB');

    // Clear existing notifications
    await Notification.deleteMany({});
    console.log('🗑️ Cleared existing notifications');

    // Get sample users and agencies for seeding
    const sampleUsers = await User.find().limit(3);
    const sampleAgencies = await Agency.find().limit(2);
    const sampleIssues = await IssueReport.find().limit(3);

    if (sampleUsers.length === 0 || sampleAgencies.length === 0) {
      console.log('⚠️ No users or agencies found. Please seed users and agencies first.');
      return;
    }

    const sampleNotifications = [
      // Issue reported notification
      {
        title: 'Issue Reported Successfully',
        message: 'Your waste management report "Garbage accumulation at Marina" has been received and is being reviewed.',
        type: 'new_report',
        recipientType: 'user',
        recipientId: sampleUsers[0]._id,
        relatedIssue: sampleIssues[0]?._id,
        data: {
          issueType: 'waste',
          reportedAt: new Date()
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      // Issue assigned to agency
      {
        title: 'New Issue Assigned',
        message: 'New waste management issue assigned: "Garbage accumulation at Marina" at Marina Beach Road',
        type: 'issue_assigned',
        recipientType: 'agency',
        recipientId: sampleAgencies[0]._id,
        relatedIssue: sampleIssues[0]?._id,
        relatedAgency: sampleAgencies[0]._id,
        data: {
          issueType: 'waste',
          priority: 'medium',
          autoAssigned: true
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      // Status update notification
      {
        title: 'Issue Status Updated',
        message: 'Your issue is now under review by Lagos Waste Management Agency.',
        type: 'status_updated',
        recipientType: 'user',
        recipientId: sampleUsers[0]._id,
        relatedIssue: sampleIssues[1]?._id,
        relatedAgency: sampleAgencies[0]._id,
        data: {
          newStatus: 'under_review',
          agencyName: 'Lagos Waste Management Agency'
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      // Issue assigned to citizen notification
      {
        title: 'Issue Assigned to Agency',
        message: 'Your issue "Road pothole at Victoria Island" has been assigned to Lagos State Public Works for resolution.',
        type: 'issue_assigned',
        recipientType: 'user',
        recipientId: sampleUsers[1]._id,
        relatedIssue: sampleIssues[2]?._id,
        relatedAgency: sampleAgencies[1]._id,
        data: {
          agencyName: 'Lagos State Public Works',
          agencyType: 'infrastructure'
        },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      // Overdue reminder
      {
        title: 'Issue Update Reminder',
        message: 'Your issue "Drainage blockage at Ikeja" has been pending for 8 days. We\'re working on it!',
        type: 'issue_reminder',
        recipientType: 'user',
        recipientId: sampleUsers[2]._id,
        relatedIssue: sampleIssues[0]?._id,
        data: {
          daysPending: 8,
          reminder: true
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      // Agency summary
      {
        title: 'Weekly Summary Report',
        message: 'This week: 12 issues resolved, 3 still pending. Keep up the great work!',
        type: 'agency_summary',
        recipientType: 'agency',
        recipientId: sampleAgencies[0]._id,
        data: {
          weeklyStats: {
            total: 15,
            resolved: 12,
            pending: 3
          },
          summaryType: 'weekly'
        },
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      },
      // Critical issue alert
      {
        title: 'Critical Issue Alert',
        message: 'Critical water pollution issue reported in your service area: "Oil spill at Lagos Lagoon" at Lagoon Front',
        type: 'agency_mention',
        recipientType: 'agency',
        recipientId: sampleAgencies[1]._id,
        relatedIssue: sampleIssues[1]?._id,
        data: {
          issueType: 'pollution',
          priority: 'urgent',
          urgent: true
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      // Unassigned issues alert
      {
        title: 'Unassigned Issues Alert',
        message: '3 unassigned issue(s) in your area need attention.',
        type: 'agency_mention',
        recipientType: 'agency',
        recipientId: sampleAgencies[0]._id,
        data: {
          unassignedCount: 3,
          alertType: 'unassigned_issues'
        },
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      }
    ];

    // Create notifications
    const createdNotifications = await Notification.insertMany(sampleNotifications);
    console.log(`✅ Created ${createdNotifications.length} sample notifications`);

    // Display summary
    console.log('\n📊 Notification Summary:');
    console.log(`- Issue reported confirmations: 1`);
    console.log(`- Issue assignments: 2`);
    console.log(`- Status updates: 1`);
    console.log(`- Overdue reminders: 1`);
    console.log(`- Agency summaries: 1`);
    console.log(`- Critical alerts: 1`);
    console.log(`- Unassigned alerts: 1`);

  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding function
seedNotifications();
