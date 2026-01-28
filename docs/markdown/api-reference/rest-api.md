# REST API

The REST API provides a simple HTTP interface for executing Moonsurf browser automation tools without needing the MCP protocol or SSE connections. Any HTTP client (curl, Python requests, JavaScript fetch, Postman, etc.) can call tools directly.

## Overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tools` | List all available tools with schemas |
| POST | `/api/tools/{toolName}` | Execute a tool |

All REST API endpoints require authentication when auth is enabled.

## Why use the REST API?

The MCP protocol (SSE + JSON-RPC) is designed for AI clients like Claude and Cursor. The REST API is designed for everything else:

- **Scripts and automation** - Shell scripts, cron jobs, CI/CD pipelines
- **Web applications** - Frontend or backend services calling Moonsurf directly
- **Custom integrations** - Any language or platform with HTTP support
- **Testing and debugging** - Quick tool calls with curl during development
- **Non-MCP clients** - Applications that don't support the MCP protocol

The REST API returns clean JSON responses (not wrapped in JSON-RPC envelopes), making it simpler to consume than the MCP protocol.

## Base URL

- **Local:** `http://localhost:3300`
- **Remote:** `https://your-server.com:3300`
- **Custom:** Set via `PUBLIC_URL` environment variable

## Authentication

When authentication is enabled, include a token with every request.

**Authorization header (recommended):**
```bash
curl -H "Authorization: Bearer your-secret-token" \
  http://localhost:3300/api/tools
```

**Query parameter:**
```bash
curl "http://localhost:3300/api/tools?token=your-secret-token"
```

## Endpoints

### GET /api/tools

List all available tools with their full JSON schemas. Use this to discover tool names, actions, and parameter definitions.

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
      "description": "Manage browser instances - launch, close, and list browsers.",
      "inputSchema": {
        "type": "object",
        "properties": {
          "action": {
            "type": "string",
            "enum": ["list", "new", "close", "profiles"],
            "description": "Action to perform"
          },
          "mode": {
            "type": "string",
            "enum": ["chrome", "testing", "chromium"],
            "description": "Browser mode"
          },
          "instanceId": {
            "type": "string",
            "description": "Instance ID (for close)"
          }
        },
        "required": ["action"]
      }
    },
    {
      "name": "browser_tab",
      "description": "..."
    },
    {
      "name": "browser_navigate",
      "description": "..."
    }
  ]
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `tools` | array | Array of tool definition objects |
| `tools[].name` | string | Tool name to use in POST requests |
| `tools[].description` | string | Human-readable description |
| `tools[].inputSchema` | object | JSON Schema describing accepted parameters |

### POST /api/tools/{toolName}

Execute a tool by name. The request body contains the tool arguments as a flat JSON object (including `action` for consolidated tools).

**URL parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `toolName` | string | Yes | The tool name (e.g., `browser_instance`, `browser_tab`, `sleep`) |

**Request body:**

The request body is the tool's arguments as JSON. For consolidated tools (all except `sleep` and `browser_execute`), include the `action` field.

**Request:**
```bash
curl -X POST http://localhost:3300/api/tools/browser_instance \
  -H "Content-Type: application/json" \
  -d '{"action": "list"}'
```

**Success response (200):**
```json
{
  "success": true,
  "result": {
    "instances": [
      {
        "id": "inst_abc123",
        "browserType": "Chrome for Testing",
        "profile": "(temporary)",
        "port": 3301,
        "userAgent": "Mozilla/5.0...",
        "windowId": 12345,
        "connectedAt": 1706234567890,
        "lastActivity": 1706234567893
      }
    ]
  }
}
```

**Error response (400):**
```json
{
  "success": false,
  "error": {
    "code": "TOOL_ERROR",
    "message": "Invalid action \"bogus\" for tool \"browser_tab\""
  }
}
```

**Error response (404):**
```json
{
  "success": false,
  "error": {
    "code": "TOOL_NOT_FOUND",
    "message": "Unknown tool: nonexistent"
  }
}
```

**Response fields:**

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the tool executed successfully |
| `result` | object | Tool result (only on success). Structure varies by tool. |
| `error` | object | Error details (only on failure) |
| `error.code` | string | Machine-readable error code |
| `error.message` | string | Human-readable error description |

## Response format

The REST API returns clean, unwrapped JSON. Unlike the MCP protocol which wraps results in JSON-RPC envelopes and stringified content arrays, the REST API parses all nested content and returns structured objects directly.

