import { describe, it, expect } from 'vitest';
import { formatTaskTime } from '../src/utils/format.js';

describe('formatTaskTime', () => {
  it('全天任务应返回 "全天"', () => {
    expect(
      formatTaskTime({ startDate: '2026-04-04T00:00:00+0000', isAllDay: true })
    ).toBe('全天');
  });

  it('有起止时间应返回 "HH:mm-HH:mm"', () => {
    expect(
      formatTaskTime({
        startDate: '2026-04-04T14:15:00+0000',
        dueDate: '2026-04-04T14:45:00+0000',
        isAllDay: false,
      })
    ).toBe('14:15-14:45');
  });

  it('仅有开始时间应返回 "HH:mm"', () => {
    expect(formatTaskTime({ startDate: '2026-04-04T09:00:00+0000' })).toBe(
      '09:00'
    );
  });

  it('无时间字段应返回空字符串', () => {
    expect(formatTaskTime({})).toBe('');
  });

  it('仅有截止日期无开始时间应返回空字符串', () => {
    expect(formatTaskTime({ dueDate: '2026-04-04T14:45:00+0000' })).toBe('');
  });

  it('全天任务无 startDate 应返回空字符串', () => {
    expect(formatTaskTime({ isAllDay: true })).toBe('');
  });

  it('起止时间相同时只显示一个', () => {
    expect(
      formatTaskTime({
        startDate: '2026-04-04T10:00:00+0000',
        dueDate: '2026-04-04T10:00:00+0000',
      })
    ).toBe('10:00');
  });

  it('应处理 +08:00 时区格式', () => {
    expect(
      formatTaskTime({
        startDate: '2026-04-04T14:15:00+08:00',
        dueDate: '2026-04-04T14:45:00+08:00',
      })
    ).toBe('14:15-14:45');
  });
});
