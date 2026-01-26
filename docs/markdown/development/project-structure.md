# Project Structure

Overview of the Moonsurf Browser Control codebase organization.

## Directory Layout

```
browser-control/
├── src/                        # TypeScript source code
│   ├── index.ts               # CLI entry point
│   ├── config.ts              # Configuration management
│   ├── types.ts               # TypeScript type definitions
│   ├── http-server.ts         # HTTP/HTTPS server with SSE
│   ├── websocket-server.ts    # Extension WebSocket server
│   ├── instance-manager.ts    # Browser instance management
│   ├── browser-launcher.ts    # Browser process spawning
│   ├── mcp-handler.ts         # MCP protocol routing
│   ├── tool-definitions.ts    # MCP tool definitions
│   ├── task-manager.ts        # Task queue and execution
│   ├── task-websocket-server.ts # Task WebSocket server
│   ├── download-watcher.ts    # File download monitoring
│   ├── sse-transport.ts       # SSE transport (legacy)
│   └── skill-installer.ts     # Claude skill installer
├── dist/                       # Compiled JavaScript (generated)
├── docs/                       # Documentation
├── skills/                     # Claude skill files
│   └── moonsurf-browser/
│       ├── SKILL.md           # Skill definition
│       └── REFERENCE.md       # Tool reference
├── package.json               # Package configuration
├── tsconfig.json              # TypeScript configuration
├── CLAUDE.md                  # Project instructions
└── README.md                  # Project readme
```

## Source Files

### Entry Point

#### `src/index.ts`

CLI entry point that handles command-line arguments and starts the server.

```typescript
// Responsibilities:
// - Parse CLI arguments (--help, --version, --install-skill)
// - Start HTTP server
// - Start Task WebSocket server
// - Handle graceful shutdown
```

### Configuration

#### `src/config.ts`

Environment-based configuration with validation.

```typescript
// Key exports:
export interface ServerConfig { ... }
export function getConfig(): ServerConfig
export function validateConfig(config): ValidationResult
export function printConfigSummary(config): void
```

**Configuration groups:**
- Server (port, host, public URL)
- Authentication (enabled, tokens)
- TLS (enabled, cert/key paths)
- CORS (enabled, origins)
- Rate limiting (enabled, limits)
- Browser (default mode, headless)
- Tasks (enabled, port, timeouts)
- Logging (level, audit)

### Type Definitions

#### `src/types.ts`

TypeScript interfaces for all data structures.

```typescript
// Core types:
interface BrowserInstance { ... }
interface RegistrationRequest { ... }

// Task types:
interface Task { ... }
interface TaskCommand { ... }
type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
type CommandStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped'

// Message types:
interface TaskSubmitMessage { ... }
interface TaskProgressMessage { ... }
interface TaskCompleteMessage { ... }
// ... and more
```

### HTTP Server

#### `src/http-server.ts`

Main HTTP/HTTPS server with SSE support.

```typescript
// Features:
// - CORS handling
// - Token-based authentication
// - Rate limiting
// - SSE endpoint for MCP
// - REST API endpoints
// - Audit logging
```

**Endpoints:**
- `/health` - Health check
- `/info` - Server info
- `/sse` - SSE connection
- `/message` - MCP requests
- `/register` - Extension registration
- `/instances` - List instances
- `/tasks` - Task management
- `/oauth/*` - OAuth compatibility

### WebSocket Server

#### `src/websocket-server.ts`

WebSocket server for browser extension communication.

```typescript
// Responsibilities:
// - Accept extension connections
// - Route messages to/from extension
// - Handle tool execution
// - Manage connection lifecycle
```

**Port range:** 3301-3399 (one per instance)

### Instance Manager

#### `src/instance-manager.ts`

Manages browser instance lifecycle.

```typescript
// Key exports:
export const instanceManager: InstanceManager

// Methods:
register(request): BrowserInstance | null
unregister(instanceId): void
getConnectedInstances(): BrowserInstance[]
getDefaultInstance(): BrowserInstance | null
queueToolCall(instanceId, tool, args): Promise<result>
```

