import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './User.js';

dotenv.config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

if (!process.env.MONGO_URI) {
  console.error('[BOOT] Missing MONGO_URI in environment');
}

mongoose.connect(process.env.MONGO_URI || '', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => console.log('[DB] connected'));
mongoose.connection.on('error', (err) => console.error('[DB] error', err));
mongoose.connection.on('disconnected', () => console.warn('[DB] disconnected'));

// Signup endpoint
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existing = await User.findOne({ email, role });
    if (existing) {
      return res.status(409).json({ message: 'User already registered with this role.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role });
    res.status(201).json({ message: 'Signup successful', user: { id: user._id, name, email, role } });
  } catch (err) {
    console.error('[SIGNUP] error', err);
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'User already registered with this role.' });
    }
    return res.status(500).json({ message: 'Server error', error: err?.message || 'Unknown error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email, role });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('[LOGIN] error', err);
    return res.status(500).json({ message: 'Server error', error: err?.message || 'Unknown error' });
  }
});

// Protected route example
app.get('/api/profile', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided.' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (err) {
    console.error('[PROFILE] error', err);
    res.status(401).json({ message: 'Invalid token.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 connected, 2 connecting
  res.json({ ok: true, dbState });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
