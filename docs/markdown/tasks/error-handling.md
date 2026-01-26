# Error Handling

This document covers error codes, states, recovery strategies, and debugging tips.

## Error Hierarchy

```
Task Error
   │
   ├── Validation Errors (pre-execution)
   │   ├── NO_COMMANDS
   │   ├── NO_INSTANCE
   │   └── QUEUE_FULL
   │
   └── Execution Errors (during execution)
       ├── EXECUTION_ERROR
       ├── COMMAND_TIMEOUT
       ├── INSTANCE_DISCONNECTED
       └── CANCELLED
```

---

## Error Codes

### Validation Errors

These occur during task submission.

| Code | HTTP Status | Description | Recovery |
|------|-------------|-------------|----------|
| `NO_COMMANDS` | 400 | Commands array is empty | Add at least one command |
| `NO_INSTANCE` | 503 | No browser instance connected | Launch a browser first |
| `INVALID_INSTANCE` | 400 | Specified instanceId not found | Check instance ID or omit it |
| `QUEUE_FULL` | 503 | Instance queue at max capacity | Wait for tasks to complete |

### Execution Errors

These occur during task execution.

| Code | Description | Recovery |
|------|-------------|----------|
| `EXECUTION_ERROR` | Tool returned an error | Check tool arguments, element existence |
| `COMMAND_TIMEOUT` | Command exceeded timeout (default 60s) | Increase timeout or simplify command |
| `INSTANCE_DISCONNECTED` | Browser disconnected mid-task | Reconnect browser and retry |
| `CANCELLED` | Task cancelled by user | Intentional, no recovery needed |

---

## Error Response Formats

### WebSocket Submit Error

```json
{
  "type": "task_submit_response",
  "success": false,
  "error": "No connected browser instances"
}
```

### REST Submit Error

```json
{
  "error": "No commands provided"
}
```

### Command Execution Error

In `task_progress`:

```json
{
  "type": "task_progress",
  "taskId": "task_123",
  "commandId": "task_123_cmd_1",
  "commandIndex": 1,
  "status": "error",
  "tool_name": "browser_interact",
  "intention": "Click button",
  "error": {
    "code": "EXECUTION_ERROR",
    "message": "Element not found: #nonexistent-button"
  }
}
```

### Task Failure

In `task_complete`:

```json
{
  "type": "task_complete",
  "taskId": "task_123",
  "status": "failed",
  "error": {
    "code": "EXECUTION_ERROR",
    "message": "Element not found: #nonexistent-button",
    "commandId": "task_123_cmd_1"
  },
  "summary": {
    "totalCommands": 3,
    "successfulCommands": 1,
    "failedCommandIndex": 1,
    "duration": 500
  }
}
```

---

## Common Errors and Solutions

### Element Not Found

**Error:**
```
Element not found: #login-button
```

**Causes:**
1. Element doesn't exist on page
2. Element hasn't loaded yet
3. Selector is incorrect
4. Element is in an iframe

**Solutions:**
1. Add a `wait_for` command before interacting:
   ```json
   {
     "tool_name": "browser_navigate",
     "intention": "Wait for button",
     "args": { "action": "wait_for", "selector": "#login-button", "timeout": 10000 }
   }
   ```
2. Verify selector in browser DevTools
3. Use more specific selectors
4. Check if element is in an iframe (not currently supported)

### Navigation Timeout

**Error:**
```
Command timeout after 60000ms
```

**Causes:**
1. Page takes too long to load
2. Network issues
3. Page never finishes loading (infinite resources)

**Solutions:**
1. Increase command timeout via `TASKS_COMMAND_TIMEOUT` env variable
2. Use explicit `wait_for` instead of relying on navigation complete
3. Check network connectivity

### Invalid Tool

**Error:**
```
Unknown tool: browser_nonexistent
```

**Causes:**
1. Typo in tool name
2. Using a tool that doesn't exist

