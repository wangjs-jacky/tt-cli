/** OAuth2 客户端凭证 */
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  /** 凭证所属区域 */
  region?: Region;
}

/** 持久化的 Token 数据 */
export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/** API 区域 */
export type Region = 'cn' | 'global';

/** 区域对应的接口地址 */
export interface RegionEndpoints {
  authUrl: string;
  tokenUrl: string;
  apiBase: string;
  developerUrl: string;
}

/** 配置文件结构 (~/.tt-cli/config.json) */
export interface AppConfig {
  oauth?: OAuthConfig;
  token?: TokenData;
  region?: Region;
}

/** TickTick OAuth2 token 响应 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}
