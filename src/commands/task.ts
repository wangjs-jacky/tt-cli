import * as p from '@clack/prompts';
import pc from 'picocolors';
import type {
  Project,
  Task,
  CreateTaskParams,
  UpdateTaskParams,
} from '../types.js';
import { formatTaskTime, normalizeTickTickDate } from '../utils/format.js';
import {
  getProjects,
  getTask,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
  moveTasks,
  getCompletedTasks,
  filterTasks,
  batchAddTasks,
  batchUpdateTasks,
  completeTasksInProject,
  getTaskById,
  listUndoneTasksByDate,
  listUndoneTasksByTimeQuery,
  searchTask,
} from '../api/resources.js';

// ─── 格式化工具 ──────────────────────────────────────

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

function displayTaskDetail(task: Task): void {
  console.log('');
  console.log(`  ${pc.bold(task.title)}`);
  console.log(`  ${pc.dim('─'.repeat(40))}`);
  console.log(`  ID:     ${task.id}`);
  console.log(`  项目:   ${task.projectId}`);
  console.log(`  优先级: ${priorityText(task.priority)}`);
  console.log(`  状态:   ${task.status === 2 ? pc.green('已完成') : '待办'}`);
  if (task.isAllDay !== undefined)
    console.log(`  全天:   ${task.isAllDay ? '是' : '否'}`);
  if (task.startDate)
    console.log(`  开始:   ${task.startDate}`);
  if (task.dueDate)
    console.log(`  截止:   ${task.dueDate}`);
  if (task.timeZone)
    console.log(`  时区:   ${task.timeZone}`);
  if (task.kind)
    console.log(`  类型:   ${task.kind}`);
  if (task.content) {
    console.log(`  内容:`);
    console.log(`    ${task.content}`);
  }
  if (task.tags && task.tags.length > 0) {
    console.log(`  标签:   ${task.tags.join(', ')}`);
  }
  if (task.items && task.items.length > 0) {
    console.log(`  子任务:`);
    for (const item of task.items) {
      const icon = item.status === 1 ? pc.green('✓') : '○';
      console.log(`    ${icon} ${item.title}`);
    }
  }
  console.log('');
}

function displayTaskTable(tasks: Task[]): void {
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
      `  ${icon} ${title}  ${timeStr}  ${pc.dim(task.id)}  ${priorityText(task.priority)}  ${pc.dim(task.projectId)}`
    );
  }
}

/** 交互式选择项目 */
async function selectProject(): Promise<string | undefined> {
  const s = p.spinner();
  s.start('正在获取项目列表...');
  const projects = await getProjects();
  s.stop('');

  if (projects.length === 0) {
    p.log.error('没有可用的项目，请先创建项目');
    return undefined;
  }

  const selected = await p.select({
    message: '选择项目',
    options: projects.map((proj: Project) => ({
      value: proj.id,
      label: proj.name,
    })),
  });

  if (p.isCancel(selected)) return undefined;
  return selected as string;
}

/** 解析优先级字符串 */
function parsePriority(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = parseInt(value, 10);
  if ([0, 1, 3, 5].includes(n)) return n;
  return undefined;
}

// ─── 命令实现 ────────────────────────────────────────

async function taskAddCommand(
  title: string | undefined,
  options: {
    project?: string;
    content?: string;
    priority?: string;
    startDate?: string;
    dueDate?: string;
    allDay?: boolean;
  }
): Promise<void> {
  if (!title) {
    const input = await p.text({ message: '请输入任务标题' });
    if (p.isCancel(input)) {
      p.outro('已取消');
      return;
    }
    title = input;
  }

  let projectId = options.project;
  if (!projectId) {
    projectId = await selectProject();
    if (!projectId) {
      p.outro('已取消');
      return;
    }
  }

  const params: CreateTaskParams = { title, projectId };
  if (options.content) params.content = options.content;
  if (options.priority) {
    const priority = parsePriority(options.priority);
    if (priority !== undefined) params.priority = priority;
  }
  if (options.startDate) params.startDate = normalizeTickTickDate(options.startDate);
  if (options.dueDate) params.dueDate = normalizeTickTickDate(options.dueDate);
  if (options.allDay !== undefined) params.isAllDay = options.allDay;

  const s = p.spinner();
  s.start('正在创建任务...');

  try {
    const task = await createTask(params);
    s.stop('创建成功');
    p.outro(pc.green(`任务「${task.title}」已创建 (ID: ${task.id})`));
  } catch (err) {
    s.stop('创建失败');
    p.outro(pc.red((err as Error).message));
  }
}

