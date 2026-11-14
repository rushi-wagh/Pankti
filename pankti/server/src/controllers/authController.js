import bcrypt from 'bcryptjs';
import Manager from '../models/Manager.js';
import { createToken } from '../utils/token.js';

export const login = async (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const manager = await Manager.findOne({ email });
  if (!manager || !(await bcrypt.compare(req.body.password || '', manager.password))) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ token: createToken(manager), manager: { id: manager.id, name: manager.name, email: manager.email } });
};

export const getCurrentManager = async (req, res) => {
  const manager = await Manager.findById(req.user.id).select('name email');
  if (!manager) return res.status(404).json({ error: 'Manager not found' });
  res.json({ id: manager.id, name: manager.name, email: manager.email });
};
