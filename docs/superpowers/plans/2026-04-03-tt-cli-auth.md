# tt-cli 鉴权模块实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现滴答清单 CLI 工具的 OAuth2 认证模块，支持登录/登出/状态查询。

**Architecture:** 本地启动临时 HTTP 服务器捕获 OAuth2 回调，自动打开浏览器完成授权，token 持久化到 `~/.tt-cli/config.json`，API 客户端自动刷新过期 token。

**Tech Stack:** TypeScript, cac, @clack/prompts, picocolors, tsup, vitest, open

---

## 文件结构

| 操作 | 文件 | 职责 |
|------|------|------|
| Create | `package.json` | 项目配置、依赖、bin |
| Create | `tsconfig.json` | TypeScript 配置 |
| Create | `tsup.config.ts` | 构建配置 |
| Create | `vitest.config.ts` | 测试配置 |
| Create | `src/types.ts` | 所有 TypeScript 类型 |
| Create | `src/utils/config.ts` | 配置文件读写（~/.tt-cli/config.json） |
| Create | `src/utils/server.ts` | 临时本地 OAuth2 回调服务器 |
| Create | `src/api/oauth.ts` | OAuth2 授权 URL 生成、code 换 token、token 刷新 |
| Create | `src/api/client.ts` | HTTP 客户端，自动附带 Bearer token 并处理刷新 |
| Create | `src/commands/auth.ts` | login/logout/whoami/config 命令实现 |
| Create | `src/index.ts` | cac 命令注册入口 |
| Create | `bin/cli.ts` | #!/usr/bin/env node 可执行入口 |
| Create | `tests/config.test.ts` | 配置模块测试 |
| Create | `tests/oauth.test.ts` | OAuth 工具函数测试 |

---

### Task 1: 项目脚手架

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`
- Create: `bin/cli.ts`

- [ ] **Step 1: 初始化 package.json**

```bash
cd /Users/jiashengwang/jacky-github/tt-cli
npm init -y
```

然后修改 `package.json` 为以下内容：

```json
{
  "name": "@wangjs-jacky/tt-cli",
  "version": "0.1.0",
  "description": "滴答清单（TickTick）命令行工具",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "tt": "./dist/bin/cli.js"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["ticktick", "dida", "cli", "todo", "task"],
  "author": "wangjs-jacky",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/wangjs-jacky/tt-cli.git"
  }
}
```

- [ ] **Step 2: 安装依赖**

```bash
npm install cac @clack/prompts picocolors open
npm install -D typescript tsup vitest @types/node
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "bin/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: 创建 tsup.config.ts**

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'bin/cli.ts'],
  format: ['esm'],
  target: 'node18',
  clean: true,
  splitting: false,
  sourcemap: true,
  dts: true,
});
```

- [ ] **Step 5: 创建 vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

- [ ] **Step 6: 创建 bin/cli.ts**

```typescript
#!/usr/bin/env node
import '../dist/index.js';
```

- [ ] **Step 7: 初始化 Git 并提交**

```bash
cd /Users/jiashengwang/jacky-github/tt-cli
git init
```

创建 `.gitignore`：

```
node_modules/
dist/
*.tsbuildinfo
```

```bash
git add .
git commit -m "chore: init tt-cli project scaffolding"
```

---

### Task 2: TypeScript 类型定义

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: 创建 src/types.ts**

```typescript
/** OAuth2 客户端凭证 */
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
}

/** 持久化的 Token 数据 */
export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/** 配置文件结构 (~/.tt-cli/config.json) */
export interface AppConfig {
  oauth?: OAuthConfig;
  token?: TokenData;
}

