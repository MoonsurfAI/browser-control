# HTTP Endpoints

Complete reference for Moonsurf's REST API endpoints.

## Base URL

- **Local:** `http://localhost:3300`
- **Remote:** `https://your-server.com:3300`
- **Custom:** Set via `PUBLIC_URL` environment variable

## Health & Info

### GET /health

Check server health status. No authentication required.

**Request:**
```bash
curl http://localhost:3300/health
```

**Response:**
```json
{
  "status": "ok",
  "version": "2.0.0",
  "connectedInstances": 2,
  "sseClients": 3,
  "auth": "enabled",
  "authTokens": 2,
  "tls": "disabled",
  "rateLimit": "enabled",
  "rateLimitMax": 100
}
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Always "ok" if healthy |
| `version` | string | Server version |
| `connectedInstances` | number | Active browser instances |
| `sseClients` | number | Connected MCP clients |
| `auth` | string | "enabled" or "disabled" |
| `authTokens` | number | Number of configured tokens |
| `tls` | string | "enabled" or "disabled" |
| `rateLimit` | string | "enabled" or "disabled" |
| `rateLimitMax` | number | Max requests per minute |

### GET /info

Get server configuration info. No authentication required.

**Request:**
```bash
curl http://localhost:3300/info
```

**Response:**
```json
{
  "name": "moonsurf-mcp",
  "version": "2.0.0",
  "endpoints": {
    "sse": "http://localhost:3300/sse",
    "message": "http://localhost:3300/message",
    "register": "http://localhost:3300/register",
    "health": "http://localhost:3300/health",
    "rest_api": {
      "list_tools": "http://localhost:3300/api/tools",
      "execute_tool": "http://localhost:3300/api/tools/{toolName}"
    }
  },
  "websocket": {
    "protocol": "ws",
    "host": "localhost",
    "portRange": "3301-3399"
  },
  "auth": {
    "required": false,
    "method": "none"
  }
}
```

## MCP Endpoints

### GET /sse

Establish SSE connection for MCP protocol. **Authentication required** (when enabled).

**Request:**
```bash
# With token in URL
curl -N "http://localhost:3300/sse?token=your-token"

# With Authorization header (not typical for SSE)
curl -N -H "Authorization: Bearer your-token" http://localhost:3300/sse
```

**Response:** Server-Sent Events stream

```
event: endpoint
data: http://localhost:3300/message?sessionId=abc123-def456

event: message
data: {"jsonrpc":"2.0","id":1,"result":{...}}
```

**Events:**

| Event | Description |
|-------|-------------|
| `endpoint` | Connection established, contains message URL |
| `message` | MCP response to a request |

### POST /message

Send MCP request and receive response. **Authentication required** (when enabled).

**Request:**
```bash
curl -X POST "http://localhost:3300/message?sessionId=abc123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

**Query Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `sessionId` | No | SSE session ID for sending response via SSE |

**Request Body (JSON-RPC 2.0):**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [...]
  }
}
```

**MCP Methods:**

| Method | Description |
|--------|-------------|
| `tools/list` | List available tools |
| `tools/call` | Execute a tool |
| `resources/list` | List resources (empty) |
| `prompts/list` | List prompts (empty) |
| `initialize` | Initialize MCP session |

## Browser Instance Management

### POST /register

Register a browser extension. **Authentication required** (when enabled).

Called automatically by the Chrome extension when connecting.

**Request:**
```bash
curl -X POST http://localhost:3300/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "extensionId": "ext-abc123",
    "userAgent": "Mozilla/5.0...",
    "windowId": 12345
  }'
```

**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `extensionId` | string | Extension identifier |
| `userAgent` | string | Browser user agent |
| `windowId` | number | Browser window ID |

**Response:**
```json
{
  "instanceId": "inst_abc123",
  "port": 3301,
  "websocketUrl": "ws://localhost:3301"
}
```

### GET /instances

List connected browser instances. **Authentication required** (when enabled).

**Request:**
```bash
curl -H "Authorization: Bearer your-token" \
  http://localhost:3300/instances
