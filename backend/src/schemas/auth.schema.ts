import { z } from 'zod';

const bcryptPasswordLimit = (password: string) => {
  const valid = Buffer.byteLength(password, 'utf8') <= 72;
  if (!valid && process.env.DEBUG_FIX) console.debug('[FIX] Password rejected: bcrypt byte limit exceeded');
  return valid;
};

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('请输入正确的邮箱格式').max(255),
  password: z.string().min(6, '密码长度不能少于 6 位').refine(bcryptPasswordLimit, '密码不能超过 72 字节'),
  name: z.string().trim().max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('请输入正确的邮箱格式'),
  password: z.string().min(1, '密码是必填项').refine(bcryptPasswordLimit, '密码不能超过 72 字节'),
});
