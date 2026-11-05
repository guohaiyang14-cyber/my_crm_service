import type { NextFunction, Request, Response } from 'express';

// 脱敏工具：将 URL 中的敏感 query 参数替换为 [REDACTED]
function sanitizeUrl(url: string): string {
  // 匹配 token、password、secret 等参数名，不区分大小写
  return url.replace(/(token|password|secret|auth|jwt|search)=[^&]*/gi, '$1=[REDACTED]');
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = Date.now();

  // 对 URL 进行脱敏处理，防止 query string 泄漏 Token
  const safeUrl = sanitizeUrl(req.originalUrl);

  res.on('finish', () => {
    const duration = Date.now() - startedAt;

    // ⚠️ 安全警告：绝对不要在这里打印 req.body 或 req.headers.authorization！
    // 如果未来需要打印 headers，请务必剔除 authorization 字段。

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${safeUrl} -> ${res.statusCode} ${duration}ms`
    );
  });

  next();
};
