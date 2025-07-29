import mongoose, { Document, Schema } from 'mongoose';

export type AgencyType = 'waste_management' | 'water_authority' | 'environmental_protection' | 'public_works' | 'general';

export interface IAgency extends Document {
  name: string;
  type: AgencyType;
  description?: string;
  email: string;
  phone?: string;
  address?: string;
  serviceAreas: {
    type: 'Polygon';
    coordinates: number[][][];
  }[];
  issueTypes: string[]; // Types of issues this agency handles
  isActive: boolean;
  contactPerson?: {
    name: string;
    email: string;
    phone?: string;
  };
  workingHours?: {
    start: string;
    end: string;
    days: string[];
  };
  priority: number; // For assignment precedence (1 = highest priority)
  // Authentication fields
  agencyId?: string; // Unique agency identifier
  password?: string; // Hashed password for agency login
  setupToken?: string; // Token for email verification setup
  setupTokenExpiry?: Date; // Expiry for setup token
  status?: 'pending_setup' | 'active' | 'suspended'; // Agency status
  credentialsSetAt?: Date; // When credentials were set up
  // Session management fields
  sessionToken?: string; // Current login session token
  sessionTokenExpiry?: Date; // Session token expiry
  lastLoginAt?: Date; // Last login timestamp
  createdAt: Date;
  updatedAt: Date;
}

const AgencySchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  type: {
    type: String,
    required: true,
    enum: ['waste_management', 'water_authority', 'environmental_protection', 'public_works', 'general']
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  serviceAreas: [{
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon'
    },
    coordinates: {
      type: [[[Number]]], // Array of polygons
      required: true
    }
  }],
  issueTypes: [{
    type: String,
    enum: ['waste', 'drainage', 'pollution', 'other']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  contactPerson: {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  workingHours: {
    start: {
      type: String, // Format: "09:00"
      default: "09:00"
    },
    end: {
      type: String, // Format: "17:00"
      default: "17:00"
    },
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }]
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  // Authentication fields
  agencyId: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but ensure uniqueness when present
    trim: true
  },
  password: {
    type: String,
    select: false // Don't include password in queries by default
  },
  setupToken: {
    type: String,
    select: false
  },
  setupTokenExpiry: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending_setup', 'active', 'suspended'],
    default: 'active'
  },
  credentialsSetAt: {
    type: Date
  },
  // Session management fields
  sessionToken: {
    type: String,
    select: false
  },
  sessionTokenExpiry: {
    type: Date
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create geospatial index for service areas
AgencySchema.index({ "serviceAreas": "2dsphere" });

// Index for efficient filtering
AgencySchema.index({ type: 1, isActive: 1 });
AgencySchema.index({ issueTypes: 1, isActive: 1 });
AgencySchema.index({ priority: 1 });
AgencySchema.index({ agencyId: 1 });
AgencySchema.index({ setupToken: 1 });
AgencySchema.index({ status: 1 });

export default mongoose.model<IAgency>('Agency', AgencySchema);
