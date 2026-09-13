import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config.js';
import { authRouter } from './routes/auth.routes.js';
import { jobsRouter } from './routes/jobs.routes.js';
import { paymentsRouter } from './routes/payments.routes.js';
import { auditRouter } from './routes/audit.routes.js';
import { checkSystemHealth, printStartupStatus } from './services/health.service.js';
import { logger } from './utils/logger.js';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server, health checks)
      if (!origin) return callback(null, true);
      if (config.corsOrigin === '*' || !config.corsOrigin) return callback(null, true);
      const allowed = config.corsOrigin.split(',').map((o) => o.trim());
      if (
        allowed.includes('*') ||
        allowed.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for hackathon deployment
    },
    credentials: true,
  })
);
app.use(express.json());

// Request & Response Logging Middleware for all APIs
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  let errorMessage: string | undefined;

  // Intercept response methods to capture error messages on failure
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 400 && body && (body.error || body.message)) {
      errorMessage = body.error || body.message;
    }
    return originalJson(body);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(
      req.method,
      req.originalUrl,
      res.statusCode,
      duration,
      errorMessage,
      res.statusCode >= 400 && req.body && Object.keys(req.body).length > 0 ? req.body : undefined
    );
  });

  next();
});

// Live Health & Diagnostics endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await checkSystemHealth();
    res.json({
      status: 'ok',
      service: 'ProofPay API',
      integrations: health,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.paymentError('Health check endpoint failed:', err.message);
    res.status(500).json({ error: err.message, status: 'error' });
  }
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/audit', auditRouter);

// Catch-all 404 handler for undefined API routes
app.use((req: Request, res: Response) => {
  const errorMsg = `Route not found: ${req.method} ${req.originalUrl}`;
  logger.http(req.method, req.originalUrl, 404, 0, errorMsg, req.body);
  res.status(404).json({
    error: errorMsg,
    code: 'ROUTE_NOT_FOUND',
    method: req.method,
    path: req.originalUrl,
  });
});

// Global Unhandled Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.paymentError(`💥 Internal Server Error on ${req.method} ${req.originalUrl}:`, {
    message: err.message,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  });
  res.status(500).json({
    error: err.message || 'Internal server error occurred',
    code: 'INTERNAL_SERVER_ERROR',
  });
});

// Catch global process exceptions to prevent silent crashes
process.on('uncaughtException', (err) => {
  logger.paymentError('💥 Process Uncaught Exception:', err.stack || err.message);
});

process.on('unhandledRejection', (reason: any) => {
  logger.paymentError('💥 Process Unhandled Rejection:', reason?.stack || reason?.message || reason);
});

app.listen(config.port, async () => {
  const health = await checkSystemHealth();
  printStartupStatus(health, config.port);
});
