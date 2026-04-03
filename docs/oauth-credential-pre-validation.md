# OAuth 2.0 认证架构设计

> 本文档梳理 tt-cli 项目中 OAuth 2.0 授权码模式的完整流程、架构设计与关键决策。

## 一、OAuth 2.0 授权码模式流程

本项目使用 **OAuth 2.0 Authorization Code Grant**（授权码模式），这是最安全的 OAuth 流程，适合有后端交互的应用。

### 完整流程时序

```
用户                 CLI（本地）              浏览器              滴答清单服务器
 │                     │                      │                      │
 │  tt login           │                      │                      │
 │────────────────────>│                      │                      │
 │                     │                      │                      │
 │                     │  1. 检查 Token 有效性  │                      │
 │                     │  2. 读取 OAuth 凭证    │                      │
 │                     │  3. 区域不匹配检测     │                      │
 │                     │                      │                      │
 │                     │  4. 启动本地 HTTP     │                      │
 │                     │     服务器 :3000      │                      │
 │                     │                      │                      │
 │                     │  5. 打开浏览器 ─────────>│                    │
 │                     │                      │                      │
 │                     │                      │  6. GET /oauth/authorize
 │                     │                      │─────────────────────>│
 │                     │                      │                      │
 │                     │                      │  7. 302 → 登录页      │
 │                     │                      │<─────────────────────│
 │                     │                      │                      │
 │                     │                      │  8. 用户登录/确认身份  │
 │                     │                      │══════════════════════>│
 │                     │                      │                      │
 │                     │                      │  9. 服务端校验 client_id
 │                     │                      │     (custom_authorize)│
 │                     │                      │                      │
 │                     │                      │  10. 302 → 回调地址   │
 │                     │                      │     localhost:3000    │
 │                     │                      │     ?code=xxx         │
 │                     │                      │     &state=yyy        │
 │                     │                      │<─────────────────────│
 │                     │                      │                      │
 │                     │  11. 收到 code + state│                      │
 │                     │<─────────────────────────│                  │
 │                     │                      │                      │
 │                     │  12. POST /oauth/token (code → token)        │
 │                     │─────────────────────────────────────────────>│
 │                     │                      │                      │
 │                     │  13. 返回 access_token + refresh_token       │
 │                     │<─────────────────────────────────────────────│
 │                     │                      │                      │
 │                     │  14. 保存 Token       │                      │
 │                     │  15. 关闭 HTTP 服务器  │                      │
 │                     │                      │                      │
 │  ✔ 登录成功          │                      │                      │
 │<────────────────────│                      │                      │
```

### 流程详解

#### 第 1 步：检查现有 Token

```typescript
// src/commands/auth.ts
const token = getToken();
if (token && isTokenValid()) {
  // Token 未过期（剩余 > 5 分钟），无需重复登录
  return;
}
```

#### 第 2-3 步：凭证与区域检测

```typescript
// 读取保存的 OAuth 凭证
let oauth = getOAuth();

// 情况 1：凭证 region 与当前 region 不一致 → 提示重新配置
if (oauth?.region && oauth.region !== region) { ... }

// 情况 2：旧凭证无 region 标记 → 提示用户确认
if (oauth && !oauth.region) { ... }

// 情况 3：无凭证 → 引导用户输入
if (!oauth) { await promptOAuthCredentials(...); }
```

#### 第 4-5 步：启动回调服务器 + 打开浏览器

```typescript
// src/api/oauth.ts - loginWithBrowser()

// 先启动本地 HTTP 服务器（监听回调）
const codePromise = createCallbackServer(state, port);  // port = 3000

// 再打开浏览器（授权 URL）
await open(authUrl);
```

授权 URL 格式：
```
https://dida365.com/oauth/authorize
  ?client_id=xxx
  &response_type=code
  &redirect_uri=http://localhost:3000/callback
  &scope=tasks:read tasks:write
  &state=<随机 CSRF token>
```

#### 第 6-10 步：浏览器内授权流程

这是在用户浏览器中发生的流程，CLI 无法控制：

1. **GET /oauth/authorize** → 服务端返回 302，重定向到登录页
2. **用户登录** → 使用已有 session 或输入账号密码
3. **服务端校验 client_id** → 跳转到 `api.dida365.com/oauth/custom_authorize`
   - client_id 无效 → 显示 401/403 错误页面
   - client_id 有效 → 显示授权确认页
