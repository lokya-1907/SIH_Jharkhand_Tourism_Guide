import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Tourist', 'Vendor', 'Guide', 'Admin'], required: true },
}, { timestamps: true });

// Ensure uniqueness per (email, role) instead of global email
userSchema.index({ email: 1, role: 1 }, { unique: true });

export default mongoose.model('User', userSchema);