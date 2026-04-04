import { describe, it, expect } from 'vitest';
import { PARITY_MAP } from './parity-map.js';

/**
 * resources.ts 中实际导出的全部 API 函数名
 * （每次新增 API 函数时需同步更新）
 */
const RESOURCES_EXPORTED_FNS = [
  // Project API
  'getProjects',
  'getProject',
  'getProjectData',
  'createProject',
  'updateProject',
  'deleteProject',
  // Task API
  'getTask',
  'createTask',
  'updateTask',
  'completeTask',
  'deleteTask',
  'moveTasks',
  'getCompletedTasks',
  'filterTasks',
  // Batch
  'batchAddTasks',
  'batchUpdateTasks',
  'completeTasksInProject',
  // Query
  'getTaskById',
  'getUserPreference',
  'listUndoneTasksByDate',
  'listUndoneTasksByTimeQuery',
  'searchTask',
] as const;

describe('MCP-CLI 等价校验：API 函数覆盖', () => {
  it('映射表中每个 CLI API 函数名应存在于 resources.ts 导出列表中', () => {
    const exportedSet = new Set(RESOURCES_EXPORTED_FNS);
    const missing: string[] = [];

    for (const entry of PARITY_MAP) {
      if (!exportedSet.has(entry.cliApiFn)) {
        missing.push(`${entry.mcpTool} -> resources.${entry.cliApiFn}`);
      }
    }

    expect(missing, `以下 CLI API 函数在 resources.ts 中不存在:\n${missing.join('\n')}`).toEqual([]);
  });

  it('映射表应覆盖所有已知的 MCP 工具', () => {
    const knownTools = [
      'list_projects',
      'get_project_by_id',
      'get_project_with_undone_tasks',
      'create_project',
      'update_project',
      'create_task',
      'get_task_in_project',
      'get_task_by_id',
      'update_task',
      'complete_task',
      'batch_add_tasks',
      'batch_update_tasks',
      'complete_tasks_in_project',
      'filter_tasks',
      'list_completed_tasks_by_date',
      'list_undone_tasks_by_date',
      'list_undone_tasks_by_time_query',
      'search_task',
      'search',
      'move_task',
      'get_user_preference',
    ];

    const mappedTools = new Set(PARITY_MAP.map((e) => e.mcpTool));
    const unmapped = knownTools.filter((t) => !mappedTools.has(t));

    expect(unmapped, `以下 MCP 工具未在映射表中:\n${unmapped.join('\n')}`).toEqual([]);
  });

  it('非别名条目不应有重复的 CLI API 函数', () => {
    const nonAliasEntries = PARITY_MAP.filter(
      (e) => !e.notes?.includes('别名')
    );
    const fns = nonAliasEntries.map((e) => e.cliApiFn);
    const uniqueFns = new Set(fns);

    expect(uniqueFns.size, `存在重复的 CLI API 函数映射`).toBe(fns.length);
  });

  it('每个映射条目都包含必要字段', () => {
    for (const entry of PARITY_MAP) {
      expect(entry.mcpTool, 'mcpTool 不能为空').toBeTruthy();
      expect(entry.cliApiFn, 'cliApiFn 不能为空').toBeTruthy();
      expect(entry.cliCommand, 'cliCommand 不能为空').toBeTruthy();
      expect(entry.httpMethod, 'httpMethod 不能为空').toBeTruthy();
      expect(entry.apiPath, 'apiPath 不能为空').toBeTruthy();
    }
  });
});
