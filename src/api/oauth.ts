import crypto from 'crypto';
import open from 'open';
import type { OAuthConfig, TokenData, TokenResponse } from '../types.js';
import { getOAuth, getToken, setToken, getRegion } from '../utils/config.js';
import { getEndpoints } from '../utils/endpoints.js';
import { createCallbackServer } from '../utils/server.js';

const SCOPES = 'tasks:read tasks:write';
const DEFAULT_PORT = 3000;

/** 生成随机 state（防 CSRF） */
export function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

/** 构建授权 URL */
export function buildAuthUrl(config: OAuthConfig, state: string, port: number, region: 'cn' | 'global' = 'cn'): string {
  const endpoints = getEndpoints(region);
  const redirectUri = `http://localhost:${port}/callback`;
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
  });
  return `${endpoints.authUrl}?${params.toString()}`;
}

/** 用授权码换取 Token */
export async function exchangeCode(
  config: OAuthConfig,
  code: string,
  port: number
): Promise<TokenData> {
  const region = getRegion();
  const endpoints = getEndpoints(region);
  const redirectUri = `http://localhost:${port}/callback`;
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');

  const response = await fetch(endpoints.tokenUrl, {
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

  const data = (await response.json()) as TokenResponse;
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
  const region = getRegion();
  const endpoints = getEndpoints(region);

  if (!oauth || !token) {
    throw new Error('未登录，请先运行 tt login');
  }

  const credentials = Buffer.from(`${oauth.clientId}:${oauth.clientSecret}`).toString('base64');

  const response = await fetch(endpoints.tokenUrl, {
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

  const data = (await response.json()) as TokenResponse;
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
  const region = getRegion();
  const state = generateState();
  const authUrl = buildAuthUrl(config, state, port, region);

  // 先启动服务器
  const codePromise = createCallbackServer(state, port);

  // 再打开浏览器
  await open(authUrl);

  // 等待回调（含超时处理）
  let callbackResult: { code: string; close: () => void };
  try {
    callbackResult = await codePromise;
  } catch (err) {
    if ((err as Error).message === 'TIMEOUT') {
      throw new Error(
        '登录超时（2 分钟未收到授权回调）。\n' +
        '可能原因：\n' +
        '  1. 浏览器授权页面显示了错误（如 invalid_client）\n' +
        '  2. 凭证与当前区域不匹配\n' +
        `  当前区域：${region === 'cn' ? '国内版（dida365.com）' : '国际版（ticktick.com）'}\n` +
        '建议：检查浏览器页面错误，或尝试切换区域/重新配置凭证'
      );
    }
    throw err;
  }

  // 交换 token
  const token = await exchangeCode(config, callbackResult.code, port);
  setToken(token);

  // 关闭服务器
  callbackResult.close();

  return token;
}
