# WebSocket Protocol

Task execution WebSocket API for batched commands with real-time progress updates.

## Overview

The Task WebSocket server provides:

- **Task submission** - Submit batched commands
- **Real-time progress** - Get updates as commands execute
- **Subscriptions** - Monitor specific tasks or instances
- **Task management** - List, query, and cancel tasks

## Connection

### Default URL

```
ws://localhost:3400
```

### Connect

```javascript
const ws = new WebSocket('ws://localhost:3400');

ws.onopen = () => {
  console.log('Connected to task server');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleMessage(message);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

## Message Format

All messages are JSON objects with a `type` field.

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
| `task_submit_response` | Task submission result |
| `task_list_response` | Task list |
| `task_status_response` | Task details |
| `task_cancel_response` | Cancel result |
| `subscribe_ack` | Subscription confirmed |
| `task_progress` | Command progress update |
| `task_complete` | Task finished |
| `error` | Error message |

## Client Messages

### task_submit

Submit a new task with commands.

```json
{
  "type": "task_submit",
  "task_name": "Login Flow",
  "task_intention": "Log into the application",
  "instanceId": "inst_abc123",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to login page",
      "args": { "action": "goto", "url": "https://example.com/login" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Enter email",
      "args": { "action": "type", "selector": "#email", "text": "user@example.com" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Click login",
      "args": { "action": "click", "selector": "#submit" }
    }
  ]
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be "task_submit" |
| `task_name` | string | Yes | Display name for the task |
| `task_intention` | string | No | Description of task purpose |
| `instanceId` | string | No | Target browser instance ID |
| `commands` | array | Yes | Array of commands |

**Command Format:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tool_name` | string | Yes | MCP tool to execute |
| `intention` | string | No | Purpose of this command |
| `args` | object | Yes | Tool arguments |

### task_list

List tasks with optional filters.

```json
{
  "type": "task_list",
  "instanceId": "inst_abc123",
  "status": "running"
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be "task_list" |
| `instanceId` | string | No | Filter by instance |
| `status` | string | No | Filter by status |

**Status Values:** `queued`, `running`, `completed`, `failed`, `cancelled`, `all`

### task_status

Get detailed status of a specific task.

```json
{
  "type": "task_status",
  "taskId": "task_xyz789"
}
```

### task_cancel

Cancel a running or queued task.

```json
{
  "type": "task_cancel",
  "taskId": "task_xyz789"
}
```

### subscribe_task

Subscribe to updates for a specific task.

```json
{
  "type": "subscribe_task",
  "taskId": "task_xyz789"
}
```

### subscribe_instance

Subscribe to updates for all tasks on an instance.

```json
{
  "type": "subscribe_instance",
  "instanceId": "inst_abc123"
}
```

## Server Messages

### welcome

Sent immediately on connection.

```json
{
  "type": "welcome",
  "sessionId": "session_abc123-def456",
  "serverVersion": "2.0.0"
}
```

### task_submit_response

Response to task submission.

**Success:**
```json
{
  "type": "task_submit_response",
  "taskId": "task_xyz789",
  "status": "accepted",
  "queuePosition": 0
}
```

**Failure:**
```json
{
  "type": "task_submit_response",
  "taskId": "",
  "status": "rejected",
  "error": "No browser instance available"
}
```

### task_list_response

List of tasks.

```json
{
  "type": "task_list_response",
  "tasks": [
    {
      "id": "task_xyz789",
      "name": "Login Flow",
      "status": "running",
      "instanceId": "inst_abc123",
      "currentCommandIndex": 2,
      "totalCommands": 5,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "startedAt": "2024-01-15T10:30:01.000Z"
    }
  ]
}
```

### task_status_response

Detailed task information.

```json
{
  "type": "task_status_response",
  "task": {
    "id": "task_xyz789",
    "name": "Login Flow",
    "intention": "Log into the application",
    "status": "running",
    "instanceId": "inst_abc123",
    "commands": [
      {
        "tool_name": "browser_navigate",
        "intention": "Go to login page",
        "args": { "action": "goto", "url": "https://example.com/login" },
        "status": "success",
        "result": { "content": [{ "type": "text", "text": "Navigated" }] },
        "startedAt": "2024-01-15T10:30:01.000Z",
        "completedAt": "2024-01-15T10:30:03.000Z"
      },
      {
        "tool_name": "browser_interact",
        "intention": "Enter email",
        "args": { "action": "type", "selector": "#email", "text": "user@example.com" },
        "status": "running",
        "startedAt": "2024-01-15T10:30:03.000Z"
      }
    ],
    "currentCommandIndex": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "startedAt": "2024-01-15T10:30:01.000Z"
  }
}
```

**Task not found:**
```json
{
  "type": "task_status_response",
  "task": null,
  "error": "Task not found"
}
```

### task_cancel_response

Result of cancel request.

```json
{
  "type": "task_cancel_response",
  "taskId": "task_xyz789",
  "success": true
}
```

Or:
```json
{
  "type": "task_cancel_response",
  "taskId": "task_xyz789",
  "success": false,
  "error": "Task not found or already completed"
}
```

### subscribe_ack

Subscription confirmed.

```json
{
  "type": "subscribe_ack",
  "taskId": "task_xyz789"
}
```

Or:
```json
{
  "type": "subscribe_ack",
  "instanceId": "inst_abc123"
}
```

### task_progress

Real-time progress update for a command.

**Command starting:**
```json
{
  "type": "task_progress",
  "taskId": "task_xyz789",
  "commandIndex": 1,
  "status": "running",
  "tool_name": "browser_interact",
  "intention": "Enter email"
}
```

**Command completed:**
```json
{
  "type": "task_progress",
  "taskId": "task_xyz789",
  "commandIndex": 1,
  "status": "success",
  "tool_name": "browser_interact",
  "intention": "Enter email",
  "result": { "content": [{ "type": "text", "text": "Typed text" }] }
}
```

**Command failed:**
```json
{
  "type": "task_progress",
  "taskId": "task_xyz789",
  "commandIndex": 1,
  "status": "error",
  "tool_name": "browser_interact",
  "intention": "Enter email",
  "error": "Element not found: #email"
}
```

**Status Values:** `pending`, `running`, `success`, `error`, `skipped`

### task_complete

Task execution finished.

**Success:**
```json
{
  "type": "task_complete",
  "taskId": "task_xyz789",
  "status": "completed",
  "results": [
    { "status": "success", "result": {...} },
    { "status": "success", "result": {...} },
    { "status": "success", "result": {...} }
  ],
  "completedAt": "2024-01-15T10:30:10.000Z"
}
```

**Failed:**
```json
{
  "type": "task_complete",
  "taskId": "task_xyz789",
  "status": "failed",
  "results": [
    { "status": "success", "result": {...} },
    { "status": "error", "error": "Element not found" },
    { "status": "skipped" }
  ],
  "completedAt": "2024-01-15T10:30:05.000Z"
}
```

**Cancelled:**
```json
{
  "type": "task_complete",
  "taskId": "task_xyz789",
  "status": "cancelled",
  "results": [
    { "status": "success", "result": {...} },
    { "status": "skipped" },
    { "status": "skipped" }
  ],
  "completedAt": "2024-01-15T10:30:03.000Z"
}
```

**Task Status Values:** `completed`, `failed`, `cancelled`

### error

Error message.

```json
{
  "type": "error",
  "message": "Invalid message format"
}
```

## Complete Client Example

```javascript
class TaskClient {
  constructor(url = 'ws://localhost:3400') {
    this.url = url;
    this.ws = null;
    this.sessionId = null;
    this.handlers = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('Connected');
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);

        if (message.type === 'welcome') {
          this.sessionId = message.sessionId;
          resolve(this.sessionId);
        }
      };

      this.ws.onerror = (error) => {
        reject(error);
      };
    });
  }

  handleMessage(message) {
    // Call registered handlers
    const handler = this.handlers.get(message.type);
    if (handler) {
      handler(message);
    }

    // Log for debugging
    console.log('Received:', message.type, message);
  }

  on(type, handler) {
    this.handlers.set(type, handler);
  }

  send(message) {
    this.ws.send(JSON.stringify(message));
  }

  submitTask(name, commands, instanceId = null) {
    return new Promise((resolve) => {
      const handler = (response) => {
        this.handlers.delete('task_submit_response');
        resolve(response);
      };
      this.handlers.set('task_submit_response', handler);

      this.send({
        type: 'task_submit',
        task_name: name,
        instanceId,
        commands
      });
    });
  }

  subscribeToTask(taskId) {
    this.send({
      type: 'subscribe_task',
      taskId
    });
  }

  cancelTask(taskId) {
    this.send({
      type: 'task_cancel',
      taskId
    });
  }

  listTasks(instanceId = null, status = null) {
    return new Promise((resolve) => {
      const handler = (response) => {
        this.handlers.delete('task_list_response');
        resolve(response.tasks);
      };
      this.handlers.set('task_list_response', handler);

      this.send({
        type: 'task_list',
        instanceId,
        status
      });
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage
const client = new TaskClient();
await client.connect();

// Handle progress updates
client.on('task_progress', (msg) => {
  console.log(`Command ${msg.commandIndex}: ${msg.status}`);
});

// Handle task completion
client.on('task_complete', (msg) => {
  console.log(`Task ${msg.taskId} finished: ${msg.status}`);
});

// Submit a task
const response = await client.submitTask('Login', [
  { tool_name: 'browser_navigate', args: { action: 'goto', url: 'https://example.com' } },
  { tool_name: 'browser_interact', args: { action: 'click', selector: '#login' } }
]);

if (response.status === 'accepted') {
  console.log('Task submitted:', response.taskId);
  client.subscribeToTask(response.taskId);
}
```

## Task States

### Task Status Flow

```
queued → running → completed
                 → failed
                 → cancelled
```

### Command Status Flow

```
pending → running → success
                  → error
pending → skipped (if previous command failed)
```

## Subscriptions

When you submit a task, you're automatically subscribed to updates for that task.

To subscribe to additional tasks:
```json
{ "type": "subscribe_task", "taskId": "task_xyz789" }
```

To receive updates for all tasks on an instance:
```json
{ "type": "subscribe_instance", "instanceId": "inst_abc123" }
```

## Keep-Alive

The server sends periodic ping frames to keep connections alive. No action required from clients.

## Error Handling

### Invalid Message Format

```json
{
  "type": "error",
  "message": "Invalid message format"
}
```

### Unknown Message Type

```json
{
  "type": "error",
  "message": "Unknown message type: invalid_type"
}
```

### Task Submission Errors

```json
{
  "type": "task_submit_response",
  "taskId": "",
  "status": "rejected",
  "error": "No browser instance available"
}
```

## Best Practices

### 1. Handle All Message Types

```javascript
client.on('task_progress', handleProgress);
client.on('task_complete', handleComplete);
client.on('error', handleError);
```

### 2. Reconnect on Disconnect

```javascript
ws.onclose = () => {
  setTimeout(() => client.connect(), 5000);
};
```

### 3. Track Pending Tasks

Keep track of submitted tasks for proper cleanup.

### 4. Handle Command Failures

When a command fails, remaining commands are skipped. Check the `task_complete` results.

### 5. Use Intentions

Add `intention` fields for better debugging:

```json
{
  "tool_name": "browser_interact",
  "intention": "Enter user email into login form",
  "args": {...}
}
```

## Related

- [HTTP Endpoints](http-endpoints.md) - REST API for tasks
- [SSE Protocol](sse-protocol.md) - MCP connection
- [Custom Clients](../integration/custom-clients.md) - Integration examples
