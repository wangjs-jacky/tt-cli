/**
 * MCP 工具与 CLI API 函数的等价映射表
 *
 * 用于自动化校验 MCP 工具 ↔ CLI API 函数的输入输出一致性。
 * 每次新增 MCP 工具或 CLI API 函数时，需同步更新此表。
 */

export interface ParityEntry {
  /** MCP 工具名称 */
  mcpTool: string;
  /** CLI API 函数名称 (在 src/api/resources.ts 中) */
  cliApiFn: string;
  /** CLI 命令名称 (tt <command>) */
  cliCommand: string;
  /** API HTTP 方法 */
  httpMethod: string;
  /** API 路径模板 */
  apiPath: string;
  /** 备注 */
  notes?: string;
}

/**
 * 完整的 MCP 工具 → CLI 映射表
 */
export const PARITY_MAP: ParityEntry[] = [
  // ─── 项目 (Project) ────────────────────────────────
  {
    mcpTool: 'list_projects',
    cliApiFn: 'getProjects',
    cliCommand: 'project-list',
    httpMethod: 'GET',
    apiPath: 'project',
  },
  {
    mcpTool: 'get_project_by_id',
    cliApiFn: 'getProject',
    cliCommand: 'project-get <id>',
    httpMethod: 'GET',
    apiPath: 'project/{projectId}',
  },
  {
    mcpTool: 'get_project_with_undone_tasks',
    cliApiFn: 'getProjectData',
    cliCommand: 'project-tasks <id>',
    httpMethod: 'GET',
    apiPath: 'project/{projectId}/data',
  },
  {
    mcpTool: 'create_project',
    cliApiFn: 'createProject',
    cliCommand: 'project-create [name]',
    httpMethod: 'POST',
    apiPath: 'project',
  },
  {
    mcpTool: 'update_project',
    cliApiFn: 'updateProject',
    cliCommand: 'project-update <id>',
    httpMethod: 'POST',
    apiPath: 'project/{projectId}',
  },

  // ─── 任务 (Task) ──────────────────────────────────────
  {
    mcpTool: 'create_task',
    cliApiFn: 'createTask',
    cliCommand: 'task-add [title]',
    httpMethod: 'POST',
    apiPath: 'task',
  },
  {
    mcpTool: 'get_task_in_project',
    cliApiFn: 'getTask',
    cliCommand: 'task-get <projectId> <taskId>',
    httpMethod: 'GET',
    apiPath: 'project/{projectId}/task/{taskId}',
  },
  {
    mcpTool: 'get_task_by_id',
    cliApiFn: 'getTaskById',
    cliCommand: 'task-find <taskId>',
    httpMethod: 'POST',
    apiPath: 'task/filter (客户端过滤)',
    notes: 'CLI 通过 filterTasks + 客户端匹配实现',
  },
  {
    mcpTool: 'update_task',
    cliApiFn: 'updateTask',
    cliCommand: 'task-update <taskId>',
    httpMethod: 'POST',
    apiPath: 'task/{taskId}',
  },
  {
    mcpTool: 'complete_task',
    cliApiFn: 'completeTask',
    cliCommand: 'task-done <projectId> <taskId>',
    httpMethod: 'POST',
    apiPath: 'project/{projectId}/task/{taskId}/complete',
  },
  {
    mcpTool: 'batch_add_tasks',
    cliApiFn: 'batchAddTasks',
    cliCommand: 'task-batch-add [jsonFile]',
    httpMethod: 'POST',
    apiPath: 'task/batch',
  },
  {
    mcpTool: 'batch_update_tasks',
    cliApiFn: 'batchUpdateTasks',
    cliCommand: 'task-batch-update [jsonFile]',
    httpMethod: 'POST',
    apiPath: 'task/batch',
  },
  {
    mcpTool: 'complete_tasks_in_project',
    cliApiFn: 'completeTasksInProject',
    cliCommand: 'task-batch-done <projectId>',
    httpMethod: 'POST',
    apiPath: 'project/{projectId}/task/{taskId}/complete (循环调用)',
    notes: 'CLI 循环调用 completeTask 实现',
  },
  {
    mcpTool: 'filter_tasks',
    cliApiFn: 'filterTasks',
    cliCommand: 'task-list',
    httpMethod: 'POST',
    apiPath: 'task/filter',
  },
  {
    mcpTool: 'list_completed_tasks_by_date',
    cliApiFn: 'getCompletedTasks',
    cliCommand: 'task-completed',
    httpMethod: 'POST',
    apiPath: 'task/completed',
  },
  {
    mcpTool: 'list_undone_tasks_by_date',
    cliApiFn: 'listUndoneTasksByDate',
    cliCommand: 'task-undone --start --end',
    httpMethod: 'POST',
    apiPath: 'task/filter (status:[0])',
    notes: 'CLI 封装 filterTasks 并添加 status:[0]',
  },
  {
    mcpTool: 'list_undone_tasks_by_time_query',
    cliApiFn: 'listUndoneTasksByTimeQuery',
    cliCommand: 'task-undone --query <preset>',
    httpMethod: 'POST',
    apiPath: 'task/filter (计算日期范围 + status:[0])',
    notes: 'CLI 计算本地日期范围后调用 listUndoneTasksByDate',
  },
  {
    mcpTool: 'search_task',
    cliApiFn: 'searchTask',
    cliCommand: 'task-search <keyword>',
    httpMethod: 'POST',
    apiPath: 'task/filter (客户端关键词匹配)',
  },
  {
    mcpTool: 'search',
    cliApiFn: 'searchTask',
    cliCommand: 'task-search <keyword>',
    httpMethod: 'POST',
    apiPath: 'task/filter (客户端关键词匹配)',
    notes: '别名，对应同一个 CLI 函数',
  },
  {
    mcpTool: 'move_task',
    cliApiFn: 'moveTasks',
    cliCommand: 'task-move <taskId>',
    httpMethod: 'POST',
    apiPath: 'task/move',
  },

  // ─── 用户 (User) ───────────────────────────────────────
  {
    mcpTool: 'get_user_preference',
    cliApiFn: 'getUserPreference',
    cliCommand: 'user-pref',
    httpMethod: 'GET',
    apiPath: 'user/info',
  },
];
