import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../utils/prisma.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';

const JWT_SECRET = process.env.JWT_SECRET!;

export const register = async (data: any) => {
  const result = registerSchema.safeParse(data);
  if (!result.success) {
    return { details: result.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`) };
  }

  const { email, password } = result.data;

  if (!email || !password) {
    return { details: ['邮箱和密码必须输入'] };
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isAdmin = !!adminEmail && email === adminEmail && !!process.env.ADMIN_INVITE_CODE &&
    data.inviteCode === process.env.ADMIN_INVITE_CODE;
  if ((process.env.NODE_ENV === 'production' && !isAdmin) ||
      (email === adminEmail && !isAdmin)) {
    return { details: ['注册已关闭或邮箱、邀请码无效'] };
  }

  const existing = await prisma.user.findUnique({ where: { email: email } });
  if (existing) {
    return { details: ['该邮箱已被注册，请使用其他邮箱。'] };
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: email,
        password: hashedPassword,
        role: isAdmin ? 'ADMIN' : 'USER',
      },
    });

    return { user: { id: user.id, email: user.email, name: user.name } };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
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

  const token = jwt.sign({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion }, JWT_SECRET, { expiresIn: '1h' });

  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
};
