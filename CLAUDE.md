# Moonsurf Browser Control

AI-native browser automation MCP server that gives AI agents complete control over web browsers.

## Project Structure

```
src/
├── index.ts                  # CLI entry point, skill installer
├── config.ts                 # Environment-based configuration (LOCAL/REMOTE modes)
├── types.ts                  # TypeScript interfaces
├── http-server.ts            # HTTP/HTTPS server, SSE, authentication, CORS
├── websocket-server.ts       # Extension WebSocket communication
├── instance-manager.ts       # Browser lifecycle, tool call queuing
├── browser-launcher.ts       # Chrome process spawn, extension handling
├── download-watcher.ts       # File system monitoring for downloads
├── mcp-handler.ts            # MCP protocol routing
├── tool-definitions.ts       # 9 consolidated MCP tools
├── sse-transport.ts          # SSE transport (legacy)
├── skill-installer.ts        # Claude skill installer
├── task-manager.ts           # Task queue and execution engine
└── task-websocket-server.ts  # Task WebSocket server for real-time updates
```

## Architecture

```
AI Client (Claude/Gemini) ──SSE/HTTP──> MCP Server (Node.js) ──WebSocket──> Chrome Extension
```

## Local Development

### Prerequisites

- Node.js 18+
- Chromium installed at `/Applications/Chromium.app`
- Chrome extension project at `../chrome-extension`

### Setup

1. Build the extension:
   ```bash
   cd ../chrome-extension
   npm install
   npm run build
   ```

2. Build the MCP server:
   ```bash
   npm install
   npm run build
   ```

3. Run with local extension:
   ```bash
   EXTENSION_PATH=../chrome-extension/dist npm start
   ```

### Development Workflow

**Terminal 1 - Extension (watch mode):**
```bash
cd ../chrome-extension
npm run dev
```

**Terminal 2 - MCP Server:**
```bash
npm run build && EXTENSION_PATH=../chrome-extension/dist npm start
```

The server starts at `http://localhost:3300` with SSE endpoint at `/sse`.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EXTENSION_PATH` | Path to local extension directory (for development) | `~/.moonsurf/extension` |
| `PORT` | Server port | `3300` |
| `HOST` | Server host | `localhost` |
| `REMOTE_MODE` | Enable remote mode (auth, TLS) | `false` |
| `AUTH_TOKENS` | Comma-separated auth tokens | - |
| `BROWSER_DEFAULT_MODE` | Default browser mode | `chromium` |
| `HEADLESS_DEFAULT` | Run headless by default | `false` |

### Browser Modes

- **chrome**: System Chrome with existing profiles (manual extension install)
- **testing**: Chrome for Testing with temporary profile
- **chromium**: Chromium with persistent profile at `~/.moonsurf` (recommended for dev)

## Testing with Claude Code

After starting the server, use the `moonsurf-browser` skill:

```bash
# In Claude Code
/moonsurf-browser
```

Or connect directly via MCP config.

## Task Execution System

The task execution system allows submitting batched commands that run sequentially with real-time progress reporting.

### Architecture

```
Client ──WebSocket──> Task WS Server (:3400) ──> Task Manager ──> MCP Handler ──> Browser
                            ↓
                     Real-time progress updates
```

### Task Input Format

```json
{
  "type": "task_submit",
  "task_name": "Login Flow",
  "task_intention": "Log into the website and navigate to dashboard",
  "instanceId": "inst_xxx",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to login page",
      "args": { "action": "goto", "url": "https://example.com/login" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Enter username",
      "args": { "action": "type", "selector": "#username", "text": "user@example.com" }
    }
  ]
}
```

### WebSocket Protocol (port 3400)

**Client → Server:**
- `task_submit` - Submit a new task
- `task_list` - List tasks (optional: instanceId, status filter)
- `task_status` - Get task details by taskId
- `task_cancel` - Cancel a running/queued task
- `subscribe_task` - Subscribe to updates for a specific task
- `subscribe_instance` - Subscribe to all tasks for an instance

**Server → Client:**
- `welcome` - Connection established with sessionId
- `task_submit_response` - Task accepted/rejected with taskId
- `task_progress` - Command status update (running/success/error)
- `task_complete` - Task finished with full results

### REST API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks` | List tasks (query: instanceId, status) |
| GET | `/tasks/:id` | Get task details |
| POST | `/tasks` | Submit a new task |
| POST | `/tasks/:id/cancel` | Cancel a task |

### Task Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TASKS_ENABLED` | `true` | Enable task execution feature |
| `TASKS_WS_PORT` | `3400` | Task WebSocket server port |
| `TASKS_COMMAND_TIMEOUT` | `60000` | Per-command timeout (ms) |
| `TASKS_MAX_QUEUE_SIZE` | `100` | Max tasks per instance queue |

### Testing Task Execution

```bash
# Start server
EXTENSION_PATH=../chrome-extension/dist npm start

# Connect to task WebSocket (using wscat or similar)
wscat -c ws://localhost:3400

# Submit a task
{"type":"task_submit","task_name":"Test","task_intention":"Testing task execution","commands":[{"tool_name":"browser_navigate","intention":"Go to Google","args":{"action":"goto","url":"https://google.com"}}]}

# You'll receive:
# - task_submit_response (taskId, queuePosition)
# - task_progress for each command (running, then success/error)
# - task_complete when done
```

### Task States

- `queued` - Waiting in queue
- `running` - Currently executing
- `completed` - All commands succeeded
- `failed` - A command failed (remaining commands skipped)
- `cancelled` - Cancelled by user

### Command States

- `pending` - Not yet started
- `running` - Currently executing
- `success` - Completed successfully
- `error` - Failed with error
- `skipped` - Skipped due to previous error

## Related Projects

- `../chrome-extension` - Browser extension that executes commands
- `../desktop-app` - Desktop application
- `../moonsurf-web` - Web application
