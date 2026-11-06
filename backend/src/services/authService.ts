import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../utils/prisma.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';

const JWT_SECRET = process.env.JWT_SECRET!;

export const register = async (data: any) => {
  // 简单粗暴：如果在生产环境，且没有传正确的邀请码，直接拒绝
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.ADMIN_INVITE_CODE || data.inviteCode !== process.env.ADMIN_INVITE_CODE)
  ) {
    return { details: ['注册已关闭或邀请码无效'] };
  }

  const result = registerSchema.safeParse(data);
  if (!result.success) {
    return { details: result.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`) };
  }

  const { email, password } = result.data;

  if (!email || !password) {
    return { details: ['邮箱和密码必须输入'] };
  }

  if (process.env.NODE_ENV === 'production' && email !== process.env.ADMIN_EMAIL) {
    return { details: ['禁止其他用户注册'] };
  }

  const existing = await prisma.user.findUnique({ where: { email: email } });
  if (existing) {
    return { details: ['该邮箱已被注册，请使用其他邮箱。'] };
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  try {
    const user = await prisma.user.create({
      data: { name: data.name, email: email, password: hashedPassword },
    });

    return { user: { id: user.id, email: user.email, name: user.name } };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ['P2002', 'P2022'].includes(error.code)
    ) {
      return { details: ['该邮箱已被注册，请使用其他邮箱。'] };
    }
    throw error;
  }
};

export const login = async (data: any) => {
  const result = loginSchema.safeParse(data);
  if (!result.success) {
    return { details: result.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`) };
  }

  const { email, password } = result.data;

  if (!email || !password) {
    return { details: ['请输入邮箱和密码'] };
  }

  const genericError = { details: ['邮箱或密码无效'] };

  const user = await prisma.user.findUnique({ where: { email: email } });
  if (!user) {
    return genericError;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return genericError;
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

  return { token, user: { id: user.id, name: user.name, email: user.email } };
};
