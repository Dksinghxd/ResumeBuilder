import { Schema, model, Document, Types } from 'mongoose';

export interface IAnalytics extends Document {
  userId: Types.ObjectId;
  resumeId?: Types.ObjectId;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
    },
    action: {
      type: String,
      required: true,
      enum: [
        'resume_viewed',
        'resume_created',
        'resume_updated',
        'resume_deleted',
        'pdf_generated',
        'share_link_created',
        'share_link_accessed',
        'resume_downloaded',
        'ai_suggestion_used',
        'login',
        'logout',
      ],
      index: true,
    },
    metadata: Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

analyticsSchema.index({ userId: 1, createdAt: -1 });
analyticsSchema.index({ action: 1, createdAt: -1 });
analyticsSchema.index({ resumeId: 1, createdAt: -1 });

// TTL Index to auto-delete old analytics after 90 days
analyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export default model<IAnalytics>('Analytics', analyticsSchema);
