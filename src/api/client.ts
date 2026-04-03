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

  return response.json() as Promise<T>;
}
