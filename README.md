# 轻量级客户管理系统 API

基于 TypeScript、Express、Prisma 和 SQLite 的 CRM 后端。前端在独立项目中维护。

目前支持账号登录、客户管理、跟进记录和待跟进筛选。普通用户访问自己负责的客户，管理员可以访问全部客户。

## 开发

1. 安装 Node.js 和 pnpm，执行 `pnpm install`。
2. 参考 `.env.example` 创建 `.env`，配置数据库、JWT 密钥和允许的前端来源。
3. 执行 `pnpm exec prisma generate` 生成客户端，并执行 `pnpm exec prisma migrate deploy` 应用数据库迁移。
4. 执行 `pnpm dev` 启动服务，默认端口为 7777。

现有数据库在应用迁移前应先备份：删除旧作品功能的迁移会删除 `Project` 表及其数据。

## 文档

- [CRM 接口](docs/CRM_API.md)
- [认证和健康检查](docs/API.md)
- [部署指南](docs/DEPLOYMENT.md)

项目使用 `pnpm test` 运行集成测试，测试会清理测试数据库中的数据，请勿将测试数据库指向正式数据库。
