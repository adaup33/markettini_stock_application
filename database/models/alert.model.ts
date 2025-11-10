import { Schema, model, models, type Document, type Model } from 'mongoose';

export type AlertOperator = '>' | '<' | '>=' | '<=' | '=='

export interface AlertItem extends Document {
  userId: string;
  symbol: string;
  operator: AlertOperator;
  threshold: number;
  active: boolean;
  note?: string;
  createdAt: Date;
  lastTriggeredAt?: Date;
}

const AlertSchema = new Schema<AlertItem>(
  {
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true, uppercase: true, trim: true },
    operator: { type: String, required: true, enum: ['>', '<', '>=', '<=', '=='] },
    threshold: { type: Number, required: true },
    active: { type: Boolean, default: true },
    note: { type: String, required: false, trim: true, default: undefined },
    createdAt: { type: Date, default: Date.now },
    lastTriggeredAt: { type: Date, required: false, default: undefined },
  },
  { timestamps: false }
);

// Helpful compound index for per-symbol queries per user
AlertSchema.index({ userId: 1, symbol: 1 });

export const Alert: Model<AlertItem> =
  (models?.Alert as Model<AlertItem>) || model<AlertItem>('Alert', AlertSchema);
