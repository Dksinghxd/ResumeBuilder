import { Schema, model, Document } from 'mongoose';

export interface IFeedback extends Document {
  name: string;
  email: string;
  type: 'suggestion' | 'bug' | 'template' | 'other';
  message: string;
  status: 'new' | 'reviewed' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true },
    type: {
      type: String,
      enum: ['suggestion', 'bug', 'template', 'other'],
      default: 'suggestion',
    },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: {
      type: String,
      enum: ['new', 'reviewed', 'closed'],
      default: 'new',
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ status: 1, createdAt: -1 });

export default model<IFeedback>('Feedback', feedbackSchema);
