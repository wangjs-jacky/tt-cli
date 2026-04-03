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
