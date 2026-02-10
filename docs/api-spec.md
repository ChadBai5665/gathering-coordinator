# API 接口规范 — 碰个头 (OnTheWay)

> 版本：v0.1.0 | 最后更新：2025-02

---

## 通用规范

### Base URL

- 开发环境：`http://localhost:3000`
- 生产环境：`https://<your-domain>/api`

### 请求格式

- Content-Type: `application/json`
- 认证：`Authorization: Bearer <token>`（除登录接口外均需要）

### 统一响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": T
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "人类可读的错误描述"
  }
}
```

### 通用错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-------------|------|
| `AUTH_REQUIRED` | 401 | 未提供 Token 或 Token 无效 |
| `FORBIDDEN` | 403 | 无权执行此操作 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 400 | 请求参数校验失败 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

---

## 1. 认证接口

### 1.1 游客登录

创建匿名用户，获取访问令牌。

```
POST /api/auth/guest
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `nickname` | string | 是 | 用户昵称，2-20 字符 |

**请求示例：**

```json
{
  "nickname": "小明"
}
```

**成功响应（200）：**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid-string",
      "nickname": "小明",
      "avatarUrl": null,
      "createdAt": "2025-02-10T12:00:00Z"
    }
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| `VALIDATION_ERROR` | nickname 为空或超出长度限制 |

---

### 1.2 微信登录

通过微信小程序 code 换取用户信息和令牌。

```
POST /api/auth/wechat
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | string | 是 | wx.login() 获取的临时登录凭证 |

**请求示例：**

```json
{
  "code": "0a1b2c3d4e5f"
}
```

**成功响应（200）：**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid-string",
      "nickname": null,
      "avatarUrl": null,
      "openid": "wx_openid_string",
      "createdAt": "2025-02-10T12:00:00Z"
    }
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| `VALIDATION_ERROR` | code 为空 |
| `WX_AUTH_FAILED` | 微信 code2session 调用失败 |

---

## 2. 聚会接口

### 2.1 创建聚会

创建新聚会，当前用户自动成为发起人和第一个参与者。

```
POST /api/gatherings
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 聚会名称，2-50 字符 |
| `targetTime` | string | 是 | 目标到达时间，ISO 8601 格式 |
| `location` | object | 否 | 发起人当前位置 |
| `location.lat` | number | 是 | 纬度 |
| `location.lng` | number | 是 | 经度 |
| `locationName` | string | 否 | 位置名称 |
| `tastes` | string[] | 否 | 口味偏好标签 |

**请求示例：**

```json
{
  "name": "周五火锅局",
  "targetTime": "2025-02-14T18:30:00+08:00",
  "location": {
    "lat": 39.9042,
    "lng": 116.4074
  },
  "locationName": "国贸大厦",
  "tastes": ["火锅", "川菜"]
}
```

**成功响应（201）：**