**MCP protocol response (for comparison):**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"instances\":[{\"id\":\"inst_abc123\"}]}"
    }]
  }
}
```

**REST API response (same data):**
```json
{
  "success": true,
  "result": {
    "instances": [{"id": "inst_abc123"}]
  }
}
```

## Error codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `TOOL_NOT_FOUND` | 404 | Tool name does not exist |
| `TOOL_ERROR` | 400 | Tool execution failed (invalid action, missing params, etc.) |
| `PARSE_ERROR` | 400 | Request body is not valid JSON |
| `MCP_ERROR` | 400 | Internal MCP protocol error |
| `NO_INSTANCE` | 400 | No browser instance connected |
| `DOWNLOAD_ERROR` | 400 | Download operation failed |

## Tool reference

All 10 tools are available via the REST API. Each tool example below shows the curl command and expected response.

### browser_instance

Manage browser instances.

#### List instances

```bash
curl -X POST http://localhost:3300/api/tools/browser_instance \
  -H "Content-Type: application/json" \
  -d '{"action": "list"}'
```

```json
{
  "success": true,
  "result": {
    "instances": [
      {
        "id": "inst_abc123",
        "browserType": "Chrome for Testing",
        "profile": "(temporary)",
        "port": 3301
      }
    ]
  }
}
```

#### Launch new browser

```bash
curl -X POST http://localhost:3300/api/tools/browser_instance \
  -H "Content-Type: application/json" \
  -d '{
    "action": "new",
    "mode": "testing",
    "url": "https://example.com"
  }'
