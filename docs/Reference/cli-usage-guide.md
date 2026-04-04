# tt-cli 操作手册

> tt-cli 是滴答清单（TickTick）的命令行工具，支持国内版（dida365.com）和国际版（ticktick.com）双区域。

## 目录

- [前置准备](#前置准备)
- [认证命令](#认证命令)
- [项目命令](#项目命令)
- [任务命令](#任务命令)
- [用户命令](#用户命令)
- [配置说明](#配置说明)
- [常见问题](#常见问题)

---

## 前置准备

### 1. 获取 OAuth 凭证

在首次使用前，需要先注册应用获取 OAuth 凭证：

- 国内版：访问 [滴答清单开发者中心](https://developer.dida365.com/manage)
- 国际版：访问 [TickTick Developer Center](https://developer.ticktick.com/app)

注册时将 **Redirect URI** 设置为 `http://localhost:3000/callback`。

### 2. 安装

```bash
npm install -g @wangjs-jacky/tt-cli
```

### 3. 首次登录

```bash
tt login
```

登录时 CLI 会引导你输入 Client ID 和 Client Secret，然后自动打开浏览器完成 OAuth 授权。

---

## 认证命令

### `tt login` — 登录

启动 OAuth2 授权流程，打开浏览器完成登录。

```bash
tt login
```

**交互流程**：
1. 检查是否已登录（已登录则提示无需重复登录）
2. 如果凭证区域与当前区域不匹配，提示重新配置
3. 如果未保存凭证，引导输入 Client ID 和 Client Secret
4. 打开浏览器进行授权
5. 授权成功后自动获取 Token 并保存

**登录失败处理**：
- 凭证无效或区域不匹配时，提供三个选项：
  - 切换到另一个区域
  - 重新输入当前区域的凭证
  - 退出

### `tt logout` — 登出

清除本地保存的 Token（保留 OAuth 凭证）。

```bash
tt logout
```

### `tt whoami` — 查看登录状态

验证当前 Token 是否有效，显示剩余有效期。

```bash
tt whoami
```

**输出示例**：
```
✔ 已登录 [国内版（滴答清单）]
  Token 有效期: 剩余 23 小时 45 分钟
```

### `tt config` — 查看/设置配置

查看当前配置信息或切换区域。

```bash
# 查看当前配置
tt config

# 切换区域（cn=国内版，global=国际版）
tt config --region cn
tt config --region global
```

**查看配置输出**：
```
区域: 国内版（滴答清单）
Client ID: xxxxxxxx
Client Secret: xxxxxxxx********
Token: xxxxxxxx...
过期时间: 2026/4/5 14:30:00
```

> **注意**：切换区域会清除 Token，需要重新运行 `tt login`。

---

## 项目命令

### `tt project-list` — 列出所有项目

```bash
tt project-list
```

**输出示例**：
```
  工作  abc123def456
    类型: TASK  视图: list  活跃
  生活  ghi789jkl012
    类型: TASK  视图: kanban  活跃
  归档  mno345pqr678
    类型: NOTE  视图: list  已关闭
```

### `tt project-get <id>` — 获取项目详情

```bash
tt project-get abc123def456
```

**输出字段**：名称、ID、颜色、类型、视图模式、状态、分组、权限。

### `tt project-tasks <id>` — 获取项目下的所有任务

```bash
tt project-tasks abc123def456
```

**输出示例**：
```
  ○ 完成周报  高
    本周五前提交
  ✓ 修复登录 Bug  中
  ○ 需求评审  无
```

### `tt project-create [name]` — 创建项目

```bash
# 交互式输入名称
tt project-create

# 直接指定名称
tt project-create "新项目"

# 带选项创建
tt project-create "新项目" --color "#F18181" --view-mode kanban --kind TASK
```

| 选项 | 说明 | 可选值 |
|------|------|--------|
| `--color <color>` | 项目颜色 | 如 `#F18181` |
| `--view-mode <mode>` | 视图模式 | `list` / `kanban` / `timeline` |
| `--kind <kind>` | 项目类型 | `TASK` / `NOTE` |

### `tt project-update <id>` — 更新项目

```bash
tt project-update abc123def456 --name "新名称"
tt project-update abc123def456 --color "#00FF88" --view-mode timeline
```

| 选项 | 说明 |
|------|------|
| `--name <name>` | 修改项目名称 |
| `--color <color>` | 修改项目颜色 |
| `--view-mode <mode>` | 修改视图模式 |
| `--kind <kind>` | 修改项目类型 |

> 不指定任何选项会提示用法，不会发出请求。

### `tt project-delete <id>` — 删除项目

```bash
tt project-delete abc123def456
```

> 会弹出确认提示，防止误删。此操作不可撤销。

---

## 任务命令

### 基础操作

#### `tt task-add [title]` — 创建任务

```bash
# 交互式创建（输入标题 + 选择项目）
tt task-add

# 直接创建
tt task-add "完成设计稿"

# 带完整参数
tt task-add "完成设计稿" \
  -p abc123def456 \
  --content "移动端首页设计" \
  --priority 5 \
  --start-date "2026-04-04T09:00:00.000Z" \
  --due-date "2026-04-06T18:00:00.000Z" \
  --all-day
```

| 选项 | 说明 | 可选值 |
|------|------|--------|
| `-p, --project <id>` | 项目 ID | 不指定则交互选择 |
| `--content <text>` | 任务详细内容 | 任意文本 |
| `--priority <n>` | 优先级 | `0`(无) / `1`(低) / `3`(中) / `5`(高) |
| `--start-date <date>` | 开始日期 | ISO 8601 格式 |
| `--due-date <date>` | 截止日期 | ISO 8601 格式 |
| `--all-day` | 全天任务 | 标志位，无需值 |

#### `tt task-get <projectId> <taskId>` — 获取任务详情

```bash
tt task-get abc123def456 task123abc456
```

**输出字段**：标题、ID、项目、优先级、状态、全天、开始/截止时间、时区、类型、内容、标签、子任务列表。

#### `tt task-update <taskId>` — 更新任务

```bash
tt task-update task123abc456 -p abc123def456 --title "新标题"
tt task-update task123abc456 -p abc123def456 --priority 3 --due-date "2026-04-10T18:00:00.000Z"
```

| 选项 | 说明 |
|------|------|
| `-p, --project <id>` | 项目 ID（**必填**） |
| `--title <title>` | 修改标题 |
| `--content <text>` | 修改内容 |
| `--priority <n>` | 修改优先级 |
| `--start-date <date>` | 修改开始日期 |
| `--due-date <date>` | 修改截止日期 |

> 项目 ID 为必填参数，用于定位任务所属项目。

#### `tt task-done <projectId> <taskId>` — 完成任务

```bash
tt task-done abc123def456 task123abc456
```

#### `tt task-delete <projectId> <taskId>` — 删除任务

```bash
tt task-delete abc123def456 task123abc456
```

> 会弹出确认提示，防止误删。

#### `tt task-move <taskId>` — 移动任务到其他项目

```bash
tt task-move task123abc456 -f abc123def456 -t xyz789ghi012
```

| 选项 | 说明 |
|------|------|
| `-f, --from <id>` | 源项目 ID（**必填**） |
| `-t, --to <id>` | 目标项目 ID（**必填**） |

### 查询操作

#### `tt task-list` — 筛选任务

```bash
# 获取所有任务
tt task-list

# 按项目筛选
tt task-list -p abc123def456

# 按日期范围
tt task-list --start "2026-04-01" --end "2026-04-30"

# 按状态和优先级
tt task-list --status 0 --priority 5

# 多条件组合
tt task-list -p abc123def456 --status 0,2 --priority 1,3,5 --tag "工作,重要"
```

| 选项 | 说明 | 可选值 |
|------|------|--------|
| `-p, --project <id>` | 按项目筛选 | 项目 ID |
| `--start <date>` | 开始日期 | ISO 8601 |
| `--end <date>` | 结束日期 | ISO 8601 |
| `--status <n>` | 按状态筛选，逗号分隔 | `0`(待办) / `2`(已完成) |
| `--priority <n>` | 按优先级筛选，逗号分隔 | `0` / `1` / `3` / `5` |
| `--tag <tag>` | 按标签筛选，逗号分隔 | 标签名称 |

#### `tt task-completed` — 查看已完成任务

```bash
# 查看所有已完成任务
tt task-completed

# 按项目和日期范围
tt task-completed -p abc123def456 --start "2026-04-01" --end "2026-04-30"
```

| 选项 | 说明 |
|------|------|
| `-p, --project <id>` | 按项目筛选 |
| `--start <date>` | 开始日期 |
| `--end <date>` | 结束日期 |

#### `tt task-undone` — 查看未完成任务

```bash
# 按预设查询
tt task-undone --query today
tt task-undone --query next7day

# 按自定义日期范围
tt task-undone --start "2026-04-01" --end "2026-04-30"

# 按项目筛选
tt task-undone --query today -p abc123def456
```

| 选项 | 说明 | 可选值 |
|------|------|--------|
| `--query <preset>` | 预设查询 | `today` / `tomorrow` / `last24hour` / `next24hour` / `last7day` / `next7day` |
| `--start <date>` | 自定义开始日期 | ISO 8601 |
| `--end <date>` | 自定义结束日期 | ISO 8601 |
| `-p, --project <id>` | 按项目筛选 | 项目 ID |

> `--query` 与 `--start/--end` 互斥，优先使用 `--query`。

#### `tt task-search <keyword>` — 搜索任务

```bash
tt task-search "设计稿"
```

在任务的标题和内容中搜索关键词，匹配的关键词会高亮显示。

#### `tt task-find <taskId>` — 按 ID 查找任务

```bash
tt task-find task123abc456
```

不需要提供项目 ID，直接通过任务 ID 查找（内部遍历所有任务匹配）。

### 批量操作

#### `tt task-batch-add [jsonFile]` — 批量创建任务

```bash
# 从文件读取
tt task-batch-add tasks.json

# 从标准输入读取
echo '[{"title":"任务1","projectId":"abc123"},{"title":"任务2","projectId":"abc123"}]' | tt task-batch-add --stdin
```

**JSON 文件格式**（数组，每个元素为创建参数）：
```json
[
  {
    "title": "任务标题",
    "projectId": "项目ID",
    "content": "任务内容（可选）",
    "priority": 5,
    "startDate": "2026-04-04T09:00:00.000Z",
    "dueDate": "2026-04-06T18:00:00.000Z",
    "isAllDay": false
  }
]
```

#### `tt task-batch-update [jsonFile]` — 批量更新任务

```bash
# 从文件读取
tt task-batch-update updates.json

# 从标准输入读取
cat updates.json | tt task-batch-update --stdin
```

**JSON 文件格式**（数组，每个元素必须包含 `id` 和 `projectId`）：
```json
[
  {
    "id": "任务ID",
    "projectId": "项目ID",
    "title": "新标题",
    "priority": 3
  }
]
```

#### `tt task-batch-done <projectId>` — 批量完成任务

```bash
# 指定任务 ID
tt task-batch-done abc123def456 --task-ids "task1,task2,task3"

# 完成项目下所有未完成任务
tt task-batch-done abc123def456 --all

# 跳过确认提示
tt task-batch-done abc123def456 --all --force
```

| 选项 | 说明 |
|------|------|
| `--task-ids <ids>` | 任务 ID 列表，逗号分隔 |
| `--all` | 完成项目下所有未完成任务 |
| `--force` | 跳过确认提示 |

> `--task-ids` 和 `--all` 二选一，必须指定一个。

---

## 用户命令

### `tt user-pref` — 查看用户偏好

```bash
tt user-pref
```

**输出字段**：时区、日期格式、语言、主题。

---

## 配置说明

### 配置文件位置

```
~/.tt-cli/config.json
```

### 配置文件结构

```json
{
  "oauth": {
    "clientId": "xxxxxxxx",
    "clientSecret": "xxxxxxxx",
    "region": "cn"
  },
  "token": {
    "accessToken": "xxxxxxxx",
    "refreshToken": "xxxxxxxx",
    "expiresAt": 1712345678000
  },
  "region": "cn"
}
```

### 区域系统

| 区域 | 值 | API 地址 | 开发者中心 |
|------|-----|---------|-----------|
| 国内版 | `cn` | `api.dida365.com` | `developer.dida365.com` |
| 国际版 | `global` | `api.ticktick.com` | `developer.ticktick.com` |

### 优先级对照表

| 值 | 含义 | 显示颜色 |
|----|------|---------|
| `0` | 无优先级 | 灰色 |
| `1` | 低优先级 | 蓝色 |
| `3` | 中优先级 | 黄色 |
| `5` | 高优先级 | 红色 |

### 任务状态对照表

| 值 | 含义 | 图标 |
|----|------|------|
| `0` | 待办 | ○ |
| `2` | 已完成 | ✓ |

---

## 命令速查表

### 认证

| 命令 | 说明 |
|------|------|
| `tt login` | 登录 |
| `tt logout` | 登出 |
| `tt whoami` | 查看登录状态 |
| `tt config` | 查看配置 |
| `tt config --region cn` | 切换到国内版 |
| `tt config --region global` | 切换到国际版 |

### 项目

| 命令 | 说明 |
|------|------|
| `tt project-list` | 列出所有项目 |
| `tt project-get <id>` | 获取项目详情 |
| `tt project-tasks <id>` | 获取项目下的任务 |
| `tt project-create "名称"` | 创建项目 |
| `tt project-update <id> --name "新名"` | 更新项目 |
| `tt project-delete <id>` | 删除项目 |

### 任务 — 基础

| 命令 | 说明 |
|------|------|
| `tt task-add "标题" -p <项目ID>` | 创建任务 |
| `tt task-get <项目ID> <任务ID>` | 获取任务详情 |
| `tt task-update <任务ID> -p <项目ID>` | 更新任务 |
| `tt task-done <项目ID> <任务ID>` | 完成任务 |
| `tt task-delete <项目ID> <任务ID>` | 删除任务 |
| `tt task-move <任务ID> -f <源> -t <目标>` | 移动任务 |

### 任务 — 查询

| 命令 | 说明 |
|------|------|
| `tt task-list` | 筛选任务 |
| `tt task-completed` | 查看已完成任务 |
| `tt task-undone --query today` | 今日未完成 |
| `tt task-undone --query next7day` | 未来 7 天未完成 |
| `tt task-search "关键词"` | 搜索任务 |
| `tt task-find <任务ID>` | 按 ID 查找 |

### 任务 — 批量

| 命令 | 说明 |
|------|------|
| `tt task-batch-add tasks.json` | 批量创建 |
| `tt task-batch-update updates.json` | 批量更新 |
| `tt task-batch-done <项目ID> --all` | 批量完成 |

### 用户

| 命令 | 说明 |
|------|------|
| `tt user-pref` | 查看用户偏好 |

---

## 常见问题

### 登录时提示"凭证无效或与区域不匹配"

1. 确认凭证是在对应区域的开发者中心注册的
2. 使用 `tt config --region cn` 或 `tt config --region global` 切换到正确区域
3. 重新运行 `tt login`，选择"重新输入当前区域的凭证"

### Token 过期怎么办

tt-cli 会在发送请求前自动检查 Token 有效性，过期会自动刷新，无需手动处理。如果刷新也失败（如 refresh token 过期），重新运行 `tt login` 即可。

### 端口 3000 被占用

登录时会在本地启动 HTTP 服务器监听端口 3000。如果端口被占用：
- 关闭占用该端口的程序
- 或等待占用程序释放后重试

### 命令无输出静默退出

这通常是命令名未被正确识别。确保使用连字符格式：
- 正确：`tt task-list`、`tt project-create`
- CLI 会自动将 `tt task list` 转换为 `tt task-list`，但建议直接使用连字符格式
