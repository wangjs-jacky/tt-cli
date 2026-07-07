import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { Task, CreateProjectParams, UpdateProjectParams } from '../types.js';
import { formatTaskTime } from '../utils/format.js';
import {
  getProjects,
  getProject,
  getProjectData,
  createProject,
  updateProject,
  deleteProject,
} from '../api/resources.js';

// ─── 格式化工具 ──────────────────────────────────────

const PRIORITY_LABEL: Record<number, string> = {
  0: '无',
  1: '低',
  3: '中',
  5: '高',
};

function priorityText(priority?: number): string {
  const v = priority ?? 0;
  switch (v) {
    case 5:
      return pc.red('高');
    case 3:
      return pc.yellow('中');
    case 1:
      return pc.blue('低');
    default:
      return pc.dim('无');
  }
}

function statusIcon(status?: number): string {
  return status === 2 ? pc.green('✓') : '○';
}

function displayTaskList(tasks: Task[]): void {
  if (tasks.length === 0) {
    p.log.info(pc.dim('  （无任务）'));
    return;
  }

  for (const task of tasks) {
    const icon = statusIcon(task.status);
    const title =
      task.title.length > 30
        ? task.title.slice(0, 30) + '…'
        : task.title;
    const time = formatTaskTime(task);
    const timeStr = time ? pc.cyan(time) : '';
    console.log(
      `  ${icon} ${title}  ${timeStr}  ${priorityText(task.priority)}`
    );
    if (task.content) {
      const content =
        task.content.length > 50
          ? task.content.slice(0, 50) + '…'
          : task.content;
      console.log(`    ${pc.dim(content)}`);
    }
  }
}

// ─── 命令实现 ────────────────────────────────────────

async function projectListCommand(options: { json?: boolean } = {}): Promise<void> {
  if (options.json) {
    const projects = await getProjects();
    console.log(JSON.stringify(projects, null, 2));
    return;
  }

  const s = p.spinner();
  s.start('正在获取项目列表...');

  try {
    const projects = await getProjects();
    s.stop(`找到 ${projects.length} 个项目`);

    if (projects.length === 0) {
      p.outro(pc.yellow('没有找到任何项目'));
      return;
    }

    console.log('');
    for (const project of projects) {
      const status = project.closed ? pc.dim('已关闭') : pc.green('活跃');
      console.log(
        `  ${pc.bold(project.name)}  ${pc.dim(project.id)}`
      );
      console.log(
        `    类型: ${project.kind || '-'}  视图: ${project.viewMode || '-'}  ${status}`
      );
    }
    console.log('');
    p.outro(`共 ${projects.length} 个项目`);
  } catch (err) {
    s.stop('获取失败');
    p.outro(pc.red((err as Error).message));
  }
}

async function projectGetCommand(id: string): Promise<void> {
  const s = p.spinner();
  s.start('正在获取项目详情...');

  try {
    const project = await getProject(id);
    s.stop('获取成功');

    console.log('');
    console.log(`  ${pc.bold('名称')}: ${project.name}`);
    console.log(`  ${pc.bold('ID')}:   ${project.id}`);
    console.log(`  ${pc.bold('颜色')}: ${project.color || '-'}`);
    console.log(`  ${pc.bold('类型')}: ${project.kind || '-'}`);
    console.log(`  ${pc.bold('视图')}: ${project.viewMode || '-'}`);
    console.log(
      `  ${pc.bold('状态')}: ${project.closed ? '已关闭' : '活跃'}`
    );
    if (project.groupId)
      console.log(`  ${pc.bold('分组')}: ${project.groupId}`);
    if (project.permission)
      console.log(`  ${pc.bold('权限')}: ${project.permission}`);
    console.log('');
  } catch (err) {
    s.stop('获取失败');
    p.outro(pc.red((err as Error).message));
  }
}

async function projectTasksCommand(
  id: string,
  options: { json?: boolean }
): Promise<void> {
  try {
    const data = await getProjectData(id);

    if (options.json) {
      console.log(JSON.stringify(data.tasks, null, 2));
      return;
    }

    const s = p.spinner();
    s.start('正在获取项目任务...');
    s.stop(
      `项目「${data.project.name}」下有 ${data.tasks.length} 个任务`
    );

    if (data.tasks.length === 0) {
      p.outro(pc.yellow('该项目下没有任务'));
      return;
    }

    console.log('');
    displayTaskList(data.tasks);
    console.log('');
    p.outro(`共 ${data.tasks.length} 个任务`);
  } catch (err) {
    s.stop('获取失败');
    p.outro(pc.red((err as Error).message));
  }
}

