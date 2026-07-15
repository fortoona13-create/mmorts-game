import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Bull from 'bull';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import pool from './db';

// Import routes
import authRoutes from './routes/auth.routes';
import gameRoutes from './routes/game.routes';
import marketRoutes from './routes/market.routes';
import militaryRoutes from './routes/military.routes';
import chatRoutes from './routes/chat.routes';

// Import workers
import { HappinessWorker } from './workers/happiness.worker';
import { ProductionWorker } from './workers/production.worker';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;
const GAME_TICK_INTERVAL = parseInt(process.env.GAME_TICK_INTERVAL || '300000', 10); // 5 min

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/military', militaryRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  socket.on('subscribe_country', (countryId) => {
    socket.join(`country_${countryId}`);
    console.log(`User ${socket.id} subscribed to country ${countryId}`);
  });

  socket.on('subscribe_region', (regionId) => {
    socket.join(`region_${regionId}`);
    console.log(`User ${socket.id} subscribed to region ${regionId}`);
  });
});

// Background Jobs
const happinessQueue = new Bull('happiness', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
});

const productionQueue = new Bull('production', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
});

happinessQueue.process(async () => {
  await HappinessWorker.calculateAndUpdateHappiness();
  return { success: true };
});

productionQueue.process(async () => {
  await ProductionWorker.calculateProduction();
  return { success: true };
});

// Schedule recurring jobs
happinessQueue.add({}, { repeat: { every: GAME_TICK_INTERVAL } });
productionQueue.add({}, { repeat: { every: GAME_TICK_INTERVAL } });

// Real-time game tick broadcast
setInterval(async () => {
  try {
    // Get all countries and emit updates
    const result = await pool.query('SELECT id, happiness_level FROM countries WHERE user_id IS NOT NULL');
    
    for (const country of result.rows) {
      io.to(`country_${country.id}`).emit('happiness_update', {
        countryId: country.id,
        happiness: country.happiness_level,
      });
    }

    // Broadcast market prices
    const prices = await pool.query('SELECT resource_type, price_per_unit FROM market_prices');
    io.emit('market_update', { prices: prices.rows });
  } catch (error) {
    console.error('Broadcast error:', error);
  }
}, 10000); // Every 10 seconds

// Server startup
httpServer.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎮 MMORTS Game Server Running`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Server: http://localhost:${PORT}`);
  console.log(`✅ WebSocket: ws://localhost:${PORT}`);
  console.log(`✅ Health: http://localhost:${PORT}/health`);
  console.log(`${'='.repeat(60)}\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await happinessQueue.close();
  await productionQueue.close();
  await pool.end();
  process.exit(0);
});

export default app;
export { io };
