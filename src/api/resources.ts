import { apiRequest } from './client.js';
import type {
  Project,
  ProjectData,
  Task,
  CreateProjectParams,
  UpdateProjectParams,
  CreateTaskParams,
  UpdateTaskParams,
  MoveTaskParams,
  CompletedTasksParams,
  FilterTasksParams,
  BatchTasksParams,
  UserPreference,
  UndoneTasksParams,
} from '../types.js';

// ─── Project API ─────────────────────────────────────

/** 获取所有项目 */
export function getProjects(): Promise<Project[]> {
  return apiRequest<Project[]>('project');
}

/** 获取单个项目 */
export function getProject(projectId: string): Promise<Project> {
  return apiRequest<Project>(`project/${projectId}`);
}

/** 获取项目及任务数据 */
export function getProjectData(projectId: string): Promise<ProjectData> {
  return apiRequest<ProjectData>(`project/${projectId}/data`);
}

/** 创建项目 */
export function createProject(data: CreateProjectParams): Promise<Project> {
  return apiRequest<Project>('project', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 更新项目 */
export function updateProject(
  projectId: string,
  data: UpdateProjectParams
): Promise<Project> {
  return apiRequest<Project>(`project/${projectId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 删除项目 */
export function deleteProject(projectId: string): Promise<void> {
  return apiRequest<void>(`project/${projectId}`, { method: 'DELETE' });
}

// ─── Task API ────────────────────────────────────────

/** 获取任务 */
export function getTask(projectId: string, taskId: string): Promise<Task> {
  return apiRequest<Task>(`project/${projectId}/task/${taskId}`);
}

/** 创建任务 */
export function createTask(data: CreateTaskParams): Promise<Task> {
  return apiRequest<Task>('task', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 更新任务 */
export function updateTask(
  taskId: string,
  data: UpdateTaskParams
): Promise<Task> {
  return apiRequest<Task>(`task/${taskId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 完成任务 */
export function completeTask(
  projectId: string,
  taskId: string
): Promise<void> {
  return apiRequest<void>(`project/${projectId}/task/${taskId}/complete`, {
    method: 'POST',
  });
}

/** 删除任务 */
export function deleteTask(
  projectId: string,
  taskId: string
): Promise<void> {
  return apiRequest<void>(`project/${projectId}/task/${taskId}`, {
    method: 'DELETE',
  });
}

/** 移动任务 */
export function moveTasks(
  moves: MoveTaskParams[]
): Promise<Array<{ id: string; etag: string }>> {
  return apiRequest<Array<{ id: string; etag: string }>>('task/move', {
    method: 'POST',
    body: JSON.stringify(moves),
  });
}

/** 获取已完成任务 */
export function getCompletedTasks(
  params: CompletedTasksParams
): Promise<Task[]> {
  return apiRequest<Task[]>('task/completed', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** 筛选任务 */
export function filterTasks(params: FilterTasksParams): Promise<Task[]> {
  return apiRequest<Task[]>('task/filter', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ─── 批量操作 ──────────────────────────────────────

/** 批量添加任务（API 返回 { id2etag: {...} }，不是 Task[]） */
export async function batchAddTasks(
  tasks: CreateTaskParams[]
): Promise<{ count: number; id2etag?: Record<string, string> }> {
  const res = await apiRequest<Record<string, unknown>>('task/batch', {
    method: 'POST',
    body: JSON.stringify({ add: tasks }),
  });
  return {
    count: tasks.length,
    id2etag: (res?.id2etag ?? res) as Record<string, string> | undefined,
  };
}

/** 批量更新任务 */
export function batchUpdateTasks(
  tasks: UpdateTaskParams[]
): Promise<void> {
  return apiRequest<void>('task/batch', {
    method: 'POST',
    body: JSON.stringify({ update: tasks }),
  });
}

/** 批量完成项目内任务 */
export async function completeTasksInProject(
  projectId: string,
  taskIds: string[]
): Promise<{ completed: string[]; failed: string[] }> {
  const completed: string[] = [];
  const failed: string[] = [];
  for (const taskId of taskIds) {
    try {
      await completeTask(projectId, taskId);
      completed.push(taskId);
    } catch {
      failed.push(taskId);
    }
  }
  return { completed, failed };
}

// ─── 查询 ──────────────────────────────────────────

/** 按 ID 查找任务（无需 projectId，同时搜索未完成和已完成任务） */
export async function getTaskById(taskId: string): Promise<Task> {
  // 并行获取未完成任务和已完成任务，确保覆盖所有任务
  // 注意：filterTasks API 有返回数量限制，改用 listUndoneTasksByDate 获取更完整的数据
  const [undoneTasks, completedTasks] = await Promise.all([
    listUndoneTasksByDate({}),
    getCompletedTasks({}),
  ]);
  const allTasks = [...undoneTasks, ...completedTasks];
  const task = allTasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`任务 ${taskId} 不存在`);
  return task;
}

/** 获取用户偏好 */
export function getUserPreference(): Promise<UserPreference> {
  return apiRequest<UserPreference>('user/info');
}

/** 按日期范围获取未完成任务 */
export function listUndoneTasksByDate(
  params: UndoneTasksParams
): Promise<Task[]> {
  const filterParams: FilterTasksParams = { status: [0] };
  if (params.projectIds) filterParams.projectIds = params.projectIds;
  if (params.startDate) filterParams.startDate = params.startDate;
  if (params.endDate) filterParams.endDate = params.endDate;
  return filterTasks(filterParams);
}

/** 按预设查询获取未完成任务 */
export function listUndoneTasksByTimeQuery(
  query: string
): Promise<Task[]> {
  const now = new Date();
  let startDate: string;
  let endDate: string;

  const toISO = (d: Date) => d.toISOString();

  switch (query) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      startDate = toISO(start);
      endDate = toISO(end);
      break;
    }
    case 'tomorrow': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      startDate = toISO(start);
      endDate = toISO(end);
      break;
    }
    case 'last24hour': {
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      startDate = toISO(start);
      endDate = toISO(now);
      break;
    }
    case 'next24hour': {
      const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      startDate = toISO(now);
      endDate = toISO(end);
      break;
    }
    case 'last7day': {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startDate = toISO(start);
      endDate = toISO(now);
      break;
    }
    case 'next7day': {
      const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      startDate = toISO(now);
      endDate = toISO(end);
      break;
    }
    default:
      throw new Error(
        `不支持的查询预设: ${query}，支持: today, tomorrow, last24hour, next24hour, last7day, next7day`
      );
  }

  return listUndoneTasksByDate({ startDate, endDate });
}

/** 搜索任务（关键词匹配，同时搜索未完成和已完成任务） */
export async function searchTask(keyword: string): Promise<Task[]> {
  // 并行获取未完成任务和已完成任务，确保覆盖所有任务
  // 注意：filterTasks API 有返回数量限制，改用 listUndoneTasksByDate 获取更完整的数据
  const [undoneTasks, completedTasks] = await Promise.all([
    listUndoneTasksByDate({}),
    getCompletedTasks({}),
  ]);

  // 合并并去重（按 id）
  const taskMap = new Map<string, Task>();
  for (const t of [...undoneTasks, ...completedTasks]) {
    taskMap.set(t.id, t);
  }
  const allTasks = Array.from(taskMap.values());

  const lower = keyword.toLowerCase();
  return allTasks.filter(
    (t) =>
      t.title.toLowerCase().includes(lower) ||
      (t.content && t.content.toLowerCase().includes(lower))
  );
}
