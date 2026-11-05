import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';

import app from '../src/app.ts'; // 如果用 tsx 跑，保留 .js 或 .ts 都可以，看你的 tsconfig
import { prisma } from '../src/utils/prisma.ts';

const server = app.listen(0);
await new Promise<void>((resolve) => {
  server.once('listening', resolve);
});

const { port } = server.address() as AddressInfo;
const baseUrl = `http://127.0.0.1:${port}`;

// 用于保存测试登录后的 Token
let authToken = '';

// 在所有测试开始前：清理数据库，注册并登录测试用户
before(async () => {
  // 1. 清理测试数据（注意清理顺序：先删关联表，再删主表）
  await prisma.followUp.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 2. 注册测试账号
  const regRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    }),
  });

  if (!regRes.ok) {
    console.error('测试账号注册失败:', await regRes.json());
  }

  // 3. 登录获取 Token
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
    }),
  });

  const loginData = await loginRes.json();
  authToken = loginData.data.token;
});

// 所有测试结束后：关闭服务器，断开数据库连接
after(async () => {
  server.close();
  await prisma.$disconnect();
});

// ==========================================
// 开始正式测试
// ==========================================

test('GET /api/health returns ok', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = (await res.json()) as { status: string };
  assert.equal(data.status, 'ok');
});

test('CRM customer lifecycle, access isolation and reminders', async () => {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };
  const request = (path: string, init: RequestInit = {}) => fetch(`${baseUrl}${path}`, init);
  assert.equal((await request('/api/customers')).status, 401);
  const created = await request('/api/customers', {
    method: 'POST',
    headers,
    body: JSON.stringify({ name: 'Acme', phone: '123', status: 'FOLLOWING' }),
  });
  assert.equal(created.status, 201);
  const { data: customer } = await created.json();
  assert.equal(
    (
      await request('/api/customers', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: ' ', ownerId: 2 }),
      })
    ).status,
    400
  );
  const follow = await request(`/api/customers/${customer.id}/follow-ups`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content: 'Called', nextFollowUpAt: '2026-12-01T00:00:00Z' }),
  });
  assert.equal(follow.status, 201);
  const due = await request(
    '/api/customers?search=Acme&status=FOLLOWING&dueBefore=2026-12-02T00%3A00%3A00Z',
    { headers }
  );
  assert.equal((await due.json()).meta.total, 1);
  const followList = await request(`/api/customers/${customer.id}/follow-ups`, { headers });
  assert.equal((await followList.json()).data.length, 1);
  await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'other@example.com', password: 'password123' }),
  });
  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'other@example.com', password: 'password123' }),
  });
  const otherToken = (await login.json()).data.token;
  const otherHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${otherToken}`,
  };
  for (const [path, method] of [
    [`/api/customers/${customer.id}`, 'GET'],
    [`/api/customers/${customer.id}`, 'PATCH'],
    [`/api/customers/${customer.id}`, 'DELETE'],
    [`/api/customers/${customer.id}/follow-ups`, 'GET'],
    [`/api/customers/${customer.id}/follow-ups`, 'POST'],
  ]) {
    const result = await request(path, {
      method,
      headers: otherHeaders,
      ...(method === 'PATCH'
        ? { body: JSON.stringify({ name: 'hijack' }) }
        : method === 'POST'
          ? { body: JSON.stringify({ content: 'hijack' }) }
          : {}),
    });
    assert.equal(result.status, 404);
  }
  assert.equal(
    (await (await request('/api/customers', { headers: otherHeaders })).json()).meta.total,
    0
  );
  const other = await prisma.user.findUniqueOrThrow({ where: { email: 'other@example.com' } });
  await prisma.user.update({ where: { id: other.id }, data: { role: 'ADMIN' } });
  assert.equal(
    (await request(`/api/customers/${customer.id}`, { headers: otherHeaders })).status,
    200
  );
  assert.equal(
    (
      await request(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'WON' }),
      })
    ).status,
    200
  );
  assert.equal(
    (
      await request(`/api/customers/${customer.id}/follow-ups`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: 'Done', nextFollowUpAt: null }),
      })
    ).status,
    201
  );
  assert.equal(
    (await (await request(`/api/customers/${customer.id}`, { headers })).json()).data
      .nextFollowUpAt,
    null
  );
  assert.equal(
    (await request(`/api/customers/${customer.id}`, { method: 'DELETE', headers })).status,
    204
  );
  assert.equal(await prisma.followUp.count({ where: { customerId: customer.id } }), 0);
});