```

```json
{
  "success": true,
  "result": {
    "instanceId": "inst_abc123",
    "browserType": "Chrome for Testing",
    "profile": "(temporary)",
    "downloadDirectory": "/Users/you/Downloads",
    "extensionAutoLoaded": true,
    "message": "Browser launched with extension auto-loaded."
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `"new"` |
| `mode` | string | No | `"chrome"`, `"testing"` (default), or `"chromium"` |
| `url` | string | No | URL to open on launch |
| `headless` | boolean | No | Launch in headless mode |
| `profile` | string | No | Chrome profile directory name |
| `extensions` | string[] | No | Paths to additional extensions to load |
| `closeOtherTabs` | boolean | No | Close pre-existing tabs after launch |

#### Close instance

```bash
curl -X POST http://localhost:3300/api/tools/browser_instance \
  -H "Content-Type: application/json" \
  -d '{"action": "close", "instanceId": "inst_abc123"}'
```

```json
{
  "success": true,
  "result": {
    "success": true,
    "message": "Browser instance closed"
  }
}
```

#### List Chrome profiles

```bash
curl -X POST http://localhost:3300/api/tools/browser_instance \
  -H "Content-Type: application/json" \
  -d '{"action": "profiles"}'
```

```json
{
  "success": true,
  "result": {
    "profiles": [
      {"directory": "Profile 2", "name": "Work"},
      {"directory": "Profile 3", "name": "Personal"}
    ]
  }
}
```

### browser_tab

Manage browser tabs.

#### List tabs

```bash
curl -X POST http://localhost:3300/api/tools/browser_tab \
  -H "Content-Type: application/json" \
  -d '{"action": "list", "instanceId": "inst_abc123"}'
```

#### Open new tab

```bash
curl -X POST http://localhost:3300/api/tools/browser_tab \
  -H "Content-Type: application/json" \
  -d '{
    "action": "new",
    "instanceId": "inst_abc123",
    "url": "https://example.com"
  }'
```

#### Close tab

```bash
curl -X POST http://localhost:3300/api/tools/browser_tab \
  -H "Content-Type: application/json" \
  -d '{"action": "close", "instanceId": "inst_abc123", "tabId": 12345}'
```

#### Close other tabs

```bash
curl -X POST http://localhost:3300/api/tools/browser_tab \
  -H "Content-Type: application/json" \
  -d '{"action": "close_others", "instanceId": "inst_abc123"}'
```

#### Activate tab

```bash
curl -X POST http://localhost:3300/api/tools/browser_tab \
  -H "Content-Type: application/json" \
  -d '{"action": "activate", "instanceId": "inst_abc123", "tabId": 12345}'
```

### browser_navigate

Navigate and wait.

#### Go to URL

```bash
curl -X POST http://localhost:3300/api/tools/browser_navigate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "goto",
    "instanceId": "inst_abc123",
    "url": "https://example.com",
    "waitUntil": "networkidle"
  }'
```

```json
{
  "success": true,
  "result": {
    "success": true,
    "tabId": 12345,
    "url": "https://example.com"
  }
}
```

**waitUntil options:** `"load"` (default), `"domcontentloaded"`, `"networkidle"`

#### Reload page

```bash
curl -X POST http://localhost:3300/api/tools/browser_navigate \
  -H "Content-Type: application/json" \
  -d '{"action": "reload", "instanceId": "inst_abc123"}'
```

#### Go back / forward

```bash
curl -X POST http://localhost:3300/api/tools/browser_navigate \
  -H "Content-Type: application/json" \
  -d '{"action": "back", "instanceId": "inst_abc123"}'
```

```bash
curl -X POST http://localhost:3300/api/tools/browser_navigate \
  -H "Content-Type: application/json" \
  -d '{"action": "forward", "instanceId": "inst_abc123"}'
```

#### Wait for condition

```bash
# Wait for selector
curl -X POST http://localhost:3300/api/tools/browser_navigate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "wait",
    "instanceId": "inst_abc123",
    "selector": "#loaded-indicator",
    "timeout": 10000
  }'

# Wait for JavaScript expression
curl -X POST http://localhost:3300/api/tools/browser_navigate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "wait",
    "instanceId": "inst_abc123",
    "expression": "document.readyState === \"complete\"",
    "timeout": 5000
  }'
```

### browser_content

Extract page content.

#### Take screenshot

```bash
curl -X POST http://localhost:3300/api/tools/browser_content \
  -H "Content-Type: application/json" \
  -d '{
    "action": "screenshot",
    "instanceId": "inst_abc123",
    "format": "png",
    "fullPage": true
  }'
```

```json
{
  "success": true,
  "result": {
    "data": "iVBORw0KGgoAAAANSUhEUg...",
    "mimeType": "image/png",
    "tabId": 12345
  }
}
```

**Parameters:** `format` (`"png"`, `"jpeg"`, `"webp"`), `fullPage` (boolean), `quality` (1-100, jpeg/webp only), `selector` (capture specific element), `clip` (`{x, y, width, height}`)

#### Generate PDF

```bash
curl -X POST http://localhost:3300/api/tools/browser_content \
  -H "Content-Type: application/json" \
  -d '{
    "action": "pdf",
    "instanceId": "inst_abc123",
    "format": "A4",
    "landscape": true
  }'
```

#### Get HTML content

```bash
curl -X POST http://localhost:3300/api/tools/browser_content \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get",
    "instanceId": "inst_abc123",
    "selector": "h1"
  }'
```

```json
{
  "success": true,
  "result": {
    "content": "<h1>Example Domain</h1>",
    "selector": "h1",
    "tabId": 12345
  }
}
```

#### Query elements

```bash
curl -X POST http://localhost:3300/api/tools/browser_content \
  -H "Content-Type: application/json" \
  -d '{
    "action": "query",
    "instanceId": "inst_abc123",
    "selector": ".item"
  }'
```

#### Get element attribute

```bash
curl -X POST http://localhost:3300/api/tools/browser_content \
  -H "Content-Type: application/json" \
  -d '{
    "action": "attribute",
    "instanceId": "inst_abc123",
    "selector": "a.link",
    "attribute": "href"
  }'
```

#### Get viewport DOM

```bash
curl -X POST http://localhost:3300/api/tools/browser_content \
  -H "Content-Type: application/json" \
  -d '{
    "action": "get_viewport_dom",
    "instanceId": "inst_abc123"
  }'
```

### browser_interact

Simulate user input.

#### Click element

```bash
curl -X POST http://localhost:3300/api/tools/browser_interact \
  -H "Content-Type: application/json" \
  -d '{
    "action": "click",
    "instanceId": "inst_abc123",
    "selector": "#submit-button"
  }'
```

#### Type text

```bash
curl -X POST http://localhost:3300/api/tools/browser_interact \
  -H "Content-Type: application/json" \
  -d '{
    "action": "type",
    "instanceId": "inst_abc123",
    "selector": "#email",
    "text": "user@example.com"
  }'
```

Text is typed with human-like delays (100-200 WPM with natural pauses).

#### Press keyboard key

```bash
curl -X POST http://localhost:3300/api/tools/browser_interact \
  -H "Content-Type: application/json" \
  -d '{
    "action": "press",
    "instanceId": "inst_abc123",
    "key": "Enter"
  }'

# With modifiers
curl -X POST http://localhost:3300/api/tools/browser_interact \
  -H "Content-Type: application/json" \
  -d '{
    "action": "press",
    "instanceId": "inst_abc123",
    "key": "a",
    "modifiers": ["ctrl"]
  }'
```

#### Scroll

```bash
curl -X POST http://localhost:3300/api/tools/browser_interact \
  -H "Content-Type: application/json" \
  -d '{
    "action": "scroll",
    "instanceId": "inst_abc123",
    "deltaY": 500
  }'
```

#### Hover

```bash
curl -X POST http://localhost:3300/api/tools/browser_interact \
  -H "Content-Type: application/json" \
  -d '{
    "action": "hover",
    "instanceId": "inst_abc123",
    "selector": ".dropdown-trigger"
  }'
```

#### Select dropdown

```bash
curl -X POST http://localhost:3300/api/tools/browser_interact \
  -H "Content-Type: application/json" \
  -d '{
    "action": "select",
    "instanceId": "inst_abc123",
    "selector": "#country",
    "value": "US"
  }'
```

#### Upload file

```bash
curl -X POST http://localhost:3300/api/tools/browser_interact \
  -H "Content-Type: application/json" \
  -d '{
    "action": "upload",
    "instanceId": "inst_abc123",
    "selector": "input[type=file]",
    "files": ["/path/to/file.pdf"]
  }'
```

### browser_execute

Execute JavaScript in the browser.

```bash
curl -X POST http://localhost:3300/api/tools/browser_execute \
  -H "Content-Type: application/json" \
  -d '{
    "instanceId": "inst_abc123",
    "expression": "document.title"
  }'
```

```json
{
  "success": true,
  "result": {
    "value": "Example Domain",
    "tabId": 12345
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | No | Target instance (uses first if omitted) |
| `expression` | string | Yes | JavaScript expression to evaluate |
| `awaitPromise` | boolean | No | Wait for promise to resolve |

### browser_network

Manage cookies, headers, and storage.

#### Get cookies

```bash
curl -X POST http://localhost:3300/api/tools/browser_network \
  -H "Content-Type: application/json" \
  -d '{"action": "get_cookies", "instanceId": "inst_abc123"}'
```

#### Set cookie

```bash
curl -X POST http://localhost:3300/api/tools/browser_network \
  -H "Content-Type: application/json" \
  -d '{
    "action": "set_cookie",
    "instanceId": "inst_abc123",
    "name": "session",
    "value": "abc123",
    "domain": "example.com",
    "path": "/",
    "secure": true,
    "httpOnly": true,
    "sameSite": "Lax"
  }'
```

#### Clear cookies

```bash
curl -X POST http://localhost:3300/api/tools/browser_network \
  -H "Content-Type: application/json" \
  -d '{"action": "clear_cookies", "instanceId": "inst_abc123"}'
```

#### Set custom headers

```bash
curl -X POST http://localhost:3300/api/tools/browser_network \
  -H "Content-Type: application/json" \
  -d '{
    "action": "set_headers",
    "instanceId": "inst_abc123",
    "headers": {"X-Custom": "value", "Accept-Language": "en-US"}
  }'
