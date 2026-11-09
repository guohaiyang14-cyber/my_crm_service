# API 接口文档

## 1. 概览

本服务提供基于 Express + Prisma 的 CRM RESTful API。客户和跟进接口详见 [CRM 接口文档](CRM_API.md)。除无响应体的 204 响应外，接口使用 JSON 格式返回数据。

- Base URL: `http://localhost:7777`
- 生产环境: `https://yourdomain.com`

## 2. 通用约定

### 2.1 响应格式

成功响应通常为：

```json
{
  "data": {}
}
```

错误响应通常为：

```json
{
  "code": "VALIDATION_ERROR",
  "message": "请求体无效",
  "details": ["email: 请输入正确的邮箱格式"]
}
```

### 2.2 鉴权

登录后，需将 JWT 放入请求头：

```http
Authorization: Bearer <token>
```

令牌有效期为 1 小时。账号密码被修改或账号被删除后，该账号的已有令牌失效；更新到支持会话版本的服务后，旧版本签发的令牌也会失效。被撤销或过期的令牌访问受保护接口时返回 401。

## 3. 健康检查

### GET /api/health

检查服务状态。

#### 示例

```bash
curl http://localhost:7777/api/health
```

#### 成功响应

```json
{
  "status": "ok",
  "uptime": 12.34,
  "timestamp": "2026-11-04T12:00:00.000Z"
}
```

## 4. 用户认证

### POST /api/auth/register

生产环境下用于初始化管理员：`email` 必须匹配 `ADMIN_EMAIL`，`inviteCode` 必须匹配 `ADMIN_INVITE_CODE`。邀请码为空或不匹配时注册失败；注册成功后可移除 `ADMIN_INVITE_CODE` 并重启服务来关闭后续管理员注册。访客由管理员创建，不使用该接口注册。非生产环境允许注册普通用户；配置的管理员邮箱仍需正确邀请码才能创建管理员。

#### 请求体

```json
{
  "email": "admin@example.com",
  "password": "123456",
  "name": "Alice",
  "inviteCode": "管理员邀请码"
}
```

#### 成功响应

```json
{
  "data": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Alice"
  }
}
```

成功返回 201；校验失败、注册关闭或邮箱重复时返回 400。邮箱会去掉首尾空格并转为小写；昵称可选，最长 50 字符。密码至少 6 个字符，且不能超过 72 个 UTF-8 字节。

### POST /api/auth/login

登录并返回 JWT。

#### 请求体

```json
{
  "email": "user@example.com",
  "password": "123456"
}
```

#### 成功响应

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "Alice",
      "role": "ADMIN"
    }
  }
}
```

成功返回 200，邮箱或密码无效返回 401。生产环境下登录和注册共用限流器，15 分钟内最多 5 次请求，超出返回 429。

## 5. 用户管理

以下接口均需要管理员令牌；未登录返回 401，非管理员返回 403。账号响应只包含 `id`、`email`、`name`、`role`、`createdAt`，不包含密码或密码哈希。

### GET /api/users

列出所有账号，返回 200 和 `{ "data": [账号, ...] }`。

### POST /api/users

创建访客账号，成功返回 201 和 `{ "data": 账号 }`。请求体例如：

```json
{
  "email": "viewer@example.com",
  "password": "123456",
  "name": "访客"
}
```

`email` 和 `password` 必填，`name` 可选；验证规则与注册一致。创建的角色固定为 `VIEWER`，请求中的角色字段不会改变该结果。邮箱已存在返回 409。

### PATCH /api/users/:id

修改账号的 `email`、`name`、`password`，至少提供一项；密码留空不表示不修改，需要直接省略 `password` 字段。仅允许上述字段。成功返回 200 和 `{ "data": 账号 }`；邮箱重复返回 409，账号不存在返回 404。修改密码会使该账号此前的所有令牌失效。

### DELETE /api/users/:id

删除账号，成功返回 204 且无响应体。不能删除当前登录账号（400）；账号不存在返回 404；账号有关联客户时返回 409，避免删除客户数据。

### POST /api/users/:id/transfer-customers

将指定账号名下的所有客户转移至另一个账号。请求体为 `{ "targetUserId": 2 }`；目标账号必须存在且角色为 `ADMIN` 或 `USER`，源账号和目标账号不能相同。成功返回 200，响应为 `{ "data": { "transferred": 3 } }`，其中数字为转移的客户数量；客户跟进记录会保留。参数无效、目标不符合条件或源与目标相同时返回 400，账号不存在返回 404。

## 6. 常见错误代码

| 代码              | 含义             |
| ----------------- | ---------------- |
| VALIDATION_ERROR  | 参数校验失败     |
| UNAUTHORIZED      | 未登录或凭证无效 |
| FORBIDDEN         | 无权限执行此操作 |
| NOT_FOUND         | 资源不存在       |
| CONFLICT          | 邮箱重复或账号关联客户 |
| TOO_MANY_REQUESTS | 请求过于频繁     |

## 7. 相关文档

- [README](../README.md)
- [部署指南](DEPLOYMENT.md)
