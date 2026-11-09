import { Prisma } from '../generated/prisma/index.js';
import { prisma } from '../utils/prisma.js';
import type { z } from 'zod';
import type {
  createCustomerSchema,
  updateCustomerSchema,
  followUpSchema,
  customerQuerySchema,
} from '../schemas/customer.schema.js';

export type Access = { userId: number; canViewAll: boolean };
const scope = (access: Access): Prisma.CustomerWhereInput =>
  access.canViewAll ? {} : { ownerId: access.userId };

export async function listCustomers(access: Access, query: z.infer<typeof customerQuerySchema>) {
  const where: Prisma.CustomerWhereInput = {
    ...scope(access),
    ...(query.status ? { status: query.status } : {}),
    ...(query.dueBefore ? { nextFollowUpAt: { lte: query.dueBefore } } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search } },
            { company: { contains: query.search } },
            { phone: { contains: query.search } },
          ],
        }
      : {}),
  };
  const [total, data, statusGroups] = await prisma.$transaction([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.customer.groupBy({ by: ['status'], where, _count: { _all: true } }),
  ]);
  return {
    data,
    meta: {
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
      statusCounts: Object.fromEntries(statusGroups.map((group) => [group.status, group._count._all])),
    },
  };
}

export async function customerStats(access: Access) {
  const where = scope(access);
  const [groups, totalFollowUps] = await prisma.$transaction([
    prisma.customer.groupBy({ by: ['status'], where, _count: { _all: true } }),
    prisma.followUp.count({ where: { customer: where } }),
  ]);
  const statusCounts = Object.fromEntries(groups.map((group) => [group.status, group._count._all]));
  return {
    totalCustomers: groups.reduce((sum, group) => sum + group._count._all, 0),
    totalFollowUps,
    statusCounts,
  };
}
export const getCustomer = (access: Access, id: number) =>
  prisma.customer.findFirst({ where: { id, ...scope(access) } });
export const createCustomer = (access: Access, data: z.infer<typeof createCustomerSchema>) =>
  prisma.customer.create({ data: { ...data, ownerId: access.userId } });
export async function updateCustomer(
  access: Access,
  id: number,
  data: z.infer<typeof updateCustomerSchema>
) {
  return prisma.$transaction(async (tx) => {
    const result = await tx.customer.updateMany({ where: { id, ...scope(access) }, data });
    return result.count ? tx.customer.findUnique({ where: { id } }) : null;
  });
}
export async function deleteCustomer(access: Access, id: number) {
  const result = await prisma.customer.deleteMany({ where: { id, ...scope(access) } });
  return result.count > 0;
}
export async function listFollowUps(access: Access, id: number) {
  const customer = await getCustomer(access, id);
  if (!customer) return null;
  return prisma.followUp.findMany({
    where: { customerId: id, customer: scope(access) },
    orderBy: [{ followedAt: 'desc' }, { id: 'desc' }],
  });
}
export async function createFollowUp(
  access: Access,
  id: number,
  data: z.infer<typeof followUpSchema>
) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findFirst({ where: { id, ...scope(access) } });
    if (!customer) return null;
    const followUp = await tx.followUp.create({ data: { ...data, customerId: id } });
    // An omitted date leaves the current reminder unchanged; null clears it.
    if (data.nextFollowUpAt !== undefined) {
      await tx.customer.update({ where: { id }, data: { nextFollowUpAt: data.nextFollowUpAt } });
    }
    return followUp;
  });
}