**Solutions:**
1. Check available tools in [Task Format](./task-format.md)
2. Use exact tool names: `browser_navigate`, `browser_interact`, `browser_content`, `browser_execute`

### Invalid Arguments

**Error:**
```
Invalid arguments
```

**Causes:**
1. Missing required argument
2. Wrong argument type
3. Invalid action for tool

**Solutions:**
1. Check tool documentation for required arguments
2. Verify argument types (strings, numbers, etc.)
3. Ensure `action` is valid for the tool

### Instance Disconnected

**Error:**
```
Browser instance disconnected
```

**Causes:**
1. Browser was closed
2. Browser crashed
3. Network disconnection (remote browsers)
4. Extension was disabled/removed

**Solutions:**
1. Launch a new browser instance
2. Check browser console for crash reasons
3. Verify extension is installed and enabled

---

## Error Handling Patterns

### Client-Side Retry Logic

```javascript
async function submitWithRetry(task, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await submitTask(task);

      if (result.error) {
        if (result.error.includes('No connected browser')) {
          // Wait for browser to be available
          await sleep(5000);
          continue;
        }
        throw new Error(result.error);
      }

      return await waitForCompletion(result.taskId);

    } catch (error) {
      if (attempt === maxRetries) throw error;
      console.log(`Attempt ${attempt} failed, retrying...`);
      await sleep(1000 * attempt); // Exponential backoff
    }
  }
}
```

### Graceful Degradation

```javascript
ws.on('message', (data) => {
  const msg = JSON.parse(data);

  if (msg.type === 'task_progress' && msg.status === 'error') {
    // Log error but continue listening for other tasks
    console.error(`Command ${msg.commandIndex} failed:`, msg.error.message);

    // Optionally notify user or trigger alternative action
    if (msg.error.code === 'EXECUTION_ERROR') {
      notifyUser(`Action failed: ${msg.intention}`);
    }
  }

  if (msg.type === 'task_complete' && msg.status === 'failed') {
    // Analyze failure and decide on action
    const { failedCommandIndex, successfulCommands, totalCommands } = msg.summary;

    if (successfulCommands > 0) {
      console.log(`Partial success: ${successfulCommands}/${totalCommands} commands completed`);
    }

    // Check which command failed
    const failedCommand = msg.results[failedCommandIndex];
    handleFailedCommand(failedCommand);
  }
});
```

### Pre-Validation

Validate tasks before submission to catch errors early:

```javascript
function validateTask(task) {
  const errors = [];

  if (!task.task_name) {
    errors.push('task_name is required');
  }

  if (!task.commands || task.commands.length === 0) {
    errors.push('At least one command is required');
  }

  const validTools = ['browser_navigate', 'browser_interact', 'browser_content', 'browser_execute'];

  task.commands?.forEach((cmd, index) => {
    if (!validTools.includes(cmd.tool_name)) {
      errors.push(`Command ${index}: unknown tool "${cmd.tool_name}"`);
    }
    if (!cmd.args) {
      errors.push(`Command ${index}: args is required`);
    }
  });

  return errors;
}

// Usage
const errors = validateTask(myTask);
if (errors.length > 0) {
  console.error('Validation failed:', errors);
  return;
}
submitTask(myTask);
```

---

## Debugging

### Enable Verbose Logging

Server-side logs show detailed execution information:

```bash
# Server output shows:
[TaskManager] Task task_123 queued for instance inst_456 (position: 1)
[TaskManager] Starting task task_123: My Task
[MCP] Tool call: browser_navigate { url: 'https://example.com', instanceId: 'inst_456' }
[MCP] Tool error: browser_interact Error: Element not found: #nonexistent
[TaskManager] Command task_123_cmd_1 failed: Element not found: #nonexistent
[TaskManager] Task task_123 failed (500ms)
```

### Inspect Task State

Use the status endpoint to inspect task state:

```bash
curl http://localhost:3300/tasks/task_123 | jq
```