async function projectCreateCommand(
  name: string | undefined,
  options: {
    color?: string;
    viewMode?: string;
    kind?: string;
  }
): Promise<void> {
  if (!name) {
    const input = await p.text({ message: '请输入项目名称' });
    if (p.isCancel(input)) {
      p.outro('已取消');
      return;
    }
    name = input;
  }

  const params: CreateProjectParams = { name };
  if (options.color) params.color = options.color;
  if (options.viewMode)
    params.viewMode = options.viewMode as CreateProjectParams['viewMode'];
  if (options.kind)
    params.kind = options.kind as CreateProjectParams['kind'];

  const s = p.spinner();
  s.start('正在创建项目...');

  try {
    const project = await createProject(params);
    s.stop('创建成功');
    p.outro(
      pc.green(`项目「${project.name}」已创建 (ID: ${project.id})`)
    );
  } catch (err) {
    s.stop('创建失败');
    p.outro(pc.red((err as Error).message));
  }
}

async function projectUpdateCommand(
  id: string,
  options: {
    name?: string;
    color?: string;
    viewMode?: string;
    kind?: string;
  }
): Promise<void> {
  const params: UpdateProjectParams = {};
  if (options.name) params.name = options.name;
  if (options.color) params.color = options.color;
  if (options.viewMode)
    params.viewMode = options.viewMode as UpdateProjectParams['viewMode'];
  if (options.kind)
    params.kind = options.kind as UpdateProjectParams['kind'];

  if (Object.keys(params).length === 0) {
    p.outro(
      pc.yellow(
        '未指定任何更新内容，使用 --name / --color / --view-mode / --kind 选项'
      )
    );
    return;
  }

  const s = p.spinner();
  s.start('正在更新项目...');

  try {
    const project = await updateProject(id, params);
    s.stop('更新成功');
    p.outro(pc.green(`项目「${project.name}」已更新`));
  } catch (err) {
    s.stop('更新失败');
    p.outro(pc.red((err as Error).message));
  }
}

async function projectDeleteCommand(id: string): Promise<void> {
  const confirmed = await p.confirm({
    message: `确认删除项目 ${pc.red(id)}？此操作不可撤销`,
  });
  if (p.isCancel(confirmed) || !confirmed) {
    p.outro('已取消');
    return;
  }

  const s = p.spinner();
  s.start('正在删除项目...');

  try {
    await deleteProject(id);
    s.stop('删除成功');
    p.outro(pc.green('项目已删除'));
  } catch (err) {
    s.stop('删除失败');
    p.outro(pc.red((err as Error).message));
  }
}

// ─── 注册命令 ────────────────────────────────────────

export function registerProjectCommands(cli: {
  command: (name: string, desc: string) => {
    option: (flag: string, desc: string) => {
      action: (fn: (...args: unknown[]) => Promise<void>) => unknown;
    };
    action: (fn: (...args: unknown[]) => Promise<void>) => unknown;
  };
}): void {
  cli
    .command('project-list', '列出所有项目')
    .option('--json', '输出 JSON 格式')
    .action(projectListCommand);

  cli
    .command('project-get <id>', '获取项目详情')
    .action(projectGetCommand);

  cli
    .command('project-tasks <id>', '获取项目下的任务')
    .option('--json', '输出 JSON 格式')
    .action(projectTasksCommand);

  cli
    .command('project-create [name]', '创建项目')
    .option('--color <color>', '项目颜色，如 #F18181')
    .option('--view-mode <mode>', '视图模式: list / kanban / timeline')
    .option('--kind <kind>', '项目类型: TASK / NOTE')
    .action(projectCreateCommand);

  cli
    .command('project-update <id>', '更新项目')
    .option('--name <name>', '项目名称')
    .option('--color <color>', '项目颜色')
    .option('--view-mode <mode>', '视图模式')
    .option('--kind <kind>', '项目类型')
    .action(projectUpdateCommand);

  cli
    .command('project-delete <id>', '删除项目')
    .action(projectDeleteCommand);
}
