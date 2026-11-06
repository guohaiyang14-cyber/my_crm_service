# My CRM Service

这是一个基于 Express + Vue 3 的 CRM 客户管理系统，前后端合并在同一仓库中统一开发。

## 项目简介

- 后端：Node.js + Express + TypeScript + Prisma + SQLite
- 前端：Vite + Vue 3 + Element Plus
- 认证：JWT 登录 / 注册
- 功能：客户管理、跟进记录、状态跟踪、权限控制

## 目录结构

```text
my_crm_service/
├─ backend/                 # CRM 后端
│  ├─ src/
│  ├─ prisma/
│  ├─ tests/
│  ├─ .env.example
│  ├─ package.json
│  └─ ...
├─ frontend/                # CRM 前端
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

## 核心功能

- 用户注册与登录
- 客户资料管理
- 跟进记录创建与查询
- 客户状态与待跟进时间管理
- 普通用户与管理员权限隔离

## 快速开始

1. 安装依赖

```bash
pnpm install
```

2. 配置后端环境变量

```bash
cp backend/.env.example backend/.env
```

然后根据实际环境修改 `backend/.env` 中的数据库连接、JWT secret 和 CORS 配置。

3. 启动开发环境

```bash
pnpm run dev
```

启动后可访问：

- 后端 API：`http://localhost:7777`
- 前端：`http://localhost:5173`

## 常用命令

```bash
pnpm run dev
pnpm run dev:api
pnpm run dev:web
pnpm run build
pnpm run test
```

## 文档

- [CRM 接口](docs/CRM_API.md)
- [API 接口文档](docs/API.md)
- [部署指南](docs/DEPLOYMENT.md)

## 说明

本仓库当前以 CRM 系统为唯一业务范围，相关前端页面、接口和文档均以客户管理场景为主。开发时请遵循现有 CRM 数据模型和权限规则，避免引入旧的作品集或 AI 页面逻辑。
