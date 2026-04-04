# tt-cli

[![npm version](https://img.shields.io/npm/v/@wangjs-jacky/tt-cli.svg)](https://www.npmjs.com/package/@wangjs-jacky/tt-cli) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[English](./README.md) | 中文

滴答清单（TickTick）命令行工具，支持国内版（dida365.com）和国际版（ticktick.com）双区域。

## 安装

```bash
npm install -g @wangjs-jacky/tt-cli
```

## 使用

### 首次登录

```bash
tt login
```

首次使用会提示输入 Client ID 和 Client Secret，需要先到 [TickTick 开发者平台](https://developer.ticktick.com/app) 注册应用。

注册时 Redirect URI 设置为：`http://localhost:3000/callback`

### 区域切换

```bash
tt config --region cn      # 切换到国内版（dida365.com）
tt config --region global   # 切换到国际版（ticktick.com）
```

### 日常使用

```bash
tt whoami    # 查看登录状态
tt logout    # 登出
tt config    # 查看配置
```

## 开发

```bash
npm install        # 安装依赖
npm run build      # 构建
npm test           # 运行测试
npm run dev        # 监听模式开发
```

## 技术栈

| 类别 | 方案 |
|------|------|
| CLI 框架 | `cac` |
| 终端 UI | `@clack/prompts` + `picocolors` |
| 构建 | `tsup`（ESM only） |
| 测试 | `vitest` |

## License

MIT
