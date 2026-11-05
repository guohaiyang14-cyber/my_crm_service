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
git clone <你的后端仓库地址> my_site_service
cd my_site_service
pnpm install
```

### 3.2 配置环境变量

创建 `.env` 文件，并填入生产环境配置：

```env
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="<使用 openssl rand -hex 32 生成的强密钥>"
NODE_ENV="production"
PORT=3000
CORS_ORIGINS="https://yourdomain.com"
```

### 3.3 生成 Prisma 客户端并执行迁移

```bash
pnpm exec prisma generate
pnpm exec prisma migrate deploy
```

### 3.4 编译并启动

```bash
rm -rf dist
pnpm run build
pm2 start dist/index.js --name "my-api"
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

    root /var/www/my_site_web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
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
sudo nano /var/www/my_site_service/backup.sh
```

脚本内容：

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/my_site"
DB_FILE="/var/www/my_site_service/prisma/prod.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
cp "$DB_FILE" "$BACKUP_DIR/prod_$DATE.db"
find "$BACKUP_DIR" -type f -name "prod_*.db" -mtime +7 -exec rm {} \;
```

设置执行权限与定时任务：

```bash
chmod +x /var/www/my_site_service/backup.sh
crontab -e
```

加入以下配置：

```cron
0 3 * * * /var/www/my_site_service/backup.sh >> /var/log/db_backup.log 2>&1
```

## 6. 日常更新流程

### 更新后端

```bash
cd /var/www/my_site_service
git pull origin main
pnpm install
pnpm exec prisma migrate deploy
rm -rf dist && pnpm run build
pm2 restart my-api
```

### 更新前端

```bash
cd /var/www/my_site_web
git pull origin main
pnpm install
pnpm run build
```

> 前端静态资源更新后，Nginx 会自动读取新文件，通常无需重启服务。

## 7. 常见问题

### 1）PM2 启动失败

检查日志：

```bash
pm2 logs my-api
```

### 2）数据库连接错误

确认 `DATABASE_URL` 路径是否正确，并确认 Prisma 迁移已执行：

```bash
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
