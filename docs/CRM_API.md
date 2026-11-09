# CRM 接口

服务默认地址为 `http://localhost:7777`。所有 CRM 接口均需在请求头中提供 `Authorization: Bearer <token>`，令牌通过已有的 `/api/auth/login` 获取。

普通用户（`USER`）只能访问自己负责的客户；管理员（`ADMIN`）可以访问和管理所有客户；访客（`VIEWER`）可以查看所有客户及跟进记录，但不能新增、修改或删除。访客调用写入接口返回 403。创建客户时负责人始终为当前用户。客户不存在或无权访问时均返回 404。

## 客户

- `GET /api/customers`：分页查询。可选参数：`search`（匹配姓名、公司或电话）、`status`、`page`、`pageSize`（1–50，默认 10）、`dueBefore`（带时区的 ISO 8601 时间，筛选下次跟进时间不晚于该值的客户）。返回 `{ data: [...], meta: { total, page, pageSize, totalPages, statusCounts } }`；`statusCounts` 按状态统计当前筛选结果的全部页面，仅包含有数据的状态，缺失状态应按 0 处理。
- `GET /api/customers/stats`：按当前账号的客户访问范围汇总，返回 `{ data: { totalCustomers, totalFollowUps, statusCounts } }`。`statusCounts` 按状态汇总客户数量，仅包含有数据的状态，缺失状态应按 0 处理；此接口不使用列表的搜索、状态或到期筛选参数。
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

部署前备份已有数据库，生成 Prisma 客户端并执行迁移：`pnpm exec prisma generate` 和 `pnpm exec prisma migrate deploy`。首次部署已有数据库时，应先确认迁移历史与目标数据库一致；不要使用测试命令操作正式数据库。任何删除客户相关表结构的迁移都将清空对应数据。

生产环境的管理员通过配置的邮箱和邀请码初始化；管理员登录后可通过用户管理创建 `VIEWER` 账号。访客无需自行注册。管理员可以使用 `POST /api/users/:id/transfer-customers` 将账号名下的客户转交给其他管理员或普通用户，保留跟进记录，再删除原账号。账号管理接口和认证规则详见 [API 接口文档](API.md)。角色权限在下一次请求时从数据库读取；修改密码会使已有令牌失效。