async function taskGetCommand(
  projectId: string,
  taskId: string
): Promise<void> {
  const s = p.spinner();
  s.start('正在获取任务...');

  try {
    const task = await getTask(projectId, taskId);
    s.stop('获取成功');
    displayTaskDetail(task);
    p.outro('任务详情如上');
  } catch (err) {
    s.stop('获取失败');
    const msg = (err as Error).message;
    p.outro(
      pc.red(`获取任务失败 (projectId: ${projectId}, taskId: ${taskId})\n`) +
        pc.red(`${msg}\n`) +
        pc.yellow('排查建议: 运行 tt task-find <taskId> 或 tt task-search <关键词> 验证任务')
    );
  }
}

async function taskDoneCommand(
  projectId: string,
  taskId: string
): Promise<void> {
  const s = p.spinner();
  s.start('正在完成任务...');

  try {
    await completeTask(projectId, taskId);
    s.stop('完成成功');
    p.outro(pc.green('任务已完成'));
  } catch (err) {
    s.stop('操作失败');
    const msg = (err as Error).message;
    p.outro(
      pc.red(`任务完成失败 (projectId: ${projectId}, taskId: ${taskId})\n`) +
        pc.red(`${msg}\n`) +
        pc.yellow('排查建议: 运行 tt task-search 检查任务是否存在或已完成')
    );
  }
}

async function taskDeleteCommand(
  projectId: string,
  taskId: string
): Promise<void> {
  const confirmed = await p.confirm({
    message: `确认删除任务 ${pc.red(taskId)}？`,
  });
  if (p.isCancel(confirmed) || !confirmed) {
    p.outro('已取消');
    return;
  }

  const s = p.spinner();
  s.start('正在删除任务...');

  try {
    await deleteTask(projectId, taskId);
    s.stop('删除成功');
    p.outro(pc.green('任务已删除'));
  } catch (err) {
    s.stop('删除失败');
    const msg = (err as Error).message;
    p.outro(
      pc.red(`删除任务失败 (projectId: ${projectId}, taskId: ${taskId})\n`) +
        pc.red(`${msg}\n`) +
        pc.yellow('排查建议: 运行 tt task-get <projectId> <taskId> 验证任务是否存在')
    );
  }
}

async function taskUpdateCommand(
  taskId: string,
  options: {
    project?: string;
    title?: string;
    content?: string;
    priority?: string;
    startDate?: string;
    dueDate?: string;
  }
): Promise<void> {
  if (!options.project) {
    p.outro(pc.red('请使用 -p/--project 指定项目 ID'));
    return;
  }

  const params: UpdateTaskParams = {
    id: taskId,
    projectId: options.project,
  };
  if (options.title) params.title = options.title;
  if (options.content) params.content = options.content;
  if (options.priority) {
    const priority = parsePriority(options.priority);
    if (priority !== undefined) params.priority = priority;
  }
  if (options.startDate) params.startDate = normalizeTickTickDate(options.startDate);
  if (options.dueDate) params.dueDate = normalizeTickTickDate(options.dueDate);

  const s = p.spinner();
  s.start('正在更新任务...');

  try {
    const task = await updateTask(taskId, params);
    s.stop('更新成功');
    p.outro(pc.green(`任务「${task.title}」已更新`));
  } catch (err) {
    s.stop('更新失败');
    const msg = (err as Error).message;
    p.outro(
      pc.red(`更新任务失败 (taskId: ${taskId}, projectId: ${options.project})\n`) +
        pc.red(`${msg}\n`) +
        pc.yellow('排查建议: 运行 tt task-find <taskId> 验证任务是否存在')
    );
  }
}