/** TickTick OAuth2 token 响应 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}
```

- [ ] **Step 2: 验证类型编译通过**

```bash
npx tsc --noEmit src/types.ts
```

Expected: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add src/types.ts
git commit -m "feat: add TypeScript type definitions"
```

---

### Task 3: 配置管理模块

**Files:**
- Create: `src/utils/config.ts`
- Create: `tests/config.test.ts`

- [ ] **Step 1: 编写配置模块测试 tests/config.test.ts**

```typescript
import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// 测试用临时目录，避免污染真实配置
const TEST_DIR = path.join(os.tmpdir(), 'tt-cli-test-' + process.pid);

// 动态导入，每个测试前重置模块
let config: typeof import('../src/utils/config.js');

beforeEach(async () => {
  // 创建临时目录
  fs.mkdirSync(TEST_DIR, { recursive: true });
  // 用环境变量覆盖配置路径（模块内部读取此变量）
  process.env.TT_CLI_CONFIG_DIR = TEST_DIR;
  // 清除模块缓存以重新加载
  const mod = await import('../src/utils/config.js?' + Date.now());
  config = mod;
});

afterEach(() => {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
  delete process.env.TT_CLI_CONFIG_DIR;
});

describe('config module', () => {
  it('无配置时应返回 undefined', () => {
    expect(config.getOAuth()).toBeUndefined();
    expect(config.getToken()).toBeUndefined();
  });

  it('应正确保存和读取 OAuth 凭证', () => {
    const oauth = { clientId: 'test-id', clientSecret: 'test-secret' };
    config.setOAuth(oauth);

    const result = config.getOAuth();
    expect(result).toEqual(oauth);
  });

  it('应正确保存和读取 Token', () => {
    const token = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      expiresAt: Date.now() + 3600000,
    };
    config.setToken(token);

    const result = config.getToken();
    expect(result).toEqual(token);
  });

  it('未过期 token 应判定为有效', () => {
    config.setToken({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: Date.now() + 600000, // 10 分钟后过期
    });
    expect(config.isTokenValid()).toBe(true);
  });

  it('即将过期（5 分钟内）应判定为无效', () => {
    config.setToken({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: Date.now() + 240000, // 4 分钟后过期
    });
    expect(config.isTokenValid()).toBe(false);
  });

  it('无 token 应判定为无效', () => {
    expect(config.isTokenValid()).toBe(false);
  });

  it('clearToken 应只删除 token 保留 oauth', () => {
    config.setOAuth({ clientId: 'id', clientSecret: 'secret' });
    config.setToken({
      accessToken: 'a',
      refreshToken: 'r',
      expiresAt: Date.now() + 3600000,
    });

    config.clearToken();

    expect(config.getToken()).toBeUndefined();
    expect(config.getOAuth()).toEqual({ clientId: 'id', clientSecret: 'secret' });
  });

  it('配置应写入 JSON 文件', () => {
    config.setOAuth({ clientId: 'id', clientSecret: 'secret' });
    const configPath = path.join(TEST_DIR, 'config.json');
    const content = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    expect(content.oauth).toEqual({ clientId: 'id', clientSecret: 'secret' });
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
npx vitest run tests/config.test.ts
```

Expected: FAIL — 模块不存在

- [ ] **Step 3: 实现 src/utils/config.ts**

```typescript
import fs from 'fs';
import path from 'path';
import os from 'os';
import type { AppConfig, OAuthConfig, TokenData } from '../types.js';

/** 配置目录，可通过环境变量覆盖（测试用） */
function getConfigDir(): string {
  return process.env.TT_CLI_CONFIG_DIR ?? path.join(os.homedir(), '.tt-cli');
}

const CONFIG_FILE = 'config.json';

function getConfigPath(): string {
  return path.join(getConfigDir(), CONFIG_FILE);
}

function ensureConfigDir(): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readConfig(): AppConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return {};
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function writeConfig(config: AppConfig): void {
  ensureConfigDir();
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}

/** 读取 OAuth 凭证 */
export function getOAuth(): OAuthConfig | undefined {
  return readConfig().oauth;
}

/** 保存 OAuth 凭证 */
export function setOAuth(oauth: OAuthConfig): void {
  const config = readConfig();
  config.oauth = oauth;
  writeConfig(config);
}

/** 读取 Token */
export function getToken(): TokenData | undefined {
  return readConfig().token;
}

/** 保存 Token */
export function setToken(token: TokenData): void {
  const config = readConfig();
  config.token = token;
  writeConfig(config);
}

/** 清除 Token（保留 OAuth 凭证） */
export function clearToken(): void {
  const config = readConfig();
  delete config.token;
  writeConfig(config);
}

/** Token 是否有效（未过期且剩余 > 5 分钟） */
export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  return Date.now() < token.expiresAt - 5 * 60 * 1000;
}
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
npx vitest run tests/config.test.ts
```

Expected: 所有 7 个测试 PASS

- [ ] **Step 5: 提交**

```bash
git add src/utils/config.ts tests/config.test.ts
git commit -m "feat: add config module with tests"
```

---

### Task 4: OAuth2 回调服务器

**Files:**
- Create: `src/utils/server.ts`

- [ ] **Step 1: 实现 src/utils/server.ts**

```typescript
import http from 'http';

interface CallbackResult {
  code: string;
  close: () => void;
}

/**
 * 创建临时本地 HTTP 服务器，等待 OAuth2 回调
 * 返回 Promise，在收到合法回调时 resolve
 */
