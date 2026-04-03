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

  const s = p.spinner();
  s.start('正在验证登录状态...');

  try {
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