async function taskMoveCommand(
  taskId: string,
  options: {
    from?: string;
    to?: string;
  }
): Promise<void> {
  if (!options.from || !options.to) {
    p.outro(
      pc.red('请使用 -f/--from 和 -t/--to 指定源和目标项目 ID')
    );
    return;
  }

  const s = p.spinner();
  s.start('正在移动任务...');

  try {
    const result = await moveTasks([
      {
        fromProjectId: options.from,
        toProjectId: options.to,
        taskId,
      },
    ]);
    s.stop('移动成功');
    p.outro(
      pc.green(
        `任务已移动 (etag: ${result[0]?.etag ?? '-'})`
      )
    );
  } catch (err) {
    s.stop('移动失败');
    const msg = (err as Error).message;
    p.outro(
      pc.red(`移动任务失败 (taskId: ${taskId}, from: ${options.from}, to: ${options.to})\n`) +
        pc.red(`${msg}\n`) +
        pc.yellow('排查建议: 运行 tt project-list 验证项目 ID 是否有效')
    );
  }
}

async function taskCompletedCommand(options: {
  project?: string;
  start?: string;
  end?: string;
  json?: boolean;
}): Promise<void> {
  const params: {
    projectIds?: string[];
    startDate?: string;
    endDate?: string;
  } = {};

  if (options.project) params.projectIds = [options.project];
  if (options.start) params.startDate = options.start;
  if (options.end) params.endDate = options.end;

  if (options.json) {
    const tasks = await getCompletedTasks(params);
    console.log(JSON.stringify(tasks, null, 2));
    return;
  }

  const s = p.spinner();
  s.start('正在获取已完成任务...');

  try {
    const tasks = await getCompletedTasks(params);
    s.stop(`找到 ${tasks.length} 个已完成任务`);

    if (tasks.length === 0) {
      p.outro(pc.yellow('没有找到已完成的任务'));
      return;
    }

    console.log('');
    displayTaskTable(tasks);
    console.log('');
    p.outro(`共 ${tasks.length} 个已完成任务`);
  } catch (err) {
    s.stop('获取失败');
    p.outro(pc.red((err as Error).message));
  }
}

async function taskListCommand(options: {
  project?: string;
  start?: string;
  end?: string;
  status?: string;
  priority?: string;
  tag?: string;
  json?: boolean;
}): Promise<void> {
  const params: {
    projectIds?: string[];
    startDate?: string;
    endDate?: string;
    status?: number[];
    priority?: number[];
    tag?: string[];
  } = {};

  if (options.project) params.projectIds = [options.project];
  if (options.start) params.startDate = options.start;
  if (options.end) params.endDate = options.end;
  if (options.status) {
    params.status = options.status.split(',').map((s) => parseInt(s, 10));
  }
  if (options.priority) {
    params.priority = options.priority
      .split(',')
      .map((s) => parseInt(s, 10));
  }
  if (options.tag) {
    params.tag = options.tag.split(',');
  }

  try {
    const tasks = await filterTasks(params);

    if (options.json) {
      console.log(JSON.stringify(tasks, null, 2));
      return;
    }

    const s = p.spinner();
    s.start('正在筛选任务...');
    s.stop(`找到 ${tasks.length} 个任务`);

    if (tasks.length === 0) {
      p.outro(pc.yellow('没有找到匹配的任务'));
      return;
    }

    console.log('');
    displayTaskTable(tasks);
    console.log('');
    p.outro(`共 ${tasks.length} 个任务`);
  } catch (err) {
    p.outro(pc.red((err as Error).message));
  }
}

