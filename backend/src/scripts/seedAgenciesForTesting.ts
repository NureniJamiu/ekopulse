import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import crypto from 'crypto';
import Agency from '../models/Agency';
import connectDB from '../config/db';

// Helper function to get test password for display
const getTestPassword = (agencyId: string): string => {
  const passwordMap: { [key: string]: string } = {
    'LAWMA001': 'lawma2024',
    'LSWC002': 'lswc2024',
    'LASEPA003': 'lasepa2024'
  };
  return passwordMap[agencyId] || 'unknown';
};

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
    agencyId: 'LAWMA001',
    password: crypto.createHash('sha256').update('lawma2024').digest('hex'),
    status: 'active',
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
    priority: 1
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
    agencyId: 'LSWC002',
    password: crypto.createHash('sha256').update('lswc2024').digest('hex'),
    status: 'active',
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
    priority: 1
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
    agencyId: 'LASEPA003',
    password: crypto.createHash('sha256').update('lasepa2024').digest('hex'),
    status: 'active',
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
    priority: 2
  }
];

async function seedAgencies() {
  try {
    console.log('🌱 Starting agency seeding...');

    await connectDB();

    // Clear existing agencies
    await Agency.deleteMany({});
    console.log('🗑️ Cleared existing agencies');

    // Insert sample agencies one by one to avoid bulk insert issues
    const insertedAgencies = [];
    for (const agencyData of sampleAgencies) {
      const agency = new Agency(agencyData);
      const savedAgency = await agency.save();
      insertedAgencies.push(savedAgency);
    }

    console.log(`✅ Successfully seeded ${insertedAgencies.length} agencies:`);

    insertedAgencies.forEach(agency => {
      console.log(`  - ${agency.name} (${agency.type})`);
      console.log(`    Agency ID: ${agency.agencyId}`);
      console.log(`    Email: ${agency.email}`);
      console.log(`    Test Password: ${getTestPassword(agency.agencyId!)}`);
      console.log('');
    });

    console.log('🎉 Agency seeding completed!');
    console.log('');
    console.log('📝 Test Credentials for Agency Login:');
    console.log('You can now login with either Agency ID or Email:');
    console.log('');
    sampleAgencies.forEach(agencyData => {
      console.log(`${agencyData.name}:`);
      console.log(`  - Agency ID: ${agencyData.agencyId} | Password: ${getTestPassword(agencyData.agencyId)}`);
      console.log(`  - Email: ${agencyData.email} | Password: ${getTestPassword(agencyData.agencyId)}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding agencies:', error);
    process.exit(1);
  }
}

// Run the seeder
seedAgencies();
