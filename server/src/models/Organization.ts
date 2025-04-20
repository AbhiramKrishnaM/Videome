import mongoose, { Document, Schema, Model } from 'mongoose';

// Organization interface
export interface IOrganization extends Document {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  address?: string;
  phoneNumber?: string;
  industry?: string;
  size?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Organization schema
const OrganizationSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
      unique: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    logo: {
      type: String,
    },
    website: {
      type: String,
    },
    address: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    industry: {
      type: String,
    },
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001+'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Index for faster lookups
OrganizationSchema.index({ name: 1 });

const Organization: Model<IOrganization> = mongoose.model<IOrganization>(
  'Organization',
  OrganizationSchema,
);

export default Organization;
