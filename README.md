# My CRM Service

这是一个前后端合并在同一仓库中的全栈项目，当前包含：

- 后端：Express + TypeScript + Prisma + SQLite
- 前端：Vite + Vue 3 + Element Plus
- 文档：接口说明、部署说明等

## 项目结构

```text
my_crm_service/
├─ backend/                 # 后端代码
│  ├─ src/
│  ├─ prisma/
│  ├─ tests/
│  ├─ .env.example
│  ├─ package.json
│  └─ ...
├─ frontend/                # 前端代码
│  ├─ src/
│  ├─ public/
│  ├─ package.json
│  └─ ...
├─ docs/                    # API / 部署文档
├─ package.json             # 根脚本入口
├─ pnpm-workspace.yaml      # pnpm 工作区配置
├─ .gitignore
├─ README.md
└─ ...
```

## 功能概览

- 用户注册 / 登录
- 客户管理
- 跟进记录
- 角色权限控制
- 前端和后端在同一仓库中统一开发

## 快速开始

1. 安装依赖

```bash
pnpm install
```

2. 配置后端环境变量

复制后端示例环境变量文件：

```bash
cp backend/.env.example backend/.env
```

根据实际环境修改 `backend/.env` 中的数据库连接、JWT secret 等配置。

3. 启动前后端开发环境

```bash
pnpm run dev
```

这会同时启动：

- 后端 API：`http://localhost:7777`
- 前端：`http://localhost:5173`

## 常用命令

```bash
pnpm run dev:api
pnpm run dev:web
pnpm run build
pnpm run test
```

## 后端说明

后端位于 [backend](backend)，使用以下技术栈：

- Node.js
- Express
- TypeScript
- Prisma
- SQLite

## 前端说明

前端位于 [frontend](frontend)，当前为 Vite + Vue 3 项目，后续可继续在此处迭代和改造页面逻辑。

## 文档

- [CRM 接口](docs/CRM_API.md)
- [认证和健康检查](docs/API.md)
- [部署指南](docs/DEPLOYMENT.md)

## 注意事项

- 测试数据库应与正式数据库分开，避免脏数据污染。
- 在执行数据库迁移前，请确认本地数据库有备份。
- 当前前端已复制进仓库中，后续可继续按需替换和优化 UI 逻辑。
