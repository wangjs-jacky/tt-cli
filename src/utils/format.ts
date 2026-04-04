/**
 * 任务时间格式化工具
 */

/**
 * 规范化日期字符串为 TickTick API 要求的格式
 * TickTick API 要求: "2026-04-04T19:00:00.000+0800"（有毫秒，时区无冒号）
 *
 * 支持输入格式:
 * - "2026-04-04T19:00:00+08:00" → "2026-04-04T19:00:00.000+0800"
 * - "2026-04-04T19:00:00Z"      → "2026-04-04T19:00:00.000+0000"
 * - "2026-04-04T19:00:00.123+0800" → 保持不变
 */
export function normalizeTickTickDate(dateStr: string): string {
  let result = dateStr;
  // 补毫秒: "T19:00:00+" → "T19:00:00.000+"
  if (!/T\d{2}:\d{2}:\d{2}\.\d{3}/.test(result)) {
    result = result.replace(/(T\d{2}:\d{2}:\d{2})([+\-Z])/, '$1.000$2');
  }
  // 去时区冒号: "+08:00" → "+0800"
  result = result.replace(/([+\-])(\d{2}):(\d{2})$/, '$1$2$3');
  // "Z" → "+0000"
  if (result.endsWith('Z')) {
    result = result.slice(0, -1) + '+0000';
  }
  return result;
}

/** 从 TickTick ISO 8601 日期字符串提取本地时间的 HH:mm */
function extractHM(dateStr: string): string | null {
  // TickTick 返回格式如 "2026-04-04T14:15:00+0000" 或 "2026-04-04T14:15:00+08:00"
  // API 返回 UTC 时间，需转换为本地时间显示
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    // 回退：直接从字符串提取 HH:mm
    const match = dateStr.match(/T(\d{2}):(\d{2})/);
    if (!match) return null;
    return `${match[1]}:${match[2]}`;
  }
}

/**
 * 格式化任务时间范围，用于表格显示
 * - 全天任务显示 "全天"
 * - 有起止时间显示 "HH:mm-HH:mm"
 * - 仅有开始时间显示 "HH:mm"
 * - 无时间显示空字符串
 */
export function formatTaskTime(task: {
  startDate?: string;
  dueDate?: string;
  isAllDay?: boolean;
}): string {
  if (task.isAllDay && task.startDate) return '全天';
  if (!task.startDate) return '';

  const start = extractHM(task.startDate);
  if (!start) return '';

  if (task.dueDate) {
    const end = extractHM(task.dueDate);
    if (end && end !== start) return `${start}-${end}`;
  }

  return start;
}