Check:
- `status` - Overall task status
- `commands[].status` - Each command's status
- `commands[].error` - Error details for failed commands
- `commands[].result` - Results for successful commands

### WebSocket Debugging

Capture all WebSocket messages for debugging:

```javascript
ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log(`[${new Date().toISOString()}] ${msg.type}:`, JSON.stringify(msg, null, 2));
});
```

### Browser DevTools

1. Open the browser controlled by Moonsurf
2. Open DevTools (F12)
3. Check:
   - Console for JavaScript errors
   - Network tab for failed requests
   - Elements tab for selector verification

---

## Error Recovery Strategies

### Idempotent Tasks

Design tasks to be safely retriable:

```json
{
  "task_name": "Navigate and Screenshot",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to page",
      "args": { "action": "goto", "url": "https://example.com" }
    },
    {
      "tool_name": "browser_content",
      "intention": "Take screenshot",
      "args": { "action": "screenshot" }
    }
  ]
}
```

This task can be safely retried without side effects.

### Checkpoint Pattern

For long tasks, break into smaller checkpointable units:

```javascript
const subtasks = [
  { name: 'Step 1: Login', commands: [...] },
  { name: 'Step 2: Navigate', commands: [...] },
  { name: 'Step 3: Extract Data', commands: [...] },
];

let lastCompleted = -1;

for (let i = 0; i < subtasks.length; i++) {
  const result = await runTask(subtasks[i]);

  if (result.status === 'completed') {
    lastCompleted = i;
  } else {
    console.log(`Failed at step ${i + 1}, last completed: ${lastCompleted + 1}`);
    // Can resume from lastCompleted + 1
    break;
  }
}
```

### Fallback Selectors

Include alternative selectors for robust element finding:

```javascript
// Instead of single selector:
{ "action": "click", "selector": "#submit-btn" }

// Try multiple approaches:
async function clickSubmit(ws) {
  const selectors = ['#submit-btn', 'button[type=submit]', '.submit-button', 'input[value=Submit]'];

  for (const selector of selectors) {
    try {
      const result = await runCommand(ws, {
        tool_name: 'browser_interact',
        intention: 'Click submit',
        args: { action: 'click', selector }
      });
      if (result.status === 'success') return;
    } catch (e) {
      continue;
    }
  }
  throw new Error('Could not find submit button');
}
```

---

## Monitoring and Alerting

### Track Error Rates

```javascript
const stats = {
  submitted: 0,
  completed: 0,
  failed: 0,
  errorCodes: {}
};

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  if (msg.type === 'task_submit_response' && msg.success) {
    stats.submitted++;
  }

  if (msg.type === 'task_complete') {
    if (msg.status === 'completed') {
      stats.completed++;
    } else if (msg.status === 'failed') {
      stats.failed++;
      const code = msg.error?.code || 'UNKNOWN';
      stats.errorCodes[code] = (stats.errorCodes[code] || 0) + 1;
    }
  }
});

// Periodically log stats
setInterval(() => {
  const successRate = stats.submitted > 0
    ? ((stats.completed / stats.submitted) * 100).toFixed(1)
    : 0;
  console.log(`Success rate: ${successRate}%, Errors:`, stats.errorCodes);
}, 60000);
```

### Alert on Failure Patterns

```javascript
const recentFailures = [];
const ALERT_THRESHOLD = 5;
const WINDOW_MS = 60000;

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  if (msg.type === 'task_complete' && msg.status === 'failed') {
    recentFailures.push(Date.now());

    // Clean old failures
    const cutoff = Date.now() - WINDOW_MS;
    while (recentFailures.length > 0 && recentFailures[0] < cutoff) {
      recentFailures.shift();
    }

    // Check threshold
    if (recentFailures.length >= ALERT_THRESHOLD) {
      sendAlert(`High failure rate: ${recentFailures.length} failures in last minute`);
    }
  }
});
```
