import Queue from '../models/Queue.js';
import Token from '../models/Token.js';

export const getAnalytics = async (req, res) => {
  const queues = await Queue.find({ manager: req.user.id }).select('_id name');
  const queueIds = queues.map((queue) => queue._id);
  const [waiting, serving, completed, cancelled, completedTokens] = await Promise.all([
    Token.countDocuments({ queue: { $in: queueIds }, status: 'WAITING' }),
    Token.countDocuments({ queue: { $in: queueIds }, status: 'SERVING' }),
    Token.countDocuments({ queue: { $in: queueIds }, status: 'COMPLETED' }),
    Token.countDocuments({ queue: { $in: queueIds }, status: 'CANCELLED' }),
    Token.find({ queue: { $in: queueIds }, status: 'COMPLETED', calledAt: { $exists: true }, completedAt: { $exists: true } }).select('createdAt calledAt completedAt')
  ]);
  const averageWaitMinutes = completedTokens.length
    ? Math.round(completedTokens.reduce((sum, token) => sum + (token.calledAt - token.createdAt) / 60000, 0) / completedTokens.length)
    : 0;
  const trend = await Promise.all(Array.from({ length: 7 }, async (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const tokens = await Token.countDocuments({ queue: { $in: queueIds }, createdAt: { $gte: date, $lt: nextDate } });
    return { date: date.toLocaleDateString('en-US', { weekday: 'short' }), tokens };
  }));
  res.json({ waiting, serving, completed, cancelled, averageWaitMinutes, trend, queues: queues.length });
};
