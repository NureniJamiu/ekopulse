import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'citizen' | 'authority' | 'agency_admin';
  agency?: mongoose.Types.ObjectId;
  permissions?: string[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['citizen', 'authority', 'agency_admin'],
    default: 'citizen'
  },
  agency: {
    type: Schema.Types.ObjectId,
    ref: 'Agency'
  },
  permissions: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema);
