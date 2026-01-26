# Internals

Deep dive into Moonsurf's internal architecture and implementation details.

## Overview

This document covers the internal workings of Moonsurf for developers who want to understand or extend the codebase.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AI Client                                │
│                  (Claude Code, Cursor, etc.)                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │ SSE + HTTP
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HTTP Server                                 │
│                    (http-server.ts)                             │
│  ┌───────────┐  ┌──────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   CORS    │  │   Auth   │  │ Rate Limit  │  │   Audit    │ │
│  └───────────┘  └──────────┘  └─────────────┘  └────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MCP Handler                                  │
│                   (mcp-handler.ts)                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐ │
│  │  tools/list    │  │  tools/call    │  │  initialize      │ │
│  └────────────────┘  └────────────────┘  └──────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Tool Definitions                               │
│                 (tool-definitions.ts)                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ instance │ │   tab    │ │ navigate │ │ content  │ ...      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Instance Manager                                │
│                (instance-manager.ts)                            │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐ │
│  │ Instance Pool  │  │  Call Queue    │  │  Port Manager    │ │
│  └────────────────┘  └────────────────┘  └──────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  WebSocket Server                                │
│                (websocket-server.ts)                            │
│                Per-instance on ports 3301-3399                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ WebSocket
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Chrome Extension                                │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐ │
│  │   Background   │  │ Content Script │  │    Commands      │ │
│  └────────────────┘  └────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Request Flow

### 1. SSE Connection

```typescript
// Client connects to /sse
// http-server.ts handles connection

const sessionId = crypto.randomUUID();

// Store client
sseClients.set(sessionId, { res, sessionId });

// Send endpoint info
sendSSE(res, 'endpoint', `${baseUrl}/message?sessionId=${sessionId}`);
```

### 2. MCP Request

```typescript
// Client POSTs to /message
// http-server.ts receives request

const body = await parseBody(req);
const request = JSON.parse(body);

// Route to MCP handler
const response = await handleMCPRequest(request);

// Send response via HTTP and SSE
sendJson(res, 200, response);
if (client) {
  sendSSE(client.res, 'message', response);
}
```

### 3. Tool Execution

```typescript
// mcp-handler.ts routes tools/call

if (request.method === 'tools/call') {
  const { name, arguments: args } = request.params;
  return executeTool(name, args);
}

// tool-definitions.ts executes tool

async function executeTool(name, args) {
  switch (name) {
    case 'browser_instance':
      return handleBrowserInstance(args);
    // ... other tools
  }
}
```

### 4. Extension Communication

```typescript
// instance-manager.ts queues call

async function queueToolCall(instanceId, command, params) {
  const instance = instances.get(instanceId);
  const ws = websockets.get(instance.port);

  // Send command to extension
  ws.send(JSON.stringify({ type: command, params }));

  // Wait for response
  return new Promise((resolve, reject) => {
    const handler = (message) => {
      if (message.id === commandId) {
        resolve(message.result);
      }
    };
    ws.on('message', handler);
  });
}
```

## Instance Management

### Instance Lifecycle

```
         ┌─────────┐
         │ Launch  │ ← browser_instance action="launch"
         └────┬────┘
              │
              ▼
         ┌─────────┐
         │ Spawned │ ← Browser process started
         └────┬────┘
              │
              ▼
         ┌─────────┐
         │Register │ ← Extension calls POST /register
         └────┬────┘
              │
              ▼
         ┌─────────┐
         │ Connect │ ← Extension WebSocket connects
         └────┬────┘
              │
              ▼
         ┌─────────┐
         │  Ready  │ ← Instance available for commands
         └────┬────┘
              │
         ┌────┴────┐
         ▼         ▼
    ┌─────────┐ ┌─────────┐
    │  Close  │ │  Lost   │ ← Disconnect or browser crash
    └─────────┘ └─────────┘
```

### Instance Registry

```typescript
interface BrowserInstance {
  id: string;           // inst_xxx unique ID
  port: number;         // WebSocket port (3301-3399)
  extensionId: string;  // Chrome extension ID
  userAgent: string;    // Browser user agent
  windowId: number;     // Chrome window ID
  connectedAt: Date;    // Connection time
  lastActivity: Date;   // Last command time
}

// Stored in Map
const instances = new Map<string, BrowserInstance>();
```

### Port Allocation

```typescript
const WS_PORT_START = 3301;
const WS_PORT_END = 3399;

function allocatePort(): number | null {
  for (let port = WS_PORT_START; port <= WS_PORT_END; port++) {
    if (!usedPorts.has(port)) {
      usedPorts.add(port);
      return port;
    }
  }
  return null; // All ports in use
}
```

## Tool Call Queue

Commands are queued per instance to prevent race conditions:

```typescript
class InstanceManager {
  private queues = new Map<string, Queue>();

  async queueToolCall(instanceId, command, params) {
    const queue = this.getOrCreateQueue(instanceId);

    return queue.add(async () => {
      const result = await this.executeCommand(instanceId, command, params);
      return result;
    });
  }
}
```

## Task Execution Engine

### Task States

```
         ┌─────────┐
         │ Queued  │ ← Task submitted
         └────┬────┘
              │ Instance available
              ▼
         ┌─────────┐
         │ Running │ ← Commands executing
         └────┬────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
┌─────────┐ ┌─────────┐ ┌───────────┐
│Complete │ │ Failed  │ │ Cancelled │
└─────────┘ └─────────┘ └───────────┘
```

### Command Execution Loop

