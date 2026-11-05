import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthRequest extends Request {
  user?: { userId: number; email: string };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!JWT_SECRET) {
    // 如果环境变量缺失，这是服务器内部错误，不是客户端的问题
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: '服务器配置错误' } });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: '需要登录',
      },
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: '令牌已过期或无效' },
    });
  }
};
