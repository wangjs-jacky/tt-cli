import { describe, it, expect } from 'vitest';
import { formatTaskTime } from '../src/utils/format.js';

// 注：formatTaskTime 按本地时区显示，测试时区已固定为 Asia/Shanghai（见 vitest.config.ts）。
// 因此 +0000(UTC) 输入会 +8 转换为上海时间显示，+08:00 输入则原样显示。
describe('formatTaskTime', () => {
  it('全天任务应返回 "全天"', () => {
    expect(
      formatTaskTime({ startDate: '2026-04-04T00:00:00+0000', isAllDay: true })
    ).toBe('全天');
  });

  it('有起止时间应返回 "HH:mm-HH:mm"（UTC +8 转上海）', () => {
    expect(
      formatTaskTime({
        startDate: '2026-04-04T14:15:00+0000',
        dueDate: '2026-04-04T14:45:00+0000',
        isAllDay: false,
      })
    ).toBe('22:15-22:45');
  });

  it('仅有开始时间应返回 "HH:mm"（UTC +8 转上海）', () => {
    expect(formatTaskTime({ startDate: '2026-04-04T09:00:00+0000' })).toBe(
      '17:00'
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

  it('起止时间相同时只显示一个（UTC +8 转上海）', () => {
    expect(
      formatTaskTime({
        startDate: '2026-04-04T10:00:00+0000',
        dueDate: '2026-04-04T10:00:00+0000',
      })
    ).toBe('18:00');
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
