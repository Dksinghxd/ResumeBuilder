import { Schema, model, Document, Types } from 'mongoose';

export interface IResume extends Document {
  userId: Types.ObjectId;
  title: string;
  templateId?: string;
  status: 'draft' | 'published' | 'archived';
  personalInfo: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email: string;
    phone?: string;
    location?: string;
    website?: string;
    summary?: string;
    profileImage?: string;
  };
  experience?: Array<{
    jobTitle: string;
    company: string;
    startDate: Date;
    endDate?: Date;
    currentlyWorking: boolean;
    description?: string;
    location?: string;
  }>;
  education?: Array<{
    schoolName: string;
    degree: string;
    fieldOfStudy?: string;
    startDate: Date;
    endDate?: Date;
    currentlyStudying: boolean;
    description?: string;
  }>;
  skills?: Array<{
    name: string;
    proficiency: 'beginner' | 'intermediate' | 'expert';
    endorsements: number;
  }>;
  certifications?: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: Date;
    expirationDate?: Date;
    credentialUrl?: string;
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    technologies?: string[];
    startDate?: Date;
    endDate?: Date;
    link?: string;
  }>;
  socialLinks?: Array<{
    platform: string;
    url: string;
  }>;
  score?: number;
  viewCount: number;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    templateId: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    personalInfo: {
      firstName: { type: String, required: false, trim: true },
      lastName: { type: String, required: false, trim: true },
      name: { type: String, trim: true },
      email: { type: String, required: true, trim: true },
      phone: String,
      location: String,
      website: String,
      summary: { type: String, maxlength: 500 },
      profileImage: String,
    },
    experience: [
      {
        jobTitle: { type: String, required: true, trim: true },
        company: { type: String, required: true, trim: true },
        startDate: { type: Date, required: true },
        endDate: Date,
        currentlyWorking: { type: Boolean, default: false },
        description: String,
        location: String,
      },
    ],
    education: [
      {
        schoolName: { type: String, required: true, trim: true },
        degree: { type: String, required: true, trim: true },
        fieldOfStudy: String,
        startDate: { type: Date, required: true },
        endDate: Date,
        currentlyStudying: { type: Boolean, default: false },
        description: String,
      },
    ],
    skills: [
      {
        name: { type: String, required: true, trim: true },
        proficiency: {
          type: String,
          enum: ['beginner', 'intermediate', 'expert'],
          required: true,
        },
        endorsements: { type: Number, default: 0 },
      },
    ],
    certifications: [
      {
        name: { type: String, required: true, trim: true },
        issuingOrganization: { type: String, required: true, trim: true },
        issueDate: { type: Date, required: true },
        expirationDate: Date,
        credentialUrl: String,
      },
    ],
    projects: [
      {
        name: { type: String, required: true, trim: true },
        description: String,
        technologies: [String],
        startDate: Date,
        endDate: Date,
        link: String,
      },
    ],
    socialLinks: [
      {
        platform: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
      },
    ],
    score: { type: Number, min: 0, max: 100 },
    viewCount: { type: Number, default: 0 },
    downloadCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

resumeSchema.index({ userId: 1, createdAt: -1 });
resumeSchema.index({ 'personalInfo.email': 1 });

export default model<IResume>('Resume', resumeSchema);
