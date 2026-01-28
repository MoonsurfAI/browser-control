# Moonsurf Browser Control

Control web browsers using Moonsurf MCP tools. Use when the user wants to automate browsers, navigate websites, take screenshots, fill forms, click elements, scrape content, or perform any web automation task.

## Task Execution System

The recommended way to automate browsers is through the **Task Execution System**. Tasks allow you to submit a sequence of browser commands that execute sequentially with real-time progress tracking.

### Why Use Tasks?

1. **Sequential Execution**: Commands run in order, ensuring page loads complete before interactions
2. **Progress Tracking**: Real-time updates on each command's status
3. **Error Handling**: Automatic fail-fast behavior - if a command fails, remaining commands are skipped
4. **Queuing**: Multiple tasks can be queued per browser instance
5. **Cancellation**: Tasks can be cancelled mid-execution

## Task Format

A task consists of a name, intention, and a list of commands:

```json
{
  "task_name": "Login to Website",
  "task_intention": "Log into the application with credentials",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to login page",
      "args": { "action": "goto", "url": "https://example.com/login" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for form",
      "args": { "action": "wait", "selector": "#login-form", "timeout": 5000 }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Enter username",
      "args": { "action": "type", "selector": "#username", "text": "user@example.com" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Enter password",
      "args": { "action": "type", "selector": "#password", "text": "password123" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Click login button",
      "args": { "action": "click", "selector": "button[type=submit]" }
    }
  ]
}
```

### Task Fields

| Field | Required | Description |
|-------|----------|-------------|
| `task_name` | Yes | Human-readable name for the task |
| `task_intention` | Yes | Description of the task's goal |
| `instanceId` | No | Target browser instance ID (uses first connected if omitted) |
| `commands` | Yes | Array of commands to execute sequentially |
| `metadata` | No | Custom data passed through to responses |

### Command Fields

| Field | Required | Description |
|-------|----------|-------------|
| `tool_name` | Yes | MCP tool name (e.g., `browser_navigate`, `browser_interact`) |
| `intention` | Yes | Description of what this command does |
| `args` | Yes | Tool-specific arguments |

## Available Tools

### browser_instance
Manage browser instances.

| Action | Description | Arguments |
|--------|-------------|-----------|
| `list` | List all instances | - |
| `new` | Launch new browser | `mode`: `chrome` \| `testing` \| `chromium`, `headless`: boolean, `profile`: string |
| `close` | Close instance | `instanceId`: string |
| `profiles` | List available profiles | `mode`: `chrome` \| `chromium` |

### browser_navigate
Navigation and waiting.

| Action | Description | Arguments |
|--------|-------------|-----------|
| `goto` | Navigate to URL | `url`: string |
| `reload` | Reload page | - |
| `back` | Go back | - |
| `forward` | Go forward | - |
| `wait` | Wait for element | `selector`: string, `timeout`: number (ms) |

### browser_interact
User input simulation.

| Action | Description | Arguments |
|--------|-------------|-----------|
| `click` | Click element | `selector`: string |
| `type` | Type text | `selector`: string, `text`: string, `clear`: boolean |
| `press` | Press keyboard key | `key`: string (e.g., "Enter", "Tab", "Escape") |
| `scroll` | Scroll page | `direction`: `up` \| `down` \| `left` \| `right`, `amount`: number |
| `hover` | Hover over element | `selector`: string |
| `select` | Select dropdown option | `selector`: string, `value`: string |
| `upload` | Upload file | `selector`: string, `path`: string |

### browser_content
Extract page content.

| Action | Description | Arguments |
|--------|-------------|-----------|
| `screenshot` | Take screenshot | `selector`: string (optional, for element screenshot) |
| `pdf` | Generate PDF | - |
| `get` | Get text/HTML | `selector`: string, `type`: `text` \| `html` |
| `query` | Query elements | `selector`: string |
| `attribute` | Get attribute | `selector`: string, `name`: string |
| `get_viewport_dom` | Get visible DOM | - |

### browser_execute
Execute JavaScript in page context.

| Arguments | Description |
|-----------|-------------|
| `expression` | JavaScript code to execute |

