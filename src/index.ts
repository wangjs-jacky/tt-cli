import { cac } from 'cac';
import { loginCommand, logoutCommand, whoamiCommand, configCommand } from './commands/auth.js';

const cli = cac('tt');

cli
  .command('login', '登录滴答清单')
  .action(loginCommand);

cli
  .command('logout', '登出')
  .action(logoutCommand);

cli
  .command('whoami', '查看登录状态')
  .action(whoamiCommand);

cli
  .command('config', '查看配置')
  .action(configCommand);

cli.help();
cli.parse();
