# Moonsurf Browser Control - Reference

Detailed reference documentation for the Moonsurf Browser Control MCP server.

## Architecture Overview

```
AI Client Layer     →  HTTP/SSE (MCP Protocol)  →  Port 3300
        ↓
MCP Server Layer    →  WebSocket (localhost)    →  Ports 3301-3399
        ↓
Browser Extension   →  Chrome/Chromium
```

The Task WebSocket server runs on port 3400 for real-time task progress.

## Server Configuration

Default ports:
- **3300**: HTTP/SSE server (MCP clients)
- **3301-3399**: Instance WebSockets (one per browser)
- **3400**: Task WebSocket server

## Browser Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `chrome` | User's installed Chrome with persistent profiles | Use existing logins, extensions, bookmarks |
| `testing` | Chrome for Testing (auto-installed) | Clean testing environment |
| `chromium` | Open-source Chromium | Headless automation, CI/CD |

## Starting a Browser Instance

Before submitting tasks, you need a connected browser instance.

### Using MCP Tools Directly

```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new",
    "mode": "chromium",
    "headless": false
  }
}
```

### Using cURL

```bash
# 1. Connect to SSE and get session
SESSION_ID=$(curl -sN --max-time 2 http://localhost:3300/sse | grep -oE '[0-9a-f-]{36}' | head -1)

# 2. Initialize MCP
curl -X POST "http://localhost:3300/message?sessionId=$SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# 3. Launch browser
curl -X POST "http://localhost:3300/message?sessionId=$SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"browser_instance","arguments":{"action":"new","mode":"chromium"}}}'
```

## Task System Deep Dive

### Task Lifecycle

1. **Submit**: Task added to instance queue, status = `queued`
2. **Start**: Task begins execution, status = `running`
3. **Execute**: Commands run sequentially
4. **Complete**: All commands done, status = `completed` | `failed` | `cancelled`

### Per-Instance Queues

Each browser instance has its own task queue. Tasks for different instances can run in parallel, but tasks for the same instance run sequentially.

```
Instance A Queue:          Instance B Queue:
┌─────────────────┐       ┌─────────────────┐
│ Task 1 (running)│       │ Task 4 (running)│
│ Task 2 (queued) │       │ Task 5 (queued) │
│ Task 3 (queued) │       └─────────────────┘
└─────────────────┘
```

### Task ID Format

`task_{timestamp}_{counter}`

Example: `task_1234567890123_1`, `task_1234567890456_2a`

### Command ID Format

`{taskId}_cmd_{index}`

Example: `task_1234567890123_1_cmd_0`, `task_1234567890123_1_cmd_1`

## WebSocket API Details

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3400');
```

### Welcome Message

Upon connection:
```json
{
  "type": "welcome",
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Connected to Moonsurf Task Server"
}
```

### Submit Task

```json
{
  "type": "task_submit",
  "task_name": "My Task",
  "task_intention": "Description of goal",
  "instanceId": "inst_xxx",
  "commands": [...],
  "metadata": { "custom": "data" }
}
```

Response:
```json
{
  "type": "task_submit_response",
  "success": true,
  "taskId": "task_xxx",
  "queuePosition": 1
}
```

### Progress Updates

Running:
```json
{
  "type": "task_progress",
  "taskId": "task_xxx",
  "commandId": "task_xxx_cmd_0",
  "commandIndex": 0,
  "totalCommands": 3,
  "status": "running",
  "timestamp": 1234567890123,
  "tool_name": "browser_navigate",
  "intention": "Go to Google"
}
```

Success:
```json
{
  "type": "task_progress",
  "status": "success",
  "result": { "content": [...] }
}
```

Error:
```json
{
  "type": "task_progress",
  "status": "error",
  "error": { "code": "EXECUTION_ERROR", "message": "Element not found" }
}
```

### Task Complete

```json
{
  "type": "task_complete",
  "taskId": "task_xxx",
  "status": "completed",
  "timestamp": 1234567890123,
  "summary": {
    "totalCommands": 3,
    "successfulCommands": 3,
    "duration": 1500
  },
  "results": [...]
}
```

### List Tasks

Request:
```json
{
  "type": "task_list",
  "instanceId": "inst_xxx",
  "status": "running"
}
```

Response:
```json
{
  "type": "task_list_response",
  "tasks": [...]
}
```

### Get Task Status

Request:
```json
{
  "type": "task_status",
  "taskId": "task_xxx"
}
```

### Cancel Task

Request:
```json
{
  "type": "task_cancel",
  "taskId": "task_xxx"
}
```

### Subscriptions

Auto-subscribe happens when submitting a task. Manual subscription:

```json
{ "type": "subscribe_task", "taskId": "task_xxx" }
{ "type": "subscribe_instance", "instanceId": "inst_xxx" }
```

## REST API Details

### Submit Task

```http
POST /tasks
Content-Type: application/json

