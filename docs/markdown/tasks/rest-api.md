# REST API Reference

The REST API provides HTTP endpoints for task management. Use these for simpler integrations or when WebSocket is not practical.

**Base URL:** `http://localhost:3300`

> **Note:** For real-time progress updates, use the [WebSocket API](./websocket-api.md). The REST API is best for task submission, status polling, and management operations.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/tasks` | Submit a new task |
| `GET` | `/tasks` | List tasks |
| `GET` | `/tasks/:id` | Get task details |
| `POST` | `/tasks/:id/cancel` | Cancel a task |

---

## Submit Task

**`POST /tasks`**

Submit a new task for execution.

### Request

```http
POST /tasks HTTP/1.1
Host: localhost:3300
Content-Type: application/json

{
  "task_name": "Search Google",
  "task_intention": "Search for browser automation tools",
  "instanceId": "inst_1234567890_abc",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to Google",
      "args": { "action": "goto", "url": "https://www.google.com" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Type search query",
      "args": { "action": "type", "selector": "textarea[name=q]", "text": "browser automation" }
    }
  ],
  "metadata": {
    "client": "my-app"
  }
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `task_name` | string | Yes | Human-readable task name |
| `task_intention` | string | Yes | Description of task goal |
| `instanceId` | string | No | Target browser instance ID. If omitted, uses first connected instance |
| `commands` | array | Yes | Array of commands to execute (must have at least 1) |
| `metadata` | object | No | Custom metadata passed through to responses |

**Command Object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tool_name` | string | Yes | MCP tool name (e.g., `browser_navigate`, `browser_interact`) |
| `intention` | string | Yes | Description of command purpose |
| `args` | object | Yes | Tool-specific arguments |

### Response

**Success (200 OK):**

```json
{
  "taskId": "task_1234567890_1",
  "queuePosition": 1,
  "wsEndpoint": "ws://localhost:3400"
}
```

| Field | Description |
|-------|-------------|
| `taskId` | Unique task identifier for tracking |
| `queuePosition` | Position in queue (1 = running or next to run) |
| `wsEndpoint` | WebSocket URL for real-time progress updates |

**Error (400 Bad Request):**

```json
{
  "error": "No commands provided"
}
```

**Error (503 Service Unavailable):**

```json
{
  "error": "No connected browser instances"
}
```

### cURL Example

```bash
curl -X POST http://localhost:3300/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "Navigate Test",
    "task_intention": "Test navigation",
    "commands": [
      {"tool_name": "browser_navigate", "intention": "Go to example", "args": {"action": "goto", "url": "https://example.com"}}
    ]
  }'
```

---

## List Tasks

**`GET /tasks`**

List all tasks with optional filtering.

### Request

```http
GET /tasks?instanceId=inst_123&status=running HTTP/1.1
Host: localhost:3300
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | No | Filter by browser instance ID |
| `status` | string | No | Filter by status: `queued`, `running`, `completed`, `failed`, `cancelled` |

### Response

**Success (200 OK):**

```json
{
  "tasks": [
    {
      "id": "task_1234567890_2",
      "instanceId": "inst_1234567890_abc",
      "name": "Search Google",
      "intention": "Search for browser automation tools",
      "status": "running",
      "commandCount": 3,
      "currentCommandIndex": 1,
      "createdAt": 1234567890100,
      "startedAt": 1234567890200
    },
    {
      "id": "task_1234567890_1",
      "instanceId": "inst_1234567890_abc",
      "name": "Navigate Test",
      "intention": "Test navigation",
      "status": "completed",
      "commandCount": 1,
      "currentCommandIndex": 0,
      "createdAt": 1234567890000,
      "startedAt": 1234567890050,
      "completedAt": 1234567890100
    }
  ]
}
```

Tasks are sorted by `createdAt` descending (newest first).

### cURL Examples

```bash
# List all tasks
curl http://localhost:3300/tasks

# List running tasks
curl "http://localhost:3300/tasks?status=running"

# List tasks for a specific instance
curl "http://localhost:3300/tasks?instanceId=inst_1234567890_abc"

# Combined filters
curl "http://localhost:3300/tasks?instanceId=inst_1234567890_abc&status=queued"
```

---

## Get Task Details

**`GET /tasks/:id`**

Get detailed information about a specific task.

### Request

```http
GET /tasks/task_1234567890_1 HTTP/1.1
Host: localhost:3300
```

### Response

**Success (200 OK):**

