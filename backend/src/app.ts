import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import chatRoutes from './routes/chat.routes';
import navigationRoutes from './routes/navigation.routes';
import { apiRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler } from './middlewares/error.middleware';

const app: Express = express();

// Security and resilience middlewares
app.use(helmet());
app.use(cors({ origin: '*' })); // Configure origin appropriately in production env
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all API endpoints
app.use('/api', apiRateLimiter);

// Bind API Routes
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/navigation', navigationRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
