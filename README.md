# 找机场 (zhaojichang.cyou) - 机场发现与筛选指南平台

「找机场」是一个面向中文用户的机场发现平台、多维目录筛选入口与 SEO 知识库网站。

- **正式域名**：https://zhaojichang.cyou
- **技术栈**：Astro 4.16 + Tailwind CSS + TypeScript + CSV 数据流水线

---

## 目录结构说明

```text
├── airports.csv           # 原始真实机场数据清单 (31家服务商)
├── dist/                  # 生产环境静态打包文件 (71个页面 + sitemap.xml + robots.txt)
├── public/                # 静态公共资源 (favicon.svg, robots.txt)
├── src/
│   ├── components/        # 页面组件 (AirportCard, AirportFilter, SearchModal, SEO 等)
│   ├── data/              # 数据层 (airports.json, airports.ts, articles.ts)
│   ├── layouts/           # 页面主布局 (Layout.astro)
│   ├── pages/             # 路由页面 (首页, /airports/, /cheap-airports/, /blog/, /nodes/ 等)
│   └── styles/            # 全局样式与设计系统
├── server.js              # 独立 Node.js 生产静态 Web 伺服器
├── build.js               # 极速自动化静态构建脚本
├── nginx.conf             # Nginx 生产环境高并发配置
├── Dockerfile             # Docker 容器化打包文件
└── package.json           # 项目配置与依赖说明
```

---

## 本地运行与管理

### 1. 安装依赖
```bash
npm install
```

### 2. 启动本地开发伺服器（热重载）
```bash
npm run dev
# 浏览器访问: http://localhost:4321
```

### 3. 一键编译静态生产文件
```bash
npm run build
# 编译结果将输出到 dist/ 目录 (包含 71 个 HTML 页面与 XML Sitemap)
```

### 4. 启动独立生产 Web 伺服器
```bash
npm run serve
# 浏览器访问: http://localhost:3000
```

---

## 部署方案

- **Cloudflare Pages / Vercel**：将输出目录设置为 `dist`，构建命令设置为 `npm run build`。
- **Nginx / VPS**：直接将 `dist/` 目录上传到服务器，并使用本项目提供的 `nginx.conf` 配置文件。
- **Docker**：运行 `docker build -t zhaojichang-cyou . && docker run -d -p 80:80 zhaojichang-cyou`。