```json
{
  "task": {
    "id": "task_1234567890_1",
    "instanceId": "inst_1234567890_abc",
    "name": "Search Google",
    "intention": "Search for browser automation tools",
    "status": "completed",
    "currentCommandIndex": 2,
    "createdAt": 1234567890000,
    "startedAt": 1234567890100,
    "completedAt": 1234567892000,
    "metadata": {
      "client": "my-app"
    },
    "commands": [
      {
        "id": "task_1234567890_1_cmd_0",
        "tool_name": "browser_navigate",
        "intention": "Go to Google",
        "args": { "action": "goto", "url": "https://www.google.com" },
        "status": "success",
        "startedAt": 1234567890100,
        "completedAt": 1234567890500,
        "result": {
          "content": [{ "type": "text", "text": "{\"success\": true}" }]
        }
      },
      {
        "id": "task_1234567890_1_cmd_1",
        "tool_name": "browser_interact",
        "intention": "Type search query",
        "args": { "action": "type", "selector": "textarea[name=q]", "text": "browser automation" },
        "status": "success",
        "startedAt": 1234567890500,
        "completedAt": 1234567891500,
        "result": {
          "content": [{ "type": "text", "text": "{\"success\": true}" }]
        }
      },
      {
        "id": "task_1234567890_1_cmd_2",
        "tool_name": "browser_interact",
        "intention": "Press Enter",
        "args": { "action": "keyboard", "key": "Enter" },
        "status": "success",
        "startedAt": 1234567891500,
        "completedAt": 1234567892000,
        "result": {
          "content": [{ "type": "text", "text": "{\"success\": true}" }]
        }
      }
    ]
  }
}
```

**Not Found (404):**

```json
{
  "error": "Task not found"
}
```

### cURL Example

```bash
curl http://localhost:3300/tasks/task_1234567890_1
```

---

## Cancel Task

**`POST /tasks/:id/cancel`**

Cancel a queued or running task.

### Request

```http
POST /tasks/task_1234567890_1/cancel HTTP/1.1
Host: localhost:3300
```

### Response

**Success (200 OK):**

```json
{
  "success": true,
  "taskId": "task_1234567890_1"
}
```

**Task Not Found (404):**

```json
{
  "error": "Task not found"
}
```

**Cannot Cancel (400):**

```json
{
  "success": false,
  "reason": "Task already completed"
}
```

### cURL Example

```bash
curl -X POST http://localhost:3300/tasks/task_1234567890_1/cancel
```

---

## Workflow Example

### Submit and Poll

When WebSocket is not available, use polling to track task progress:

```bash
#!/bin/bash

# 1. Submit task
RESPONSE=$(curl -s -X POST http://localhost:3300/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "Example Task",
    "task_intention": "Navigate to example.com",
    "commands": [
      {"tool_name": "browser_navigate", "intention": "Navigate", "args": {"action": "goto", "url": "https://example.com"}}
    ]
  }')

TASK_ID=$(echo $RESPONSE | jq -r '.taskId')
echo "Task submitted: $TASK_ID"

# 2. Poll for completion
while true; do
  TASK=$(curl -s http://localhost:3300/tasks/$TASK_ID)
  STATUS=$(echo $TASK | jq -r '.task.status')

  echo "Status: $STATUS"

  if [ "$STATUS" == "completed" ] || [ "$STATUS" == "failed" ] || [ "$STATUS" == "cancelled" ]; then
    echo "Task finished with status: $STATUS"
    echo $TASK | jq '.task.commands'
    break
  fi

  sleep 1
done
```

### JavaScript Example

```javascript
const axios = require('axios');

async function runTask() {
  const BASE_URL = 'http://localhost:3300';

  // Submit task
  const submitRes = await axios.post(`${BASE_URL}/tasks`, {
    task_name: 'Screenshot Task',
    task_intention: 'Navigate and take screenshot',
    commands: [
      {
        tool_name: 'browser_navigate',
        intention: 'Go to example.com',
        args: { action: 'goto', url: 'https://example.com' }
      },
      {
        tool_name: 'browser_content',
        intention: 'Take screenshot',
        args: { action: 'screenshot' }
      }
    ]
  });

  const { taskId, wsEndpoint } = submitRes.data;
  console.log(`Task ${taskId} submitted. WebSocket: ${wsEndpoint}`);

  // Poll for completion
  let task;
  do {
    await new Promise(resolve => setTimeout(resolve, 500));
    const statusRes = await axios.get(`${BASE_URL}/tasks/${taskId}`);
    task = statusRes.data.task;
    console.log(`Status: ${task.status}`);
  } while (!['completed', 'failed', 'cancelled'].includes(task.status));

  console.log('Results:', task.commands.map(c => ({
    intention: c.intention,
    status: c.status
  })));
}

runTask().catch(console.error);
```

---

## Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad request (invalid input, cannot cancel) |
| 404 | Task not found |
| 503 | Service unavailable (no browser connected) |

---

## Response Headers

All responses include:
- `Content-Type: application/json`

---

## Notes

1. **Real-time updates**: The REST API does not provide real-time progress. For live updates, connect to the WebSocket endpoint returned in the submit response.

2. **Task persistence**: Tasks are stored in memory and cleaned up after 1 hour. Do not rely on tasks being available indefinitely.

3. **Concurrent requests**: Multiple tasks can be submitted concurrently. They are queued per browser instance and executed sequentially.

4. **CORS**: By default, CORS is disabled. Enable it via `CORS_ENABLED=true` environment variable for browser-based clients.