export function createCallbackServer(
  expectedState: string,
  port: number
): Promise<CallbackResult> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost:${port}`);

      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (state !== expectedState) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>授权失败：state 不匹配</h1>');
        reject(new Error('CSRF state 不匹配'));
        server.close();
        return;
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>授权失败：缺少 code 参数</h1>');
        reject(new Error('缺少授权码'));
        server.close();
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif"><h1>✅ 授权成功！请返回终端。</h1></body></html>');

      resolve({
        code,
        close: () => server.close(),
      });
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`端口 ${port} 已被占用，请关闭占用该端口的程序或等待重试`));
      } else {
        reject(err);
      }
    });

    server.listen(port);
  });
}
```

- [ ] **Step 2: 验证编译通过**

```bash
npx tsc --noEmit src/utils/server.ts
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/utils/server.ts
git commit -m "feat: add OAuth2 callback server"
```

---

### Task 5: OAuth2 流程模块

**Files:**
- Create: `src/api/oauth.ts`
- Create: `tests/oauth.test.ts`

- [ ] **Step 1: 编写 OAuth 工具函数测试 tests/oauth.test.ts**

```typescript
import { describe, it, expect } from 'vitest';
import { generateState, buildAuthUrl } from '../src/api/oauth.js';
import type { OAuthConfig } from '../src/types.js';

describe('OAuth utilities', () => {
  it('generateState 应返回 32 位十六进制字符串', () => {
    const state = generateState();
    expect(state).toMatch(/^[0-9a-f]{32}$/);
  });

  it('generateState 每次应返回不同的值', () => {
    const a = generateState();
    const b = generateState();
    expect(a).not.toBe(b);
  });

  it('buildAuthUrl 应包含所有必要参数', () => {
    const config: OAuthConfig = { clientId: 'my-client-id', clientSecret: 'my-secret' };
    const state = 'test-state';
    const port = 3000;

    const url = buildAuthUrl(config, state, port);

    expect(url).toContain('https://ticktick.com/oauth/authorize');
    expect(url).toContain('client_id=my-client-id');
    expect(url).toContain('response_type=code');
    expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
    expect(url).toContain('scope=tasks%3Aread+tasks%3Awrite');
    expect(url).toContain('state=test-state');
  });

  it('buildAuthUrl 不同端口应生成不同的 redirect_uri', () => {
    const config: OAuthConfig = { clientId: 'id', clientSecret: 'secret' };
    const url3000 = buildAuthUrl(config, 's', 3000);
    const url8080 = buildAuthUrl(config, 's', 8080);

    expect(url3000).toContain('localhost%3A3000');
    expect(url8080).toContain('localhost%3A8080');
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
npx vitest run tests/oauth.test.ts
```

Expected: FAIL — 模块不存在

- [ ] **Step 3: 实现 src/api/oauth.ts**

```typescript
import crypto from 'crypto';
import open from 'open';
import type { OAuthConfig, TokenData, TokenResponse } from '../types.js';
import { getOAuth, getToken, setToken } from '../utils/config.js';
import { createCallbackServer } from '../utils/server.js';

const AUTH_URL = 'https://ticktick.com/oauth/authorize';
const TOKEN_URL = 'https://ticktick.com/oauth/token';
const SCOPES = 'tasks:read tasks:write';
const DEFAULT_PORT = 3000;

/** 生成随机 state（防 CSRF） */
export function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

/** 构建授权 URL */
export function buildAuthUrl(config: OAuthConfig, state: string, port: number): string {
  const redirectUri = `http://localhost:${port}/callback`;
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

/** 用授权码换取 Token */
export async function exchangeCode(
  config: OAuthConfig,
  code: string,
  port: number
): Promise<TokenData> {
  const redirectUri = `http://localhost:${port}/callback`;
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      scope: SCOPES,
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token 交换失败: ${response.status} ${text}`);
  }

  const data: TokenResponse = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

/** 刷新 Token */
export async function refreshAccessToken(): Promise<TokenData> {
  const oauth = getOAuth();
  const token = getToken();

  if (!oauth || !token) {
    throw new Error('未登录，请先运行 tt login');
  }

  const credentials = Buffer.from(`${oauth.clientId}:${oauth.clientSecret}`).toString('base64');

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token 刷新失败: ${response.status} ${text}`);
  }

  const data: TokenResponse = await response.json();
  const newToken: TokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  setToken(newToken);
  return newToken;
}

