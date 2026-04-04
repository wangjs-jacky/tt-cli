import { getOAuth, getToken, isTokenValid, getRegion } from '../utils/config.js';
import { getEndpoints } from '../utils/endpoints.js';
import { refreshAccessToken } from './oauth.js';

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

/** 发送 API 请求 */
export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getValidToken();
  const endpoints = getEndpoints(getRegion());

  const response = await fetch(`${endpoints.apiBase}${path}`, {
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

  if (response.status === 204) {
    return undefined as T;
  }

  // 读取响应文本，处理空 body（TickTick 部分 API 返回 200 + 空 body）
  const text = await response.text();
  if (!text || text.trim() === '') {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `API 响应 JSON 解析失败 (HTTP ${response.status})\n` +
        `路径: ${path}\n` +
        `原始响应: ${text.substring(0, 500)}\n` +
        `建议: 请检查 API 端点是否正确，或尝试 tt task-search 验证数据`
    );
  }
}
