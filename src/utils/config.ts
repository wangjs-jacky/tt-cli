import fs from 'fs';
import path from 'path';
import os from 'os';
import type { AppConfig, OAuthConfig, Region, TokenData } from '../types.js';

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

/** 读取区域设置，默认国内版 */
export function getRegion(): Region {
  return readConfig().region ?? 'cn';
}

/** 保存区域设置 */
export function setRegion(region: Region): void {
  const config = readConfig();
  config.region = region;
  writeConfig(config);
}

/** 读取 OAuth 凭证 */
export function getOAuth(): OAuthConfig | undefined {
  return readConfig().oauth;
}

/** 保存 OAuth 凭证（同时记录当前区域） */
export function setOAuth(oauth: OAuthConfig): void {
  const config = readConfig();
  config.oauth = { ...oauth, region: getRegion() };
  writeConfig(config);
}

/** 获取凭证所属区域 */
export function getOAuthRegion(): Region | undefined {
  return readConfig().oauth?.region;
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