{
  "task_name": "My Task",
  "task_intention": "Description",
  "instanceId": "inst_xxx",
  "commands": [...],
  "metadata": {}
}
```

Response:
```json
{
  "taskId": "task_xxx",
  "queuePosition": 1,
  "wsEndpoint": "ws://localhost:3400"
}
```

### List Tasks

```http
GET /tasks?instanceId=inst_xxx&status=running
```

### Get Task Details

```http
GET /tasks/:id
```

### Cancel Task

```http
POST /tasks/:id/cancel
```

## Tool Reference

### browser_instance

#### List Instances
```json
{ "action": "list" }
```

#### Launch Browser
```json
{
  "action": "new",
  "mode": "chromium",
  "headless": false,
  "profile": "Default"
}
```

#### Close Instance
```json
{ "action": "close", "instanceId": "inst_xxx" }
```

#### List Profiles
```json
{ "action": "profiles", "mode": "chrome" }
```

### browser_navigate

#### Navigate to URL
```json
{ "action": "goto", "url": "https://example.com" }
```

#### Reload Page
```json
{ "action": "reload" }
```

#### Go Back/Forward
```json
{ "action": "back" }
{ "action": "forward" }
```

#### Wait for Element
```json
{ "action": "wait", "selector": "#element", "timeout": 5000 }
```

### browser_interact

#### Click
```json
{ "action": "click", "selector": "#button" }
```

#### Type
```json
{ "action": "type", "selector": "#input", "text": "Hello", "clear": true }
```

#### Press Key
```json
{ "action": "press", "key": "Enter" }
```

Special keys: `Enter`, `Tab`, `Escape`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Backspace`, `Delete`, `Home`, `End`, `PageUp`, `PageDown`

#### Scroll
```json
{ "action": "scroll", "direction": "down", "amount": 500 }
```

Directions: `up`, `down`, `left`, `right`

#### Hover
```json
{ "action": "hover", "selector": "#element" }
```

#### Select Dropdown
```json
{ "action": "select", "selector": "#dropdown", "value": "option1" }
```

#### Upload File
```json
{ "action": "upload", "selector": "input[type=file]", "path": "/path/to/file.pdf" }
```

### browser_content

#### Screenshot
```json
{ "action": "screenshot" }
{ "action": "screenshot", "selector": "#element" }
```

#### PDF
```json
{ "action": "pdf" }
```

#### Get Text/HTML
```json
{ "action": "get", "selector": "#element", "type": "text" }
{ "action": "get", "selector": "#element", "type": "html" }
```

#### Query Elements
```json
{ "action": "query", "selector": ".items" }
```

#### Get Attribute
```json
{ "action": "attribute", "selector": "#link", "name": "href" }
```

#### Get Viewport DOM
```json
{ "action": "get_viewport_dom" }
```

### browser_execute

```json
{ "expression": "document.title" }
{ "expression": "return Array.from(document.querySelectorAll('a')).map(a => a.href)" }
```

### browser_network

#### Cookies
```json
{ "action": "get_cookies" }
{ "action": "set_cookie", "name": "session", "value": "abc123", "domain": "example.com" }
{ "action": "clear_cookies" }
```

#### Headers
```json
{ "action": "set_headers", "headers": { "Authorization": "Bearer token" } }
```

#### Storage
```json
{ "action": "get_storage", "type": "local" }
{ "action": "set_storage", "type": "local", "key": "user", "value": "john" }
{ "action": "clear_storage", "type": "session" }
```

### browser_emulate

#### Viewport
```json
{ "action": "viewport", "width": 1920, "height": 1080 }
```

#### User Agent
```json
{ "action": "user_agent", "userAgent": "Mozilla/5.0..." }
```

#### Geolocation
```json
{ "action": "geolocation", "latitude": 37.7749, "longitude": -122.4194 }
```

#### Timezone
```json
{ "action": "timezone", "timezoneId": "America/Los_Angeles" }
```

#### Device Emulation
```json
{ "action": "device", "device": "iPhone 12" }
```

