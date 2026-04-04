# tt-cli 意图映射参考表

> 本文件为 `tt-cli-guide` skill 的详细参考，包含所有自然语言到命令的映射关系。

## 日期转换规则

**所有相对日期必须先转换为绝对日期（格式 `YYYY-MM-DD`）**，用 JavaScript `new Date()` 获取当前日期计算。

| 用户说法 | 转换规则 | 示例（假设今天是 2026-04-04） |
|----------|----------|------|
| 今天 | 当天日期 | `2026-04-04` |
| 昨天 | 当天 -1 | `2026-04-03` |
| 前天 | 当天 -2 | `2026-04-02` |
| 明天 | 当天 +1 | `2026-04-05` |
| 后天 | 当天 +2 | `2026-04-06` |
| 这周 | 本周一 ~ 本周日 | `2026-03-30` ~ `2026-04-05` |
| 上周 | 上周一 ~ 上周日 | `2026-03-23` ~ `2026-03-29` |
| 下周 | 下周一 ~ 下周日 | `2026-04-06` ~ `2026-04-12` |
| 本月 | 本月1日 ~ 月末 | `2026-04-01` ~ `2026-04-30` |
| 上月 | 上月1日 ~ 上月末 | `2026-03-01` ~ `2026-03-31` |

### 日期预设快捷值

`tt task-undone --query` 支持以下预设（无需计算日期）：

| 预设值 | 含义 |
|--------|------|
| `today` | 今天 |
| `tomorrow` | 明天 |
| `last24hour` | 过去 24 小时 |
| `next24hour` | 未来 24 小时 |
| `last7day` | 过去 7 天 |
| `next7day` | 未来 7 天 |

> `--query` 与 `--start/--end` 互斥，优先使用 `--query`。

---

## 意图映射表

### 查询任务

| 用户意图 | 命令 | 说明 |
|----------|------|------|
| 查看今天的任务 | `tt task-undone --query today` | 今日未完成 |
| 查看明天的任务 | `tt task-undone --query tomorrow` | 明日未完成 |
| 未来一周的任务 | `tt task-undone --query next7day` | 未来 7 天 |
| 过去一周的任务 | `tt task-undone --query last7day` | 过去 7 天 |
| 查看昨天的任务 | `tt task-undone --start "YYYY-MM-DD" --end "YYYY-MM-DD"` | 需计算日期 |
| 查看前天的任务 | `tt task-undone --start "YYYY-MM-DD" --end "YYYY-MM-DD"` | 需计算日期 |
| 查看某天的任务 | `tt task-undone --start "日期" --end "日期"` | 日期范围查询 |
| 查看已完成任务 | `tt task-completed` | 默认所有 |
| 某段时间完成的任务 | `tt task-completed --start "开始" --end "结束"` | 带日期范围 |
| 所有未完成任务 | `tt task-list --status 0` | 全部待办 |
| 高优先级任务 | `tt task-list --status 0 --priority 5` | 高优先级待办 |
| 按关键词搜索 | `tt task-search "关键词"` | 模糊搜索标题和内容 |
| 某项目的任务 | `tt project-tasks <projectId>` | 需先知道项目 ID |
| 任务详情 | `tt task-find <taskId>` | 按 ID 查找 |

### 创建任务

| 用户意图 | 命令模板 |
|----------|----------|
| 创建任务（只说标题） | `tt task-add "标题"` |
| 创建到指定项目 | `tt task-add "标题" -p <projectId>` |
| 高优先级任务 | `tt task-add "标题" --priority 5` |
| 带截止日期 | `tt task-add "标题" --due-date "YYYY-MM-DDTHH:mm:ss.000Z"` |
| 全天任务 | `tt task-add "标题" --all-day` |
| 带详细内容 | `tt task-add "标题" --content "详细说明"` |
| 完整创建 | `tt task-add "标题" -p <projectId> --priority 3 --start-date "..." --due-date "..."` |

**创建规则**：
- 用户没指定项目 → 不加 `-p`，让 CLI 交互选择
- 用户说了项目名称（非 ID）→ 先 `tt project-list` 查找 ID
- 用户说了项目 ID → 直接使用

### 更新任务

| 用户意图 | 命令模板 |
|----------|----------|
| 修改标题 | `tt task-update <taskId> -p <projectId> --title "新标题"` |
| 修改优先级 | `tt task-update <taskId> -p <projectId> --priority 3` |
| 修改截止日期 | `tt task-update <taskId> -p <projectId> --due-date "..."` |
| 修改内容 | `tt task-update <taskId> -p <projectId> --content "新内容"` |

**更新规则**：如果用户只提供了任务名称，先用 `tt task-search` 查找，获取 `projectId` 和 `taskId`。

### 完成和删除

| 用户意图 | 命令模板 | 风险等级 |
|----------|----------|----------|
| 完成任务 | `tt task-done <projectId> <taskId>` | 低 |
| 删除任务 | `tt task-delete <projectId> <taskId>` | **高** |
| 批量完成（指定） | `tt task-batch-done <projectId> --task-ids "id1,id2,id3"` | 中 |
| 批量完成（全部） | `tt task-batch-done <projectId> --all` | **高** |

### 项目管理

| 用户意图 | 命令模板 |
|----------|----------|
| 查看所有项目 | `tt project-list` |
| 查看项目详情 | `tt project-get <projectId>` |
| 创建项目 | `tt project-create "项目名"` |
| 修改项目名称 | `tt project-update <projectId> --name "新名称"` |
| 删除项目 | `tt project-delete <projectId>` | **高** |

### 认证和配置

| 用户意图 | 命令模板 |
|----------|----------|
| 登录 | `tt login` |
| 登出 | `tt logout` |
| 查看登录状态 | `tt whoami` |
| 查看配置 | `tt config` |
| 切换到国内版 | `tt config --region cn` |
| 切换到国际版 | `tt config --region global` |
| 查看用户偏好 | `tt user-pref` |

---

## 优先级映射

| 值 | 含义 | 触发词 |
|----|------|--------|
| `0` | 无优先级 | （默认） |
| `1` | 低优先级 | "低优先级"、"不急" |
| `3` | 中优先级 | "中优先级"、"一般" |
| `5` | 高优先级 | "高优先级"、"紧急"、"重要" |

## 任务状态

| 值 | 含义 | 图标 |
|----|------|------|
| `0` | 待办 | ○ |
| `2` | 已完成 | ✓ |

---

## 常用 Prompt 模板

以下是用户可以直接使用的自然语言示例：

### 查询类
- "帮我查看今天的任务"
- "今天有什么待办事项"
- "看看我明天要做什么"
- "未来一周有哪些任务"
- "昨天的任务完成了吗"
- "帮我查一下上周完成了哪些任务"
- "有哪些高优先级的任务还没完成"
- "搜索一下关于 XX 的任务"
- "看看 XX 项目里有什么任务"

### 创建类
- "帮我创建一个任务：明天开会"
- "新建一个高优先级任务：提交报告，截止到本周五"
- "在'工作'项目下添加任务：准备会议材料"
- "帮我安排明天的任务：上午开会，下午写文档"

### 操作类
- "帮我把 XX 任务标记为完成"
- "完成今天所有的任务"
- "把 XX 任务移到'生活'项目"
- "修改 XX 任务的截止日期到下周一"

### 分析类
- "帮我统计一下这周完成了多少任务"
- "看看我哪些任务快到期了"
- "帮我整理一下当前所有未完成的任务，按优先级排序"
