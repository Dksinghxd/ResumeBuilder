import { Schema, model, Document } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  type: 'modern' | 'classic' | 'creative' | 'minimal' | 'professional';
  description?: string;
  thumbnail?: string;
  previewUrl?: string;
  colors: string[];
  fonts: {
    heading: string;
    body: string;
  };
  isPremium: boolean;
  isActive: boolean;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new Schema<ITemplate>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['modern', 'classic', 'creative', 'minimal', 'professional'],
      required: true,
    },
    description: String,
    thumbnail: String,
    previewUrl: String,
    colors: {
      type: [String],
      default: ['#000000', '#FFFFFF'],
    },
    fonts: {
      heading: { type: String, default: 'Arial' },
      body: { type: String, default: 'Helvetica' },
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    features: [String],
  },
  {
    timestamps: true,
  }
);

templateSchema.index({ type: 1 });
templateSchema.index({ isPremium: 1 });
templateSchema.index({ isActive: 1 });

export default model<ITemplate>('Template', templateSchema);
