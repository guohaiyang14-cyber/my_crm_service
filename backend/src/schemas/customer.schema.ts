import { z } from 'zod';

export const customerStatus = z.enum(['LEAD', 'FOLLOWING', 'WON', 'LOST']);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const dateTime = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

export const createCustomerSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    company: optionalText(200),
    phone: optionalText(50),
    wechat: optionalText(100),
    source: optionalText(100),
    status: customerStatus.default('LEAD'),
    notes: optionalText(2000),
  })
  .strict();
export const updateCustomerSchema = createCustomerSchema.partial();
export const followUpSchema = z
  .object({
    content: z.string().trim().min(1).max(5000),
    followedAt: dateTime.optional(),
    nextFollowUpAt: dateTime.nullable().optional(),
  })
  .strict();
export const customerQuerySchema = z
  .object({
    search: z.string().trim().max(200).optional(),
    status: customerStatus.optional(),
    dueBefore: dateTime.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();
