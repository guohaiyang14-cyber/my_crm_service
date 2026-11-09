import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import jwt from 'jsonwebtoken';

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

test('POST /api/auth/register rejects duplicate emails with a client error', async () => {
  const res = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123',
      name: 'Duplicate User',
    }),
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.code, 'VALIDATION_ERROR');
  assert.equal(body.message, '邮箱已被注册');
  assert.match(JSON.stringify(body.details), /邮箱|已存在|已注册|重复|使用/);
});

test('viewer can read all customers and follow-ups but cannot write', async () => {
  const owner = await prisma.user.findUniqueOrThrow({ where: { email: 'test@example.com' } });
  await prisma.user.update({ where: { id: owner.id }, data: { role: 'ADMIN' } });
  try {
    const adminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };
    for (const password of ['a'.repeat(73), '密'.repeat(25)]) {
      const invalid = await fetch(`${baseUrl}/api/users`, {
        method: 'POST', headers: adminHeaders,
        body: JSON.stringify({ email: 'long@example.com', password }),
      });
      assert.equal(invalid.status, 400);
      const invalidRegistration = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'long@example.com', password }),
      });
      assert.equal(invalidRegistration.status, 400);
    }
    const boundaryPassword = '密'.repeat(24);
    const boundary = await fetch(`${baseUrl}/api/users`, {
      method: 'POST', headers: adminHeaders,
      body: JSON.stringify({ email: 'boundary@example.com', password: boundaryPassword }),
    });
    assert.equal(boundary.status, 201);
    for (const [password, status] of [[boundaryPassword, 200], [boundaryPassword + 'x', 401]] as const) {
      const result = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'boundary@example.com', password }),
      });
      assert.equal(result.status, status);
    }
    const reg = await fetch(`${baseUrl}/api/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ email: 'viewer@example.com', password: 'password123', role: 'ADMIN' }),
    });
    assert.equal(reg.status, 201);
    const created = (await reg.json()).data;
    assert.equal(created.role, 'VIEWER');
    assert.equal(created.password, undefined);
    const list = await fetch(`${baseUrl}/api/users`, { headers: { Authorization: `Bearer ${authToken}` } });
    assert.ok((await list.json()).data.some((user: { id: number }) => user.id === created.id));
    const duplicate = await fetch(`${baseUrl}/api/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ email: 'viewer@example.com', password: 'password123' }),
    });
    assert.equal(duplicate.status, 409);
    const login = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'viewer@example.com', password: 'password123' }),
    });
    const viewer = (await login.json()).data;
    assert.equal(viewer.user.role, 'VIEWER');
    const customer = await prisma.customer.create({ data: { name: 'Viewer test', ownerId: owner.id } });
    await prisma.followUp.create({ data: { customerId: customer.id, content: 'Follow-up' } });
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${viewer.token}` };
    const request = (path: string, init: RequestInit = {}) => fetch(`${baseUrl}${path}`, { headers, ...init });
    assert.equal((await request('/api/users')).status, 403);
    assert.equal((await request('/api/users', { method: 'POST', body: JSON.stringify({ email: 'bad@example.com', password: 'password123' }) })).status, 403);
    assert.ok((await (await request('/api/customers')).json()).data.some((item: { id: number }) => item.id === customer.id));
    assert.equal((await request(`/api/customers/${customer.id}`)).status, 200);
    assert.equal((await (await request(`/api/customers/${customer.id}/follow-ups`)).json()).data.length, 1);
    for (const [path, method] of [
      ['/api/customers', 'POST'],
      [`/api/customers/${customer.id}`, 'PATCH'],
      [`/api/customers/${customer.id}`, 'DELETE'],
      [`/api/customers/${customer.id}/follow-ups`, 'POST'],
    ]) {
      assert.equal((await request(path, { method, body: '{}' })).status, 403);
    }
    assert.equal((await request(`/api/users/${created.id}`, { method: 'PATCH', body: JSON.stringify({ name: 'Hijack' }) })).status, 403);
    assert.equal((await request(`/api/users/${created.id}`, { method: 'DELETE' })).status, 403);
    const adminRequest = (path: string, init: RequestInit = {}) => fetch(`${baseUrl}${path}`, { headers: adminHeaders, ...init });
    assert.equal((await adminRequest(`/api/users/${owner.id}`, { method: 'DELETE' })).status, 400);
    assert.equal((await adminRequest(`/api/users/${created.id}`, { method: 'PATCH', body: JSON.stringify({ email: owner.email }) })).status, 409);
    assert.equal((await adminRequest(`/api/users/${created.id}`, { method: 'PATCH', body: JSON.stringify({ password: '密'.repeat(25) }) })).status, 400);
    assert.equal((await adminRequest(`/api/users/${created.id}`, { method: 'PATCH', body: JSON.stringify({ name: 'Updated' }) })).status, 200);
    assert.equal((await request('/api/customers')).status, 200);
    const updated = await adminRequest(`/api/users/${created.id}`, { method: 'PATCH', body: JSON.stringify({ name: 'Updated', email: 'newviewer@example.com', password: 'newpassword123' }) });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).data.name, 'Updated');
    assert.equal((await request('/api/customers')).status, 401);
    for (const [password, status] of [['password123', 401], ['newpassword123', 200]] as const) {
      const result = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'newviewer@example.com', password }) });
      assert.equal(result.status, status);
      if (status === 200) {
        const newToken = (await result.json()).data.token;
        assert.equal((await fetch(`${baseUrl}/api/customers`, { headers: { Authorization: `Bearer ${newToken}` } })).status, 200);
      }
    }
    await prisma.customer.create({ data: { name: 'Owned', ownerId: created.id } });
    assert.equal((await adminRequest(`/api/users/${created.id}`, { method: 'DELETE' })).status, 409);
    await prisma.customer.deleteMany({ where: { ownerId: created.id } });
    assert.equal((await adminRequest(`/api/users/${created.id}`, { method: 'DELETE' })).status, 204);
    assert.equal((await request('/api/customers')).status, 401);
    assert.equal((await adminRequest(`/api/users/${created.id}`, { method: 'DELETE' })).status, 404);
    await prisma.customer.delete({ where: { id: customer.id } });
  } finally {
    await prisma.user.update({ where: { id: owner.id }, data: { role: 'USER' } });
  }
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

test('statistics cover all filtered pages and transfers preserve ownership and follow-ups', async () => {
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'test@example.com' } });
  await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } });
  const source = await prisma.user.create({ data: { email: 'source@example.com', password: 'unused', role: 'USER' } });
  const target = await prisma.user.create({ data: { email: 'target@example.com', password: 'unused', role: 'USER' } });
  const viewer = await prisma.user.create({ data: { email: 'readonly@example.com', password: 'unused', role: 'VIEWER' } });
  const headersFor = (user: typeof source) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion }, process.env.JWT_SECRET!, { expiresIn: '1h' })}` });
  const adminHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };
  const sourceHeaders = headersFor(source);
  const targetHeaders = headersFor(target);
  const viewerHeaders = headersFor(viewer);
  for (let i = 0; i < 12; i++) {
    await prisma.customer.create({ data: { name: `Stats ${i}`, status: i < 7 ? 'FOLLOWING' : 'WON', ownerId: source.id } });
  }
  const first = await prisma.customer.findFirstOrThrow({ where: { ownerId: source.id } });
  await prisma.followUp.create({ data: { customerId: first.id, content: 'Retain this record' } });
  await prisma.customer.create({ data: { name: 'Other customer', status: 'LEAD', ownerId: target.id } });
  const get = async (path: string, headers: Record<string, string>) => (await fetch(`${baseUrl}${path}`, { headers })).json();
  const filtered = await get('/api/customers?search=Stats&pageSize=2', sourceHeaders);
  assert.equal(filtered.data.length, 2);
  assert.equal(filtered.meta.total, 12);
  assert.equal(filtered.meta.statusCounts.FOLLOWING, 7);
  assert.equal(filtered.meta.statusCounts.WON, 5);
  const statusFiltered = await get('/api/customers?search=Stats&status=WON&pageSize=2', viewerHeaders);
  assert.equal(statusFiltered.meta.total, 5);
  assert.equal(statusFiltered.meta.statusCounts.WON, 5);
  for (const [headers, total] of [[sourceHeaders, 12], [targetHeaders, 1], [viewerHeaders, 13], [adminHeaders, 13]] as const) {
    const stats = await get('/api/customers/stats', headers);
    assert.equal(stats.data.totalCustomers, total);
  }
  assert.equal((await get('/api/customers/stats', viewerHeaders)).data.totalFollowUps, 1);
  const transfer = (id: number, targetUserId: number, headers: Record<string, string>) => fetch(`${baseUrl}/api/users/${id}/transfer-customers`, { method: 'POST', headers, body: JSON.stringify({ targetUserId }) });
  assert.equal((await transfer(source.id, target.id, viewerHeaders)).status, 403);
  assert.equal((await transfer(source.id, viewer.id, adminHeaders)).status, 400);
  assert.equal((await transfer(source.id, source.id, adminHeaders)).status, 400);
  assert.equal((await transfer(source.id, 999999, adminHeaders)).status, 404);
  const moved = await transfer(source.id, target.id, adminHeaders);
  assert.equal(moved.status, 200);
  assert.equal((await moved.json()).data.transferred, 12);
  assert.equal((await fetch(`${baseUrl}/api/customers/${first.id}`, { headers: sourceHeaders })).status, 404);
  assert.equal((await fetch(`${baseUrl}/api/customers/${first.id}`, { headers: targetHeaders })).status, 200);
  assert.equal((await fetch(`${baseUrl}/api/customers/${first.id}`, { method: 'PATCH', headers: targetHeaders, body: JSON.stringify({ notes: 'Transferred' }) })).status, 200);
  assert.equal((await get(`/api/customers/${first.id}/follow-ups`, targetHeaders)).data[0].content, 'Retain this record');
  assert.equal((await fetch(`${baseUrl}/api/users/${source.id}`, { method: 'DELETE', headers: adminHeaders })).status, 204);
  await prisma.customer.deleteMany({ where: { ownerId: target.id } });
  await prisma.user.deleteMany({ where: { id: { in: [target.id, viewer.id] } } });
  await prisma.user.update({ where: { id: admin.id }, data: { role: 'USER' } });
});

test('changing own password revokes old and legacy sessions', async () => {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: 'test@example.com' } });
  await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
  const legacyToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };
  assert.equal((await fetch(`${baseUrl}/api/users`, { headers: { Authorization: `Bearer ${legacyToken}` } })).status, 401);
  const update = await fetch(`${baseUrl}/api/users/${user.id}`, { method: 'PATCH', headers, body: JSON.stringify({ password: 'updated-password' }) });
  assert.equal(update.status, 200);
  assert.equal((await fetch(`${baseUrl}/api/users`, { headers })).status, 401);
  assert.equal((await fetch(`${baseUrl}/api/customers`, { headers })).status, 401);
  const login = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password: 'updated-password' }) });
  assert.equal(login.status, 200);
  const token = (await login.json()).data.token;
  assert.equal((await fetch(`${baseUrl}/api/users`, { headers: { Authorization: `Bearer ${token}` } })).status, 200);
});
