import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import IssueReport from '../models/IssueReport';
import User from '../models/User';
import Agency from '../models/Agency';
import connectDB from '../config/db';

// Sample issue reports data
const sampleIssueReports = [
  {
    title: 'Overflowing garbage bins at Victoria Island',
    description: 'The garbage bins near TBS area on Victoria Island have been overflowing for 3 days. The smell is becoming unbearable and attracting flies.',
    type: 'waste',
    status: 'reported',
    location: {
      type: 'Point',
      coordinates: [3.4234, 6.4302] // Victoria Island area
    },
    address: 'TBS Bus Stop, Victoria Island, Lagos',
    priority: 'high',
    autoAssigned: true
  },
  {
    title: 'Blocked drainage causing flooding',
    description: 'Heavy rainfall yesterday caused severe flooding in our street due to blocked drainage. Water is still standing and affecting movement.',
    type: 'drainage',
    status: 'under_review',
    location: {
      type: 'Point',
      coordinates: [3.3682, 6.5407] // Ikeja area
    },
    address: 'Oba Akran Avenue, Ikeja, Lagos',
    priority: 'urgent',
    autoAssigned: true,
    agencyNotes: 'Drainage team dispatched to assess the situation. Preliminary clearing in progress.'
  },
  {
    title: 'Air pollution from factory emissions',
    description: 'Strong chemical smell and visible smoke coming from a factory in the industrial area. This has been ongoing for several days.',
    type: 'pollution',
    status: 'reported',
    location: {
      type: 'Point',
      coordinates: [3.3576, 6.4967] // Industrial area
    },
    address: 'Industrial Estate, Ikeja, Lagos',
    priority: 'medium',
    autoAssigned: false
  },
  {
    title: 'Illegal dumping of construction waste',
    description: 'Someone has dumped construction debris and rubble along the roadside. This is creating traffic congestion and environmental hazard.',
    type: 'waste',
    status: 'reported',
    location: {
      type: 'Point',
      coordinates: [3.3992, 6.6303] // Yaba area
    },
    address: 'Herbert Macaulay Way, Yaba, Lagos',
    priority: 'medium',
    autoAssigned: true
  },
  {
    title: 'Water contamination in borehole',
    description: 'Our community borehole water has become muddy and has a strange taste. We suspect contamination from nearby construction activities.',
    type: 'pollution',
    status: 'under_review',
    location: {
      type: 'Point',
      coordinates: [3.3445, 6.5834] // Agege area
    },
    address: 'Agege Community Center, Agege, Lagos',
    priority: 'high',
    autoAssigned: true,
    agencyNotes: 'Water samples collected for laboratory analysis. Results pending.'
  },
  {
    title: 'Abandoned vehicle causing obstruction',
    description: 'An abandoned car has been parked on the roadside for over 2 weeks, causing traffic issues and becoming an eyesore.',
    type: 'other',
    status: 'reported',
    location: {
      type: 'Point',
      coordinates: [3.4123, 6.4789] // Surulere area
    },
    address: 'Adeniran Ogunsanya Street, Surulere, Lagos',
    priority: 'low',
    autoAssigned: false
  },
  {
    title: 'Broken street lights causing safety concerns',
    description: 'Multiple street lights on this road have been non-functional for weeks, making the area unsafe at night.',
    type: 'other',
    status: 'resolved',
    location: {
      type: 'Point',
      coordinates: [3.3789, 6.5123] // Maryland area
    },
    address: 'Ikorodu Road, Maryland, Lagos',
    priority: 'medium',
    autoAssigned: true,
    agencyNotes: 'Street lights repaired and tested. All functioning properly now.',
    citizenFeedback: {
      rating: 5,
      comment: 'Excellent work! The lights are now working perfectly and the area feels much safer.',
      submittedAt: new Date()
    }
  },
  {
    title: 'Sewage overflow in residential area',
    description: 'Raw sewage is overflowing from manholes in our estate, creating health hazards and terrible odor.',
    type: 'drainage',
    status: 'under_review',
    location: {
      type: 'Point',
      coordinates: [3.4567, 6.4456] // Lekki area
    },
    address: 'Palm Grove Estate, Lekki Phase 1, Lagos',
    priority: 'urgent',
    autoAssigned: true,
    agencyNotes: 'Emergency response team deployed. Pumping equipment on site.',
    estimatedResolutionTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
  },
  {
    title: 'Plastic waste accumulation at beach',
    description: 'Large amounts of plastic bottles and bags have washed up on the beach, affecting marine life and tourism.',
    type: 'waste',
    status: 'reported',
    location: {
      type: 'Point',
      coordinates: [3.4289, 6.4078] // Bar Beach area
    },
    address: 'Bar Beach, Victoria Island, Lagos',
    priority: 'high',
    autoAssigned: true
  },
  {
    title: 'Chemical spill from tanker accident',
    description: 'A fuel tanker had an accident and spilled chemicals on the road. The area needs immediate cleanup and decontamination.',
    type: 'pollution',
    status: 'resolved',
    location: {
      type: 'Point',
      coordinates: [3.3234, 6.6178] // Lagos-Ibadan Expressway
    },
    address: 'Lagos-Ibadan Expressway, near Berger, Lagos',
    priority: 'urgent',
    autoAssigned: true,
    agencyNotes: 'Hazmat team responded immediately. Area cleaned and decontaminated. Traffic restored to normal.',
    citizenFeedback: {
      rating: 4,
      comment: 'Quick response, but took longer than expected to fully clean up.',
      submittedAt: new Date()
    }
  }
];