// ─── 批量 / 高级命令 ────────────────────────────────

async function taskBatchAddCommand(
  jsonFile: string | undefined,
  options: { stdin?: boolean }
): Promise<void> {
  let jsonStr: string;

  if (options.stdin || !jsonFile) {
    // 从 stdin 读取
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }
    jsonStr = Buffer.concat(chunks).toString('utf-8');
  } else {
    // 从文件读取
    const fs = await import('fs/promises');
    jsonStr = await fs.readFile(jsonFile, 'utf-8');
  }

  let tasks: CreateTaskParams[];
  try {
    tasks = JSON.parse(jsonStr);
    if (!Array.isArray(tasks)) {
      p.outro(pc.red('JSON 必须是任务数组'));
      return;
    }
  } catch {
    p.outro(pc.red('JSON 解析失败，请检查格式'));
    return;
  }

  // 规范化日期格式
  for (const task of tasks) {
    if (task.startDate) task.startDate = normalizeTickTickDate(task.startDate);
    if (task.dueDate) task.dueDate = normalizeTickTickDate(task.dueDate);
  }

  const s = p.spinner();
  s.start(`正在批量创建 ${tasks.length} 个任务...`);

  try {
    const result = await batchAddTasks(tasks);
    s.stop(`成功创建 ${result.count} 个任务`);
    console.log('');
    for (const task of tasks) {
      console.log(`  ${pc.green('✓')} ${task.title}`);
    }
    console.log('');
    p.outro(`共创建 ${result.count} 个任务`);
  } catch (err) {
    s.stop('批量创建失败');
    p.outro(pc.red((err as Error).message));
  }
}

async function taskBatchUpdateCommand(
  jsonFile: string | undefined,
  options: { stdin?: boolean }
): Promise<void> {
  let jsonStr: string;

  if (options.stdin || !jsonFile) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk as Buffer);
    }
    jsonStr = Buffer.concat(chunks).toString('utf-8');
  } else {
    const fs = await import('fs/promises');
    jsonStr = await fs.readFile(jsonFile, 'utf-8');
  }

  let tasks: UpdateTaskParams[];
  try {
    tasks = JSON.parse(jsonStr);
    if (!Array.isArray(tasks)) {
      p.outro(pc.red('JSON 必须是任务数组'));
      return;
    }
  } catch {
    p.outro(pc.red('JSON 解析失败，请检查格式'));
    return;
  }

  // 规范化日期格式
  for (const task of tasks) {
    if (task.startDate) task.startDate = normalizeTickTickDate(task.startDate);
    if (task.dueDate) task.dueDate = normalizeTickTickDate(task.dueDate);
  }

  const s = p.spinner();
  s.start(`正在批量更新 ${tasks.length} 个任务...`);

  try {
    await batchUpdateTasks(tasks);
    s.stop(`成功更新 ${tasks.length} 个任务`);
    p.outro(pc.green(`已更新 ${tasks.length} 个任务`));
  } catch (err) {
    s.stop('批量更新失败');
    p.outro(pc.red((err as Error).message));
  }
}

