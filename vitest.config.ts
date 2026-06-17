import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // 固定时区为上海，确保依赖本地时区的时间格式化测试（formatTaskTime）
    // 在任意机器 / CI（默认 UTC）上结果可复现。
    env: {
      TZ: 'Asia/Shanghai',
    },
  },
});