/** 完整登录流程 */
export async function loginWithBrowser(config: OAuthConfig, port = DEFAULT_PORT): Promise<TokenData> {
  const state = generateState();
  const authUrl = buildAuthUrl(config, state, port);

  // 先启动服务器
  const codePromise = createCallbackServer(state, port);

  // 再打开浏览器
  await open(authUrl);

  // 等待回调
  const { code, close } = await codePromise;

  // 交换 token
  const token = await exchangeCode(config, code, port);
  setToken(token);

  // 关闭服务器
  close();

  return token;
}
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
npx vitest run tests/oauth.test.ts
```

Expected: 所有 4 个测试 PASS

- [ ] **Step 5: 提交**

```bash
git add src/api/oauth.ts tests/oauth.test.ts
git commit -m "feat: add OAuth2 flow module with tests"
```

---

### Task 6: API 客户端

**Files:**
- Create: `src/api/client.ts`

- [ ] **Step 1: 实现 src/api/client.ts**

```typescript
import type { OAuthConfig, TokenData } from '../types.js';
import { getOAuth, getToken, isTokenValid } from '../utils/config.js';
import { refreshAccessToken } from './oauth.js';

const API_BASE = 'https://api.ticktick.com/open/v1/';

/** 获取有效的 access token（自动刷新） */
async function getValidToken(): Promise<string> {
  const oauth = getOAuth();
  const token = getToken();

  if (!oauth || !token) {
    throw new Error('未登录，请先运行 tt login');
  }

  if (isTokenValid()) {
    return token.accessToken;
  }

  const newToken = await refreshAccessToken();
  return newToken.accessToken;
}

/** 发送 TickTick Open API 请求 */
export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getValidToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API 请求失败: ${response.status} ${text}`);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
```

- [ ] **Step 2: 验证编译通过**

```bash
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/api/client.ts
git commit -m "feat: add API client with auto token refresh"
```

---

### Task 7: 命令实现

**Files:**
- Create: `src/commands/auth.ts`

- [ ] **Step 1: 实现 src/commands/auth.ts**

```typescript
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getOAuth, setOAuth, getToken, clearToken, isTokenValid } from '../utils/config.js';
import { loginWithBrowser } from '../api/oauth.js';
import { apiRequest } from '../api/client.js';

/** tt login */
export async function loginCommand(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' 滴答清单 CLI 登录 ')));

  // 已登录则跳过
  const token = getToken();
  if (token && isTokenValid()) {
    p.outro(pc.green('已登录，无需重复登录。使用 tt logout 先登出。'));
    return;
  }

  // 获取或输入 OAuth 凭证
  let oauth = getOAuth();
  if (!oauth) {
    p.log.info('首次使用需要注册 TickTick 开发者应用');
    p.log.info('请访问 https://developer.ticktick.com/app 注册');
    p.log.info('Redirect URI 设置为: http://localhost:3000/callback\n');

    const clientId = await p.text({
      message: '请输入 Client ID',
      validate: (v) => (!v ? 'Client ID 不能为空' : undefined),
    });
    if (p.isCancel(clientId)) {
      p.outro('已取消');
      return;
    }

    const clientSecret = await p.text({
      message: '请输入 Client Secret',
      validate: (v) => (!v ? 'Client Secret 不能为空' : undefined),
    });
    if (p.isCancel(clientSecret)) {
      p.outro('已取消');
      return;
    }

    oauth = { clientId, clientSecret };
    setOAuth(oauth);
    p.log.success('OAuth 凭证已保存');
  }

  // 开始 OAuth 流程
  const s = p.spinner();
  s.start('正在打开浏览器进行授权...');

  try {
    await loginWithBrowser(oauth);
    s.stop('授权完成');
    p.outro(pc.green('✔ 登录成功！'));
  } catch (err) {
    s.stop('登录失败');
    p.outro(pc.red(`✖ ${(err as Error).message}`));
    process.exit(1);
  }
}

/** tt logout */
export async function logoutCommand(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' 滴答清单 CLI 登出 ')));
  clearToken();
  p.outro(pc.green('✔ 已登出'));
}

/** tt whoami */
export async function whoamiCommand(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' 滴答清单 CLI 状态 ')));

  const token = getToken();
  if (!token) {
    p.outro(pc.yellow('未登录，请先运行 tt login'));
    return;
  }

  // 调用 API 验证 token 有效性
  const s = p.spinner();
  s.start('正在验证登录状态...');

  try {
    // 用获取项目列表来验证 token
    await apiRequest<unknown[]>('project');
    s.stop('验证完成');

    const expiresIn = token.expiresAt - Date.now();
    if (expiresIn <= 0) {
      p.log.warn('Token 已过期');
      p.outro(pc.yellow('Token 已失效，请运行 tt login 重新登录'));
      return;
    }

    const hours = Math.floor(expiresIn / 3600000);
    const minutes = Math.floor((expiresIn % 3600000) / 60000);
    p.log.success(pc.green('已登录'));
    p.log.info(`Token 有效期: 剩余 ${hours} 小时 ${minutes} 分钟`);
    p.outro('一切正常');
  } catch {
    s.stop('验证失败');
    p.outro(pc.red('Token 已失效，请运行 tt login 重新登录'));
  }
}

/** tt config */
export async function configCommand(): Promise<void> {
  p.intro(pc.bgCyan(pc.black(' 滴答清单 CLI 配置 ')));

  const oauth = getOAuth();
  if (oauth) {
    p.log.info(`Client ID: ${oauth.clientId}`);
    p.log.info(`Client Secret: ${oauth.clientSecret.substring(0, 8)}${'*'.repeat(Math.max(0, oauth.clientSecret.length - 8))}`);
  } else {
    p.log.warn('尚未配置 OAuth 凭证');
  }

  const token = getToken();
  if (token) {
    p.log.info(`Token: ${token.accessToken.substring(0, 8)}...`);
    p.log.info(`过期时间: ${new Date(token.expiresAt).toLocaleString('zh-CN')}`);
  } else {
    p.log.info('Token: 未登录');
  }

  p.outro('配置信息如上');
}
```

