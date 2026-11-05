import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('请输入正确的邮箱格式').max(255),
  password: z.string().min(6, '密码长度不能少于 6 位').max(100),
  name: z.string().trim().max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('请输入正确的邮箱格式'),
  password: z.string().min(1, '密码是必填项'),
});
