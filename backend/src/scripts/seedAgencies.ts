import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import crypto from "crypto";
import Agency from "../models/Agency";
import connectDB from "../config/db";

// Helper function to get test password for display
const getTestPassword = (agencyId: string): string => {
    const passwordMap: { [key: string]: string } = {
        LAWMA001: "lawma2024",
        LSWC002: "lswc2024",
        LASEPA003: "lasepa2024",
        LSPWC004: "lspwc2024",
        VIEU005: "vieu2024",
    };
    return passwordMap[agencyId] || "unknown";
};

const sampleAgencies = [
    {
        name: "Lagos Waste Management Authority",
        type: "waste_management",
        description:
            "Responsible for waste collection, disposal, and recycling across Lagos State",
        email: "agency@lawma.gov.ng",
        phone: "+234-1-700-5296",
        address: "LAWMA Headquarters, Ijora, Lagos",
        issueTypes: ["waste"],
        isActive: true,
        agencyId: "LAWMA001",
        password: crypto.createHash("sha256").update("lawma2024").digest("hex"),
        status: "active",
        contactPerson: {
            name: "Ibrahim Odumboni",
            email: "md@lawma.gov.ng",
            phone: "+234-1-700-5296",
        },
        workingHours: {
            start: "08:00",
            end: "17:00",
            days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        },
        priority: 1,
        serviceAreas: [], // TODO: Add geospatial coordinates later
    },
    {
        name: "Lagos State Water Corporation",
        type: "water_authority",
        description:
            "Managing water supply and drainage infrastructure in Lagos State",
        email: "agency@lagoswater.gov.ng",
        phone: "+234-1-800-9247",
        address: "Water Corporation House, Alausa, Ikeja",
        issueTypes: ["drainage", "pollution"],
        isActive: true,
        agencyId: "LSWC002",
        password: crypto.createHash("sha256").update("lswc2024").digest("hex"),
        status: "active",
        contactPerson: {
            name: "Muminu Badmus",
            email: "gm@lagoswater.gov.ng",
            phone: "+234-1-800-9247",
        },
        workingHours: {
            start: "07:30",
            end: "16:30",
            days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        },
        priority: 1,
        serviceAreas: [], // TODO: Add geospatial coordinates later
    },
    {
        name: "Lagos State Environmental Protection Agency",
        type: "environmental_protection",
        description:
            "Environmental monitoring and protection across Lagos State",
        email: "agency@lasepa.gov.ng",
        phone: "+234-1-773-7000",
        address: "LASEPA House, Alausa Secretariat, Ikeja",
        issueTypes: ["pollution", "other"],
        isActive: true,
        agencyId: "LASEPA003",
        password: crypto
            .createHash("sha256")
            .update("lasepa2024")
            .digest("hex"),
        status: "active",
        contactPerson: {
            name: "Babatunde Ajayi",
            email: "gm@lasepa.gov.ng",
            phone: "+234-1-773-7000",
        },
        workingHours: {
            start: "08:00",
            end: "17:00",
            days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        },
        priority: 2,
        serviceAreas: [], // TODO: Add geospatial coordinates later
    },
    {
        name: "Lagos State Public Works Corporation",
        type: "public_works",
        description: "Infrastructure maintenance and public works projects",
        email: "agency@lagospwc.gov.ng",
        phone: "+234-1-234-5678",
        address: "Public Works House, Marina, Lagos",
        issueTypes: ["drainage", "other"],
        isActive: true,
        agencyId: "LSPWC004",
        password: crypto.createHash("sha256").update("lspwc2024").digest("hex"),
        status: "active",
        contactPerson: {
            name: "Olumide Ogundipe",
            email: "md@lagospwc.gov.ng",
            phone: "+234-1-234-5678",
        },
        workingHours: {
            start: "07:00",
            end: "16:00",
            days: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
            ],
        },
        priority: 3,
        serviceAreas: [], // TODO: Add geospatial coordinates later
    },
    {
        name: "Victoria Island Environmental Unit",
        type: "general",
        description: "General environmental services for Victoria Island area",
        email: "agency@vi-env.gov.ng",
        phone: "+234-1-987-6543",
        address: "Environmental Unit, Victoria Island, Lagos",
        issueTypes: ["waste", "drainage", "pollution", "other"],
        isActive: true,
        agencyId: "VIEU005",
        password: crypto.createHash("sha256").update("vieu2024").digest("hex"),
        status: "active",
        contactPerson: {
            name: "Adebayo Johnson",
            email: "coordinator@vi-env.gov.ng",
            phone: "+234-1-987-6543",
        },
        workingHours: {
            start: "08:30",
            end: "17:30",
            days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        },
        priority: 2,
        serviceAreas: [], // TODO: Add geospatial coordinates later
    },
];

async function seedAgencies() {
    try {
        console.log("🌱 Starting agency seeding...");

        await connectDB();

        // Clear existing agencies
        await Agency.deleteMany({});
        console.log("🗑️ Cleared existing agencies");

        // Insert sample agencies
        const agencies = await Agency.insertMany(sampleAgencies);
        console.log(`✅ Successfully seeded ${agencies.length} agencies:`);

        agencies.forEach((agency) => {
            console.log(`  - ${agency.name} (${agency.type})`);
            console.log(`    Agency ID: ${agency.agencyId}`);
            console.log(`    Email: ${agency.email}`);
            console.log(
                `    Test Password: ${getTestPassword(agency.agencyId!)}`
            );
            console.log("");
        });

        console.log("🎉 Agency seeding completed!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error seeding agencies:", error);
        process.exit(1);
    }
}

// Run the seeder
seedAgencies();
