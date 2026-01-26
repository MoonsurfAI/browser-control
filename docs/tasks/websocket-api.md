# WebSocket API Reference

The Task WebSocket API provides real-time task submission, progress monitoring, and management.

## Connection

**Endpoint:** `ws://localhost:3400`

**Connection Example:**
```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3400');
```

Upon connection, the server sends a welcome message:

```json
{
  "type": "welcome",
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Connected to Moonsurf Task Server"
}
```

## Message Protocol

All messages are JSON objects with a `type` field indicating the message type.

### Client → Server Messages

| Type | Description |
|------|-------------|
| `task_submit` | Submit a new task |
| `task_list` | List tasks |
| `task_status` | Get task details |
| `task_cancel` | Cancel a task |
| `subscribe_task` | Subscribe to task updates |
| `subscribe_instance` | Subscribe to instance updates |

### Server → Client Messages

| Type | Description |
|------|-------------|
| `welcome` | Connection established |
| `task_submit_response` | Response to task submission |
| `task_progress` | Command execution progress |
| `task_complete` | Task finished |
| `task_list_response` | Response to list request |
| `task_status_response` | Response to status request |
| `task_cancel_response` | Response to cancel request |
| `error` | Error occurred |

---

## Task Submission

### Request: `task_submit`

```json
{
  "type": "task_submit",
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
    },
    {
      "tool_name": "browser_interact",
      "intention": "Submit search",
      "args": { "action": "keyboard", "key": "Enter" }
    }
  ],
  "metadata": {
    "client": "my-app",
    "requestId": "req-123"
  }
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be `"task_submit"` |
| `task_name` | string | Yes | Human-readable task name |
| `task_intention` | string | Yes | Description of task goal |
| `instanceId` | string | No | Target browser instance. If omitted, uses first connected instance |
| `commands` | array | Yes | Array of commands to execute |
| `metadata` | object | No | Custom metadata passed through to responses |

**Command Object:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tool_name` | string | Yes | MCP tool name (e.g., `browser_navigate`) |
| `intention` | string | Yes | Description of command purpose |
| `args` | object | Yes | Tool-specific arguments |

### Response: `task_submit_response`

**Success:**
```json
{
  "type": "task_submit_response",
  "success": true,
  "taskId": "task_1234567890_1",
  "queuePosition": 1
}
```

**Error:**
```json
{
  "type": "task_submit_response",
  "success": false,
  "error": "No connected browser instances"
}
```

---

## Progress Updates

After task submission, the client automatically receives progress updates.

### `task_progress`

Emitted twice per command: once when starting (`running`) and once when finished (`success`/`error`).

**Running:**
```json
{
  "type": "task_progress",
  "taskId": "task_1234567890_1",
  "commandId": "task_1234567890_1_cmd_0",
  "commandIndex": 0,
  "totalCommands": 3,
  "status": "running",
  "timestamp": 1234567890123,
  "tool_name": "browser_navigate",
  "intention": "Go to Google"
}
```

**Success:**
```json
{
  "type": "task_progress",
  "taskId": "task_1234567890_1",
  "commandId": "task_1234567890_1_cmd_0",
  "commandIndex": 0,
  "totalCommands": 3,
  "status": "success",
  "timestamp": 1234567890456,
  "tool_name": "browser_navigate",
  "intention": "Go to Google",
  "result": {
    "content": [{ "type": "text", "text": "{\"success\": true}" }]
  }
}
```

