import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthRequest extends Request {
  user?: { userId: number; email: string };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!JWT_SECRET) {
    // 如果环境变量缺失，这是服务器内部错误，不是客户端的问题
    return res.status(500).json({ code: 'INTERNAL_ERROR', message: '服务器配置错误' });
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: '需要登录',
    });
  }

  const token = authHeader.split(' ')[1];
  let decoded: { userId: number; email: string; tokenVersion: number };
  try {
    decoded = jwt.verify(token, JWT_SECRET) as typeof decoded;
    if (!Number.isSafeInteger(decoded.userId) || !Number.isSafeInteger(decoded.tokenVersion)) throw new Error('Invalid token');
  } catch {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: '令牌已过期或无效',
    });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { tokenVersion: true } });
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
      if (process.env.DEBUG_FIX) console.debug('[FIX] Rejected a revoked or obsolete session');
      return res.status(401).json({ code: 'UNAUTHORIZED', message: '登录已失效，请重新登录' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
