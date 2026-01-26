# Getting Started

This guide will help you submit your first task and understand the basics of the Task Execution System.

## Prerequisites

1. Moonsurf browser-control server running
2. A connected browser instance
3. A WebSocket client or HTTP client

## Starting the Server

```bash
# Start the server
npm start

# Or with local extension for development
EXTENSION_PATH=../chrome-extension/dist npm start
```

You should see:
```
[Config]   Tasks: ENABLED (port: 3400, timeout: 60000ms)
[TaskWS] Server listening on localhost:3400
```

## Launching a Browser Instance

Before submitting tasks, you need a connected browser instance. Use the MCP API:

```bash
# Connect to SSE and get session
SESSION_ID=$(curl -sN --max-time 2 http://localhost:3300/sse | grep -oE '[0-9a-f-]{36}' | head -1)

# Initialize MCP
curl -X POST "http://localhost:3300/message?sessionId=$SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# Launch browser
curl -X POST "http://localhost:3300/message?sessionId=$SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"browser_instance","arguments":{"action":"new","mode":"chromium"}}}'
```

## Your First Task

### Option 1: Using WebSocket (Recommended)

WebSocket provides real-time progress updates.

```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3400');

ws.on('open', () => {
  // Submit a task
  ws.send(JSON.stringify({
    type: 'task_submit',
    task_name: 'My First Task',
    task_intention: 'Navigate to a website and take a screenshot',
    commands: [
      {
        tool_name: 'browser_navigate',
        intention: 'Go to example.com',
        args: { action: 'goto', url: 'https://example.com' }
      },
      {
        tool_name: 'browser_content',
        intention: 'Capture screenshot',
        args: { action: 'screenshot' }
      }
    ]
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());

  switch (msg.type) {
    case 'welcome':
      console.log('Connected! Session:', msg.sessionId);
      break;

    case 'task_submit_response':
      console.log('Task accepted:', msg.taskId);
      break;

    case 'task_progress':
      console.log(`Command ${msg.commandIndex + 1}: ${msg.status} - ${msg.intention}`);
      break;

    case 'task_complete':
      console.log('Task completed!', msg.summary);
      ws.close();
      break;
  }
});
```

**Output:**
```
Connected! Session: a1b2c3d4-...
Task accepted: task_1234567890_1
Command 1: running - Go to example.com
Command 1: success - Go to example.com
Command 2: running - Capture screenshot
Command 2: success - Capture screenshot
Task completed! { totalCommands: 2, successfulCommands: 2, duration: 1234 }
```

### Option 2: Using REST API

For simpler use cases without real-time updates.

```bash
# Submit a task
curl -X POST http://localhost:3300/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "My First Task",
    "task_intention": "Navigate and screenshot",
    "commands": [
      {"tool_name": "browser_navigate", "intention": "Navigate", "args": {"action": "goto", "url": "https://example.com"}},
      {"tool_name": "browser_content", "intention": "Screenshot", "args": {"action": "screenshot"}}
    ]
  }'

# Response:
# {"taskId": "task_1234567890_1", "queuePosition": 1, "wsEndpoint": "ws://localhost:3400"}

# Check task status
curl http://localhost:3300/tasks/task_1234567890_1
```

## Understanding the Response

### Task Submit Response

```json
{
  "taskId": "task_1234567890_1",
  "queuePosition": 1,
  "wsEndpoint": "ws://localhost:3400"
}
```

- `taskId`: Unique identifier for tracking the task
- `queuePosition`: Position in the queue (1 = next to run or running)
- `wsEndpoint`: WebSocket URL for real-time updates

### Progress Updates (WebSocket)

Each command emits two progress events:

```json
{
  "type": "task_progress",
  "taskId": "task_1234567890_1",
  "commandId": "task_1234567890_1_cmd_0",
  "commandIndex": 0,
  "totalCommands": 2,
  "status": "running",
  "timestamp": 1234567890123,
  "tool_name": "browser_navigate",
  "intention": "Go to example.com"
}
```

Then on completion:

```json
{
  "type": "task_progress",
  "status": "success",
  "result": { ... }
}
```

Or on error:

```json
{
  "type": "task_progress",
  "status": "error",
  "error": { "code": "EXECUTION_ERROR", "message": "Element not found" }
}
```

## Handling Errors

If a command fails, the task stops immediately:

```javascript
ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());

  if (msg.type === 'task_progress' && msg.status === 'error') {
    console.error(`Command failed: ${msg.error.message}`);
    // Remaining commands will be skipped
  }

  if (msg.type === 'task_complete' && msg.status === 'failed') {
    console.error('Task failed at command:', msg.summary.failedCommandIndex);
    console.error('Error:', msg.error);
  }
});
```

## Cancelling a Task

```bash
# Cancel via REST
curl -X POST http://localhost:3300/tasks/task_1234567890_1/cancel

# Or via WebSocket
ws.send(JSON.stringify({
  type: 'task_cancel',
  taskId: 'task_1234567890_1'
}));
```

## Next Steps

- Learn the full [Task Format](./task-format.md)
- Explore the [WebSocket API](./websocket-api.md)
- See more [Examples](./examples.md)
