/** OAuth2 客户端凭证 */
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  /** 凭证所属区域 */
  region?: Region;
}

/** 持久化的 Token 数据 */
export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

/** API 区域 */
export type Region = 'cn' | 'global';

/** 区域对应的接口地址 */
export interface RegionEndpoints {
  authUrl: string;
  tokenUrl: string;
  apiBase: string;
  developerUrl: string;
}

/** 配置文件结构 (~/.tt-cli/config.json) */
export interface AppConfig {
  oauth?: OAuthConfig;
  token?: TokenData;
  region?: Region;
}

/** TickTick OAuth2 token 响应 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

// ─── API 数据类型 ────────────────────────────────────

/** 项目 */
export interface Project {
  id: string;
  name: string;
  color: string;
  sortOrder?: number;
  closed?: boolean;
  groupId?: string;
  viewMode?: 'list' | 'kanban' | 'timeline';
  permission?: 'read' | 'write' | 'comment';
  kind?: 'TASK' | 'NOTE';
}

/** 看板列 */
export interface Column {
  id: string;
  projectId: string;
  name: string;
  sortOrder: number;
}

/** 项目及数据 */
export interface ProjectData {
  project: Project;
  tasks: Task[];
  columns: Column[];
}

/** 清单子项 */
export interface ChecklistItem {
  id?: string;
  title: string;
  status?: number;
  completedTime?: string;
  isAllDay?: boolean;
  sortOrder?: number;
  startDate?: string;
  timeZone?: string;
}

/** 任务 */
export interface Task {
  id: string;
  projectId: string;
  title: string;
  isAllDay?: boolean;
  completedTime?: string;
  content?: string;
  desc?: string;
  dueDate?: string;
  items?: ChecklistItem[];
  priority?: number;
  reminders?: string[];
  repeatFlag?: string;
  sortOrder?: number;
  startDate?: string;
  status?: number;
  timeZone?: string;
  kind?: 'TEXT' | 'NOTE' | 'CHECKLIST';
  tags?: string[];
  etag?: string;
  /** 看板列 ID */
  columnId?: string;
  /** 父任务 ID */
  parentId?: string;
  /** 子任务 ID 列表 */
  childIds?: string[];
  /** 看板列名称 */
  columnName?: string;
  /** 任务指派人 */
  assignor?: string;
}

// ─── API 请求参数类型 ────────────────────────────────

/** 创建项目参数 */
export interface CreateProjectParams {
  name: string;
  color?: string;
  sortOrder?: number;
  viewMode?: 'list' | 'kanban' | 'timeline';
  kind?: 'TASK' | 'NOTE';
}

/** 更新项目参数 */
export interface UpdateProjectParams {
  name?: string;
  color?: string;
  sortOrder?: number;
  viewMode?: 'list' | 'kanban' | 'timeline';
  kind?: 'TASK' | 'NOTE';
}

/** 创建任务参数 */
export interface CreateTaskParams {
  title: string;
  projectId: string;
  content?: string;
  desc?: string;
  isAllDay?: boolean;
  startDate?: string;
  dueDate?: string;
  timeZone?: string;
  reminders?: string[];
  repeatFlag?: string;
  priority?: number;
  sortOrder?: number;
  items?: ChecklistItem[];
}

/** 更新任务参数 */
export interface UpdateTaskParams {
  id: string;
  projectId: string;
  title?: string;
  content?: string;
  desc?: string;
  isAllDay?: boolean;
  startDate?: string;
  dueDate?: string;
  timeZone?: string;
  reminders?: string[];
  repeatFlag?: string;
  priority?: number;
  sortOrder?: number;
  items?: ChecklistItem[];
}

/** 移动任务参数 */
export interface MoveTaskParams {
  fromProjectId: string;
  toProjectId: string;
  taskId: string;
}

/** 已完成任务查询参数 */
export interface CompletedTasksParams {
  projectIds?: string[];
  startDate?: string;
  endDate?: string;
}

/** 筛选任务参数 */
export interface FilterTasksParams {
  projectIds?: string[];
  startDate?: string;
  endDate?: string;
  priority?: number[];
  tag?: string[];
  status?: number[];
}

/** 批量任务操作参数 */
export interface BatchTasksParams {
  add?: CreateTaskParams[];
  update?: UpdateTaskParams[];
}

/** 用户偏好 */
export interface UserPreference {
  timeZone?: string;
  dateFormat?: string;
  timeFormat?: string;
  weekStartDay?: string;
  language?: string;
  [key: string]: unknown;
}