```

**Response:**
```json
{
  "instances": [
    {
      "id": "inst_abc123",
      "port": 3301,
      "userAgent": "Mozilla/5.0...",
      "windowId": 12345,
      "connectedAt": "2024-01-15T10:30:00.000Z",
      "lastActivity": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

## REST Tools API

Execute browser automation tools directly via HTTP without the MCP protocol. See [REST API](rest-api.md) for the full reference with examples for every tool.

### GET /api/tools

List all available tools with their schemas. **Authentication required** (when enabled).

**Request:**
```bash
curl http://localhost:3300/api/tools
```

**Response:**
```json
{
  "tools": [
    {
      "name": "browser_instance",
      "description": "Manage browser instances...",
      "inputSchema": { ... }
    },
    {
      "name": "browser_tab",
      "description": "..."
    }
  ]
}
```

### POST /api/tools/{toolName}

Execute a tool by name. **Authentication required** (when enabled).

**Request:**
```bash
curl -X POST http://localhost:3300/api/tools/browser_instance \
  -H "Content-Type: application/json" \
  -d '{"action": "list"}'
```

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `toolName` | string | Tool name (e.g., `browser_instance`, `browser_tab`, `sleep`) |

**Request Body:** Tool arguments as JSON. Include `action` for consolidated tools.

**Success Response (200):**
```json
{
  "success": true,
  "result": {
    "instances": []
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "TOOL_ERROR",
    "message": "Invalid action \"bogus\" for tool \"browser_tab\""
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": {
    "code": "TOOL_NOT_FOUND",
    "message": "Unknown tool: nonexistent"
  }
}
```

**Available tools:** `browser_instance`, `browser_tab`, `browser_navigate`, `browser_content`, `browser_interact`, `browser_execute`, `browser_network`, `browser_emulate`, `browser_debug`, `sleep`

## Task Endpoints

### GET /tasks

List tasks. **Authentication required** (when enabled).

**Request:**
```bash
# List all tasks
curl -H "Authorization: Bearer your-token" \
  http://localhost:3300/tasks

# Filter by instance
curl -H "Authorization: Bearer your-token" \
  "http://localhost:3300/tasks?instanceId=inst_abc123"

# Filter by status
curl -H "Authorization: Bearer your-token" \
  "http://localhost:3300/tasks?status=running"
```

**Query Parameters:**

| Parameter | Values | Description |
|-----------|--------|-------------|
| `instanceId` | string | Filter by instance ID |
| `status` | `queued`, `running`, `completed`, `failed`, `cancelled`, `all` | Filter by status |

**Response:**
```json
{
  "tasks": [
    {
      "id": "task_xyz789",
      "name": "Login Flow",
      "status": "running",
      "instanceId": "inst_abc123",
      "currentCommandIndex": 2,
      "totalCommands": 5,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "startedAt": "2024-01-15T10:30:01.000Z",
      "completedAt": null
    }
  ],
  "wsEndpoint": "ws://localhost:3400"
}
```

### POST /tasks

Submit a new task. **Authentication required** (when enabled).

**Request:**
```bash
curl -X POST http://localhost:3300/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
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
      }
    ]
  }'
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `task_name` | string | Yes | Task display name |
| `task_intention` | string | No | Task purpose description |
| `instanceId` | string | No | Target browser instance |
| `commands` | array | Yes | Array of commands |

**Command Format:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tool_name` | string | Yes | MCP tool name |
| `intention` | string | No | Command purpose |
| `args` | object | Yes | Tool arguments |

**Response:**
```json
{
  "taskId": "task_xyz789",
  "queuePosition": 0,
  "wsEndpoint": "ws://localhost:3400"
}
```

### GET /tasks/:id

Get task details. **Authentication required** (when enabled).

**Request:**
```bash
curl -H "Authorization: Bearer your-token" \
  http://localhost:3300/tasks/task_xyz789
```

**Response:**
```json
{
  "task": {
    "id": "task_xyz789",
    "name": "Login Flow",
    "intention": "Log into the application",
    "status": "completed",
    "instanceId": "inst_abc123",
    "commands": [
      {
        "tool_name": "browser_navigate",
        "intention": "Go to login page",
        "args": { "action": "goto", "url": "https://example.com/login" },
        "status": "success",
        "result": { ... },
        "startedAt": "2024-01-15T10:30:01.000Z",
        "completedAt": "2024-01-15T10:30:03.000Z"
      }
    ],
    "currentCommandIndex": 2,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "startedAt": "2024-01-15T10:30:01.000Z",
    "completedAt": "2024-01-15T10:30:10.000Z"
  }
}
```

### POST /tasks/:id/cancel

Cancel a running or queued task. **Authentication required** (when enabled).

**Request:**
```bash
curl -X POST -H "Authorization: Bearer your-token" \
  http://localhost:3300/tasks/task_xyz789/cancel
```

**Response:**
```json
{
  "success": true,
  "message": "Task cancelled"
}
```

Or if task not found/already completed:
```json
{
  "success": false,
  "message": "Task not found or already completed"
}
```

## OAuth Endpoints

These endpoints provide OAuth 2.0 compatibility for clients that require it.

### GET /.well-known/oauth-authorization-server

OAuth server metadata.

**Response:**
```json
{
  "issuer": "http://localhost:3300",
  "authorization_endpoint": "http://localhost:3300/oauth/authorize",
  "token_endpoint": "http://localhost:3300/oauth/token",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code"],
  "code_challenge_methods_supported": ["S256"],
  "registration_endpoint": "http://localhost:3300/oauth/register"
}
```

### POST /oauth/register

Register OAuth client.

**Request:**
```bash
curl -X POST http://localhost:3300/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "My App",
    "redirect_uris": ["http://localhost:8080/callback"]
  }'
```

**Response:**
```json
{
  "client_id": "moonsurf-client",
  "client_secret": "not-secret",
  "redirect_uris": ["http://localhost:8080/callback"],
  "client_name": "My App"
}
```

### GET /oauth/authorize

OAuth authorization. Auto-approves and redirects with code.

**Request:**
```
GET /oauth/authorize?redirect_uri=http://localhost:8080/callback&state=xyz
```

**Response:** 302 redirect to:
```
http://localhost:8080/callback?code=auto-approved-code&state=xyz
```

### POST /oauth/token

Exchange code for access token.

**Response:**
```json
{
  "access_token": "local-access-token",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

## Error Responses

### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

### 404 Not Found

```json
{
  "error": "Not found"
}
```

### 429 Too Many Requests

```
HTTP/1.1 429 Too Many Requests
Retry-After: 45

{"error": "Too many requests", "retryAfter": 45}
```

### 503 Service Unavailable

```json
{
  "error": "No available ports"
}
```

## CORS Headers

All responses include CORS headers:

```
Access-Control-Allow-Origin: * (or specific origins if configured)
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true (if enabled)
```

Preflight requests (OPTIONS) return 204 No Content with headers.

## Related

- [SSE Protocol](sse-protocol.md) - SSE connection details
- [WebSocket Protocol](websocket-protocol.md) - Task WebSocket API
- [Error Codes](error-codes.md) - Error reference