async function taskBatchDoneCommand(
  projectId: string,
  options: {
    taskIds?: string;
    all?: boolean;
    force?: boolean;
  }
): Promise<void> {
  let ids: string[];

  if (options.all) {
    // 获取项目下所有未完成任务
    const s = p.spinner();
    s.start('正在获取项目任务...');
    const tasks = await filterTasks({ projectIds: [projectId], status: [0] });
    s.stop(`找到 ${tasks.length} 个未完成任务`);
    ids = tasks.map((t) => t.id);
  } else if (options.taskIds) {
    ids = options.taskIds.split(',').map((s) => s.trim());
  } else {
    p.outro(pc.red('请使用 --task-ids <id1,id2,...> 或 --all'));
    return;
  }

  if (ids.length === 0) {
    p.outro(pc.yellow('没有需要完成的任务'));
    return;
  }

  // 确认
  if (!options.force) {
    console.log('');
    console.log(`  将完成 ${ids.length} 个任务:`);
    for (const id of ids) {
      console.log(`  ${pc.dim(id)}`);
    }
    console.log('');
    const confirmed = await p.confirm({
      message: `确认完成这 ${ids.length} 个任务？`,
    });
    if (p.isCancel(confirmed) || !confirmed) {
      p.outro('已取消');
      return;
    }
  }

  const s = p.spinner();
  s.start(`正在完成 ${ids.length} 个任务...`);

  try {
    const result = await completeTasksInProject(projectId, ids);
    s.stop('操作完成');
    p.outro(
      pc.green(`成功 ${result.completed.length} 个`) +
        (result.failed.length > 0
          ? pc.red(`，失败 ${result.failed.length} 个`)
          : '')
    );
  } catch (err) {
    s.stop('操作失败');
    p.outro(pc.red((err as Error).message));
  }
}

async function taskFindCommand(taskId: string): Promise<void> {
  const s = p.spinner();
  s.start('正在查找任务...');

  try {
    const task = await getTaskById(taskId);
    s.stop('查找成功');
    displayTaskDetail(task);
    p.outro('任务详情如上');
  } catch (err) {
    s.stop('查找失败');
    p.outro(pc.red((err as Error).message));
  }
}

async function taskUndoneCommand(options: {
  start?: string;
  end?: string;
  query?: string;
  project?: string;
  json?: boolean;
}): Promise<void> {
  let tasks: Task[];

  try {
    if (options.query) {
      // 预设查询
      tasks = await listUndoneTasksByTimeQuery(options.query);
    } else {
      // 自定义日期范围
      const params: { startDate?: string; endDate?: string; projectIds?: string[] } = {};
      if (options.start) params.startDate = options.start;
      if (options.end) params.endDate = options.end;
      if (options.project) params.projectIds = [options.project];
      tasks = await listUndoneTasksByDate(params);
    }

    if (options.json) {
      console.log(JSON.stringify(tasks, null, 2));
      return;
    }

    const s = p.spinner();
    s.start('正在获取未完成任务...');
    s.stop(`找到 ${tasks.length} 个未完成任务`);

    if (tasks.length === 0) {
      p.outro(pc.yellow('没有找到未完成任务'));
      return;
    }

    console.log('');
    displayTaskTable(tasks);
    console.log('');
    p.outro(`共 ${tasks.length} 个未完成任务`);
  } catch (err) {
    s.stop('获取失败');
    p.outro(pc.red((err as Error).message));
  }
}

async function taskSearchCommand(
  keyword: string,
  options: { json?: boolean } = {}
): Promise<void> {
  // JSON 模式：不渲染 spinner，直接输出结构化数据，避免污染管道
  if (options.json) {
    const tasks = await searchTask(keyword);
    console.log(JSON.stringify(tasks, null, 2));
    return;
  }

  const s = p.spinner();
  s.start(`正在搜索 "${keyword}"...`);

  try {
    const tasks = await searchTask(keyword);
    s.stop(`找到 ${tasks.length} 个匹配任务`);

    if (tasks.length === 0) {
      p.outro(pc.yellow(`没有找到包含 "${keyword}" 的任务`));
      return;
    }

    console.log('');
    for (const task of tasks) {
      const icon = statusIcon(task.status);
      // 高亮关键词
      const title = task.title.replace(
        new RegExp(keyword, 'gi'),
        (m) => pc.bold(pc.yellow(m))
      );
      console.log(`  ${icon} ${title}  ${pc.dim(task.id)}  ${pc.dim(task.projectId)}`);
    }
    console.log('');
    p.outro(`共 ${tasks.length} 个匹配`);
  } catch (err) {
    s.stop('搜索失败');
    p.outro(pc.red((err as Error).message));
  }
}

