import { describe, it, expect } from 'vitest';
import type { Task } from '../src/types.js';

/**
 * MCP OpenTask schema 定义的所有字段
 * 来源：dida365 MCP server 的 OpenTask 类型定义
 */
const MCP_OPEN_TASK_FIELDS = [
  'id',
  'projectId',
  'sortOrder',
  'title',
  'content',
  'desc',
  'startDate',
  'dueDate',
  'timeZone',
  'isAllDay',
  'priority',
  'reminders',
  'repeatFlag',
  'completedTime',
  'status',
  'items',
  'tags',
  'columnId',
  'parentId',
  'childIds',
  'columnName',
  'assignor',
  'etag',
  'kind',
] as const;

/**
 * CLI Task 接口的所有字段
 */
const CLI_TASK_FIELDS: (keyof Task)[] = [
  'id',
  'projectId',
  'title',
  'isAllDay',
  'completedTime',
  'content',
  'desc',
  'dueDate',
  'items',
  'priority',
  'reminders',
  'repeatFlag',
  'sortOrder',
  'startDate',
  'status',
  'timeZone',
  'kind',
  'tags',
  'etag',
  'columnId',
  'parentId',
  'childIds',
  'columnName',
  'assignor',
];

describe('MCP-CLI 等价校验：Task 字段覆盖', () => {
  it('CLI Task 类型应覆盖 MCP OpenTask 的所有核心字段', () => {
    const cliSet = new Set<string>(CLI_TASK_FIELDS);
    const missing = MCP_OPEN_TASK_FIELDS.filter((f) => !cliSet.has(f));

    expect(missing, `CLI Task 缺少 MCP 字段: ${missing.join(', ')}`).toEqual([]);
  });

  it('CLI Task 字段数应 >= MCP OpenTask 字段数', () => {
    const cliSet = new Set<string>(CLI_TASK_FIELDS);
    const mcpSet = new Set<string>(MCP_OPEN_TASK_FIELDS);

    expect(cliSet.size).toBeGreaterThanOrEqual(mcpSet.size);
  });

  it('CLI 可有 MCP 无的扩展字段（仅做信息性输出）', () => {
    const mcpSet = new Set<string>(MCP_OPEN_TASK_FIELDS);
    const cliExtra = CLI_TASK_FIELDS.filter((f) => !mcpSet.has(f));

    // CLI 扩展字段是允许的，仅做日志输出
    if (cliExtra.length > 0) {
      console.log(`  CLI 扩展字段（MCP 无对应）: ${cliExtra.join(', ')}`);
    }
  });
});
