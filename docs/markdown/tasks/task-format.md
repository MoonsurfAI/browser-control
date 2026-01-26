# Task Format

This document details the structure of tasks, commands, and their states.

## Task Structure

A task represents a sequence of browser automation commands to be executed.

```typescript
interface Task {
  id: string;                    // Unique identifier
  instanceId: string;            // Target browser instance
  name: string;                  // Human-readable name
  intention: string;             // Description of goal
  commands: TaskCommand[];       // Commands to execute
  status: TaskStatus;            // Current status
  currentCommandIndex: number;   // Index of current/last command
  createdAt: number;             // Creation timestamp (ms)
  startedAt?: number;            // Execution start timestamp
  completedAt?: number;          // Completion timestamp
  error?: TaskError;             // Error details if failed
  metadata?: Record<string, unknown>;  // Custom metadata
}
```

### Task ID Format

Task IDs are generated as: `task_{timestamp}_{counter}`

- `timestamp`: Unix timestamp in milliseconds
- `counter`: Incremental counter in base36

Example: `task_1234567890123_1`, `task_1234567890456_2a`

---

## Task Status

```typescript
type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
```

| Status | Description |
|--------|-------------|
| `queued` | Waiting in queue for execution |
| `running` | Currently executing commands |
| `completed` | All commands finished successfully |
| `failed` | A command failed; execution stopped |
| `cancelled` | Cancelled by user before completion |

### Status Transitions

```
Submit ──► queued ──► running ──┬──► completed (all commands succeeded)
                                │
                                ├──► failed (a command errored)
                                │
                                └──► cancelled (user cancelled)
```

---

## Command Structure

A command represents a single MCP tool invocation.

```typescript
interface TaskCommand {
  id: string;                    // Unique identifier
  tool_name: string;             // MCP tool name
  intention: string;             // Description of purpose
  args: Record<string, unknown>; // Tool arguments
  status: CommandStatus;         // Current status
  startedAt?: number;            // Execution start timestamp
  completedAt?: number;          // Completion timestamp
  result?: unknown;              // Result if successful
  error?: CommandError;          // Error if failed
}
```

### Command ID Format

Command IDs are derived from task ID: `{taskId}_cmd_{index}`

Example: `task_1234567890123_1_cmd_0`, `task_1234567890123_1_cmd_1`

---

## Command Status

```typescript
type CommandStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped';
```

| Status | Description |
|--------|-------------|
| `pending` | Not yet executed |
| `running` | Currently executing |
| `success` | Completed successfully |
| `error` | Failed with error |
| `skipped` | Skipped (previous command failed or task cancelled) |

### Status Transitions

```
pending ──► running ──┬──► success
                      │
                      └──► error

pending ──► skipped (if previous command fails or task cancelled)
running ──► skipped (if task cancelled mid-execution)
```

---

## Available Tools

Commands use MCP tools defined in the browser-control server. Common tools:

### browser_navigate

Navigate, reload, wait for elements.

```json
{
  "tool_name": "browser_navigate",
  "intention": "Go to Google",
  "args": {
    "action": "goto",
    "url": "https://www.google.com"
  }
}
```

Actions:
- `goto` - Navigate to URL (requires `url`)
- `reload` - Reload current page
- `back` - Go back
- `forward` - Go forward
- `wait_for` - Wait for selector (requires `selector`, optional `timeout`)

### browser_interact

Interact with page elements.

```json
{
  "tool_name": "browser_interact",
  "intention": "Click login button",
  "args": {
    "action": "click",
    "selector": "#login-btn"
  }
}
```

Actions:
- `click` - Click element (requires `selector`)
- `type` - Type text (requires `selector`, `text`)
- `keyboard` - Press key (requires `key`)
- `scroll` - Scroll page (requires `direction`, optional `amount`)
- `select` - Select dropdown option (requires `selector`, `value`)
- `hover` - Hover over element (requires `selector`)

### browser_content

Get page content or screenshot.

```json
{
  "tool_name": "browser_content",
  "intention": "Take screenshot",
  "args": {
    "action": "screenshot"
  }
}
```

Actions:
- `screenshot` - Capture screenshot (optional `selector` for element)
- `get_text` - Get text content (requires `selector`)
- `get_html` - Get HTML (optional `selector`)
- `get_viewport_dom` - Get viewport DOM

### browser_execute

Execute JavaScript in page context.

