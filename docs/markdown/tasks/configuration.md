# Configuration

This document covers all configuration options for the Task Execution System.

## Environment Variables

Configure the task system using environment variables.

| Variable | Default | Description |
|----------|---------|-------------|
| `TASKS_ENABLED` | `true` | Enable/disable the task execution feature |
| `TASKS_WS_PORT` | `3400` | WebSocket server port for task operations |
| `TASKS_COMMAND_TIMEOUT` | `60000` | Per-command timeout in milliseconds |
| `TASKS_MAX_QUEUE_SIZE` | `100` | Maximum tasks per instance queue |

## Detailed Configuration

### TASKS_ENABLED

Enable or disable the entire task execution system.

```bash
# Disable task system
TASKS_ENABLED=false npm start

# Enable (default)
TASKS_ENABLED=true npm start
```

When disabled:
- Task WebSocket server does not start
- REST endpoints for tasks return 404
- Task Manager is not initialized

Use case: Disable when you only need MCP tool access without the task batching feature.

### TASKS_WS_PORT

Port for the task WebSocket server.

```bash
# Use custom port
TASKS_WS_PORT=4000 npm start
```

**Notes:**
- Must not conflict with HTTP server port (default 3300)
- Must not conflict with instance WebSocket ports (default 3301-3399)
- Clients must connect to this port for task operations

### TASKS_COMMAND_TIMEOUT

Maximum time allowed for a single command to complete.

```bash
# Increase timeout to 2 minutes
TASKS_COMMAND_TIMEOUT=120000 npm start

# Reduce timeout to 30 seconds
TASKS_COMMAND_TIMEOUT=30000 npm start
```

**Notes:**
- Value is in milliseconds
- Applies per-command, not per-task
- If a command times out, the task fails
- Consider page load times, typing speed, and network latency

Recommended values:
- **Fast pages**: 30000 (30s)
- **Normal pages**: 60000 (60s, default)
- **Slow pages/heavy operations**: 120000-180000 (2-3 min)

### TASKS_MAX_QUEUE_SIZE

Maximum number of tasks that can be queued per browser instance.

```bash
# Allow more queued tasks
TASKS_MAX_QUEUE_SIZE=500 npm start

# Reduce queue size
TASKS_MAX_QUEUE_SIZE=20 npm start
```

**Notes:**
- Applies per browser instance
- When queue is full, new submissions return `QUEUE_FULL` error
- Helps prevent memory issues with many pending tasks

---

## Configuration Examples

### Development

```bash
# Relaxed settings for development
TASKS_ENABLED=true \
TASKS_WS_PORT=3400 \
TASKS_COMMAND_TIMEOUT=120000 \
TASKS_MAX_QUEUE_SIZE=50 \
npm start
```

### Production

```bash
# Strict settings for production
TASKS_ENABLED=true \
TASKS_WS_PORT=3400 \
TASKS_COMMAND_TIMEOUT=60000 \
TASKS_MAX_QUEUE_SIZE=100 \
npm start
```

### High-Volume

```bash
# For high-volume task processing
TASKS_ENABLED=true \
TASKS_WS_PORT=3400 \
TASKS_COMMAND_TIMEOUT=30000 \
TASKS_MAX_QUEUE_SIZE=500 \
npm start
```

### Local Development with Extension

```bash
# Using local Chrome extension
EXTENSION_PATH=../chrome-extension/dist \
TASKS_ENABLED=true \
npm start
```

---

## Server Configuration Context

The task system is part of the larger Moonsurf server configuration. Here's how it fits:

```
Server Configuration
├── HTTP Server
│   ├── PORT (default: 3300)
│   └── /tasks REST endpoints
├── MCP Server
│   ├── SSE endpoint
│   └── Tool handlers
├── Instance WebSockets
│   ├── WS_PORT_START (default: 3301)
│   └── WS_PORT_END (default: 3399)
└── Task System ← You are here
    ├── TASKS_ENABLED
    ├── TASKS_WS_PORT
    ├── TASKS_COMMAND_TIMEOUT
    └── TASKS_MAX_QUEUE_SIZE
```

---

## Programmatic Configuration

The configuration is loaded in `src/config.ts`:

```typescript
export interface ServerConfig {
  // ... other config
  tasks: {
    enabled: boolean;
    wsPort: number;
    commandTimeout: number;
    maxQueueSize: number;
  };
}

function loadConfig(): ServerConfig {
  return {
    // ... other config
    tasks: {
      enabled: parseBoolean(process.env.TASKS_ENABLED, true),
      wsPort: parseNumber(process.env.TASKS_WS_PORT, 3400),
      commandTimeout: parseNumber(process.env.TASKS_COMMAND_TIMEOUT, 60000),
      maxQueueSize: parseNumber(process.env.TASKS_MAX_QUEUE_SIZE, 100),
    },
  };
}
```

---

## Startup Verification

When the server starts, it logs the task configuration:

```
[Config] Server Configuration:
[Config]   Mode: LOCAL
[Config]   HTTP: http://localhost:3300
[Config]   WebSocket: ws://localhost:3301-3399
[Config]   ...
[Config]   Tasks: ENABLED (port: 3400, timeout: 60000ms)
```

Or if disabled:

```
[Config]   Tasks: DISABLED
```

---

## Runtime Behavior

### Queue Limits

When the queue is full:

```json
{
  "type": "task_submit_response",
  "success": false,
  "error": "Queue full: max 100 tasks allowed"
}
```

**Handling:**
1. Wait for tasks to complete
2. Cancel unnecessary pending tasks
3. Increase `TASKS_MAX_QUEUE_SIZE`

### Timeout Behavior

When a command times out:

1. Command is marked as `error` with code `COMMAND_TIMEOUT`
2. Task is marked as `failed`
3. Remaining commands are marked as `skipped`
4. `task_complete` is emitted with error details

```json
{
  "type": "task_complete",
  "status": "failed",
  "error": {
    "code": "COMMAND_TIMEOUT",
    "message": "Command timeout after 60000ms",
    "commandId": "task_123_cmd_1"
  }
}
```

---

## Related Configuration

### Server-wide Settings

These affect the task system indirectly:

| Variable | Default | Impact on Tasks |
|----------|---------|-----------------|
| `PORT` | `3300` | HTTP server for REST task endpoints |
| `WS_PORT_START` | `3301` | First port for browser instance WebSockets |
| `WS_PORT_END` | `3399` | Last port for browser instance WebSockets |
| `CORS_ENABLED` | `false` | Enable CORS for browser-based task clients |

### Browser Settings

| Variable | Default | Impact on Tasks |
|----------|---------|-----------------|
| `HEADLESS` | `false` | Run browser headlessly (affects command execution) |
| `EXTENSION_PATH` | - | Path to local Chrome extension |

---

## Validation

The server validates configuration at startup:

1. **Port conflicts**: Ensures `TASKS_WS_PORT` doesn't conflict with other ports
2. **Timeout sanity**: Warns if timeout is very short (< 5000ms)
3. **Queue size**: Warns if queue size is very large (> 1000)

---

## Changing Configuration

Configuration is read at server startup. To apply changes:

1. Stop the server
2. Set new environment variables
3. Restart the server

```bash
# Stop server (Ctrl+C or kill process)

# Set new config
export TASKS_COMMAND_TIMEOUT=120000

# Restart
npm start
```

There is no hot-reload of configuration. This ensures predictable behavior during task execution.