### browser_network
Network and storage control.

| Action | Description | Arguments |
|--------|-------------|-----------|
| `get_cookies` | Get cookies | - |
| `set_cookie` | Set cookie | `name`, `value`, `domain`, `path`, etc. |
| `clear_cookies` | Clear cookies | - |
| `set_headers` | Set request headers | `headers`: object |
| `intercept` | Intercept requests | `patterns`: array |
| `get_storage` | Get localStorage/sessionStorage | `type`: `local` \| `session` |
| `set_storage` | Set storage item | `type`, `key`, `value` |
| `clear_storage` | Clear storage | `type`: `local` \| `session` |

### browser_emulate
Device and network emulation.

| Action | Description | Arguments |
|--------|-------------|-----------|
| `viewport` | Set viewport size | `width`, `height` |
| `user_agent` | Set user agent | `userAgent`: string |
| `geolocation` | Set geolocation | `latitude`, `longitude` |
| `timezone` | Set timezone | `timezoneId`: string |
| `device` | Emulate device | `device`: string (e.g., "iPhone 12") |
| `offline` | Toggle offline mode | `offline`: boolean |
| `throttle` | Network throttling | `latency`, `downloadThroughput`, `uploadThroughput` |

### browser_debug
Debugging tools.

| Action | Description | Arguments |
|--------|-------------|-----------|
| `dialog` | Handle dialog | `accept`: boolean, `text`: string |
| `console` | Get console logs | - |
| `performance` | Get performance metrics | - |
| `trace_start` | Start performance trace | - |
| `trace_stop` | Stop trace | - |
| `downloads` | List downloads | - |
| `download_wait` | Wait for download | `filename`: string, `timeout`: number |

## Submitting Tasks

### Via REST API

```bash
curl -X POST http://localhost:3300/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "Screenshot Example",
    "task_intention": "Navigate and take screenshot",
    "commands": [
      {"tool_name": "browser_navigate", "intention": "Go to site", "args": {"action": "goto", "url": "https://example.com"}},
      {"tool_name": "browser_content", "intention": "Screenshot", "args": {"action": "screenshot"}}
    ]
  }'
```

Response:
```json
{
  "taskId": "task_1234567890_1",
  "queuePosition": 1,
  "wsEndpoint": "ws://localhost:3400"
}
```

### Via WebSocket (Real-time Progress)

```javascript
const ws = new WebSocket('ws://localhost:3400');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'task_submit',
    task_name: 'Screenshot Example',
    task_intention: 'Navigate and take screenshot',
    commands: [
      { tool_name: 'browser_navigate', intention: 'Go to site', args: { action: 'goto', url: 'https://example.com' } },
      { tool_name: 'browser_content', intention: 'Screenshot', args: { action: 'screenshot' } }
    ]
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'task_progress') {
    console.log(`[${msg.commandIndex + 1}/${msg.totalCommands}] ${msg.status}: ${msg.intention}`);
  }
  if (msg.type === 'task_complete') {
    console.log('Task completed:', msg.status);
  }
});
```

## Task Status Flow

```
Submit -> queued -> running -> completed (success)
                           -> failed (command error)
                           -> cancelled (user cancelled)
```

## Command Status Flow

```
pending -> running -> success
                   -> error
        -> skipped (if previous command failed or task cancelled)
```

## Common Task Examples

### Form Submission

```json
{
  "task_name": "Submit Contact Form",
  "task_intention": "Fill and submit the contact form",
  "commands": [
    { "tool_name": "browser_navigate", "intention": "Go to contact page", "args": { "action": "goto", "url": "https://example.com/contact" } },
    { "tool_name": "browser_interact", "intention": "Enter name", "args": { "action": "type", "selector": "#name", "text": "John Doe" } },
    { "tool_name": "browser_interact", "intention": "Enter email", "args": { "action": "type", "selector": "#email", "text": "john@example.com" } },
    { "tool_name": "browser_interact", "intention": "Enter message", "args": { "action": "type", "selector": "#message", "text": "Hello, I have a question." } },
    { "tool_name": "browser_interact", "intention": "Submit form", "args": { "action": "click", "selector": "button[type=submit]" } },
    { "tool_name": "browser_navigate", "intention": "Wait for confirmation", "args": { "action": "wait", "selector": ".success-message", "timeout": 5000 } }
  ]
}
```