```

#### Intercept requests

```bash
curl -X POST http://localhost:3300/api/tools/browser_network \
  -H "Content-Type: application/json" \
  -d '{
    "action": "intercept",
    "instanceId": "inst_abc123",
    "pattern": "*.png",
    "resourceType": "image"
  }'
```

#### Get/set/clear storage

```bash
# Get localStorage
curl -X POST http://localhost:3300/api/tools/browser_network \
  -H "Content-Type: application/json" \
  -d '{"action": "get_storage", "instanceId": "inst_abc123", "key": "token"}'

# Set localStorage
curl -X POST http://localhost:3300/api/tools/browser_network \
  -H "Content-Type: application/json" \
  -d '{
    "action": "set_storage",
    "instanceId": "inst_abc123",
    "key": "token",
    "value": "abc123"
  }'

# Clear storage
curl -X POST http://localhost:3300/api/tools/browser_network \
  -H "Content-Type: application/json" \
  -d '{"action": "clear_storage", "instanceId": "inst_abc123", "storageType": "local"}'
```

### browser_emulate

Emulate devices and network conditions.

#### Set viewport

```bash
curl -X POST http://localhost:3300/api/tools/browser_emulate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "viewport",
    "instanceId": "inst_abc123",
    "width": 1920,
    "height": 1080,
    "deviceScaleFactor": 2
  }'
