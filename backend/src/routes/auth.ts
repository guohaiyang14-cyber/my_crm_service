import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController.js';

const router: ReturnType<typeof Router> = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 5, // 测试环境放开限制
  message: {
    error: { code: 'TOO_MANY_REQUESTS', message: '登录尝试过于频繁，请 15 分钟后再试' },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
export default router;
