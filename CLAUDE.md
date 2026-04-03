# tt-cli

滴答清单（TickTick）命令行工具，支持国内版（dida365.com）和国际版（ticktick.com）双区域。

## 技术栈

| 类别 | 方案 |
|------|------|
| CLI 框架 | `cac` |
| 终端 UI | `@clack/prompts` + `picocolors` |
| 构建 | `tsup`（ESM only，target node18） |
| 测试 | `vitest`（globals 模式） |
| 运行时 | Node.js 18+，ESM 模块 |

## 常用命令

```bash
npm run build      # 构建（tsup → dist/）
npm run dev        # 监听模式构建
npm test           # 运行测试
npm run test:watch # 监听模式测试
```

## 项目结构

```
src/
  index.ts          # CLI 入口，cac 命令注册
  types.ts          # 类型定义（OAuthConfig, TokenData, Region, AppConfig）
  commands/
    auth.ts          # 认证命令：login / logout / whoami / config
  api/
    client.ts        # API 客户端，自动刷新 Token
    oauth.ts         # OAuth2 流程：授权 URL 构建、code 换 token、刷新
  utils/
    config.ts        # 配置读写（~/.tt-cli/config.json）
    endpoints.ts     # 区域接口地址映射（cn / global）
    server.ts        # OAuth 回调本地 HTTP 服务器（端口 3000）
```

## 配置存储

- 配置目录：`~/.tt-cli/`（测试时通过 `TT_CLI_CONFIG_DIR` 环境变量覆盖）
- 配置文件：`~/.tt-cli/config.json`，包含 `oauth`（凭证）、`token`（访问令牌）、`region`（区域）

## 区域系统

通过 `tt config --region cn|global` 切换区域。切换区域会清除 Token，需要重新登录。凭证与区域绑定，登录时会检测不匹配并引导用户处理。

## 架构要点

- **OAuth2 流程**：本地启动 HTTP 服务器监听回调 → 浏览器打开授权页 → 拿到 code 换 token
- **Token 自动刷新**：`apiRequest` 发请求前检查 Token 有效性，过期自动刷新
- **CSRF 防护**：授权请求携带随机 state 参数，回调时校验

## 开发约定

- 使用 TypeScript strict 模式
- 注释和输出文案使用中文
- npm 包名：`@wangjs-jacky/tt-cli`

## 架构设计文档

- [OAuth 2.0 认证架构设计](docs/oauth-credential-pre-validation.md)：授权码模式完整流程、双区域架构、Token 管理与安全设计
