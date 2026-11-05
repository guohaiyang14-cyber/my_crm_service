# CRM 接口

服务默认地址为 `http://localhost:7777`。所有 CRM 接口均需在请求头中提供 `Authorization: Bearer <token>`，令牌通过已有的 `/api/auth/login` 获取。

普通用户只能访问自己负责的客户；数据库中 `User.role` 为 `ADMIN` 的用户可以访问所有客户。创建客户时负责人始终为当前用户。客户不存在或无权访问时均返回 404。

## 客户

- `GET /api/customers`：分页查询。可选参数：`search`（匹配姓名、公司或电话）、`status`、`page`、`pageSize`（1–50，默认 10）、`dueBefore`（带时区的 ISO 8601 时间，筛选下次跟进时间不晚于该值的客户）。返回 `{ data: [...], meta: { total, page, pageSize, totalPages } }`。
- `POST /api/customers`：创建客户，返回 201 和 `{ data }`。
- `GET /api/customers/:id`：查询详情，返回 `{ data }`。
- `PATCH /api/customers/:id`：部分更新，返回 `{ data }`。
- `DELETE /api/customers/:id`：删除客户及其跟进记录，返回 204。

创建示例：

```json
{
  "name": "张三",
  "company": "示例公司",
  "phone": "13800000000",
  "wechat": "zhangsan",
  "source": "转介绍",
  "status": "LEAD",
  "notes": "初次联系"
}
```

`name` 必填，其余字段可选；`status` 可为 `LEAD`（潜在客户）、`FOLLOWING`（跟进中）、`WON`（已成交）、`LOST`（已流失），默认为 `LEAD`。`company`、`phone`、`wechat`、`source`、`notes` 可设为 `null`。响应还包含 `id`、`ownerId`、`nextFollowUpAt`、`createdAt`、`updatedAt`。

## 跟进

- `GET /api/customers/:id/follow-ups`：按跟进时间倒序返回 `{ data: [...] }`。
- `POST /api/customers/:id/follow-ups`：新增记录，返回 201 和 `{ data }`。

```json
{
  "content": "电话沟通需求",
  "followedAt": "2026-11-05T10:00:00+08:00",
  "nextFollowUpAt": "2026-11-10T10:00:00+08:00"
}
```

`content` 必填；时间使用带 `Z` 或时区偏移的 ISO 8601 字符串。`followedAt` 省略时使用当前时间。`nextFollowUpAt` 传入时间会更新客户的待跟进时间，传 `null` 清除，省略则不修改。响应时间以 UTC 输出。按当前时间传入 `dueBefore` 可获取已到期的客户。

## 数据库与账号

部署前备份已有数据库，生成 Prisma 客户端并执行迁移：`pnpm exec prisma generate` 和 `pnpm exec prisma migrate deploy`。首次部署已有数据库时，应先确认迁移历史与目标数据库一致；不要使用测试命令操作正式数据库。删除原有 Project 的迁移会删除 Project 表及其全部数据。

新用户默认为 `USER`。由可信管理员通过受控数据库运维方式将指定用户的 `role` 设为 `ADMIN`；注册接口不能自行指定角色。当前沿用原项目的注册策略：生产环境只允许配置的 `ADMIN_EMAIL` 和邀请码注册，新增团队账号需要单独调整账号管理流程。角色变更在下一次请求生效。
