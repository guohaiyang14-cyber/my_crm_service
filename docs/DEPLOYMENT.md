# 生产环境部署指南

本文档面向 Ubuntu + Nginx + PM2 的部署场景，适合将本项目部署到生产环境，并通过反向代理对外提供 HTTPS 访问。

## 1. 适用环境

- OS: Ubuntu 22.04 LTS
- Node.js: v20+
- 包管理器: pnpm
- Web 服务器: Nginx
- 进程守护: PM2
- 版本控制: Git

## 2. 服务器初始化

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 安装全局工具
sudo npm install -g pnpm pm2

# 安装 Nginx
sudo apt install -y nginx
```

## 3. 后端部署

### 3.1 拉取代码

```bash
cd /var/www
git clone <你的仓库地址> my_crm_service
cd my_crm_service
pnpm install
```

### 3.2 配置环境变量

在 `backend/.env` 中填入生产环境配置（后端进程和 Prisma 命令都从 `backend` 目录运行）：

```env
DATABASE_URL="file:/var/www/my_crm_service/backend/prisma/prod.db"
JWT_SECRET="<使用 openssl rand -hex 32 生成的强密钥>"
NODE_ENV="production"
PORT=7777
CORS_ORIGINS="https://yourdomain.com"
ADMIN_EMAIL="admin@example.com"
ADMIN_INVITE_CODE="<使用 openssl rand -hex 32 生成的邀请码>"
```

生产环境注册管理员时，邮箱必须与 `ADMIN_EMAIL` 一致，邀请码必须与 `ADMIN_INVITE_CODE` 一致。部署前端后，在注册页面填写这两项即可创建管理员账号。注册完成后可移除 `ADMIN_INVITE_CODE` 并重启后端，关闭后续管理员注册。不要将邀请码提交到仓库或公开分享。

管理员登录后，在「用户管理」中设置访客的邮箱和密码。访客无需注册，可直接从登录页登录，查看所有客户及跟进记录，但不能新增、修改或删除客户和跟进记录。

更新到支持会话版本的版本时，需先执行数据库迁移，再启动新后端。旧版登录令牌会失效，用户需要重新登录；修改密码后，该账号的现有会话也会立即失效。

### 3.3 生成 Prisma 客户端并执行迁移

```bash
cd /var/www/my_crm_service/backend
pnpm exec prisma generate
pnpm exec prisma migrate deploy
```

### 3.4 编译并启动

```bash
pnpm run build
pm2 start dist/index.js --name "my-crm-api"
pm2 save
pm2 startup
```

> 如果终端输出了启动命令，请按照提示执行对应的 `sudo` 命令，以确保 PM2 在开机后自动拉起服务。

## 4. Nginx 反向代理与 HTTPS

### 4.1 申请 HTTPS 证书

推荐使用 Certbot：

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 4.2 配置站点

编辑 `/etc/nginx/sites-available/my_site`：

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/my_crm_service/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:7777;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/my_site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. SQLite 数据备份

创建备份脚本：

```bash
sudo nano /var/www/my_crm_service/backup.sh
```

脚本内容：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/my_crm_service"
DB_FILE="/var/www/my_crm_service/backend/prisma/prod.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
cp "$DB_FILE" "$BACKUP_DIR/prod_$DATE.db"
find "$BACKUP_DIR" -type f -name "prod_*.db" -mtime +7 -exec rm {} \;
```

设置执行权限与定时任务：

```bash
chmod +x /var/www/my_crm_service/backup.sh
crontab -e
```

加入以下配置：

```cron
0 3 * * * /var/www/my_crm_service/backup.sh >> /var/log/db_backup.log 2>&1
```

## 6. 日常更新流程

### 更新后端

如果之前按旧指南将配置保存在项目根目录的 `.env`，请在首次升级前将配置复制到 `backend/.env`；不要覆盖已有的 `backend/.env`，并保留原来的 `JWT_SECRET` 和其他配置。例如：

```bash
cd /var/www/my_crm_service
if [ -f .env ] && [ ! -e backend/.env ]; then cp -p .env backend/.env; fi
```

切换工作目录前，请确认旧服务实际使用的 SQLite 数据库文件，并将 `backend/.env` 中的 `DATABASE_URL` 改为指向该文件的绝对路径（格式为 `file:/绝对路径/数据库文件`）。不要直接使用新部署示例中的路径覆盖原地址，否则可能连接到另一个数据库。备份原数据库后，再执行以下迁移和构建步骤。确保配置文件存在并且后端进程账号可以读取。

```bash
cd /var/www/my_crm_service
git pull origin main
pnpm install
cd backend
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm run build
```

如果 PM2 记录的工作目录已经是 `backend`，执行 `pm2 restart my-crm-api`。如果旧进程使用了项目根目录作为工作目录，请先停止并删除该 PM2 进程，再从 `backend` 目录执行 `pm2 start dist/index.js --name "my-crm-api"` 和 `pm2 save`，使其读取 `backend/.env`。重建进程会短暂中断服务。重启后确认进程没有通过继承的环境变量覆盖新配置，且原有监听端口与 Nginx 代理端口一致；检查时不要公开密钥。

### 更新前端

```bash
cd /var/www/my_crm_service
git pull origin main
pnpm install
pnpm --dir frontend run build
```

> 前端静态资源更新后，Nginx 会自动读取新文件，通常无需重启服务。

## 7. 常见问题

### 1）PM2 启动失败

检查日志：

```bash
pm2 logs my-crm-api
```

### 2）数据库连接错误

确认 `DATABASE_URL` 路径是否正确，并确认 Prisma 迁移已执行：

```bash
cd /var/www/my_crm_service/backend
pnpm exec prisma migrate status
```

### 3）跨域请求失败

检查 `CORS_ORIGINS` 是否包含前端完整域名，且与浏览器访问地址一致。

## 8. 推荐运维建议

- 建议将生产环境的日志输出到单独目录或日志系统中。
- 定期执行数据库备份和迁移检查。
- 使用 HTTPS + 强密码机制保护认证接口。
- 对敏感配置使用环境变量，不要将 `.env` 提交到 Git 仓库。

## 9. 相关文档

- [README](../README.md)
- [API 接口说明](API.md)
