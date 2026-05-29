import { Schema, model, Document, Types } from 'mongoose';

export interface IShareLink extends Document {
  resumeId: Types.ObjectId;
  userId: Types.ObjectId;
  token: string;
  expiresAt?: Date;
  allowDownload: boolean;
  allowComments: boolean;
  viewCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const shareLinkSchema = new Schema<IShareLink>(
  {
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: Date,
    allowDownload: {
      type: Boolean,
      default: true,
    },
    allowComments: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

shareLinkSchema.index({ resumeId: 1, userId: 1 });
shareLinkSchema.index({ expiresAt: 1 });

// Automatically disable expired share links
shareLinkSchema.pre('find', function () {
  this.find({ expiresAt: { $lt: new Date() } }).updateMany(
    {},
    { isActive: false }
  );
});

export default model<IShareLink>('ShareLink', shareLinkSchema);
