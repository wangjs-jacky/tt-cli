# tt-cli

[![npm version](https://img.shields.io/npm/v/@wangjs-jacky/tt-cli.svg)](https://www.npmjs.com/package/@wangjs-jacky/tt-cli) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

English | [中文](./README_CN.md)

A command-line tool for TickTick (滴答清单), supporting both China region (dida365.com) and Global region (ticktick.com).

## Install

```bash
npm install -g @wangjs-jacky/tt-cli
```

## Usage

### First-time Login

```bash
tt login
```

You'll be prompted for Client ID and Client Secret. Register your app at [TickTick Developer Platform](https://developer.ticktick.com/app) first.

Set Redirect URI to: `http://localhost:3000/callback`

### Switch Region

```bash
tt config --region cn      # China region (dida365.com)
tt config --region global   # Global region (ticktick.com)
```

### Daily Use

```bash
tt whoami    # Check login status
tt logout    # Log out
tt config    # View configuration
```

## Development

```bash
npm install        # Install dependencies
npm run build      # Build
npm test           # Run tests
npm run dev        # Watch mode
```

## Tech Stack

| Category | Choice |
|----------|--------|
| CLI Framework | `cac` |
| Terminal UI | `@clack/prompts` + `picocolors` |
| Build | `tsup` (ESM only) |
| Test | `vitest` |

## License

MIT
