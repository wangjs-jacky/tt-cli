import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { Region, OAuthConfig } from '../types.js';
import { getOAuth, setOAuth, getToken, clearToken, isTokenValid, getRegion, setRegion } from '../utils/config.js';
import { getEndpoints } from '../utils/endpoints.js';
import { loginWithBrowser } from '../api/oauth.js';
import { apiRequest } from '../api/client.js';

const REGION_LABELS: Record<Region, string> = {
  cn: '国内版（滴答清单）',
  global: '国际版（TickTick）',
};

/** 引导用户输入 OAuth 凭证 */
async function promptOAuthCredentials(developerUrl: string): Promise<OAuthConfig | undefined> {
  p.log.info(`请访问 ${developerUrl} 获取凭证`);
  p.log.info('Redirect URI 设置为: http://localhost:3000/callback\n');

  const clientId = await p.text({
    message: '请输入 Client ID',
    validate: (v) => (!v ? 'Client ID 不能为空' : undefined),
  });
  if (p.isCancel(clientId)) return undefined;

  const clientSecret = await p.text({
    message: '请输入 Client Secret',
    validate: (v) => (!v ? 'Client Secret 不能为空' : undefined),
  });
  if (p.isCancel(clientSecret)) return undefined;

  const oauth: OAuthConfig = { clientId, clientSecret };
  setOAuth(oauth);
  p.log.success('凭证已保存');
  return oauth;
}

/** tt login */
export async function loginCommand(): Promise<void> {
  const region = getRegion();
  const endpoints = getEndpoints(region);

  p.intro(pc.bgCyan(pc.black(` 滴答清单 CLI 登录 [${REGION_LABELS[region]}] `)));

  const token = getToken();
  if (token && isTokenValid()) {
    p.outro(pc.green('已登录，无需重复登录。使用 tt logout 先登出。'));
    return;
  }

  let oauth = getOAuth();

  // 检测凭证区域不匹配
  if (oauth?.region && oauth.region !== region) {
    p.log.warn(`当前区域为 ${REGION_LABELS[region]}，但保存的凭证属于 ${REGION_LABELS[oauth.region]}`);
    p.log.warn('凭证与区域不匹配会导致登录失败\n');
    const reconfigure = await p.confirm({
      message: `是否为 ${REGION_LABELS[region]} 重新配置凭证？`,
    });
    if (p.isCancel(reconfigure) || !reconfigure) {
      p.outro('已取消');
      return;
    }
    oauth = undefined;
  }

  // 旧凭证无区域标记，提示确认后再补充
  if (oauth && !oauth.region) {
    p.log.warn('保存的凭证未标记区域，可能与当前区域不匹配');
    const confirmRegion = await p.confirm({
      message: `这些凭证是否用于 ${REGION_LABELS[region]}？`,
    });
    if (p.isCancel(confirmRegion)) {
      p.outro('已取消');
      return;
    }
    if (confirmRegion) {
      setOAuth(oauth);
      p.log.success(`已将凭证标记为 ${REGION_LABELS[region]}`);
    } else {
      oauth = undefined;
    }
  }

  if (!oauth) {
    oauth = await promptOAuthCredentials(endpoints.developerUrl);
    if (!oauth) { p.outro('已取消'); return; }
  }

  const s = p.spinner();
  s.start('正在打开浏览器进行授权...');

  try {
    await loginWithBrowser(oauth);
    s.stop('授权完成');
    p.outro(pc.green('✔ 登录成功！'));
  } catch (err) {
    s.stop('登录失败');
    const msg = (err as Error).message;

    if (msg.includes('invalid_client') || msg.includes('TIMEOUT')) {
      p.log.error(pc.red('登录失败：凭证无效或与区域不匹配'));
      p.log.info(`当前区域：${REGION_LABELS[region]}`);
      p.log.info(`凭证来源：${oauth.region ? REGION_LABELS[oauth.region] : '未知'}\n`);

      const action = await p.select({
        message: '请选择下一步操作',
        options: [
          { value: 'switch', label: `切换到${region === 'cn' ? '国际版' : '国内版'}` },
          { value: 'reconfig', label: '重新输入当前区域的凭证' },
          { value: 'exit', label: '退出' },
        ],
      });

      if (p.isCancel(action) || action === 'exit') {
        p.outro('已退出');
        return;
      }

      if (action === 'switch') {
        const newRegion: Region = region === 'cn' ? 'global' : 'cn';
        setRegion(newRegion);
        p.log.success(`已切换到 ${REGION_LABELS[newRegion]}，请重新运行 tt login`);
        p.outro('区域已切换');
        return;
      }

      if (action === 'reconfig') {
        await promptOAuthCredentials(endpoints.developerUrl);
        p.outro('凭证已更新，请重新运行 tt login');
        return;
      }
    }

    p.outro(pc.red(`✖ ${msg}`));
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
  const region = getRegion();
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
      p.outro(pc.yellow('Token 已失效，请运行 tt login 重新登录'));
      return;
    }

    const hours = Math.floor(expiresIn / 3600000);
    const minutes = Math.floor((expiresIn % 3600000) / 60000);
    p.log.success(pc.green(`已登录 [${REGION_LABELS[region]}]`));
    p.log.info(`Token 有效期: 剩余 ${hours} 小时 ${minutes} 分钟`);
    p.outro('一切正常');
  } catch {
    s.stop('验证失败');
    p.outro(pc.red('Token 已失效，请运行 tt login 重新登录'));
  }
}

/** tt config [--region cn|global] */
export async function configCommand(args?: { region?: Region }): Promise<void> {
  if (args?.region) {
    const oldRegion = getRegion();
    setRegion(args.region);
    clearToken();
    p.intro(pc.bgCyan(pc.black(' 滴答清单 CLI 配置 ')));
    p.log.success(`已切换到 ${REGION_LABELS[args.region]}`);
    if (oldRegion !== args.region) {
      p.log.warn('区域已变更，请重新运行 tt login');
    }
    p.outro('配置已更新');
    return;
  }

  const region = getRegion();
  p.intro(pc.bgCyan(pc.black(' 滴答清单 CLI 配置 ')));
  p.log.info(`区域: ${REGION_LABELS[region]}`);

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

  p.log.info('\n使用 tt config --region cn/global 切换区域');
  p.outro('配置信息如上');
}