#### Network Conditions
```json
{ "action": "offline", "offline": true }
{ "action": "throttle", "latency": 100, "downloadThroughput": 500000, "uploadThroughput": 100000 }
```

### browser_debug

#### Handle Dialog
```json
{ "action": "dialog", "accept": true, "text": "input text" }
```

#### Console Logs
```json
{ "action": "console" }
```

#### Performance
```json
{ "action": "performance" }
```

#### Tracing
```json
{ "action": "trace_start" }
{ "action": "trace_stop" }
```

#### Downloads
```json
{ "action": "downloads" }
{ "action": "download_wait", "filename": "report.pdf", "timeout": 30000 }
```

## Complete Example: Node.js Task Client

```javascript
const WebSocket = require('ws');

async function runTask(task) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3400');
    let taskId = null;
    const results = [];

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'task_submit',
        ...task
      }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'task_submit_response':
          if (!msg.success) {
            ws.close();
            reject(new Error(msg.error));
          }
          taskId = msg.taskId;
          console.log(`Task started: ${taskId}`);
          break;

        case 'task_progress':
          console.log(`[${msg.commandIndex + 1}/${msg.totalCommands}] ${msg.status}: ${msg.intention}`);
          if (msg.status === 'success' && msg.result) {
            results.push(msg.result);
          }
          break;

        case 'task_complete':
          ws.close();
          if (msg.status === 'completed') {
            resolve({ taskId, status: msg.status, results, summary: msg.summary });
          } else {
            reject(new Error(`Task ${msg.status}: ${msg.error?.message}`));
          }
          break;
      }
    });

    ws.on('error', reject);
  });
}

// Usage
runTask({
  task_name: 'Screenshot Google',
  task_intention: 'Navigate to Google and take screenshot',
  commands: [
    { tool_name: 'browser_navigate', intention: 'Go to Google', args: { action: 'goto', url: 'https://www.google.com' } },
    { tool_name: 'browser_content', intention: 'Take screenshot', args: { action: 'screenshot' } }
  ]
}).then(result => {
  console.log('Completed:', result.summary);
}).catch(err => {
  console.error('Failed:', err.message);
});
```

## Complete Example: Python Task Client

```python
import asyncio
import websockets
import json

async def run_task(task):
    uri = "ws://localhost:3400"
    async with websockets.connect(uri) as ws:
        await ws.send(json.dumps({
            "type": "task_submit",
            **task
        }))

        results = []
        async for message in ws:
            msg = json.loads(message)

            if msg["type"] == "task_submit_response":
                if not msg.get("success"):
                    raise Exception(msg.get("error"))
                print(f"Task started: {msg['taskId']}")

            elif msg["type"] == "task_progress":
                idx = msg["commandIndex"] + 1
                total = msg["totalCommands"]
                print(f"[{idx}/{total}] {msg['status']}: {msg['intention']}")
                if msg["status"] == "success" and msg.get("result"):
                    results.append(msg["result"])

            elif msg["type"] == "task_complete":
                if msg["status"] == "completed":
                    return {"status": msg["status"], "results": results, "summary": msg["summary"]}
                else:
                    raise Exception(f"Task {msg['status']}: {msg.get('error', {}).get('message')}")

# Usage
task = {
    "task_name": "Screenshot Google",
    "task_intention": "Navigate to Google and take screenshot",
    "commands": [
        {"tool_name": "browser_navigate", "intention": "Go to Google", "args": {"action": "goto", "url": "https://www.google.com"}},
        {"tool_name": "browser_content", "intention": "Take screenshot", "args": {"action": "screenshot"}}
    ]
}

result = asyncio.run(run_task(task))
print("Completed:", result["summary"])
```

## Troubleshooting

### No Connected Browser Instances

Error: `No connected browser instances`

Solution: Launch a browser instance first using `browser_instance` with `action: new`.

### Element Not Found

Error: `Element not found: #selector`

Solutions:
1. Add a `wait` command before interaction
2. Check selector is correct (use browser dev tools)
3. Increase timeout value

### Command Timeout

Error: `COMMAND_TIMEOUT`

Solutions:
1. Increase command timeout (default: 60s, configurable via `TASKS_COMMAND_TIMEOUT`)
2. Split long operations into multiple commands
3. Check for network issues

### Instance Disconnected

Error: `INSTANCE_DISCONNECTED`

The browser was closed or crashed. Launch a new instance.
