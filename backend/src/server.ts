import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';

const startServer = async () => {
  // 1. Establish Database Connections
  await connectDB();
  
  // 2. Initialize Redis cache (continues gracefully if Redis fails)
  connectRedis();

  // 3. Listen on port
  app.listen(env.PORT, () => {
    console.log(`[Server] running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
};

startServer();
