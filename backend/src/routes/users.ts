import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '../generated/prisma/index.js';
import { requireAuth, type AuthRequest } from '../middlewares/authMiddleware.js';
import { registerSchema } from '../schemas/auth.schema.js';
import { prisma } from '../utils/prisma.js';

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { role: true } });
    if (!user) return res.status(401).json({ code: 'UNAUTHORIZED', message: '用户不存在' });
    if (user.role !== 'ADMIN') return res.status(403).json({ code: 'FORBIDDEN', message: '仅管理员可以管理账号' });
    next();
  } catch (error) {
    next(error);
  }
});

const publicFields = { id: true, email: true, name: true, role: true, createdAt: true } as const;
const userIdSchema = z.coerce.number().int().positive().safe();
const updateSchema = registerSchema.partial().strict().refine((value) => Object.keys(value).length > 0, '请提供要修改的信息');
const transferSchema = z.object({ targetUserId: z.number().int().positive().safe() }).strict();
router.get('/', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({ select: publicFields, orderBy: { id: 'asc' } });
    res.json({ data: users });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: '账号信息无效', details: parsed.error.issues.map((issue) => issue.message) });
  }
  try {
    const user = await prisma.user.create({
      data: { email: parsed.data.email, name: parsed.data.name, password: await bcrypt.hash(parsed.data.password, 10), role: 'VIEWER' },
      select: publicFields,
    });
    res.status(201).json({ data: user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ code: 'CONFLICT', message: '邮箱已被注册' });
    }
    next(error);
  }
});

router.post('/:id/transfer-customers', async (req, res, next) => {
  const sourceId = userIdSchema.safeParse(req.params.id);
  const body = transferSchema.safeParse(req.body);
  if (!sourceId.success || !body.success || sourceId.data === body.data.targetUserId) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: '请选择不同的有效账号' });
  }
  try {
    const result = await prisma.$transaction(async (tx) => {
      const [source, target] = await Promise.all([
        tx.user.findUnique({ where: { id: sourceId.data }, select: { id: true } }),
        tx.user.findUnique({ where: { id: body.data.targetUserId }, select: { id: true, role: true } }),
      ]);
      if (!source || !target) return { error: 'missing' as const };
      if (!['ADMIN', 'USER'].includes(target.role)) return { error: 'target' as const };
      const transferred = await tx.customer.updateMany({
        where: { ownerId: source.id },
        data: { ownerId: target.id },
      });
      return { count: transferred.count };
    });
    if ('error' in result) {
      return result.error === 'missing'
        ? res.status(404).json({ code: 'NOT_FOUND', message: '来源账号或目标账号不存在' })
        : res.status(400).json({ code: 'VALIDATION_ERROR', message: '目标账号必须具有客户管理权限' });
    }
    res.json({ data: { transferred: result.count } });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  const id = userIdSchema.safeParse(req.params.id);
  const parsed = updateSchema.safeParse(req.body);
  if (!id.success || !parsed.success) {
    return res.status(400).json({ code: 'VALIDATION_ERROR', message: '账号信息无效', details: parsed.success ? [] : parsed.error.issues.map((issue) => issue.message) });
  }
  try {
    const data = parsed.data;
    const user = await prisma.user.update({
      where: { id: id.data },
      data: { ...data, ...(data.password !== undefined ? { password: await bcrypt.hash(data.password, 10), tokenVersion: { increment: 1 } } : {}) },
      select: publicFields,
    });
    res.json({ data: user });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ code: 'CONFLICT', message: '邮箱已被注册' });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ code: 'NOT_FOUND', message: '账号不存在' });
    }
    next(error);
  }
});

router.delete('/:id', async (req: AuthRequest, res, next) => {
  const id = userIdSchema.safeParse(req.params.id);
  if (!id.success) return res.status(400).json({ code: 'VALIDATION_ERROR', message: '账号 ID 无效' });
  if (id.data === req.user!.userId) return res.status(400).json({ code: 'VALIDATION_ERROR', message: '不能删除当前登录账号' });
  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: id.data }, select: { id: true, _count: { select: { customers: true } } } });
      if (!user) return 'missing';
      if (user._count.customers) return 'has_customers';
      await tx.user.delete({ where: { id: id.data } });
      return 'deleted';
    });
    if (result === 'missing') return res.status(404).json({ code: 'NOT_FOUND', message: '账号不存在' });
    if (result === 'has_customers') return res.status(409).json({ code: 'CONFLICT', message: '该账号关联了客户，不能删除' });
    res.status(204).end();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return res.status(409).json({ code: 'CONFLICT', message: '该账号关联了客户，不能删除' });
    }
    next(error);
  }
});
export default router;
