import mongoose, { Document, Schema } from 'mongoose';

export type IssueType = 'waste' | 'drainage' | 'pollution' | 'other';
export type IssueStatus = 'reported' | 'under_review' | 'resolved';

export interface IIssueReport extends Document {
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  address: string;
  imageUrl?: string;
  imagePublicId?: string;
  reportedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  assignedAgency?: mongoose.Types.ObjectId;
  assignedAt?: Date;
  autoAssigned: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedResolutionTime?: Date;
  citizenFeedback?: {
    rating: number;
    comment?: string;
    submittedAt: Date;
  };
  agencyNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IssueReportSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    enum: ['waste', 'drainage', 'pollution', 'other']
  },
  status: {
    type: String,
    enum: ['reported', 'under_review', 'resolved'],
    default: 'reported'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(coords: number[]) {
          return coords.length === 2 &&
                 coords[1] >= -90 && coords[1] <= 90 &&
                 coords[0] >= -180 && coords[0] <= 180;
        },
        message: 'Invalid coordinates'
      }
    }
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true
  },
  imagePublicId: {
    type: String,
    trim: true
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAgency: {
    type: Schema.Types.ObjectId,
    ref: 'Agency'
  },
  assignedAt: {
    type: Date
  },
  autoAssigned: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  estimatedResolutionTime: {
    type: Date
  },
  citizenFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 500
    },
    submittedAt: {
      type: Date
    }
  },
  agencyNotes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Create geospatial index for location-based queries
IssueReportSchema.index({ location: '2dsphere' });

// Index for efficient status and type filtering
IssueReportSchema.index({ status: 1, type: 1 });
IssueReportSchema.index({ reportedBy: 1 });
IssueReportSchema.index({ assignedAgency: 1, status: 1 });
IssueReportSchema.index({ assignedTo: 1 });
IssueReportSchema.index({ priority: 1, createdAt: -1 });
IssueReportSchema.index({ createdAt: -1 });

export default mongoose.model<IIssueReport>('IssueReport', IssueReportSchema);
