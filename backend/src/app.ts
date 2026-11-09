import cors from 'cors';
import express, { type Express } from 'express';

import { errorHandler, notFound } from './middlewares/errorHandler.js';
import healthRoutes from './routes/health.js';
import customersRoutes from './routes/customers.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import { requestLogger } from './utils/logger.js';

const app: Express = express();

// 信任 Nginx 传来的 X-Forwarded-For 头（必须加上，否则限流器会报错）
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:8888')
  .split(',')
  .map((origin) => origin.trim()) // <--- 去空格
  .filter(Boolean);

app.disable('x-powered-by');
app.use(requestLogger);
app.use(
  cors({
    origin: (origin, callback) => {
      // 允许没有 origin 的请求（比如 postman 或服务端调用）
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // 显式抛出错误，交给全局 errorHandler 处理
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);
app.use(express.json({ limit: '1mb' }));

app.use('/api/health', healthRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
