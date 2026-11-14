import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  queue: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  number: { type: Number, required: true },
  position: { type: Number, required: true },
  status: { type: String, enum: ['WAITING', 'SERVING', 'COMPLETED', 'CANCELLED'], default: 'WAITING', index: true },
  calledAt: Date,
  completedAt: Date,
  cancelledAt: Date
}, { timestamps: true });

tokenSchema.index({ queue: 1, number: 1 }, { unique: true });
tokenSchema.index({ queue: 1, status: 1, position: 1 });

export default mongoose.model('Token', tokenSchema);
