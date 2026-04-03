import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

// 测试用临时目录，避免污染真实配置
const TEST_DIR = path.join(os.tmpdir(), 'tt-cli-test-' + process.pid);

let config: typeof import('../src/utils/config.js');

beforeEach(async () => {
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.env.TT_CLI_CONFIG_DIR = TEST_DIR;
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
      expiresAt: Date.now() + 600000,
    });
    expect(config.isTokenValid()).toBe(true);
  });

  it('即将过期（5 分钟内）应判定为无效', () => {
    config.setToken({
      accessToken: 'access',
      refreshToken: 'refresh',
      expiresAt: Date.now() + 240000,
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
