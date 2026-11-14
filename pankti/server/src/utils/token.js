import jwt from 'jsonwebtoken';

export const createToken = (manager) => jwt.sign(
  { id: manager._id.toString(), email: manager.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

export const serializeToken = (token) => ({
  id: token._id.toString(),
  queueId: token.queue.toString(),
  name: token.name,
  number: token.number,
  position: token.position,
  status: token.status,
  calledAt: token.calledAt,
  completedAt: token.completedAt,
  cancelledAt: token.cancelledAt,
  createdAt: token.createdAt
});
