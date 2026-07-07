import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project, Task } from '../src/types.js';

const api = vi.hoisted(() => ({
  getProjects: vi.fn(),
  getProject: vi.fn(),
  getProjectData: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getTask: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  completeTask: vi.fn(),
  deleteTask: vi.fn(),
  moveTasks: vi.fn(),
  getCompletedTasks: vi.fn(),
  filterTasks: vi.fn(),
  batchAddTasks: vi.fn(),
  batchUpdateTasks: vi.fn(),
  completeTasksInProject: vi.fn(),
  getTaskById: vi.fn(),
  listUndoneTasksByDate: vi.fn(),
  listUndoneTasksByTimeQuery: vi.fn(),
  searchTask: vi.fn(),
}));

vi.mock('../src/api/resources.js', () => api);

vi.mock('@clack/prompts', () => ({
  spinner: () => ({
    start: vi.fn(),
    stop: vi.fn(),
  }),
  outro: vi.fn(),
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
  text: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
}));

import { registerProjectCommands } from '../src/commands/project.js';
import { registerTaskCommands } from '../src/commands/task.js';

type RegisteredCommand = {
  flags: string[];
  action?: (...args: unknown[]) => Promise<void>;
};

function createCliHarness() {
  const commands = new Map<string, RegisteredCommand>();
  const cli = {
    command(name: string) {
      const command: RegisteredCommand = { flags: [] };
      commands.set(name.split(' ')[0], command);
      const chain = {
        option(flag: string) {
          command.flags.push(flag);
          return chain;
        },
        action(fn: (...args: unknown[]) => Promise<void>) {
          command.action = fn;
          return chain;
        },
      };
      return chain;
    },
  };

  return { cli, commands };
}

function captureStdout() {
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args) => {
    lines.push(args.join(' '));
  });
  return {
    read: () => lines.join('\n'),
    restore: () => spy.mockRestore(),
  };
}

describe('JSON 输出模式', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('project-list 支持 --json 并直接输出项目数组', async () => {
    const projects: Project[] = [
      {
        id: 'project-1',
        name: '任务池',
        color: '#f3d23b',
        closed: false,
        viewMode: 'list',
        kind: 'TASK',
      },
    ];
    api.getProjects.mockResolvedValue(projects);
    const { cli, commands } = createCliHarness();

    registerProjectCommands(cli);

    const command = commands.get('project-list');
    expect(command?.flags).toContain('--json');

    const stdout = captureStdout();
    try {
      await command?.action?.({ json: true });
    } finally {
      stdout.restore();
    }

    expect(JSON.parse(stdout.read())).toEqual(projects);
  });

  it('task-completed 支持 --json 并直接输出已完成任务数组', async () => {
    const tasks: Task[] = [
      {
        id: 'task-1',
        projectId: 'project-1',
        title: '完成日报',
        status: 2,
        completedTime: '2026-07-08T01:00:00.000+0000',
      },
    ];
    api.getCompletedTasks.mockResolvedValue(tasks);
    const { cli, commands } = createCliHarness();

    registerTaskCommands(cli);

    const command = commands.get('task-completed');
    expect(command?.flags).toContain('--json');

    const stdout = captureStdout();
    try {
      await command?.action?.({ start: '2026-07-08', end: '2026-07-09', json: true });
    } finally {
      stdout.restore();
    }

    expect(api.getCompletedTasks).toHaveBeenCalledWith({
      startDate: '2026-07-08',
      endDate: '2026-07-09',
    });
    expect(JSON.parse(stdout.read())).toEqual(tasks);
  });
});
