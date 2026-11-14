import 'dotenv/config';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const server = createServer(app);
const io = new Server(server, { cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' } });

io.on('connection', (socket) => {
  socket.on('queue:join', (queueId) => socket.join(`queue:${queueId}`));
});

app.set('io', io);

const startServer = async () => {
  await connectDatabase();
  const port = process.env.PORT || 4000;
  server.listen(port, () => console.log(`QueueFlow API running on port ${port}`));
};

startServer().catch((error) => {
  console.error('Server startup failed:', error.message);
  process.exit(1);
});
