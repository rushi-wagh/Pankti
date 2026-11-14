import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager', required: true, index: true },
  nextTokenNumber: { type: Number, default: 1 },
  nextPosition: { type: Number, default: 1 },
  currentServingToken: { type: mongoose.Schema.Types.ObjectId, default: null }
}, { timestamps: true });

export default mongoose.model('Queue', queueSchema);
