# tt-cli 设计文档

> 滴答清单（TickTick）命令行工具，TypeScript 实现

## 项目信息

| 项 | 值 |
|---|---|
| 项目名 | `tt-cli` |
| npm 包名 | `@wangjs-jacky/tt-cli` |
| CLI 命令 | `tt` |
| 仓库 | `/Users/jiashengwang/jacky-github/tt-cli` |
| GitHub | `https://github.com/wangjs-jacky/tt-cli` |

## 技术栈

| 包 | 用途 |
|---|------|
| `cac` | CLI 命令框架 |
| `@clack/prompts` | 终端交互 UI |
| `picocolors` | 终端颜色 |
| `tsup` | 构建打包 |
| `open` | 打开浏览器 |
| `conf` | 跨平台配置存储（基于 XDG） |

## 项目结构

```
tt-cli/
├── src/
│   ├── index.ts          # 入口，cac 命令注册
│   ├── commands/
│   │   └── auth.ts       # tt login / tt logout
│   ├── api/
│   │   ├── client.ts     # HTTP 客户端，自动附带 token
│   │   └── oauth.ts      # OAuth2 流程（本地回调服务器）
│   ├── utils/
│   │   ├── config.ts     # token 存储管理 (~/.tt-cli/config.json)
│   │   ├── server.ts     # 临时本地回调服务器
│   │   └── open.ts       # 打开浏览器
│   └── types.ts          # TypeScript 类型定义
├── bin/
│   └── cli.ts            # #!/usr/bin/env node 入口
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

## Token 存储

位置：`~/.tt-cli/config.json`

```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresAt": 1712121600000,
  "clientId": "...",
  "clientSecret": "..."
}
```

## OAuth2 认证流程

### tt login

1. 检测 `~/.tt-cli/config.json` 是否有有效 token
2. 首次使用：提示输入 Client ID + Client Secret
3. 启动本地服务器 `http://localhost:{随机端口}/callback`
4. 生成 state（防 CSRF），拼接授权 URL
5. 自动打开浏览器 → 用户登录并授权
6. TickTick 重定向到 `localhost/callback?code=xxx&state=yyy`
7. 本地服务器捕获 code，验证 state
8. `POST https://ticktick.com/oauth/token` 换取 access_token（Authorization: Basic base64(clientId:clientSecret)）
9. 保存 token 到 config.json
10. 终端显示登录成功，关闭本地服务器

### Token 刷新（自动）

1. API 调用前检查 expiresAt
2. 即将过期时自动 `POST https://ticktick.com/oauth/token`，grant_type=refresh_token
3. 更新 config.json 中的 token

### tt logout

删除 config.json 中的 token 数据。

## CLI 命令（鉴权阶段）

```bash
tt login          # OAuth2 登录，获取 token
tt logout         # 登出，清除 token
tt whoami         # 显示当前登录状态和用户信息
tt config         # 查看/设置 Client ID 和 Client Secret
```

### tt login 交互流程

```
◈ 滴答清单 CLI 登录

◇ 尚未配置 OAuth 凭证
│ 首次使用需要注册 TickTick 开发者应用
│ 请访问 https://developer.ticktick.com/app 注册
│ Redirect URI 设置为: http://localhost:3000/callback
│
◇ 请输入 Client ID: ________
◇ 请输入 Client Secret: ________
│
◆ 正在打开浏览器进行授权...
│ 如果浏览器没有自动打开，请访问：
│ https://ticktick.com/oauth/authorize?...
│
✔ 登录成功！欢迎, <用户名>
```

### tt whoami 输出

```
✔ 已登录
  用户: jacky
  Token 有效期: 2026-04-03 18:30 (剩余 6 小时)
```

## TickTick OAuth2 关键参数

| 参数 | 值 |
|---|---|
| 授权 URL | `https://ticktick.com/oauth/authorize` |
| Token URL | `https://ticktick.com/oauth/token` |
| API Base | `https://api.ticktick.com/open/v1/` |
| Scopes | `tasks:read tasks:write` |
| Redirect URI | `http://localhost:{port}/callback` |

## 后续阶段（本次不实现）

- `tt tasks` — 查看今日/明日任务
- `tt add` — 创建任务
- `tt done` — 完成任务
- `tt projects` — 查看项目清单
- `tt review` — 日程复盘