- [ ] **Step 2: 验证编译通过**

```bash
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/commands/auth.ts
git commit -m "feat: add login/logout/whoami/config commands"
```

---

### Task 8: CLI 入口

**Files:**
- Create: `src/index.ts`
- Modify: `bin/cli.ts`

- [ ] **Step 1: 实现 src/index.ts**

```typescript
import { cac } from 'cac';
import { loginCommand, logoutCommand, whoamiCommand, configCommand } from './commands/auth.js';

const cli = cac('tt');

cli
  .command('login', '登录滴答清单')
  .action(loginCommand);

cli
  .command('logout', '登出')
  .action(logoutCommand);

cli
  .command('whoami', '查看登录状态')
  .action(whoamiCommand);

cli
  .command('config', '查看配置')
  .action(configCommand);

cli.help();
cli.parse();
```

- [ ] **Step 2: 更新 bin/cli.ts（确保 shebang 正确）**

```typescript
#!/usr/bin/env node
import '../dist/index.js';
```

- [ ] **Step 3: 构建验证**

```bash
npm run build
```

Expected: 成功生成 `dist/` 目录

- [ ] **Step 4: 测试 CLI 帮助信息**

```bash
node dist/bin/cli.js --help
```

Expected: 显示 tt 命令帮助信息，包含 login/logout/whoami/config

- [ ] **Step 5: 测试 tt whoami（未登录状态）**

```bash
node dist/bin/cli.js whoami
```

Expected: 显示"未登录，请先运行 tt login"

- [ ] **Step 6: 提交**

```bash
git add src/index.ts bin/cli.ts
git commit -m "feat: add CLI entry point with cac"
```

---

### Task 9: 全量测试与清理

**Files:**
- All files

- [ ] **Step 1: 运行所有测试**

```bash
npm test
```

Expected: 所有测试 PASS（config 7 个 + oauth 4 个 = 11 个）

- [ ] **Step 2: 运行完整构建**

```bash
npm run build
```

Expected: 构建成功，`dist/` 目录包含 `index.js` 和 `bin/cli.js`

- [ ] **Step 3: 创建 README.md**

```markdown
# tt-cli

滴答清单（TickTick）命令行工具。

## 安装

```bash
npm install -g @wangjs-jacky/tt-cli
```

## 使用

### 首次登录

```bash
tt login
```

首次使用会提示输入 Client ID 和 Client Secret，需要先到 [TickTick 开发者平台](https://developer.ticktick.com/app) 注册应用。

注册时 Redirect URI 设置为：`http://localhost:3000/callback`

### 日常使用

```bash
tt whoami    # 查看登录状态
tt logout    # 登出
tt config    # 查看配置
```

## 开发

```bash
npm install        # 安装依赖
npm run build      # 构建
npm test           # 运行测试
npm run dev        # 监听模式开发
```
```

- [ ] **Step 4: 最终提交**

```bash
git add .
git commit -m "docs: add README"
```

---

## 自检清单

- [x] Spec 覆盖：设计文档中每个需求都有对应 Task
- [x] 无占位符：所有步骤包含完整代码
- [x] 类型一致：所有函数签名在定义和使用处一致
- [x] TDD：config 和 oauth 模块有完整测试
- [x] 构建路径：tsup 入口包含 index.ts 和 bin/cli.ts