```typescript
async function executeTask(task: Task) {
  task.status = 'running';
  task.startedAt = new Date();

  for (let i = 0; i < task.commands.length; i++) {
    const command = task.commands[i];

    if (task.status === 'cancelled') {
      command.status = 'skipped';
      continue;
    }

    command.status = 'running';
    emit('progress', { taskId: task.id, commandIndex: i, status: 'running' });

    try {
      const result = await executeTool(command.tool_name, command.args);
      command.status = 'success';
      command.result = result;
      emit('progress', { taskId: task.id, commandIndex: i, status: 'success', result });
    } catch (error) {
      command.status = 'error';
      command.error = error.message;
      task.status = 'failed';
      emit('progress', { taskId: task.id, commandIndex: i, status: 'error', error: error.message });

      // Skip remaining commands
      for (let j = i + 1; j < task.commands.length; j++) {
        task.commands[j].status = 'skipped';
      }
      break;
    }
  }

  if (task.status === 'running') {
    task.status = 'completed';
  }
  task.completedAt = new Date();
  emit('complete', task);
}
```

## Configuration System

### Configuration Loading

```typescript
function getConfig(): ServerConfig {
  return {
    port: parseInt(process.env.PORT || '3300'),
    host: process.env.HOST || (isRemote ? '0.0.0.0' : 'localhost'),
    publicUrl: process.env.PUBLIC_URL,

    auth: {
      enabled: toBool(process.env.AUTH_ENABLED, isRemote),
      tokens: (process.env.AUTH_TOKENS || '').split(',').filter(Boolean),
    },

    tls: {
      enabled: toBool(process.env.TLS_ENABLED, false),
      cert: process.env.TLS_CERT_PATH,
      key: process.env.TLS_KEY_PATH,
    },

    // ... more configuration
  };
}
```

### Validation

```typescript
function validateConfig(config: ServerConfig): ValidationResult {
  const errors: string[] = [];

  if (config.auth.enabled && config.auth.tokens.length === 0) {
    errors.push('Authentication enabled but no tokens configured');
  }

  if (config.tls.enabled && (!config.tls.cert || !config.tls.key)) {
    errors.push('TLS enabled but cert/key paths not provided');
  }

  return { valid: errors.length === 0, errors };
}
```

## Extension Protocol

### Command Message Format

```typescript
// Server to Extension
{
  id: string;      // Unique command ID
  type: string;    // Command type
  params: object;  // Command parameters
}

// Extension to Server
{
  id: string;      // Matching command ID
  success: boolean;
  result?: any;    // Command result
  error?: string;  // Error message
}
```

### Command Types

| Type | Description |
|------|-------------|
| `navigate_goto` | Navigate to URL |
| `navigate_back` | Go back |
| `interact_click` | Click element |
| `interact_type` | Type text |
| `content_screenshot` | Take screenshot |
| `content_extract` | Extract content |
| `execute_evaluate` | Run JavaScript |
| ... | ... |

## Download Tracking

### File Watcher

```typescript
class DownloadWatcher {
  private watcher: FSWatcher;
  private downloads: Map<string, Download>;

  constructor(directory: string) {
    this.watcher = chokidar.watch(directory, {
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher.on('add', (path) => {
      this.downloads.set(path, {
        filename: basename(path),
        path,
        size: null,
        status: 'in_progress',
        startedAt: new Date(),
      });
    });

    this.watcher.on('change', (path) => {
      const download = this.downloads.get(path);
      if (download) {
        const stats = statSync(path);
        download.size = stats.size;
        // Check if download complete
        if (isComplete(path)) {
          download.status = 'completed';
          download.completedAt = new Date();
        }
      }
    });
  }
}
```

## SSE Transport

### SSE Message Format

```
event: <event-type>
data: <json-data>

```

Note the double newline at the end.

### Keep-Alive

SSE connections are kept alive with periodic comments:

```typescript
setInterval(() => {
  for (const client of sseClients.values()) {
    client.res.write(':keepalive\n\n');
  }
}, 30000);
```

## Error Handling

### Error Propagation

```
Extension Error → WebSocket Message → Instance Manager → Tool Definition → MCP Handler → HTTP Response
```

### Error Response Format

```typescript
// MCP Error
{
  jsonrpc: '2.0',
  id: requestId,
  error: {
    code: -32603,
    message: 'Internal error: Element not found'
  }
}

// Tool Result with Error
{
  content: [{ type: 'text', text: 'Error: Element not found' }],
  isError: true
}
```

## Memory Management

### Instance Cleanup

```typescript
// When browser disconnects
function cleanupInstance(instanceId: string) {
  const instance = instances.get(instanceId);
  if (instance) {
    // Release port
    usedPorts.delete(instance.port);

    // Close WebSocket server
    wsServers.get(instance.port)?.close();
    wsServers.delete(instance.port);

    // Clear queues
    queues.delete(instanceId);

    // Remove instance
    instances.delete(instanceId);
  }
}
```

### Rate Limit Cleanup

```typescript
// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000);
```

## Performance Considerations

### Concurrent Operations

- Each instance has its own WebSocket (no contention)
- Tool calls are queued per instance (no race conditions)
- SSE clients are independent (no blocking)

### Bottlenecks

- Extension execution (single-threaded browser)
- Page load times (network dependent)
- Screenshot encoding (CPU intensive)

### Optimization Tips

- Use headless mode for faster execution
- Minimize screenshots in loops
- Use `networkidle` only when necessary
- Close unused browser instances

## Related

- [Project Structure](project-structure.md) - File organization
- [Adding Tools](adding-tools.md) - Extend functionality
- [Extension Development](extension-development.md) - Chrome extension
