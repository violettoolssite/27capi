# 27c API — AI API 中转站

基于 Next.js 14 构建的 OpenAI 兼容 API 中转服务，采用米陶色设计风格。

## 功能特性

- **完整中转** — 支持所有 OpenAI 兼容端点，包括流式响应（SSE）
- **自动模型同步** — 自动从上游接口获取模型列表，无需手动维护
- **管理面板** — 可视化配置上游接口、品牌信息、访问控制
- **自定义品牌** — 支持上传 Logo、Favicon，自定义站点名称和描述
- **访问控制** — 可设置中转密钥，限制接口访问
- **CORS 支持** — 全跨域，可从任意客户端接入

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm run dev
```

### 生产部署

```bash
npm run build
npm start
```

## 初始配置

1. 访问 `http://localhost:3000/admin`
2. 使用默认密码 **`27capi`** 登录（**请立即修改！**）
3. 在「上游接口」选项卡填写上游 API 地址和密钥
4. 点击「保存配置」

## 项目结构

```
├── src/
│   ├── app/
│   │   ├── v1/[...path]/route.ts   # OpenAI 兼容中转路由
│   │   ├── api/admin/              # 管理 API
│   │   ├── admin/page.tsx          # 管理面板
│   │   └── page.tsx                # 公开首页
│   ├── components/                 # UI 组件
│   └── lib/config.ts               # 配置读写
├── data/config.json                # 运行时配置（gitignored）
└── public/uploads/                 # 上传文件（gitignored）
```

## API 端点

中转站启动后，将以下地址作为 `base_url` 填入你的客户端：

```
http://your-domain.com/v1
```

支持的标准端点（通过上游代理）：
- `POST /v1/chat/completions`
- `GET  /v1/models`
- `POST /v1/embeddings`
- `POST /v1/completions`
- 其他所有 `/v1/*` 路径

## 安全说明

- 上游 API Key 仅存储在服务器本地，不会通过接口暴露
- 管理面板使用 Bearer Token 验证，建议设置强密码
- `data/` 目录已加入 `.gitignore`，防止密钥泄露
- 建议在反代（Nginx/Caddy）后部署，并启用 HTTPS

## 技术栈

- **框架**: Next.js 14 (App Router)
- **UI**: React + Tailwind CSS (米陶色主题)
- **图标**: Lucide React
- **类型**: TypeScript
