import test from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '../src/generated/prisma/index.js';
import { errorHandler } from '../src/middlewares/errorHandler.js';
import type { Request, Response, NextFunction } from 'express';

test('a missing database column is reported as a server error, not a duplicate email', () => {
  const error = new Prisma.PrismaClientKnownRequestError('Missing column', {
    code: 'P2022', clientVersion: 'test',
  });
  let status = 0;
  let body: any;
  const response = {
    headersSent: false,
    status(value: number) { status = value; return this; },
    json(value: unknown) { body = value; return this; },
  } as unknown as Response;
  errorHandler(error, {} as Request, response, (() => {}) as NextFunction);
  assert.equal(status, 500);
  assert.notEqual(body.message, '邮箱已被注册');
});
