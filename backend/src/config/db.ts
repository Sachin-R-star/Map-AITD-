import mongoose from 'mongoose';
import winston from 'winston';
import { env } from './env';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

export const connectDB = async (): Promise<void> => {
  try {
    logger.info(`Connecting to MongoDB at ${env.MONGODB_URI}`);
    await mongoose.connect(env.MONGODB_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};