**Error:**
```json
{
  "type": "task_progress",
  "taskId": "task_1234567890_1",
  "commandId": "task_1234567890_1_cmd_1",
  "commandIndex": 1,
  "totalCommands": 3,
  "status": "error",
  "timestamp": 1234567890789,
  "tool_name": "browser_interact",
  "intention": "Click button",
  "error": {
    "code": "EXECUTION_ERROR",
    "message": "Element not found: #nonexistent"
  }
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `taskId` | string | Task identifier |
| `commandId` | string | Command identifier |
| `commandIndex` | number | 0-based index in commands array |
| `totalCommands` | number | Total number of commands |
| `status` | string | `"running"`, `"success"`, or `"error"` |
| `timestamp` | number | Unix timestamp in milliseconds |
| `tool_name` | string | MCP tool name |
| `intention` | string | Command intention |
| `result` | object | Present on success, contains tool result |
| `error` | object | Present on error, contains code and message |

### `task_complete`

Emitted when task finishes (completed, failed, or cancelled).

**Completed:**
```json
{
  "type": "task_complete",
  "taskId": "task_1234567890_1",
  "status": "completed",
  "timestamp": 1234567891000,
  "summary": {
    "totalCommands": 3,
    "successfulCommands": 3,
    "duration": 1500
  },
  "results": [
    { "commandId": "task_1234567890_1_cmd_0", "status": "success", "result": {...} },
    { "commandId": "task_1234567890_1_cmd_1", "status": "success", "result": {...} },
    { "commandId": "task_1234567890_1_cmd_2", "status": "success", "result": {...} }
  ]
}
```

**Failed:**
```json
{
  "type": "task_complete",
  "taskId": "task_1234567890_1",
  "status": "failed",
  "timestamp": 1234567891000,
  "summary": {
    "totalCommands": 3,
    "successfulCommands": 1,
    "failedCommandIndex": 1,
    "duration": 800
  },
  "error": {
    "code": "EXECUTION_ERROR",
    "message": "Element not found",
    "commandId": "task_1234567890_1_cmd_1"
  },
  "results": [
    { "commandId": "task_1234567890_1_cmd_0", "status": "success", "result": {...} },
    { "commandId": "task_1234567890_1_cmd_1", "status": "error", "error": {...} },
    { "commandId": "task_1234567890_1_cmd_2", "status": "skipped" }
  ]
}
```

**Cancelled:**
```json
{
  "type": "task_complete",
  "taskId": "task_1234567890_1",
  "status": "cancelled",
  "timestamp": 1234567891000,
  "summary": {
    "totalCommands": 3,
    "successfulCommands": 1,
    "duration": 500
  },
  "error": {
    "code": "CANCELLED",
    "message": "Task cancelled by user"
  },
  "results": [
    { "commandId": "task_1234567890_1_cmd_0", "status": "success", "result": {...} },
    { "commandId": "task_1234567890_1_cmd_1", "status": "skipped" },
    { "commandId": "task_1234567890_1_cmd_2", "status": "skipped" }
  ]
}
```

---

## Task Listing

### Request: `task_list`

```json
{
  "type": "task_list",
  "instanceId": "inst_1234567890_abc",
  "status": "running"
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `instanceId` | string | No | Filter by instance |
| `status` | string | No | Filter by status: `queued`, `running`, `completed`, `failed`, `cancelled`, or `all` |

### Response: `task_list_response`

```json
{
  "type": "task_list_response",
  "tasks": [
    {
      "id": "task_1234567890_1",
      "name": "Search Google",
      "instanceId": "inst_1234567890_abc",
      "status": "running",
      "commandCount": 3,
      "currentCommandIndex": 1,
      "createdAt": 1234567890000
    },
    {
      "id": "task_1234567890_2",
      "name": "Take Screenshot",
      "instanceId": "inst_1234567890_abc",
      "status": "queued",
      "commandCount": 2,
      "currentCommandIndex": 0,
      "createdAt": 1234567890100
    }
  ]
}
```

---

## Task Status

### Request: `task_status`

```json
{
  "type": "task_status",
  "taskId": "task_1234567890_1"
}
```

### Response: `task_status_response`

```json
{
  "type": "task_status_response",
  "task": {
    "id": "task_1234567890_1",
    "instanceId": "inst_1234567890_abc",
    "name": "Search Google",
    "intention": "Search for browser automation tools",
    "status": "running",
    "currentCommandIndex": 1,
    "createdAt": 1234567890000,
    "startedAt": 1234567890100,
    "commands": [
      {
        "id": "task_1234567890_1_cmd_0",
        "tool_name": "browser_navigate",
        "intention": "Go to Google",
        "status": "success",
        "startedAt": 1234567890100,
        "completedAt": 1234567890300
      },
      {
        "id": "task_1234567890_1_cmd_1",
        "tool_name": "browser_interact",
        "intention": "Type search query",
        "status": "running",
        "startedAt": 1234567890300
      },
      {
        "id": "task_1234567890_1_cmd_2",
        "tool_name": "browser_interact",
        "intention": "Submit search",
        "status": "pending"
      }
    ]
  }
}
```

**Task Not Found:**
```json
{
  "type": "task_status_response",
  "task": null
}
```

---

## Task Cancellation

### Request: `task_cancel`

```json
{
  "type": "task_cancel",
  "taskId": "task_1234567890_1"
}
```

### Response: `task_cancel_response`

**Success:**
```json
{
  "type": "task_cancel_response",
  "success": true,
  "taskId": "task_1234567890_1"
}
```

**Failed (already completed):**
```json
{
  "type": "task_cancel_response",
  "success": false,
  "taskId": "task_1234567890_1",
  "reason": "Task already completed"
}
```

---

## Subscriptions

By default, submitting a task auto-subscribes the client to that task's updates. You can also manually subscribe.

### Subscribe to Task

```json
{
  "type": "subscribe_task",
  "taskId": "task_1234567890_1"
}
```

### Subscribe to Instance

Receive updates for all tasks on an instance:

```json
{
  "type": "subscribe_instance",
  "instanceId": "inst_1234567890_abc"
}
```

---

## Error Messages

Generic errors are sent as:

```json
{
  "type": "error",
  "error": "Invalid message format",
  "details": "Missing required field: task_name"
}
```

---

## Complete Example

```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3400');

ws.on('open', () => {
  console.log('Connected to Task Server');

  // Submit a task
  ws.send(JSON.stringify({
    type: 'task_submit',
    task_name: 'Google Search',
    task_intention: 'Search for Node.js tutorials',
    commands: [
      {
        tool_name: 'browser_navigate',
        intention: 'Open Google',
        args: { action: 'goto', url: 'https://www.google.com' }
      },
      {
        tool_name: 'browser_interact',
        intention: 'Enter search term',
        args: { action: 'type', selector: 'textarea[name=q]', text: 'Node.js tutorials' }
      },
      {
        tool_name: 'browser_interact',
        intention: 'Press Enter',
        args: { action: 'keyboard', key: 'Enter' }
      }
    ]
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());

  switch (msg.type) {
    case 'welcome':
      console.log(`Session: ${msg.sessionId}`);
      break;

    case 'task_submit_response':
      if (msg.success) {
        console.log(`Task submitted: ${msg.taskId} (queue position: ${msg.queuePosition})`);
      } else {
        console.error(`Submission failed: ${msg.error}`);
      }
      break;

    case 'task_progress':
      console.log(`[${msg.commandIndex + 1}/${msg.totalCommands}] ${msg.status}: ${msg.intention}`);
      if (msg.status === 'error') {
        console.error(`  Error: ${msg.error.message}`);
      }
      break;

    case 'task_complete':
      console.log(`Task ${msg.status}!`);
      console.log(`  Duration: ${msg.summary.duration}ms`);
      console.log(`  Commands: ${msg.summary.successfulCommands}/${msg.summary.totalCommands} succeeded`);
      ws.close();
      break;
  }
});

ws.on('close', () => {
  console.log('Connection closed');
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err);
});
```

**Output:**
```
Connected to Task Server
Session: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Task submitted: task_1234567890_1 (queue position: 1)
[1/3] running: Open Google
[1/3] success: Open Google
[2/3] running: Enter search term
[2/3] success: Enter search term
[3/3] running: Press Enter
[3/3] success: Press Enter
Task completed!
  Duration: 2500ms
  Commands: 3/3 succeeded
Connection closed
```
