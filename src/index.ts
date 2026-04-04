import { cac } from 'cac';
import type { Region } from './types.js';
import { loginCommand, logoutCommand, whoamiCommand, configCommand } from './commands/auth.js';
import { registerProjectCommands } from './commands/project.js';
import { registerTaskCommands } from './commands/task.js';
import { registerUserCommands } from './commands/user.js';

// cac v7 不支持空格子命令（如 'task list'），需要将 argv 预处理为连字符格式
const SUBCOMMAND_GROUPS = ['task', 'project', 'user'];
const argv = process.argv.slice(2);
if (
  argv.length >= 2 &&
  SUBCOMMAND_GROUPS.includes(argv[0]) &&
  !argv[1].startsWith('-')
) {
  argv.splice(0, 2, `${argv[0]}-${argv[1]}`);
}

const cli = cac('tt');

// 认证命令
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

// 项目命令
registerProjectCommands(cli);

// 任务命令
registerTaskCommands(cli);

// 用户命令
registerUserCommands(cli);

cli.help();
cli.parse(['', '', ...argv]);
