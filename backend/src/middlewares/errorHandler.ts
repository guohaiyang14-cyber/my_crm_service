import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../generated/prisma/index.js';

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `无法访问 ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  if (res.headersSent) {
    return;
  }

  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({
      code: 'INVALID_JSON',
      message: '请求体不是有效的 JSON',
    });
    return;
  }

  // 专门处理 CORS 错误
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      code: 'FORBIDDEN',
      message: 'CORS policy violation',
    });
    return;
  }

  const isUniqueConstraintError =
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

  if (isUniqueConstraintError) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: '邮箱已被注册',
      details: ['该邮箱已被注册，请使用其他邮箱。'],
    });
    return;
  }

  const status = err?.status ?? err?.statusCode ?? 500;

  if (status >= 500) {
    console.error('[500]', err);
  }

  res.status(status).json({
    code: err?.code ?? (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    message: status >= 500 ? '服务器内部错误' : err?.message,
    ...(err?.details ? { details: err.details } : {}),
  });
};
