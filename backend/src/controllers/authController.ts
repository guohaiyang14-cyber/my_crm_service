import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService.js';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    if ('details' in result) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: '请求体无效',
          details: result.details,
        },
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
        error: {
          code: 'UNAUTHORIZED',
          message: '用户名或密码错误',
          details: result.details,
        },
      });
    }
    res.status(200).json({
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