```json
{
  "tool_name": "browser_execute",
  "intention": "Get page title",
  "args": {
    "action": "evaluate",
    "script": "return document.title"
  }
}
```

### browser_instance

Manage browser instances (typically not used in tasks).

---

## Error Structure

### Task Error

```typescript
interface TaskError {
  code: string;           // Error code
  message: string;        // Human-readable message
  commandId?: string;     // ID of failed command (if applicable)
}
```

### Command Error

```typescript
interface CommandError {
  code: string;           // Error code
  message: string;        // Human-readable message
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `EXECUTION_ERROR` | Tool execution failed |
| `COMMAND_TIMEOUT` | Command exceeded timeout |
| `CANCELLED` | Task was cancelled |
| `INSTANCE_DISCONNECTED` | Browser disconnected |
| `INVALID_ARGUMENTS` | Invalid tool arguments |

---

## Example Tasks

### Simple Navigation

```json
{
  "task_name": "Open Google",
  "task_intention": "Navigate to Google homepage",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to Google",
      "args": { "action": "goto", "url": "https://www.google.com" }
    }
  ]
}
```

### Form Submission

```json
{
  "task_name": "Login",
  "task_intention": "Log into the application",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to login page",
      "args": { "action": "goto", "url": "https://app.example.com/login" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for form",
      "args": { "action": "wait_for", "selector": "#login-form", "timeout": 5000 }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Enter email",
      "args": { "action": "type", "selector": "#email", "text": "user@example.com" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Enter password",
      "args": { "action": "type", "selector": "#password", "text": "password123" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Click submit",
      "args": { "action": "click", "selector": "button[type=submit]" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for dashboard",
      "args": { "action": "wait_for", "selector": ".dashboard", "timeout": 10000 }
    }
  ]
}
```

### Data Extraction

```json
{
  "task_name": "Extract Product Info",
  "task_intention": "Get product details from page",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to product page",
      "args": { "action": "goto", "url": "https://shop.example.com/product/123" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for content",
      "args": { "action": "wait_for", "selector": ".product-details" }
    },
    {
      "tool_name": "browser_content",
      "intention": "Get product title",
      "args": { "action": "get_text", "selector": ".product-title" }
    },
    {
      "tool_name": "browser_content",
      "intention": "Get product price",
      "args": { "action": "get_text", "selector": ".product-price" }
    },
    {
      "tool_name": "browser_content",
      "intention": "Screenshot product image",
      "args": { "action": "screenshot", "selector": ".product-image" }
    }
  ]
}
```

### Search and Navigate

```json
{
  "task_name": "Wikipedia Search",
  "task_intention": "Search Wikipedia and read article",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to Wikipedia",
      "args": { "action": "goto", "url": "https://en.wikipedia.org" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Click search box",
      "args": { "action": "click", "selector": "#searchInput" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Type search query",
      "args": { "action": "type", "selector": "#searchInput", "text": "Artificial Intelligence" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Press Enter to search",
      "args": { "action": "keyboard", "key": "Enter" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for article",
      "args": { "action": "wait_for", "selector": "#firstHeading", "timeout": 10000 }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Scroll down",
      "args": { "action": "scroll", "direction": "down", "amount": 500 }
    },
    {
      "tool_name": "browser_content",
      "intention": "Take screenshot",
      "args": { "action": "screenshot" }
    }
  ]
}
```

---

## Metadata

The optional `metadata` field allows you to attach custom data to tasks:

```json
{
  "task_name": "API Test",
  "task_intention": "Test API endpoint",
  "metadata": {
    "requestId": "req-abc-123",
    "userId": "user-456",
    "environment": "staging",
    "retryCount": 0
  },
  "commands": [...]
}
```

Metadata is preserved throughout task lifecycle and included in responses:
- `task_submit_response`
- `task_status_response`
- `GET /tasks/:id`

Use cases:
- Correlating tasks with external systems
- Tracking request origins
- Custom retry logic
- Analytics and logging

---

## Validation Rules

### Task Validation

1. `task_name` - Required, non-empty string
2. `task_intention` - Required, non-empty string
3. `commands` - Required, non-empty array
4. `instanceId` - Optional; if provided, must be a connected instance

### Command Validation

1. `tool_name` - Required, must be a valid MCP tool
2. `intention` - Required, non-empty string
3. `args` - Required, must be valid for the tool

Invalid tasks are rejected with an error response.
