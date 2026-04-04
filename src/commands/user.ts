import * as p from '@clack/prompts';
import pc from 'picocolors';
import { getUserPreference } from '../api/resources.js';

async function userPrefCommand(): Promise<void> {
  const s = p.spinner();
  s.start('正在获取用户偏好...');

  try {
    const pref = await getUserPreference();
    s.stop('获取成功');

    console.log('');
    if (pref.timeZone) console.log(`  时区: ${pref.timeZone}`);
    if (pref.dateFormat !== undefined)
      console.log(`  日期格式: ${pref.dateFormat}`);
    if (pref.language) console.log(`  语言: ${pref.language}`);
    if (pref.theme) console.log(`  主题: ${pref.theme}`);

    // 如果所有字段都为空，显示原始数据
    if (!pref.timeZone && pref.dateFormat === undefined && !pref.language && !pref.theme) {
      console.log(pc.dim('  （未获取到偏好信息，API 可能不支持此端点）'));
    }
    console.log('');
    p.outro('用户偏好如上');
  } catch (err) {
    s.stop('获取失败');
    p.outro(pc.red(`获取用户偏好失败: ${(err as Error).message}`));
  }
}

// ─── 注册命令 ────────────────────────────────────────

export function registerUserCommands(cli: {
  command: (name: string, desc: string) => {
    option: (flag: string, desc: string) => {
      action: (fn: (...args: unknown[]) => Promise<void>) => unknown;
    };
    action: (fn: (...args: unknown[]) => Promise<void>) => unknown;
  };
}): void {
  cli.command('user-pref', '查看用户偏好设置').action(userPrefCommand);
}