```json
{
  "success": true,
  "data": {
    "gathering": {
      "id": "uuid-string",
      "code": "A3K9F2",
      "name": "周五火锅局",
      "status": "waiting",
      "targetTime": "2025-02-14T18:30:00+08:00",
      "creatorId": "uuid-string",
      "version": 1,
      "createdAt": "2025-02-10T12:00:00Z",
      "participants": [
        {
          "id": "uuid-string",
          "userId": "uuid-string",
          "nickname": "小明",
          "location": { "lat": 39.9042, "lng": 116.4074 },
          "locationName": "国贸大厦",
          "tastes": ["火锅", "川菜"],
          "status": "joined",
          "isCreator": true
        }
      ],
      "restaurants": [],
      "votes": []
    }
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| `VALIDATION_ERROR` | 参数校验失败 |
| `AUTH_REQUIRED` | 未登录 |

---

### 2.2 获取聚会详情

根据邀请码获取聚会完整信息。

```
GET /api/gatherings/:code
```

**路径参数：**

| 参数 | 说明 |
|------|------|
| `code` | 6 位聚会邀请码 |

**成功响应（200）：**

```json
{
  "success": true,
  "data": {
    "gathering": {
      "id": "uuid-string",
      "code": "A3K9F2",
      "name": "周五火锅局",
      "status": "waiting",
      "targetTime": "2025-02-14T18:30:00+08:00",
      "creatorId": "uuid-string",
      "confirmedRestaurant": null,
      "version": 3,
      "createdAt": "2025-02-10T12:00:00Z",
      "participants": [...],
      "restaurants": [...],
      "votes": [...]
    }
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| `NOT_FOUND` | 邀请码不存在 |

---

### 2.3 我的聚会列表

获取当前用户参与的所有聚会。

```
GET /api/gatherings/mine
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `status` | string | 否 | 按状态过滤：`active`（进行中）/ `completed`（已完成） |
| `limit` | number | 否 | 返回数量，默认 20 |
| `offset` | number | 否 | 偏移量，默认 0 |

**成功响应（200）：**

```json
{
  "success": true,
  "data": {
    "gatherings": [
      {
        "id": "uuid-string",
        "code": "A3K9F2",
        "name": "周五火锅局",
        "status": "waiting",
        "targetTime": "2025-02-14T18:30:00+08:00",
        "participantCount": 4,
        "createdAt": "2025-02-10T12:00:00Z"
      }
    ],
    "total": 5
  }
}
```

---

### 2.4 加入聚会

通过邀请码加入聚会，提交个人信息。

```
POST /api/gatherings/:code/join
```

**路径参数：**

| 参数 | 说明 |
|------|------|
| `code` | 6 位聚会邀请码 |

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `nickname` | string | 是 | 昵称，2-20 字符 |
| `location` | object | 是 | 当前位置 |
| `location.lat` | number | 是 | 纬度 |
| `location.lng` | number | 是 | 经度 |
| `locationName` | string | 否 | 位置名称 |
| `tastes` | string[] | 否 | 口味偏好标签 |

**请求示例：**

```json
{
  "nickname": "小红",
  "location": {
    "lat": 39.9142,
    "lng": 116.3974
  },
  "locationName": "望京 SOHO",
  "tastes": ["日料", "火锅"]
}
```

**成功响应（200）：**

```json
{
  "success": true,
  "data": {
    "participant": {
      "id": "uuid-string",
      "userId": "uuid-string",
      "nickname": "小红",
      "location": { "lat": 39.9142, "lng": 116.3974 },
      "locationName": "望京 SOHO",
      "tastes": ["日料", "火锅"],
      "status": "joined",
      "isCreator": false
    }
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| `NOT_FOUND` | 邀请码不存在 |
| `ALREADY_JOINED` | 已加入该聚会 |
| `GATHERING_FULL` | 聚会人数已满（上限 10 人） |
| `INVALID_STATE` | 聚会状态不允许加入（已完成等） |

---

### 2.5 发起推荐

触发 AI 餐厅推荐，仅发起人可操作。

```
POST /api/gatherings/:code/recommend
```

**路径参数：**

| 参数 | 说明 |
|------|------|
| `code` | 6 位聚会邀请码 |

**请求体：** 无

**成功响应（200）：**

```json
{
  "success": true,
  "data": {
    "restaurants": [
      {
        "index": 0,
        "name": "海底捞火锅（望京店）",
        "address": "北京市朝阳区望京街9号",
        "cuisine": "火锅",
        "rating": 4.5,
        "pricePerPerson": 120,
        "location": { "lat": 39.9100, "lng": 116.4020 },
        "reason": "位于所有人的中心位置，火锅是大家共同的偏好，评分高且人均适中",
        "distances": [
          { "nickname": "小明", "distance": "2.3km", "duration": "15分钟" },
          { "nickname": "小红", "distance": "1.8km", "duration": "12分钟" }
        ]
      },
      {
        "index": 1,
        "name": "...",
        "...": "..."
      },
      {
        "index": 2,
        "name": "...",
        "...": "..."
      }
    ]
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| `FORBIDDEN` | 非发起人无权操作 |
| `INVALID_STATE` | 聚会状态不允许推荐（需要 `waiting` 状态） |
| `TOO_FEW_PARTICIPANTS` | 参与者不足（至少 2 人） |
| `RECOMMEND_FAILED` | AI 推荐服务调用失败 |

---

### 2.6 发起投票

对某个推荐餐厅发起投票，仅发起人可操作。

```
POST /api/gatherings/:code/vote
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `restaurantIndex` | number | 是 | 推荐餐厅的索引（0-2） |

**请求示例：**

```json
{
  "restaurantIndex": 0
}
```

**成功响应（201）：**

```json
{
  "success": true,
  "data": {
    "vote": {
      "id": "uuid-string",
      "restaurantIndex": 0,
      "restaurantName": "海底捞火锅（望京店）",
      "status": "active",
      "agreeCount": 0,
      "disagreeCount": 0,
      "totalParticipants": 4,
      "records": [],
      "createdAt": "2025-02-10T12:30:00Z"
    }
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| `FORBIDDEN` | 非发起人无权操作 |
| `INVALID_STATE` | 聚会状态不允许发起投票（需要 `recommended` 状态） |
| `VALIDATION_ERROR` | restaurantIndex 超出范围 |

---

### 2.7 投票

参与者对当前投票进行投票。

```
POST /api/gatherings/:code/vote/:voteId
```

**路径参数：**

| 参数 | 说明 |
|------|------|
| `code` | 6 位聚会邀请码 |
| `voteId` | 投票 ID |

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `agree` | boolean | 是 | true=同意，false=反对 |

**请求示例：**

```json
{
  "agree": true
}
```

**成功响应（200）：**

```json
{
  "success": true,
  "data": {
    "vote": {
      "id": "uuid-string",
      "status": "active",
      "agreeCount": 3,
      "disagreeCount": 1,
      "totalParticipants": 4,
      "records": [
        { "userId": "uuid", "nickname": "小明", "agree": true },
        { "userId": "uuid", "nickname": "小红", "agree": true },
        { "userId": "uuid", "nickname": "小刚", "agree": true },
        { "userId": "uuid", "nickname": "小丽", "agree": false }
      ],
      "result": "approved"
    }
  }
}
```

**投票结果判定：**

- `agreeCount > totalParticipants / 2` → `result: "approved"`，聚会状态变为 `confirmed`
- `disagreeCount >= totalParticipants / 2` → `result: "rejected"`，聚会状态回到 `recommended`
- 否则 → `result: null`，投票继续

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| `NOT_FOUND` | 投票不存在 |
| `ALREADY_VOTED` | 已投过票 |
| `INVALID_STATE` | 投票已结束 |
| `NOT_PARTICIPANT` | 非聚会参与者 |

---

### 2.8 标记出发

参与者标记自己已出发。

```
POST /api/gatherings/:code/depart
```

**路径参数：**

| 参数 | 说明 |
|------|------|
| `code` | 6 位聚会邀请码 |

**请求体：** 无

**成功响应（200）：**

```json
{
  "success": true,
  "data": {
    "participant": {
      "id": "uuid-string",
      "nickname": "小明",
      "status": "departed",
      "departedAt": "2025-02-14T17:45:00Z"
    }
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| `INVALID_STATE` | 聚会未确认餐厅，或参与者已出发/到达 |
| `NOT_PARTICIPANT` | 非聚会参与者 |

---

### 2.9 标记到达

参与者标记自己已到达。

```
POST /api/gatherings/:code/arrive
```

**路径参数：**

| 参数 | 说明 |
|------|------|
| `code` | 6 位聚会邀请码 |

**请求体：** 无

**成功响应（200）：**

```json
{
  "success": true,
  "data": {
    "participant": {
      "id": "uuid-string",
      "nickname": "小明",
      "status": "arrived",
      "arrivedAt": "2025-02-14T18:25:00Z"
    },
    "allArrived": false
  }
}
```

当 `allArrived: true` 时，聚会状态自动变为 `completed`。

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| `INVALID_STATE` | 参与者未出发，或已到达 |
| `NOT_PARTICIPANT` | 非聚会参与者 |

---

### 2.10 轮询更新

小程序端轮询获取聚会最新状态（Web 端使用 Supabase Realtime，不需要此接口）。

```
GET /api/gatherings/:code/poll?version=N
```

**路径参数：**

| 参数 | 说明 |
|------|------|
| `code` | 6 位聚会邀请码 |

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `version` | number | 是 | 客户端当前数据版本号 |

**成功响应 — 有更新（200）：**

```json
{
  "success": true,
  "data": {
    "gathering": { "...完整聚会数据..." },
    "version": 5,
    "messages": [
      {
        "type": "participant_joined",
        "content": "小红加入了聚会",
        "timestamp": "2025-02-10T12:15:00Z"
      },
      {
        "type": "nudge",
        "content": "小明还没出发，催他一下！",
        "timestamp": "2025-02-14T17:50:00Z"
      }
    ]
  }
}
```

**成功响应 — 无更新（200）：**

```json
{
  "success": true,
  "data": {
    "gathering": null,
    "version": 3,
    "messages": []
  }
}
```

**消息类型（messages.type）：**

| 类型 | 说明 |
|------|------|
| `participant_joined` | 有人加入聚会 |
| `recommend_ready` | 推荐结果已生成 |
| `vote_started` | 投票已发起 |
| `vote_passed` | 投票通过 |
| `vote_rejected` | 投票未通过 |
| `departed` | 有人已出发 |
| `arrived` | 有人已到达 |
| `nudge` | 催促消息 |
| `all_arrived` | 全员到达 |

---

## 3. 聚会状态机

```
waiting → recommending → recommended → voting → confirmed → completed
                ↑              │          │
                └──────────────┘          │
                  （重新推荐）      （投票未通过，
                                    回到 recommended）
```

| 状态 | 说明 | 允许的操作 |
|------|------|------------|
| `waiting` | 等待参与者加入 | join, recommend |
| `recommending` | AI 推荐中 | （等待） |
| `recommended` | 推荐完成 | vote（发起投票）, recommend（重新推荐） |
| `voting` | 投票进行中 | vote/:voteId（投票） |
| `confirmed` | 餐厅已确认 | depart, arrive |
| `completed` | 全员到达，聚会完成 | （无） |