// ─── 注册命令 ────────────────────────────────────────

export function registerTaskCommands(cli: {
  command: (name: string, desc: string) => {
    option: (flag: string, desc: string) => {
      action: (fn: (...args: unknown[]) => Promise<void>) => unknown;
    };
    action: (fn: (...args: unknown[]) => Promise<void>) => unknown;
  };
}): void {
  cli
    .command('task-add [title]', '创建任务')
    .option('-p, --project <id>', '项目 ID')
    .option('--content <text>', '任务内容')
    .option('--priority <n>', '优先级: 0(无) / 1(低) / 3(中) / 5(高)')
    .option('--start-date <date>', '开始日期')
    .option('--due-date <date>', '截止日期')
    .option('--all-day', '全天任务')
    .action(taskAddCommand);

  cli
    .command('task-get <projectId> <taskId>', '获取任务详情')
    .action(taskGetCommand);

  cli
    .command('task-done <projectId> <taskId>', '完成任务')
    .action(taskDoneCommand);

  cli
    .command('task-delete <projectId> <taskId>', '删除任务')
    .action(taskDeleteCommand);

  cli
    .command('task-update <taskId>', '更新任务')
    .option('-p, --project <id>', '项目 ID（必填）')
    .option('--title <title>', '任务标题')
    .option('--content <text>', '任务内容')
    .option('--priority <n>', '优先级')
    .option('--start-date <date>', '开始日期')
    .option('--due-date <date>', '截止日期')
    .action(taskUpdateCommand);

  cli
    .command('task-move <taskId>', '移动任务到其他项目')
    .option('-f, --from <id>', '源项目 ID')
    .option('-t, --to <id>', '目标项目 ID')
    .action(taskMoveCommand);

  cli
    .command('task-completed', '查看已完成任务')
    .option('-p, --project <id>', '按项目筛选')
    .option('--start <date>', '开始日期')
    .option('--end <date>', '结束日期')
    .option('--json', '输出 JSON 格式')
    .action(taskCompletedCommand);

  cli
    .command('task-list', '筛选任务')
    .option('-p, --project <id>', '按项目筛选')
    .option('--start <date>', '开始日期')
    .option('--end <date>', '结束日期')
    .option('--status <n>', '状态，逗号分隔: 0(待办),2(已完成)')
    .option('--priority <n>', '优先级，逗号分隔: 0,1,3,5')
    .option('--tag <tag>', '标签，逗号分隔')
    .option('--json', '输出 JSON 格式')
    .action(taskListCommand);

  // ─── 批量 / 高级命令 ────────────────────────────

  cli
    .command('task-batch-add [jsonFile]', '批量创建任务')
    .option('--stdin', '从标准输入读取 JSON')
    .action(taskBatchAddCommand);

  cli
    .command('task-batch-update [jsonFile]', '批量更新任务')
    .option('--stdin', '从标准输入读取 JSON')
    .action(taskBatchUpdateCommand);

  cli
    .command('task-batch-done <projectId>', '批量完成任务')
    .option('--task-ids <ids>', '任务 ID 列表，逗号分隔')
    .option('--all', '完成项目下所有未完成任务')
    .option('--force', '跳过确认')
    .action(taskBatchDoneCommand);

  cli
    .command('task-find <taskId>', '按 ID 查找任务（无需项目 ID）')
    .action(taskFindCommand);

  cli
    .command('task-undone', '查看未完成任务')
    .option('--start <date>', '开始日期')
    .option('--end <date>', '结束日期')
    .option('--query <preset>', '预设查询: today|tomorrow|last24hour|next24hour|last7day|next7day')
    .option('-p, --project <id>', '按项目筛选')
    .option('--json', '输出 JSON 格式')
    .action(taskUndoneCommand);

  cli
    .command('task-search <keyword>', '搜索任务')
    .option('--json', '输出 JSON 格式')
    .action(taskSearchCommand);
}
