# 滴答清单 Open API

## 简介

欢迎使用滴答清单 Open API 文档。滴答清单是一款功能强大的任务管理应用，帮助用户轻松管理和组织日常任务、截止日期和项目。通过滴答清单 Open API，开发者可以将滴答清单的任务管理功能集成到自己的应用中，打造无缝的用户体验。

## 快速开始

使用滴答清单 Open API 前，你需要注册应用并获取 Client ID 和 Client Secret。请访问[滴答清单开发者中心](https://developer.dida365.com/manage)注册应用。注册成功后，你将收到用于请求认证的 Client ID 和 Client Secret。

## 授权

### 获取 Access Token

调用滴答清单 Open API 需要先获取对应用户的 Access Token。滴答清单使用 OAuth2 协议获取 Access Token。

#### 第一步

将用户重定向到滴答清单授权页面：`https://dida365.com/oauth/authorize`

| 参数名 | 说明 |
|--------|------|
| client_id | 应用唯一标识 |
| scope | 以空格分隔的权限范围，当前可用范围：`tasks:write` `tasks:read` |
| state | 会原样传递到重定向 URL |
| redirect_uri | 用户配置的重定向 URL |
| response_type | 固定值 `code` |

示例：

```
https://dida365.com/oauth/authorize?scope=scope&client_id=client_id&state=state&redirect_uri=redirect_uri&response_type=code
```

#### 第二步

用户授权后，滴答清单会将用户重定向回你的应用的 `redirect_uri`，并附带授权码作为查询参数。

| 参数名 | 说明 |
|--------|------|
| code | 用于后续获取 Access Token 的授权码 |
| state | 第一步中传递的 state 参数 |

#### 第三步

使用授权码换取 Access Token，向 `https://dida365.com/oauth/token` 发送 POST 请求（Content-Type: application/x-www-form-urlencoded）：

| 参数名 | 说明 |
|--------|------|
| client_id | 使用 **Basic Auth** 认证方式放在 **HEADER** 中的用户名 |
| client_secret | 使用 **Basic Auth** 认证方式放在 **HEADER** 中的密码 |
| code | 第二步获取的授权码 |
| grant_type | 授权类型，目前仅支持 `authorization_code` |
| scope | 以空格分隔的权限范围，当前可用范围：`tasks:write`、`tasks:read` |
| redirect_uri | 用户配置的重定向 URL |

响应中包含用于 OpenAPI 请求认证的 Access Token：

```json
{
  "access_token": "access token value"
}
```

#### 调用 OpenAPI

在请求头中设置 **Authorization**，值为 **Bearer** `access token value`：

```
Authorization: Bearer e*****b
```

## API 参考

滴答清单 Open API 提供了 RESTful 接口，用于访问和管理用户任务、清单和其他相关资源。API 基于标准 HTTP 协议，支持 JSON 数据格式。

### 任务（Task）

#### 根据 Project ID 和 Task ID 获取任务

```
GET /open/v1/project/{projectId}/task/{taskId}
```

**参数**

| 类型 | 参数名 | 说明 | 数据类型 |
|------|--------|------|----------|
| Path | **projectId** *必填* | 项目标识 | string |
| Path | **taskId** *必填* | 任务标识 | string |

**响应**

| HTTP 状态码 | 说明 | 数据模型 |
|-------------|------|----------|
| 200 | OK | [Task](#task) |
| 401 | 未授权 | 无内容 |
| 403 | 禁止访问 | 无内容 |
| 404 | 未找到 | 无内容 |

**示例**

请求：

```http
GET /open/v1/project/{{projectId}}/task/{{taskId}} HTTP/1.1
Host: api.dida365.com
Authorization: Bearer {{token}}
```

响应：

```json
{
  "id": "63b7bebb91c0a5474805fcd4",
  "isAllDay": true,
  "projectId": "6226ff9877acee87727f6bca",
  "title": "任务标题",
  "content": "任务内容",
  "desc": "任务描述",
  "timeZone": "America/Los_Angeles",
  "repeatFlag": "RRULE:FREQ=DAILY;INTERVAL=1",
  "startDate": "2019-11-13T03:00:00+0000",
  "dueDate": "2019-11-14T03:00:00+0000",
  "reminders": ["TRIGGER:P0DT9H0M0S", "TRIGGER:PT0S"],
  "priority": 1,
  "status": 0,
  "completedTime": "2019-11-13T03:00:00+0000",
  "sortOrder": 12345,
  "items": [
    {
      "id": "6435074647fd2e6387145f20",
      "status": 0,
      "title": "子任务标题",
      "sortOrder": 12345,
      "startDate": "2019-11-13T03:00:00+0000",
      "isAllDay": false,
      "timeZone": "America/Los_Angeles",
      "completedTime": "2019-11-13T03:00:00+0000"
    }
  ]
}
```

#### 创建任务

```
POST /open/v1/task
```

**参数**

| 类型 | 参数名 | 说明 | 数据类型 |
|------|--------|------|----------|
| Body | title *必填* | 任务标题 | string |
| Body | projectId *必填* | 项目 ID | string |
| Body | content | 任务内容 | string |
| Body | desc | 清单描述 | string |
| Body | isAllDay | 是否全天 | boolean |
| Body | startDate | 开始日期时间，格式：`"yyyy-MM-dd'T'HH:mm:ssZ"`。**示例**：`"2019-11-13T03:00:00+0000"` | date |
| Body | dueDate | 截止日期时间，格式：`"yyyy-MM-dd'T'HH:mm:ssZ"`。**示例**：`"2019-11-13T03:00:00+0000"` | date |
| Body | timeZone | 时间指定的时区 | string |
| Body | reminders | 任务提醒列表 | list |
| Body | repeatFlag | 任务重复规则 | string |
| Body | priority | 任务优先级，默认为 "0" | integer |
| Body | sortOrder | 任务排序值 | integer |
| Body | items | 子任务列表 | list |
| Body | items.title | 子任务标题 | string |
| Body | items.startDate | 开始日期时间，格式：`"yyyy-MM-dd'T'HH:mm:ssZ"` | date |
| Body | items.isAllDay | 是否全天 | boolean |
| Body | items.sortOrder | 子任务排序值 | integer |
| Body | items.timeZone | 开始时间指定的时区 | string |
| Body | items.status | 子任务完成状态 | integer |
| Body | items.completedTime | 完成时间，格式：`"yyyy-MM-dd'T'HH:mm:ssZ"`。**示例**：`"2019-11-13T03:00:00+0000"` | date |

**响应**

| HTTP 状态码 | 说明 | 数据模型 |
|-------------|------|----------|
| 200 | OK | [Task](#task) |
| 201 | 已创建 | 无内容 |
| 401 | 未授权 | 无内容 |
| 403 | 禁止访问 | 无内容 |
| 404 | 未找到 | 无内容 |

**示例**

请求：

```http
POST /open/v1/task HTTP/1.1
Host: api.dida365.com
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "title": "任务标题",
  "projectId": "6226ff9877acee87727f6bca"
}
```

响应：

```json
{
  "id": "63b7bebb91c0a5474805fcd4",
  "projectId": "6226ff9877acee87727f6bca",
  "title": "任务标题",
  "content": "任务内容",
  "desc": "任务描述",
  "isAllDay": true,
  "startDate": "2019-11-13T03:00:00+0000",
  "dueDate": "2019-11-14T03:00:00+0000",
  "timeZone": "America/Los_Angeles",
  "reminders": ["TRIGGER:P0DT9H0M0S", "TRIGGER:PT0S"],
  "repeatFlag": "RRULE:FREQ=DAILY;INTERVAL=1",
  "priority": 1,
  "status": 0,
  "completedTime": "2019-11-13T03:00:00+0000",
  "sortOrder": 12345,
  "items": [
    {
      "id": "6435074647fd2e6387145f20",
      "status": 1,
      "title": "子任务标题",
      "sortOrder": 12345,
      "startDate": "2019-11-13T03:00:00+0000",
      "isAllDay": false,
      "timeZone": "America/Los_Angeles",
      "completedTime": "2019-11-13T03:00:00+0000"
    }
  ]
}
```

#### 更新任务

```
POST /open/v1/task/{taskId}
```

**参数**

| 类型 | 参数名 | 说明 | 数据类型 |
|------|--------|------|----------|
| Path | **taskId** *必填* | 任务标识 | string |
| Body | id *必填* | 任务 ID | string |
| Body | projectId *必填* | 项目 ID | string |
| Body | title | 任务标题 | string |
| Body | content | 任务内容 | string |
| Body | desc | 清单描述 | string |
| Body | isAllDay | 是否全天 | boolean |
| Body | startDate | 开始日期时间，格式：`"yyyy-MM-dd'T'HH:mm:ssZ"`。**示例**：`"2019-11-13T03:00:00+0000"` | date |
| Body | dueDate | 截止日期时间，格式：`"yyyy-MM-dd'T'HH:mm:ssZ"`。**示例**：`"2019-11-13T03:00:00+0000"` | date |
| Body | timeZone | 时间指定的时区 | string |
| Body | reminders | 任务提醒列表 | list |
| Body | repeatFlag | 任务重复规则 | string |
| Body | priority | 任务优先级，默认为 "normal" | integer |
| Body | sortOrder | 任务排序值 | integer |
| Body | items | 子任务列表 | list |
| Body | items.title | 子任务标题 | string |
| Body | items.startDate | 开始日期时间，格式：`"yyyy-MM-dd'T'HH:mm:ssZ"` | date |
| Body | items.isAllDay | 是否全天 | boolean |
| Body | items.sortOrder | 子任务排序值 | integer |
| Body | items.timeZone | 开始时间指定的时区 | string |
| Body | items.status | 子任务完成状态 | integer |
| Body | items.completedTime | 完成时间，格式：`"yyyy-MM-dd'T'HH:mm:ssZ"`。**示例**：`"2019-11-13T03:00:00+0000"` | date |

**响应**

| HTTP 状态码 | 说明 | 数据模型 |
|-------------|------|----------|
| 200 | OK | [Task](#task) |
| 201 | 已创建 | 无内容 |
| 401 | 未授权 | 无内容 |
| 403 | 禁止访问 | 无内容 |
| 404 | 未找到 | 无内容 |

**示例**

请求：

```http
POST /open/v1/task/{{taskId}} HTTP/1.1
Host: api.dida365.com
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "id": "{{taskId}}",
  "projectId": "{{projectId}}",
  "title": "任务标题",
  "priority": 1
}
```

响应：

```json
{
  "id": "63b7bebb91c0a5474805fcd4",
  "projectId": "6226ff9877acee87727f6bca",
  "title": "任务标题",
  "content": "任务内容",
  "desc": "任务描述",
  "isAllDay": true,
  "startDate": "2019-11-13T03:00:00+0000",
  "dueDate": "2019-11-14T03:00:00+0000",
  "timeZone": "America/Los_Angeles",
  "reminders": ["TRIGGER:P0DT9H0M0S", "TRIGGER:PT0S"],
  "repeatFlag": "RRULE:FREQ=DAILY;INTERVAL=1",
  "priority": 1,
  "status": 0,
  "completedTime": "2019-11-13T03:00:00+0000",
  "sortOrder": 12345,
  "items": [
    {
      "id": "6435074647fd2e6387145f20",
      "status": 1,
      "title": "子任务标题",
      "sortOrder": 12345,
      "startDate": "2019-11-13T03:00:00+0000",
      "isAllDay": false,
      "timeZone": "America/Los_Angeles",
      "completedTime": "2019-11-13T03:00:00+0000"
    }
  ],
  "kind": "CHECKLIST"
}
```

#### 完成任务

```
POST /open/v1/project/{projectId}/task/{taskId}/complete
```

**参数**

| 类型 | 参数名 | 说明 | 数据类型 |
|------|--------|------|----------|
| Path | **projectId** *必填* | 项目标识 | string |
| Path | **taskId** *必填* | 任务标识 | string |

**响应**

| HTTP 状态码 | 说明 | 数据模型 |
|-------------|------|----------|
| 200 | OK | 无内容 |
| 201 | 已创建 | 无内容 |
| 401 | 未授权 | 无内容 |
| 403 | 禁止访问 | 无内容 |
| 404 | 未找到 | 无内容 |

**示例**

请求：

```http
POST /open/v1/project/{{projectId}}/task/{{taskId}}/complete HTTP/1.1
Host: api.dida365.com
Authorization: Bearer {{token}}
```

#### 删除任务

```
DELETE /open/v1/project/{projectId}/task/{taskId}
```

**参数**

| 类型 | 参数名 | 说明 | 数据类型 |
|------|--------|------|----------|
| Path | **projectId** *必填* | 项目标识 | string |
| Path | **taskId** *必填* | 任务标识 | string |

**响应**

| HTTP 状态码 | 说明 | 数据模型 |
|-------------|------|----------|
| 200 | OK | 无内容 |
| 201 | 已创建 | 无内容 |
| 401 | 未授权 | 无内容 |
| 403 | 禁止访问 | 无内容 |
| 404 | 未找到 | 无内容 |

**示例**

请求：

```http
DELETE /open/v1/project/{{projectId}}/task/{{taskId}} HTTP/1.1
Host: api.dida365.com
Authorization: Bearer {{token}}
```

#### 移动任务

```
POST /open/v1/task/move
```

在项目之间移动一个或多个任务。

**请求体**

JSON 数组，包含任务移动操作。

| 类型 | 参数名 | 说明 | 数据类型 |
|------|--------|------|----------|
| Body | **fromProjectId** *必填* | 源项目 ID | string |
| Body | **toProjectId** *必填* | 目标项目 ID | string |
| Body | **taskId** *必填* | 要移动的任务 ID | string |

**响应**

| HTTP 状态码 | 说明 | 数据模型 |
|-------------|------|----------|
| 200 | OK | 返回移动结果数组，包含任务 ID 和新的 etag |
| 201 | 已创建 | 无内容 |
| 401 | 未授权 | 无内容 |
| 403 | 禁止访问 | 无内容 |
| 404 | 未找到 | 无内容 |

**示例**

请求：

```http
POST /open/v1/task/move HTTP/1.1
Host: api.dida365.com
Authorization: Bearer {{token}}

[
  {
    "fromProjectId": "69a850ef1c20d2030e148fdd",
    "toProjectId": "69a850f41c20d2030e148fdf",
    "taskId": "69a850f8b9061f374d54a046"
  }
]
```

响应：

```json
[
  {
    "id": "69a850f8b9061f374d54a046",
    "etag": "43p2zso1"
  }
]
```

#### 获取已完成任务列表

```
POST /open/v1/task/completed
```

获取指定项目和时间范围内已标记为完成的任务列表。

**请求体**

JSON 对象，包含筛选条件。所有字段均为可选，但建议至少提供一个筛选条件以缩小结果范围。

| 类型 | 参数名 | 说明 | 数据类型 |
|------|--------|------|----------|
| Body | **projectIds** | 项目标识列表 | list |
| Body | **startDate** | 时间范围起始（包含）。筛选 completedTime >= startDate 的任务 | date |
| Body | **endDate** | 时间范围截止（包含）。筛选 completedTime <= endDate 的任务 | date |

**响应**

| HTTP 状态码 | 说明 | 数据模型 |
|-------------|------|----------|
| 200 | OK | < [Task](#task) > 数组 |
| 201 | 已创建 | 无内容 |
| 401 | 未授权 | 无内容 |
| 403 | 禁止访问 | 无内容 |
| 404 | 未找到 | 无内容 |

**示例**

请求：

```http
POST /open/v1/task/completed HTTP/1.1
Host: api.dida365.com
Authorization: Bearer {{token}}

{
  "projectIds": ["69a850f41c20d2030e148fdf"],
  "startDate": "2026-03-01T00:58:20.000+0000",
  "endDate": "2026-03-05T10:58:20.000+0000"
}
```

响应：

```json
[
  {
    "id": "69a850f8b9061f374d54a046",
    "projectId": "69a850f41c20d2030e148fdf",
    "sortOrder": -1099511627776,
    "title": "update",
    "content": "",
    "timeZone": "America/Los_Angeles",
    "isAllDay": false,
    "priority": 0,
    "completedTime": "2026-03-04T23:58:20.000+0000",
    "status": 2,
    "etag": "t3kc5m5f",
    "kind": "TEXT"
  }
]
```

#### 筛选任务

```
POST /open/v1/task/filter
```

根据高级筛选条件获取任务列表，包括项目范围、日期范围、优先级、标签和状态。

**参数**

| 类型 | 参数名 | 说明 | 数据类型 |
|------|--------|------|----------|
| Body | **projectIds** | 筛选属于指定项目 ID 的任务 | list |
| Body | **startDate** | 筛选 startDate >= startDate 的任务 | date |
| Body | **endDate** | 筛选 startDate <= endDate 的任务 | date |
| Body | **priority** | 按优先级筛选。有效值：无(0)、低(1)、中(3)、高(5) | list |
| Body | **tag** | 筛选包含所有指定标签的任务 | list |
| Body | **status** | 按状态码筛选任务（如 `[0]` 表示未完成，`[2]` 表示已完成） | list |

**响应**

| HTTP 状态码 | 说明 | 数据模型 |
|-------------|------|----------|
| 200 | OK | < [Task](#task) > 数组 |
| 201 | 已创建 | 无内容 |
| 401 | 未授权 | 无内容 |
| 403 | 禁止访问 | 无内容 |
| 404 | 未找到 | 无内容 |

**示例**

请求：

```http
POST /open/v1/task/filter HTTP/1.1
Host: api.dida365.com
Authorization: Bearer {{token}}

{
  "projectIds": ["69a850f41c20d2030e148fdf"],
  "startDate": "2026-03-01T00:58:20.000+0000",
  "endDate": "2026-03-06T10:58:20.000+0000",
  "priority": [0],
  "tag": ["urgent"],
  "status": [0]
}
```

响应：

```json
[
  {
    "id": "69a85785b9061f3c217e9de6",
    "projectId": "69a850f41c20d2030e148fdf",
    "sortOrder": -2199023255552,
    "title": "task1",
    "content": "",
    "desc": "",
    "startDate": "2026-03-05T00:00:00.000+0000",
    "dueDate": "2026-03-05T00:00:00.000+0000",
    "timeZone": "America/Los_Angeles",
    "isAllDay": false,
    "priority": 0,
    "status": 0,
    "tags": ["tag"],
    "etag": "cic6e3cg",
    "kind": "TEXT"
  },
  {
    "id": "69a8ea79b9061f4d803f6b32",
    "projectId": "69a850f41c20d2030e148fdf",
    "sortOrder": -3298534883328,
    "title": "task2",
    "content": "",
    "startDate": "2026-03-05T00:00:00.000+0000",
    "dueDate": "2026-03-05T00:00:00.000+0000",
    "timeZone": "America/Los_Angeles",
    "isAllDay": false,
    "priority": 0,
    "status": 0,
    "tags": ["tag"],
    "etag": "0nvpcxzh",
    "kind": "TEXT"
  }
]
```

### 项目（Project）

#### 获取用户所有项目

```
GET /open/v1/project
```

**响应**

| HTTP 状态码 | 说明 | 数据模型 |
|-------------|------|----------|
| 200 | OK | < [Project](#project) > 数组 |
| 401 | 未授权 | 无内容 |
| 403 | 禁止访问 | 无内容 |
| 404 | 未找到 | 无内容 |

**示例**

请求：

```http
GET /open/v1/project HTTP/1.1
Host: api.dida365.com
Authorization: Bearer {{token}}
```

响应：

```json
[
  {
    "id": "6226ff9877acee87727f6bca",
    "name": "项目名称",
    "color": "#F18181",
    "closed": false,
    "groupId": "6436176a47fd2e05f26ef56e",
    "viewMode": "list",
    "permission": "write",
    "kind": "TASK"
  }
]
```

#### 根据 ID 获取项目

```
GET /open/v1/project/{projectId}
```

**参数**

| 类型 | 参数名 | 说明 | 数据类型 |
|------|--------|------|----------|
| Path | **projectId** *必填* | 项目标识 | string |

**响应**

| HTTP 状态码 | 说明 | 数据模型 |
|-------------|------|----------|
| 200 | OK | [Project](#project) |
| 401 | 未授权 | 无内容 |
| 403 | 禁止访问 | 无内容 |
| 404 | 未找到 | 无内容 |

**示例**

请求：

```http
GET /open/v1/project/{{projectId}} HTTP/1.1
Host: api.dida365.com
Authorization: Bearer {{token}}
```

响应：

```json
{
  "id": "6226ff9877acee87727f6bca",
  "name": "项目名称",
  "color": "#F18181",
  "closed": false,
  "groupId": "6436176a47fd2e05f26ef56e",
  "viewMode": "list",
  "kind": "TASK"
}
```

#### 获取项目及其数据

```
GET /open/v1/project/{projectId}/data
```

**参数**

| 类型 | 参数名 | 说明 | 数据类型 |
|------|--------|------|----------|
| Path | **projectId** *必填* | 项目标识，支持 "inbox" | string |

**响应**

| HTTP 状态码 | 说明 | 数据模型 |
|-------------|------|----------|
| 200 | OK | [ProjectData](#projectdata) |
| 401 | 未授权 | 无内容 |
| 403 | 禁止访问 | 无内容 |
| 404 | 未找到 | 无内容 |

**示例**

请求：

```http
GET /open/v1/project/{{projectId}}/data HTTP/1.1
Host: api.dida365.com
Authorization: Bearer {{token}}
```

响应：

```json
{
  "project": {
    "id": "6226ff9877acee87727f6bca",
    "name": "项目名称",
    "color": "#F18181",
    "closed": false,
    "groupId": "6436176a47fd2e05f26ef56e",
    "viewMode": "list",
    "kind": "TASK"
  },
  "tasks": [
    {
      "id": "6247ee29630c800f064fd145",
      "isAllDay": true,
      "projectId": "6226ff9877acee87727f6bca",
      "title": "任务标题",
      "content": "任务内容",
      "desc": "任务描述",
      "timeZone": "America/Los_Angeles",
      "repeatFlag": "RRULE:FREQ=DAILY;INTERVAL=1",
      "startDate": "2019-11-13T03:00:00+0000",
      "dueDate": "2019-11-14T03:00:00+0000",
      "reminders": ["TRIGGER:P0DT9H0M0S", "TRIGGER:PT0S"],
      "priority": 1,
      "status": 0,
      "completedTime": "2019-11-13T03:00:00+0000",
      "sortOrder": 12345,
      "items": [
        {
          "id": "6435074647fd2e6387145f20",
          "status": 0,
          "title": "子任务标题",
          "sortOrder": 12345,
          "startDate": "2019-11-13T03:00:00+0000",
          "isAllDay": false,
          "timeZone": "America/Los_Angeles",
          "completedTime": "2019-11-13T03:00:00+0000"
        }
      ]
    }
  ],
  "columns": [
    {
      "id": "6226ff9e76e5fc39f2862d1b",
      "projectId": "6226ff9877acee87727f6bca",
      "name": "列名称",
      "sortOrder": 0
    }
  ]
}
```

#### 创建项目

```
POST /open/v1/project
```

**参数**

| 类型 | 参数名 | 说明 | 数据类型 |
|------|--------|------|----------|
| Body | name *必填* | 项目名称 | string |
| Body | color | 项目颜色，如 `"#F18181"` | string |
| Body | sortOrder | 项目排序值 | integer (int64) |
| Body | viewMode | 视图模式：`"list"`、`"kanban"`、`"timeline"` | string |
| Body | kind | 项目类型：`"TASK"`、`"NOTE"` | string |

**响应**

| HTTP 状态码 | 说明 | 数据模型 |
|-------------|------|----------|
| 200 | OK | [Project](#project) |
| 201 | 已创建 | 无内容 |
| 401 | 未授权 | 无内容 |
| 403 | 禁止访问 | 无内容 |
| 404 | 未找到 | 无内容 |

**示例**

请求：

```http
POST /open/v1/project HTTP/1.1
Host: api.dida365.com
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "name": "项目名称",
  "color": "#F18181",
  "viewMode": "list",
  "kind": "task"
}
```

响应：

```json
{
  "id": "6226ff9877acee87727f6bca",
  "name": "项目名称",
  "color": "#F18181",
  "sortOrder": 0,
  "viewMode": "list",
  "kind": "TASK"
}
```

#### 更新项目

```
POST /open/v1/project/{projectId}
```

**参数**

| 类型 | 参数名 | 说明 | 数据类型 |
|------|--------|------|----------|
| Path | projectId *必填* | 项目标识 | string |
| Body | name | 项目名称 | string |
| Body | color | 项目颜色 | string |
| Body | sortOrder | 排序值，默认 0 | integer (int64) |
| Body | viewMode | 视图模式：`"list"`、`"kanban"`、`"timeline"` | string |
| Body | kind | 项目类型：`"TASK"`、`"NOTE"` | string |

**响应**

| HTTP 状态码 | 说明 | 数据模型 |
|-------------|------|----------|
| 200 | OK | [Project](#project) |
| 201 | 已创建 | 无内容 |
| 401 | 未授权 | 无内容 |
| 403 | 禁止访问 | 无内容 |
| 404 | 未找到 | 无内容 |

**示例**

请求：

```http
POST /open/v1/project/{{projectId}} HTTP/1.1
Host: api.dida365.com
Content-Type: application/json
Authorization: Bearer {{token}}

{
  "name": "项目名称",
  "color": "#F18181",
  "viewMode": "list",
  "kind": "TASK"
}
```

响应：

```json
{
  "id": "6226ff9877acee87727f6bca",
  "name": "项目名称",
  "color": "#F18181",
  "sortOrder": 0,
  "viewMode": "list",
  "kind": "TASK"
}
```

#### 删除项目

```
DELETE /open/v1/project/{projectId}
```

**参数**

| 类型 | 参数名 | 说明 | 数据类型 |
|------|--------|------|----------|
| Path | **projectId** *必填* | 项目标识 | string |

**响应**

| HTTP 状态码 | 说明 | 数据模型 |
|-------------|------|----------|
| 200 | OK | 无内容 |
| 401 | 未授权 | 无内容 |
| 403 | 禁止访问 | 无内容 |
| 404 | 未找到 | 无内容 |

**示例**

请求：

```http
DELETE /open/v1/project/{{projectId}} HTTP/1.1
Host: api.dida365.com
Authorization: Bearer {{token}}
```

## 数据模型

### ChecklistItem（清单项）

| 字段名 | 说明 | 数据类型 |
|--------|------|----------|
| **id** | 子任务标识 | string |
| **title** | 子任务标题 | string |
| **status** | 完成状态。正常：`0`，已完成：`1` | integer (int32) |
| **completedTime** | 完成时间，格式：`"yyyy-MM-dd'T'HH:mm:ssZ"`。**示例**：`"2019-11-13T03:00:00+0000"` | string (date-time) |
| **isAllDay** | 是否全天 | boolean |
| **sortOrder** | 排序值。**示例**：`234444` | integer (int64) |
| **startDate** | 开始日期时间，格式：`"yyyy-MM-dd'T'HH:mm:ssZ"`。**示例**：`"2019-11-13T03:00:00+0000"` | string (date-time) |
| **timeZone** | 时区。**示例**：`"America/Los_Angeles"` | string |

### Task（任务）

| 字段名 | 说明 | 数据类型 |
|--------|------|----------|
| **id** | 任务标识 | string |
| **projectId** | 所属项目 ID | string |
| **title** | 任务标题 | string |
| **isAllDay** | 是否全天 | boolean |
| **completedTime** | 完成时间，格式：`"yyyy-MM-dd'T'HH:mm:ssZ"`。**示例**：`"2019-11-13T03:00:00+0000"` | string (date-time) |
| **content** | 任务内容 | string |
| **desc** | 清单描述 | string |
| **dueDate** | 截止日期时间，格式：`"yyyy-MM-dd'T'HH:mm:ssZ"`。**示例**：`"2019-11-13T03:00:00+0000"` | string (date-time) |
| **items** | 子任务列表 | < [ChecklistItem](#checklistitem清单项) > 数组 |
| **priority** | 优先级。无：`0`，低：`1`，中：`3`，高：`5` | integer (int32) |
| **reminders** | 提醒触发器列表。**示例**：`["TRIGGER:P0DT9H0M0S", "TRIGGER:PT0S"]` | < string > 数组 |
| **repeatFlag** | 重复规则。**示例**：`"RRULE:FREQ=DAILY;INTERVAL=1"` | string |
| **sortOrder** | 排序值。**示例**：`12345` | integer (int64) |
| **startDate** | 开始日期时间，格式：`"yyyy-MM-dd'T'HH:mm:ssZ"`。**示例**：`"2019-11-13T03:00:00+0000"` | string (date-time) |
| **status** | 完成状态。正常：`0`，已完成：`2` | integer (int32) |
| **timeZone** | 时区。**示例**：`"America/Los_Angeles"` | string |
| **kind** | 类型：`"TEXT"`、`"NOTE"`、`"CHECKLIST"` | string |

### Project（项目）

| 字段名 | 说明 | 数据类型 |
|--------|------|----------|
| **id** | 项目标识 | string |
| **name** | 项目名称 | string |
| **color** | 项目颜色 | string |
| **sortOrder** | 排序值 | integer (int64) |
| **closed** | 是否已关闭 | boolean |
| **groupId** | 项目分组标识 | string |
| **viewMode** | 视图模式：`"list"`、`"kanban"`、`"timeline"` | string |
| **permission** | 权限：`"read"`、`"write"` 或 `"comment"` | string |
| **kind** | 类型：`"TASK"` 或 `"NOTE"` | string |

### Column（列）

| 字段名 | 说明 | 数据类型 |
|--------|------|----------|
| id | 列标识 | string |
| projectId | 项目标识 | string |
| name | 列名称 | string |
| sortOrder | 排序值 | integer (int64) |

### ProjectData（项目数据）

| 字段名 | 说明 | 数据类型 |
|--------|------|----------|
| project | 项目信息 | [Project](#project项目) |
| tasks | 项目下未完成的任务 | < [Task](#task任务) > 数组 |
| columns | 项目下的列 | < [Column](#column列) > 数组 |

## 反馈与支持

如果你对滴答清单 Open API 文档有任何问题或反馈，请通过 [support@dida365.com](mailto:support@dida365.com) 联系我们。感谢你选择滴答清单！
