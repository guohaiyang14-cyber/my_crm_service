import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService.js';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    if ('details' in result) {
      const message = result.details.some((detail) => /邮箱|已被注册|已存在|重复/.test(detail))
        ? '邮箱已被注册'
        : '请求体无效';

      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message,
        details: result.details,
      });
    }
    res.status(201).json({ data: result.user });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);
    if ('details' in result) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: '用户名或密码错误',
        details: result.details,
      });
    }
    res.status(200).json({
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