async function seedIssueReports() {
  try {
    console.log('🌱 Starting issue reports seeding...');

    await connectDB();

    // Get existing users and agencies for proper references
    console.log('📋 Fetching existing users and agencies...');

    const users = await User.find({ role: 'citizen' }).limit(10);
    const agencies = await Agency.find({ isActive: true });

    if (users.length === 0) {
      console.log('⚠️ No users found. Creating sample test users...');

      // Create sample users for testing
      const testUsers = await User.insertMany([
        {
          clerkId: 'test_citizen_1',
          email: 'citizen1@test.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'citizen',
          isActive: true
        },
        {
          clerkId: 'test_citizen_2',
          email: 'citizen2@test.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'citizen',
          isActive: true
        },
        {
          clerkId: 'test_citizen_3',
          email: 'citizen3@test.com',
          firstName: 'Ahmed',
          lastName: 'Ibrahim',
          role: 'citizen',
          isActive: true
        }
      ]);

      users.push(...testUsers);
      console.log(`✅ Created ${testUsers.length} test users`);
    }

    if (agencies.length === 0) {
      console.log('⚠️ No agencies found. Please run agency seeding first.');
      process.exit(1);
    }

    console.log(`📊 Found ${users.length} users and ${agencies.length} agencies`);

    // Clear existing issue reports
    await IssueReport.deleteMany({});
    console.log('🗑️ Cleared existing issue reports');

    // Prepare issue reports with proper references
    const issueReportsWithRefs = sampleIssueReports.map((issue, index) => {
      const randomUser = users[index % users.length];
      const issueData: any = {
        ...issue,
        reportedBy: randomUser._id
      };

      // Auto-assign to agencies based on issue type
      if (issue.autoAssigned) {
        let targetAgency;

        switch (issue.type) {
          case 'waste':
            targetAgency = agencies.find(a => a.issueTypes.includes('waste'));
            break;
          case 'drainage':
            targetAgency = agencies.find(a => a.issueTypes.includes('drainage'));
            break;
          case 'pollution':
            targetAgency = agencies.find(a => a.issueTypes.includes('pollution'));
            break;
          default:
            targetAgency = agencies.find(a => a.issueTypes.includes('other'));
        }

        if (targetAgency) {
          issueData.assignedAgency = targetAgency._id;
          issueData.assignedAt = new Date();
        }
      }

      return issueData;
    });

    // Insert issue reports
    const reports = await IssueReport.insertMany(issueReportsWithRefs);
    console.log(`✅ Successfully seeded ${reports.length} issue reports:`);

    // Group by status for summary
    const statusCounts = reports.reduce((acc: any, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 Issue Reports Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} reports`);
    });

    // Show assignment summary
    const assignedCount = reports.filter(r => r.assignedAgency).length;
    const unassignedCount = reports.length - assignedCount;

    console.log('\n🏢 Assignment Summary:');
    console.log(`  - Assigned to agencies: ${assignedCount} reports`);
    console.log(`  - Unassigned: ${unassignedCount} reports`);

    console.log('\n🎉 Issue reports seeding completed!');
    console.log('\n📍 Sample locations covered:');
    console.log('  - Victoria Island, Ikeja, Yaba, Agege');
    console.log('  - Surulere, Maryland, Lekki, Bar Beach');
    console.log('  - Lagos-Ibadan Expressway');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding issue reports:', error);
    process.exit(1);
  }
}

// Run the seeder
seedIssueReports();
