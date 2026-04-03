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
