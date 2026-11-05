# API 接口文档

## 1. 概览

本服务提供基于 Express + Prisma 的 CRM RESTful API。客户和跟进接口详见 [CRM 接口文档](CRM_API.md)。所有接口统一使用 JSON 格式返回数据。

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
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求体无效",
    "details": ["email: 请输入正确的邮箱格式"]
  }
}
```

### 2.2 鉴权

登录后，需将 JWT 放入请求头：

```http
Authorization: Bearer <token>
```

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
  "timestamp": "2026-11-04T12:00:00.000Z"
}
```

## 4. 用户认证

### POST /api/auth/register

注册新用户。

#### 请求体

```json
{
  "email": "user@example.com",
  "password": "123456",
  "name": "Alice"
}
```

#### 成功响应

```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "Alice",
    "createdAt": "2026-11-04T12:00:00.000Z"
  }
}
```

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
      "name": "Alice"
    }
  }
}
```

## 5. 常见错误代码

| 代码              | 含义             |
| ----------------- | ---------------- |
| VALIDATION_ERROR  | 参数校验失败     |
| UNAUTHORIZED      | 未登录或凭证无效 |
| FORBIDDEN         | 无权限执行此操作 |
| NOT_FOUND         | 资源不存在       |
| TOO_MANY_REQUESTS | 请求过于频繁     |

## 6. 相关文档

- [README](../README.md)
- [部署指南](DEPLOYMENT.md)
