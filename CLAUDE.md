# tt-cli

滴答清单（TickTick）命令行工具。

## 开发约定

- TypeScript strict 模式
- 注释和输出文案使用中文
- npm 包名：`@wangjs-jacky/ticktick-cli`
- ESM only，target node18

## 架构要点

- **OAuth2 流程**：本地 HTTP 服务器监听回调 → 浏览器打开授权页 → code 换 token
- **Token 自动刷新**：`apiRequest` 发请求前检查有效性，过期自动刷新
- **CSRF 防护**：授权请求携带随机 state 参数，回调时校验

## 调试经验

- **"无输出"≠"无报错"**：命令静默退出时，优先排查命令注册/匹配问题
- **401 先验端点再验 token**：用 `fetch` 直接测试不同 API 端点，比猜测 token 过期更快定位
- **验证轮次要克制**：确认 bug 后立即转向修复，不要反复验证同一结论
- **日期格式**：TickTick API 要求 `"2026-04-04T19:00:00.000+0800"`（有毫秒，时区无冒号）。`utils/format.ts` 的 `normalizeTickTickDate()` 已自动转换

## cac 子命令约束

`cac` v7 不支持空格分隔的子命令名，必须用连字符（`task-list`）。`index.ts` 中 `SUBCOMMAND_GROUPS` 做了预处理，用户可输入 `tt task list`。**新增子命令时必须同时更新命令注册和 `SUBCOMMAND_GROUPS`**。

## 参考文档

- [项目开发指南](docs/reference/project-guide.md)：技术栈、常用命令、项目结构、配置存储、区域系统
- [CLI 操作手册](docs/reference/cli-usage-guide.md)：所有已实现命令的完整用法
- [OAuth 2.0 认证架构设计](docs/oauth-credential-pre-validation.md)：授权码模式完整流程
- [滴答清单 Open API（中文）](docs/reference/dida365-open-api-zh.md) / [英文](docs/reference/dida365-open-api.md)
