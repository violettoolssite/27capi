# 27c API — AI API 中转站

> 基于 Next.js 15 构建的 OpenAI 兼容 API 中转服务，支持多用户、API Key 管理、用量计费、邮箱验证等完整功能。

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🔄 **完整中转** | 支持所有 OpenAI 兼容端点，包括流式响应（SSE） |
| 👥 **多用户系统** | 用户注册/登录，JWT 认证，scrypt 密码哈希 |
| 🔑 **API Key 管理** | 用户自助生成、启用/禁用 API Key |
| 📊 **用量统计** | 按模型记录 Token 消耗，支持自定义定价 |
| 💰 **余额计费** | 用户余额系统，按调用自动扣费 |
| 📧 **邮箱验证** | 注册时可启用邮箱验证，支持域名白名单 |
| 🎨 **品牌定制** | 自定义站点名称、Logo、Favicon、公告、CSS |
| 🛡️ **访问控制** | 可设置中转密钥，限制接口访问 |
| 🌐 **CORS 支持** | 全跨域，可从任意客户端接入 |
| 📋 **模型列表** | 自动从上游获取，按提供商分组展示 |

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 安装

```bash
git clone https://github.com/violettoolssite/27capi.git
cd 27capi
npm install
```

### 配置环境变量（可选）

```bash
cp .env.example .env.local
# 编辑 .env.local 填写必要配置
```

### 开发运行

```bash
npm run dev
# 访问 http://localhost:3000
```

### 生产部署

```bash
npm run build
npm start
```

---

## ⚙️ 初始配置

1. 访问 `http://localhost:3000/admin`
2. 使用默认密码 **`123456`** 登录（**请立即修改！**）
3. 在「上游接口」选项卡填写上游 API 地址和密钥
4. 点击「保存配置」

---

## 📁 项目结构

```
├── src/
│   ├── app/
│   │   ├── v1/[...path]/route.ts     # OpenAI 兼容中转路由
│   │   ├── api/
│   │   │   ├── admin/                # 管理 API（config/users/stats/model-prices）
│   │   │   ├── auth/                 # 认证 API（login/register/logout/me/verify-email）
│   │   │   └── user/                 # 用户 API（keys/usage）
│   │   ├── admin/page.tsx            # 管理面板
│   │   ├── dashboard/page.tsx        # 用户仪表盘
│   │   ├── models/page.tsx           # 模型列表页
│   │   ├── docs/page.tsx             # API 文档页
│   │   ├── pricing/page.tsx          # 定价页
│   │   ├── status/page.tsx           # 服务状态页
│   │   ├── login/page.tsx            # 登录/注册页
│   │   └── zidingyi/page.tsx         # 商业定制面板
│   ├── components/
│   │   ├── Navbar.tsx                # 导航栏
│   │   ├── Footer.tsx                # 页脚
│   │   ├── ModelGrid.tsx             # 模型分组展示
│   │   └── QuickStart.tsx            # 快速接入引导
│   └── lib/
│       ├── auth.ts                   # JWT 认证工具
│       ├── config.ts                 # 配置读写
│       ├── db.ts                     # 用户/Key 数据库
│       ├── email.ts                  # 邮件发送
│       └── model-prices.ts           # 模型定价
├── data/                             # 运行时数据（gitignored）
│   ├── config.json
│   ├── users.json
│   ├── api_keys.json
│   └── usage_logs.jsonl
└── public/uploads/                   # 上传文件（gitignored）
```

---

## 🔌 API 端点

将以下地址作为 `base_url` 填入客户端：

```
https://your-domain.com/v1
```

**认证方式**：Bearer Token（用户 API Key 或管理员密码）

```bash
Authorization: Bearer sk-27c-xxxxxxxxxxxxxxxx
```

**支持的端点**（全部透传到上游）：

```
POST /v1/chat/completions
GET  /v1/models
POST /v1/embeddings
POST /v1/completions
POST /v1/images/generations
...（所有 /v1/* 路径）
```

---

## 🛠️ 路由说明

| 路由 | 说明 |
|------|------|
| `/` | 公开首页，展示接入方式和模型列表 |
| `/models` | 模型列表，按提供商分组 |
| `/docs` | API 文档 |
| `/pricing` | 定价说明 |
| `/status` | 上游服务实时状态检测 |
| `/login` | 登录/注册 |
| `/dashboard` | 用户仪表盘（API Key 管理 + 用量记录） |
| `/admin` | 管理员面板 |
| `/zidingyi` | 商业定制配置 |

---

## 🔐 安全说明

- 上游 API Key 仅存储在服务器本地，不通过接口暴露
- 管理面板使用 Bearer Token 验证，建议设置强密码
- 用户密码使用 scrypt 哈希存储
- `data/` 目录已加入 `.gitignore`，防止密钥泄露
- 建议在反向代理（Nginx/Caddy）后部署，并启用 HTTPS

---

## 📦 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **UI**: React 19 + Tailwind CSS（米陶色主题）
- **图标**: Lucide React
- **认证**: 自实现 JWT（Node.js crypto, HS256）
- **数据存储**: JSON 文件（无需数据库）
- **邮件**: Nodemailer

---

## 📄 开源协议

本项目采用 [Apache License 2.0](LICENSE) 开源协议。
