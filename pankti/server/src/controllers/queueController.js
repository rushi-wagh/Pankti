import Queue from '../models/Queue.js';
import Token from '../models/Token.js';
import { serializeToken } from '../utils/token.js';

const findOwnedQueue = (id, managerId) => Queue.findOne({ _id: id, manager: managerId });
const notifyQueue = (req, queueId) => req.app.get('io').to(`queue:${queueId}`).emit('queue:update', { queueId: queueId.toString() });

export const getQueues = async (req, res) => {
  const queues = await Queue.find({ manager: req.user.id }).sort({ createdAt: -1 }).lean();
  const counts = await Token.aggregate([
    { $match: { queue: { $in: queues.map((queue) => queue._id) }, status: 'WAITING' } },
    { $group: { _id: '$queue', count: { $sum: 1 } } }
  ]);
  const countMap = new Map(counts.map((item) => [item._id.toString(), item.count]));
  res.json(queues.map((queue) => ({ id: queue._id.toString(), name: queue.name, waitingCount: countMap.get(queue._id.toString()) || 0, createdAt: queue.createdAt })));
};

export const createQueue = async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Queue name is required' });
  const queue = await Queue.create({ name, manager: req.user.id });
  res.status(201).json({ id: queue.id, name: queue.name, waitingCount: 0, createdAt: queue.createdAt });
};

export const deleteQueue = async (req, res) => {
  const queue = await findOwnedQueue(req.params.id, req.user.id);
  if (!queue) return res.sendStatus(404);
  await Token.deleteMany({ queue: queue._id });
  await queue.deleteOne();
  res.sendStatus(204);
};

export const getQueueTokens = async (req, res) => {
  const queue = await findOwnedQueue(req.params.id, req.user.id);
  if (!queue) return res.sendStatus(404);
  const tokens = await Token.find({ queue: queue._id }).sort({ createdAt: -1 }).lean();
  const ordered = tokens.sort((a, b) => {
    const rank = { SERVING: 0, WAITING: 1, COMPLETED: 2, CANCELLED: 3 };
    return rank[a.status] - rank[b.status] || a.position - b.position || b.createdAt - a.createdAt;
  });
  res.json(ordered.map((token) => serializeToken({ ...token, queue: queue._id })));
};

export const addToken = async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Person name is required' });
  const queue = await findOwnedQueue(req.params.id, req.user.id);
  if (!queue) return res.sendStatus(404);
  const updatedQueue = await Queue.findOneAndUpdate(
    { _id: queue._id, manager: req.user.id },
    { $inc: { nextTokenNumber: 1, nextPosition: 1 } },
    { new: true }
  );
  const token = await Token.create({ queue: queue._id, name, number: updatedQueue.nextTokenNumber - 1, position: updatedQueue.nextPosition - 1 });
  notifyQueue(req, queue.id);
  res.status(201).json(serializeToken(token));
};

export const serveNext = async (req, res) => {
  const queue = await findOwnedQueue(req.params.id, req.user.id);
  if (!queue) return res.sendStatus(404);
  const nextToken = await Token.findOne({ queue: queue._id, status: 'WAITING' }).sort({ position: 1 });
  if (!nextToken) return res.status(409).json({ error: 'No one is waiting' });
  const claimed = await Queue.findOneAndUpdate(
    { _id: queue._id, currentServingToken: null },
    { $set: { currentServingToken: nextToken._id } },
    { new: true }
  );
  if (!claimed) return res.status(409).json({ error: 'Complete the currently serving token first' });
  const token = await Token.findOneAndUpdate(
    { _id: nextToken._id, status: 'WAITING' },
    { $set: { status: 'SERVING', calledAt: new Date() } },
    { new: true }
  );
  if (!token) {
    await Queue.updateOne({ _id: queue._id, currentServingToken: nextToken._id }, { $set: { currentServingToken: null } });
    return res.status(409).json({ error: 'The selected token is no longer waiting' });
  }
  notifyQueue(req, queue.id);
  res.json(serializeToken(token));
};

export const updateToken = async (req, res) => {
  const queue = await findOwnedQueue(req.params.id, req.user.id);
  if (!queue) return res.sendStatus(404);
  const token = await Token.findOne({ _id: req.params.tokenId, queue: queue._id });
  if (!token) return res.sendStatus(404);
  const { action } = req.body;
  if (action === 'cancel') {
    if (token.status !== 'WAITING') return res.status(409).json({ error: 'Only waiting tokens can be cancelled' });
    token.status = 'CANCELLED';
    token.cancelledAt = new Date();
  } else if (action === 'complete') {
    if (token.status !== 'SERVING') return res.status(409).json({ error: 'Only serving tokens can be completed' });
    token.status = 'COMPLETED';
    token.completedAt = new Date();
  } else if (action === 'up' || action === 'down') {
    if (token.status !== 'WAITING') return res.status(409).json({ error: 'Only waiting tokens can be reordered' });
    const direction = action === 'up' ? -1 : 1;
    const neighbor = await Token.findOne({ queue: queue._id, status: 'WAITING', position: direction < 0 ? { $lt: token.position } : { $gt: token.position } }).sort({ position: direction < 0 ? -1 : 1 });
    if (!neighbor) return res.json(serializeToken(token));
    const position = token.position;
    token.position = neighbor.position;
    neighbor.position = position;
    await Promise.all([token.save(), neighbor.save()]);
    notifyQueue(req, queue.id);
    return res.json({ ok: true });
  } else {
    return res.status(400).json({ error: 'Unknown action' });
  }
  await token.save();
  if (action === 'complete') await Queue.updateOne({ _id: queue._id, currentServingToken: token._id }, { $set: { currentServingToken: null } });
  notifyQueue(req, queue.id);
  res.json(serializeToken(token));
};
