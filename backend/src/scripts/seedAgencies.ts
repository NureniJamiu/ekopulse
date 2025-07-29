import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Agency from '../models/Agency';
import connectDB from '../config/db';

const sampleAgencies = [
  {
    name: 'Lagos Waste Management Authority',
    type: 'waste_management',
    description: 'Responsible for waste collection, disposal, and recycling across Lagos State',
    email: 'contact@lawma.gov.ng',
    phone: '+234-1-700-5296',
    address: 'LAWMA Headquarters, Ijora, Lagos',
    issueTypes: ['waste'],
    isActive: true,
    contactPerson: {
      name: 'Ibrahim Odumboni',
      email: 'md@lawma.gov.ng',
      phone: '+234-1-700-5296'
    },
    workingHours: {
      start: '08:00',
      end: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    priority: 1,
    serviceAreas: [
      {
        type: 'Polygon',
        coordinates: [[[
          [3.3792, 6.5244], // Southwest Lagos
          [3.5792, 6.5244],
          [3.5792, 6.7244],
          [3.3792, 6.7244],
          [3.3792, 6.5244]
        ]]]
      }
    ]
  },
  {
    name: 'Lagos State Water Corporation',
    type: 'water_authority',
    description: 'Managing water supply and drainage infrastructure in Lagos State',
    email: 'info@lagoswater.gov.ng',
    phone: '+234-1-800-9247',
    address: 'Water Corporation House, Alausa, Ikeja',
    issueTypes: ['drainage', 'pollution'],
    isActive: true,
    contactPerson: {
      name: 'Muminu Badmus',
      email: 'gm@lagoswater.gov.ng',
      phone: '+234-1-800-9247'
    },
    workingHours: {
      start: '07:30',
      end: '16:30',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    priority: 1,
    serviceAreas: [
      {
        type: 'Polygon',
        coordinates: [[[
          [3.3492, 6.5044],
          [3.6092, 6.5044],
          [3.6092, 6.7444],
          [3.3492, 6.7444],
          [3.3492, 6.5044]
        ]]]
      }
    ]
  },
  {
    name: 'Lagos State Environmental Protection Agency',
    type: 'environmental_protection',
    description: 'Environmental monitoring and protection across Lagos State',
    email: 'info@lasepa.gov.ng',
    phone: '+234-1-773-7000',
    address: 'LASEPA House, Alausa Secretariat, Ikeja',
    issueTypes: ['pollution', 'other'],
    isActive: true,
    contactPerson: {
      name: 'Babatunde Ajayi',
      email: 'gm@lasepa.gov.ng',
      phone: '+234-1-773-7000'
    },
    workingHours: {
      start: '08:00',
      end: '17:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    priority: 2,
    serviceAreas: [
      {
        type: 'Polygon',
        coordinates: [[[
          [3.3292, 6.4844],
          [3.6292, 6.4844],
          [3.6292, 6.7644],
          [3.3292, 6.7644],
          [3.3292, 6.4844]
        ]]]
      }
    ]
  },
  {
    name: 'Lagos State Public Works Corporation',
    type: 'public_works',
    description: 'Infrastructure maintenance and public works projects',
    email: 'contact@lagospwc.gov.ng',
    phone: '+234-1-234-5678',
    address: 'Public Works House, Marina, Lagos',
    issueTypes: ['drainage', 'other'],
    isActive: true,
    contactPerson: {
      name: 'Olumide Ogundipe',
      email: 'md@lagospwc.gov.ng',
      phone: '+234-1-234-5678'
    },
    workingHours: {
      start: '07:00',
      end: '16:00',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    priority: 3,
    serviceAreas: [
      {
        type: 'Polygon',
        coordinates: [[[
          [3.3692, 6.5144],
          [3.5992, 6.5144],
          [3.5992, 6.7344],
          [3.3692, 6.7344],
          [3.3692, 6.5144]
        ]]]
      }
    ]
  },
  {
    name: 'Victoria Island Environmental Unit',
    type: 'general',
    description: 'General environmental services for Victoria Island area',
    email: 'contact@vi-env.gov.ng',
    phone: '+234-1-987-6543',
    address: 'Environmental Unit, Victoria Island, Lagos',
    issueTypes: ['waste', 'drainage', 'pollution', 'other'],
    isActive: true,
    contactPerson: {
      name: 'Adebayo Johnson',
      email: 'coordinator@vi-env.gov.ng',
      phone: '+234-1-987-6543'
    },
    workingHours: {
      start: '08:30',
      end: '17:30',
      days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    },
    priority: 2,
    serviceAreas: [
      {
        type: 'Polygon',
        coordinates: [[[
          [3.4200, 6.4200], // Victoria Island area
          [3.4600, 6.4200],
          [3.4600, 6.4600],
          [3.4200, 6.4600],
          [3.4200, 6.4200]
        ]]]
      }
    ]
  }
];

async function seedAgencies() {
  try {
    console.log('🌱 Starting agency seeding...');

    await connectDB();

    // Clear existing agencies
    await Agency.deleteMany({});
    console.log('🗑️ Cleared existing agencies');

    // Insert sample agencies
    const agencies = await Agency.insertMany(sampleAgencies);
    console.log(`✅ Successfully seeded ${agencies.length} agencies:`);

    agencies.forEach(agency => {
      console.log(`  - ${agency.name} (${agency.type})`);
    });

    console.log('🎉 Agency seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding agencies:', error);
    process.exit(1);
  }
}

// Run the seeder
seedAgencies();