### Web Scraping

```json
{
  "task_name": "Extract Product Data",
  "task_intention": "Get product information from page",
  "commands": [
    { "tool_name": "browser_navigate", "intention": "Go to product page", "args": { "action": "goto", "url": "https://shop.example.com/product/123" } },
    { "tool_name": "browser_navigate", "intention": "Wait for content", "args": { "action": "wait", "selector": ".product-details" } },
    { "tool_name": "browser_content", "intention": "Get product title", "args": { "action": "get", "selector": ".product-title", "type": "text" } },
    { "tool_name": "browser_content", "intention": "Get product price", "args": { "action": "get", "selector": ".product-price", "type": "text" } },
    { "tool_name": "browser_content", "intention": "Screenshot product", "args": { "action": "screenshot", "selector": ".product-image" } }
  ]
}
```

### Search and Navigate

```json
{
  "task_name": "Google Search",
  "task_intention": "Search Google and capture results",
  "commands": [
    { "tool_name": "browser_navigate", "intention": "Go to Google", "args": { "action": "goto", "url": "https://www.google.com" } },
    { "tool_name": "browser_interact", "intention": "Type search query", "args": { "action": "type", "selector": "textarea[name=q]", "text": "Moonsurf browser automation" } },
    { "tool_name": "browser_interact", "intention": "Press Enter", "args": { "action": "press", "key": "Enter" } },
    { "tool_name": "browser_navigate", "intention": "Wait for results", "args": { "action": "wait", "selector": "#search", "timeout": 10000 } },
    { "tool_name": "browser_content", "intention": "Screenshot results", "args": { "action": "screenshot" } }
  ]
}
```

## REST API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/tasks` | Submit new task |
| `GET` | `/tasks` | List tasks (filter: `?status=running&instanceId=xxx`) |
| `GET` | `/tasks/:id` | Get task details |
| `POST` | `/tasks/:id/cancel` | Cancel task |

## WebSocket Messages

### Client -> Server

| Type | Description |
|------|-------------|
| `task_submit` | Submit new task |
| `task_list` | List tasks |
| `task_status` | Get task details |
| `task_cancel` | Cancel task |
| `subscribe_task` | Subscribe to task updates |
| `subscribe_instance` | Subscribe to instance updates |

### Server -> Client

| Type | Description |
|------|-------------|
| `welcome` | Connection established |
| `task_submit_response` | Task submission result |
| `task_progress` | Command execution progress |
| `task_complete` | Task finished |
| `task_list_response` | Task list |
| `task_status_response` | Task details |
| `error` | Error occurred |

## Error Codes

| Code | Description |
|------|-------------|
| `EXECUTION_ERROR` | Tool execution failed |
| `COMMAND_TIMEOUT` | Command exceeded timeout (default: 60s) |
| `CANCELLED` | Task was cancelled |
| `INSTANCE_DISCONNECTED` | Browser disconnected |
| `INVALID_ARGUMENTS` | Invalid tool arguments |

## Selector Syntax

| Type | Example | Description |
|------|---------|-------------|
| ID | `#login-button` | Element by ID |
| Class | `.btn-primary` | Element by class |
| Attribute | `[data-testid="submit"]` | Element by attribute |
| Text | `text=Sign In` | Element containing exact text |
| Has Text | `button:has-text(Submit)` | Button containing text |
| Nth Child | `li:nth-child(2)` | Second list item |

## Best Practices

1. **Always wait for elements** before interacting - use `browser_navigate` with `action: wait`
2. **Use specific selectors** - prefer IDs and data-testid attributes over generic classes
3. **Set appropriate timeouts** - network conditions vary, use longer timeouts for navigation
4. **Handle dynamic content** - wait for elements to appear before extracting content
5. **Use meaningful intentions** - helps with debugging and progress tracking