```

#### Emulate device

```bash
curl -X POST http://localhost:3300/api/tools/browser_emulate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "device",
    "instanceId": "inst_abc123",
    "device": "iPhone 14"
  }'
```

**Preset devices:** `"iPhone 14"`, `"iPhone 14 Pro Max"`, `"Pixel 7"`, `"iPad Pro"`, `"Galaxy S23"`

#### Set geolocation

```bash
curl -X POST http://localhost:3300/api/tools/browser_emulate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "geolocation",
    "instanceId": "inst_abc123",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "accuracy": 100
  }'
```

#### Set timezone

```bash
curl -X POST http://localhost:3300/api/tools/browser_emulate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "timezone",
    "instanceId": "inst_abc123",
    "timezoneId": "America/New_York"
  }'
```

#### Network throttling

```bash
curl -X POST http://localhost:3300/api/tools/browser_emulate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "throttle",
    "instanceId": "inst_abc123",
    "preset": "slow-3g"
  }'
```

**Presets:** `"slow-3g"`, `"fast-3g"`, `"4g"`, `"wifi"`, `"offline"`, `"none"`

#### Toggle offline

```bash
curl -X POST http://localhost:3300/api/tools/browser_emulate \
  -H "Content-Type: application/json" \
  -d '{"action": "offline", "instanceId": "inst_abc123", "enabled": true}'
```

### browser_debug

Debugging and monitoring tools.

#### Handle dialog (alert/confirm/prompt)

```bash
curl -X POST http://localhost:3300/api/tools/browser_debug \
  -H "Content-Type: application/json" \
  -d '{
    "action": "dialog",
    "instanceId": "inst_abc123",
    "dialogAction": "accept",
    "promptText": "response text"
  }'
```

#### Get console logs

```bash
curl -X POST http://localhost:3300/api/tools/browser_debug \
  -H "Content-Type: application/json" \
  -d '{
    "action": "console",
    "instanceId": "inst_abc123",
    "level": "error"
  }'
```

**Levels:** `"log"`, `"info"`, `"warn"`, `"error"`, `"all"`

#### Get performance metrics

```bash
curl -X POST http://localhost:3300/api/tools/browser_debug \
  -H "Content-Type: application/json" \
  -d '{"action": "performance", "instanceId": "inst_abc123"}'
```

#### Start/stop tracing

```bash
# Start
curl -X POST http://localhost:3300/api/tools/browser_debug \
  -H "Content-Type: application/json" \
  -d '{"action": "trace_start", "instanceId": "inst_abc123"}'

# Stop
curl -X POST http://localhost:3300/api/tools/browser_debug \
  -H "Content-Type: application/json" \
  -d '{"action": "trace_stop", "instanceId": "inst_abc123"}'
```

#### List downloads

```bash
curl -X POST http://localhost:3300/api/tools/browser_debug \
  -H "Content-Type: application/json" \
  -d '{"action": "downloads", "instanceId": "inst_abc123", "state": "complete"}'
```

#### Wait for download

```bash
curl -X POST http://localhost:3300/api/tools/browser_debug \
  -H "Content-Type: application/json" \
  -d '{
    "action": "download_wait",
    "instanceId": "inst_abc123",
    "downloadId": "dl_xyz",
    "timeout": 30000
  }'
```

### sleep

Wait for a specified duration in milliseconds.

```bash
curl -X POST http://localhost:3300/api/tools/sleep \
  -H "Content-Type: application/json" \
  -d '{"duration": 2000}'
```

```json
{
  "success": true,
  "result": {
    "slept": 2000
  }
}
```

## Complete workflow examples

### Example: Screenshot a webpage

A complete workflow from launching a browser to taking a screenshot and closing it.

```bash
#!/bin/bash
BASE="http://localhost:3300/api/tools"

# 1. Launch browser
RESULT=$(curl -s -X POST "$BASE/browser_instance" \
  -H "Content-Type: application/json" \
  -d '{"action": "new", "mode": "testing", "url": "https://example.com"}')
INSTANCE_ID=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['instanceId'])")
echo "Instance: $INSTANCE_ID"

# 2. Wait for page to load
curl -s -X POST "$BASE/browser_navigate" \
  -H "Content-Type: application/json" \
  -d "{\"action\": \"wait\", \"instanceId\": \"$INSTANCE_ID\", \"selector\": \"h1\"}" > /dev/null

