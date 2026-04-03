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
