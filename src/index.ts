import { cac } from 'cac';
import type { Region } from './types.js';
import { loginCommand, logoutCommand, whoamiCommand, configCommand } from './commands/auth.js';

const cli = cac('tt');

cli.command('login', '登录滴答清单').action(loginCommand);
cli.command('logout', '登出').action(logoutCommand);
cli.command('whoami', '查看登录状态').action(whoamiCommand);
cli
  .command('config', '查看/设置配置')
  .option('--region <region>', '切换区域: cn (国内版) / global (国际版)')
  .action(async (options: { region?: string }) => {
    if (options.region && options.region !== 'cn' && options.region !== 'global') {
      console.error(`无效的区域: ${options.region}，请使用 cn 或 global`);
      process.exit(1);
    }
    await configCommand({ region: options.region as Region | undefined });
  });

cli.help();
cli.parse();
