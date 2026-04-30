# DocShare — 文件分享平台

类似 TPT 的文件分享网站，支持真实注册、登录、文件上传和下载。

## 功能

- ✅ 真实注册 / 登录（密码加密存储）
- ✅ 会话持久化（关闭浏览器后仍保持登录）
- ✅ 上传头像
- ✅ 上传文件（PDF、DOC、PPT 等）
- ✅ 每个文件必须上传 3 张以上展示图片
- ✅ 浏览文件时显示上传者头像和名字
- ✅ 真实文件下载
- ✅ 按分类筛选
- ✅ 上传进度条

## 快速启动

### 1. 安装 Node.js
前往 https://nodejs.org 下载安装（推荐 LTS 版本）

### 2. 安装依赖

```bash
cd docshare
npm install
```

### 3. 启动服务器

```bash
npm start
```

### 4. 打开浏览器

访问 http://localhost:3000

---

## 部署到公网（可选）

### 方案 A：Railway（免费）
1. 注册 https://railway.app
2. 新建项目 → Deploy from GitHub
3. 上传代码即可自动部署

### 方案 B：Render（免费）
1. 注册 https://render.com
2. 新建 Web Service → 连接代码仓库
3. Start Command: `node server.js`

### 方案 C：VPS（阿里云/腾讯云）
```bash
# 安装 Node.js 和 PM2
npm install -g pm2
pm2 start server.js --name docshare
pm2 save
```

---

## 文件结构

```
docshare/
├── server.js          # 主服务器
├── db.js              # 数据库初始化
├── routes/
│   ├── auth.js        # 注册/登录接口
│   └── files.js       # 文件上传/下载接口
├── public/
│   ├── index.html     # 前端页面
│   └── uploads/       # 上传的文件（自动创建）
├── docshare.db        # SQLite 数据库（自动创建）
└── package.json
```

## 注意事项

- 文件存储在 `public/uploads/` 目录
- 数据库文件为 `docshare.db`（SQLite，无需额外安装）
- 生产环境请修改 `server.js` 中的 `secret` 为随机字符串
- 如需支持大文件，可修改 `routes/files.js` 中的 `fileSize` 限制（当前50MB）