4. **用户确认授权** → 服务端返回 302，重定向到 `redirect_uri`
5. **浏览器访问** `http://localhost:3000/callback?code=xxx&state=yyy`

#### 第 11 步：回调服务器接收授权码

```typescript
// src/utils/server.ts
// 本地 HTTP 服务器监听 /callback 路径
// 校验 state（CSRF 防护）
// 提取 code 参数
// 超时时间：2 分钟
```

#### 第 12-13 步：用授权码换取 Token

```typescript
// src/api/oauth.ts - exchangeCode()
POST https://dida365.com/oauth/token
Headers:
  Authorization: Basic <base64(clientId:clientSecret)>
Body:
  code=xxx
  grant_type=authorization_code
  redirect_uri=http://localhost:3000/callback

// 返回
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600
}
```

## 二、双区域架构

### 区域系统

| 区域 | 域名 | OAuth 授权端点 | Token 端点 |
|------|------|----------------|------------|
| 国内版 | dida365.com | `https://dida365.com/oauth/authorize` | `https://dida365.com/oauth/token` |
| 国际版 | ticktick.com | `https://ticktick.com/oauth/authorize` | `https://ticktick.com/oauth/token` |

区域配置存储在 `~/.tt-cli/config.json` 中，通过 `tt config --region cn|global` 切换。

### 区域与凭证绑定

凭证（client_id / client_secret）是按区域注册的。国内版开放平台注册的凭证只对 `dida365.com` 有效，国际版的只对 `ticktick.com` 有效。

**检测机制**：凭证保存时自动记录当前区域（`oauth.region`），登录时对比：

```
config.json:
{
  "region": "cn",                    ← 当前区域
  "oauth": {
    "clientId": "xxx",
    "clientSecret": "yyy",
    "region": "cn"                    ← 凭证所属区域
  }
}
```

三种情况：

| 情况 | 条件 | 处理 |
|------|------|------|
| 区域匹配 | `oauth.region === region` | 正常登录 |
| 区域不匹配 | `oauth.region !== region` | 提示重新配置 |
| 区域未知 | `oauth.region` 为空（旧配置） | 提示用户确认凭证所属区域 |

## 三、Token 管理

### Token 存储

```typescript
interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;  // 过期时间戳（毫秒）
}
```

### 自动刷新

每次 API 请求前检查 Token 有效性：

```typescript
// src/api/client.ts - apiRequest()

// 1. 检查 Token 是否存在
// 2. 检查是否过期（剩余 < 5 分钟视为过期）
// 3. 过期 → 自动调用 refreshAccessToken()
// 4. 刷新失败 → 提示用户重新登录
```

刷新 Token 的请求：
```
POST https://dida365.com/oauth/token
Headers:
  Authorization: Basic <base64(clientId:clientSecret)>
Body:
  grant_type=refresh_token
  refresh_token=xxx
```

## 四、安全设计

### CSRF 防护

每次授权请求生成随机 `state` 参数，回调时校验：

```typescript
// src/api/oauth.ts
const state = crypto.randomBytes(16).toString('hex');

// src/utils/server.ts
if (state !== expectedState) {
  reject(new Error('CSRF state 不匹配'));
}
```

### 凭证存储

- 配置文件：`~/.tt-cli/config.json`
- Client Secret 显示时脱敏（只显示前 8 位）
- Token 存储在本地，不传输到第三方

## 五、已知限制

1. **无法在打开浏览器前校验 client_id 有效性**：滴答清单 OAuth 服务端在用户登录后才校验 client_id，`/oauth/authorize` 端点对任何 client_id 都返回 302。通过 Node.js `fetch` 无法到达校验环节（需要浏览器 session cookies）。

2. **回调超时 2 分钟**：如果浏览器显示错误（如 invalid_client），回调不会触发，需要等待 2 分钟超时后才能在终端显示错误提示。后续可考虑通过 Headless Chrome（CDP）复用用户已登录的 session 进行预校验来优化。

3. **端口固定 3000**：回调服务器固定监听 3000 端口，如果被占用会报错。
