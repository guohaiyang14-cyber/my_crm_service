import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from '../middlewares/authMiddleware.js';
import { prisma } from '../utils/prisma.js';
import * as service from '../services/customersService.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  followUpSchema,
  customerQuerySchema,
} from '../schemas/customer.schema.js';

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, role: true },
    });
    if (!user) return res.status(401).json({ code: 'UNAUTHORIZED', message: '用户不存在' });
    if (user.role === 'VIEWER' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: '访客只能查看数据' });
    }
    res.locals.access = { userId: user.id, canViewAll: ['ADMIN', 'VIEWER'].includes(user.role) };
    next();
  } catch (err) {
    next(err);
  }
});
const idSchema = z.coerce.number().int().positive().safe();
function parseId(req: Request, res: Response): number | null {
  const result = idSchema.safeParse(req.params.id);
  if (!result.success) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: '客户 ID 无效' });
    return null;
  }
  return result.data;
}
function parse<T>(schema: z.ZodType<T>, input: unknown, res: Response): { value: T } | null {
  const result = schema.safeParse(input);
  if (!result.success) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: '请求参数无效',
      details: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return null;
  }
  return { value: result.data };
}
const notFound = (res: Response) =>
  res.status(404).json({ code: 'NOT_FOUND', message: '客户不存在' });
router.get('/', async (req, res) => {
  const query = parse(customerQuerySchema, req.query, res);
  if (!query) return;
  res.json(await service.listCustomers(res.locals.access as service.Access, query.value));
});
router.get('/stats', async (_req, res) => {
  const data = await service.customerStats(res.locals.access as service.Access);
  res.json({ data });
});
router.post('/', async (req, res) => {
  const body = parse(createCustomerSchema, req.body, res);
  if (!body) return;
  const data = await service.createCustomer(res.locals.access as service.Access, body.value);
  res.status(201).location(`/api/customers/${data.id}`).json({ data });
});
router.get('/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const data = await service.getCustomer(res.locals.access as service.Access, id);
  if (!data) return notFound(res);
  res.json({ data });
});
router.patch('/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const body = parse(updateCustomerSchema, req.body, res);
  if (!body) return;
  const data = await service.updateCustomer(res.locals.access as service.Access, id, body.value);
  if (!data) return notFound(res);
  res.json({ data });
});
router.delete('/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  if (!(await service.deleteCustomer(res.locals.access as service.Access, id)))
    return notFound(res);
  res.status(204).end();
});
router.get('/:id/follow-ups', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const data = await service.listFollowUps(res.locals.access as service.Access, id);
  if (!data) return notFound(res);
  res.json({ data });
});
router.post('/:id/follow-ups', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  const body = parse(followUpSchema, req.body, res);
  if (!body) return;
  const data = await service.createFollowUp(res.locals.access as service.Access, id, body.value);
  if (!data) return notFound(res);
  res.status(201).json({ data });
});
export default router;