**Responsibilities:**
- Track registered instances
- Assign WebSocket ports
- Queue tool calls
- Handle disconnections

### Browser Launcher

#### `src/browser-launcher.ts`

Spawns browser processes with extension.

```typescript
// Key exports:
export async function launchBrowser(options): Promise<LaunchResult>
export function getBrowserPath(mode): string
export function getExtensionPath(): string
```

**Browser modes:**
- `chrome` - System Chrome
- `chromium` - Chromium browser
- `testing` - Chrome for Testing

**Extension loading:**
- Downloads from GitHub releases if needed
- Extracts to `~/.moonsurf/extension/`
- Passes to browser via `--load-extension`

### MCP Handler

#### `src/mcp-handler.ts`

Routes MCP protocol requests.

```typescript
// Key exports:
export async function handleMCPRequest(request): Promise<response>

// Supported methods:
// - initialize
// - tools/list
// - tools/call
// - resources/list
// - prompts/list
```

### Tool Definitions

#### `src/tool-definitions.ts`

Defines the 9 consolidated MCP tools.

```typescript
// Key exports:
export const tools: Tool[]
export async function executeTool(name, args): Promise<result>

// Tools defined:
// - browser_instance
// - browser_tab
// - browser_navigate
// - browser_content
// - browser_interact
// - browser_execute
// - browser_network
// - browser_emulate
// - browser_debug
```

Each tool:
- Has a JSON schema for input validation
- Maps actions to extension commands
- Returns structured results

### Task Manager

#### `src/task-manager.ts`

Manages task queue and execution.

```typescript
// Key exports:
export const taskManager: TaskManager

// Methods:
submitTask(message): SubmitResult
getTask(taskId): Task | undefined
listTasks(instanceId?, status?): Task[]
cancelTask(taskId): boolean

// Events:
taskManager.on('progress', handler)
taskManager.on('complete', handler)
```

**Responsibilities:**
- Queue tasks per instance
- Execute commands sequentially
- Emit progress events
- Handle cancellation

### Task WebSocket Server

#### `src/task-websocket-server.ts`

WebSocket server for task management.

```typescript
// Key exports:
export function startTaskWebSocketServer(port): WebSocketServer
export function stopTaskWebSocketServer(): void
export function getTaskWebSocketUrl(): string
```

**Message types:**
- `task_submit` / `task_submit_response`
- `task_list` / `task_list_response`
- `task_status` / `task_status_response`
- `task_cancel` / `task_cancel_response`
- `subscribe_task` / `subscribe_instance` / `subscribe_ack`
- `task_progress`
- `task_complete`

### Download Watcher

#### `src/download-watcher.ts`

Monitors browser downloads directory.

```typescript
// Key exports:
export class DownloadWatcher
export function getDownloads(): Download[]
```

Uses `chokidar` for file system watching.

### Skill Installer

#### `src/skill-installer.ts`

Installs Claude skill for browser automation.

```typescript
// Key exports:
export function installSkill(): void
export function uninstallSkill(): void
export function showSkillStatus(): void
```

Copies skill files to `~/.claude/skills/moonsurf-browser/`.

## Package Configuration

### `package.json`

```json
{
  "name": "@moonsurf/browser-control",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "moonsurf": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js",
    "typecheck": "tsc --noEmit"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "dist"
  }
}
```

## Data Flow

```
AI Client
    ↓ SSE/HTTP
HTTP Server (http-server.ts)
    ↓ MCP
MCP Handler (mcp-handler.ts)
    ↓ Tool call
Tool Definitions (tool-definitions.ts)
    ↓ Queue
Instance Manager (instance-manager.ts)
    ↓ WebSocket
WebSocket Server (websocket-server.ts)
    ↓
Chrome Extension (external)
    ↓
Browser DOM
```

## Related

- [Local Setup](local-setup.md) - Development environment
- [Internals](internals.md) - Deep architecture dive
- [Adding Tools](adding-tools.md) - Extend functionality