# 3. Take screenshot
curl -s -X POST "$BASE/browser_content" \
  -H "Content-Type: application/json" \
  -d "{\"action\": \"screenshot\", \"instanceId\": \"$INSTANCE_ID\"}" \
  | python3 -c "
import sys, json, base64
data = json.load(sys.stdin)['result']['data']
with open('screenshot.png', 'wb') as f:
    f.write(base64.b64decode(data))
print('Saved screenshot.png')
"

# 4. Close browser
curl -s -X POST "$BASE/browser_instance" \
  -H "Content-Type: application/json" \
  -d "{\"action\": \"close\", \"instanceId\": \"$INSTANCE_ID\"}" > /dev/null
echo "Done"
```

### Example: Form login (Python)

```python
import requests

BASE = "http://localhost:3300/api/tools"

def call_tool(tool, args):
    resp = requests.post(f"{BASE}/{tool}", json=args)
    data = resp.json()
    if not data["success"]:
        raise Exception(f"Tool error: {data['error']['message']}")
    return data["result"]

# Launch browser
result = call_tool("browser_instance", {
    "action": "new",
    "mode": "testing",
    "url": "https://myapp.com/login"
})
instance_id = result["instanceId"]

# Fill login form
call_tool("browser_interact", {
    "action": "type",
    "instanceId": instance_id,
    "selector": "#email",
    "text": "user@example.com"
})

call_tool("browser_interact", {
    "action": "type",
    "instanceId": instance_id,
    "selector": "#password",
    "text": "secret123"
})

# Submit
call_tool("browser_interact", {
    "action": "click",
    "instanceId": instance_id,
    "selector": "button[type=submit]"
})

# Wait for navigation
call_tool("browser_navigate", {
    "action": "wait",
    "instanceId": instance_id,
    "selector": ".dashboard",
    "timeout": 10000
})

# Verify login succeeded
result = call_tool("browser_execute", {
    "instanceId": instance_id,
    "expression": "document.title"
})
print(f"Page title: {result['value']}")

# Cleanup
call_tool("browser_instance", {
    "action": "close",
    "instanceId": instance_id
})
```

### Example: Web scraping (JavaScript/Node.js)

```javascript
const BASE = 'http://localhost:3300/api/tools';

async function callTool(tool, args) {
  const resp = await fetch(`${BASE}/${tool}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const data = await resp.json();
  if (!data.success) throw new Error(data.error.message);
  return data.result;
}

// Launch browser
const { instanceId } = await callTool('browser_instance', {
  action: 'new',
  mode: 'testing',
  url: 'https://news.ycombinator.com',
});

// Wait for content
await callTool('browser_navigate', {
  action: 'wait',
  instanceId,
  selector: '.titleline',
});

// Extract titles via JavaScript
const { value: titles } = await callTool('browser_execute', {
  instanceId,
  expression: `
    Array.from(document.querySelectorAll('.titleline > a'))
      .slice(0, 10)
      .map(a => ({ title: a.textContent, url: a.href }))
  `,
});

console.log('Top 10 stories:', titles);

// Cleanup
await callTool('browser_instance', {
  action: 'close',
  instanceId,
});
```

## Comparison with MCP protocol

| Feature | REST API | MCP Protocol |
|---------|----------|-------------|
| Transport | HTTP POST | SSE + HTTP POST |
| Protocol | Plain JSON | JSON-RPC 2.0 |
| Session | Stateless | Session-based (SSE) |
| Response format | `{ success, result }` | `{ jsonrpc, id, result: { content } }` |
| Real-time events | No | Yes (SSE stream) |
| Best for | Scripts, backends, custom apps | AI clients (Claude, Cursor) |
| Authentication | Same (Bearer token) | Same (Bearer token) |

Use the **REST API** when you need simple HTTP integration without SSE or JSON-RPC. Use the **MCP protocol** when connecting AI clients that support MCP natively.

## Related

- [HTTP Endpoints](http-endpoints.md) - All HTTP routes including non-tool endpoints
- [SSE Protocol](sse-protocol.md) - MCP protocol for AI clients
- [Tools Reference](../tools/README.md) - Complete tool documentation with all parameters
- [Error Codes](error-codes.md) - Full error code reference
- [Connecting AI Clients](../getting-started/connecting-ai-clients.md) - Client setup guide
