import type { NextFunction, Request, Response } from 'express';

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `无法访问 ${req.method} ${req.originalUrl}`,
    },
  });
};

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  if (res.headersSent) {
    return;
  }

  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({
      error: {
        code: 'INVALID_JSON',
        message: '请求体不是有效的 JSON',
      },
    });
    return;
  }

  // 专门处理 CORS 错误
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'CORS policy violation' },
    });
    return;
  }

  const status = err?.status ?? err?.statusCode ?? 500;

  if (status >= 500) {
    console.error('[500]', err);
  }

  res.status(status).json({
    error: {
      code: err?.code ?? (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
      message: status >= 500 ? '服务器内部错误' : err?.message,
    },
  });
};
