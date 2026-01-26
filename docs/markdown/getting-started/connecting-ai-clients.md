# Connecting AI Clients

This guide explains how to connect various AI clients to Moonsurf for browser automation.

## How It Works

Moonsurf implements the Model Context Protocol (MCP), a standard for connecting AI assistants to external tools. The connection works as follows:

1. **Start Moonsurf server** - Exposes an SSE endpoint at `http://localhost:3300/sse`
2. **Configure AI client** - Point it to the Moonsurf SSE endpoint
3. **AI discovers tools** - Client calls `tools/list` to discover available browser tools
4. **AI uses tools** - Client can now automate browsers

## Claude Code

Claude Code is Anthropic's official CLI for Claude with built-in MCP support.

### Option 1: Install the Skill (Recommended)

```bash
moonsurf --install-skill
```

This installs a Claude Code skill that makes browser automation tools available.

**Verify installation:**
```bash
moonsurf --skill-status
```

**Usage in Claude Code:**
```
/moonsurf-browser
```

### Option 2: Manual MCP Configuration

Add to your Claude Code MCP configuration (`~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

## Claude Desktop

Claude Desktop supports MCP servers through its configuration file.

### Configuration

1. Open Claude Desktop settings
2. Navigate to the MCP section
3. Add a new server:

**macOS** (`~/Library/Application Support/Claude/mcp.json`):
```json
{
  "mcpServers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

**Windows** (`%APPDATA%\Claude\mcp.json`):
```json
{
  "mcpServers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

4. Restart Claude Desktop
5. Look for the browser tools in the tools menu

## Cursor IDE

Cursor supports MCP through its settings.

### Configuration

1. Open Cursor Settings (Cmd/Ctrl + ,)
2. Search for "MCP"
3. Add Moonsurf:

```json
{
  "mcp.servers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

Or add to `.cursor/mcp.json` in your project:

```json
{
  "servers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

## Custom MCP Clients

You can build your own MCP client to connect to Moonsurf.

### Basic Connection Flow

```javascript
// 1. Connect to SSE endpoint
const eventSource = new EventSource('http://localhost:3300/sse');

// 2. Get the message endpoint from the 'endpoint' event
let messageEndpoint;
eventSource.addEventListener('endpoint', (event) => {
  messageEndpoint = event.data;
  console.log('Message endpoint:', messageEndpoint);
});

// 3. Listen for messages
eventSource.addEventListener('message', (event) => {
  const response = JSON.parse(event.data);
  console.log('Response:', response);
});

// 4. Initialize the connection
await fetch(messageEndpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {}
  })
});

// 5. List available tools
await fetch(messageEndpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list'
  })
});

// 6. Call a tool
await fetch(messageEndpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'browser_instance',
      arguments: {
        action: 'new',
        mode: 'chromium'
      }
    }
  })
});
```

### Python Example

```python
import requests
import sseclient
import json

# Connect to SSE
response = requests.get('http://localhost:3300/sse', stream=True)
client = sseclient.SSEClient(response)

message_endpoint = None

for event in client.events():
    if event.event == 'endpoint':
        message_endpoint = event.data
        break

# Initialize
requests.post(message_endpoint, json={
    'jsonrpc': '2.0',
    'id': 1,
    'method': 'initialize',
    'params': {}
})

# List tools
resp = requests.post(message_endpoint, json={
    'jsonrpc': '2.0',
    'id': 2,
    'method': 'tools/list'
})
tools = resp.json()['result']['tools']
print(f"Available tools: {[t['name'] for t in tools]}")

# Launch browser
resp = requests.post(message_endpoint, json={
    'jsonrpc': '2.0',
    'id': 3,
    'method': 'tools/call',
    'params': {
        'name': 'browser_instance',
        'arguments': {'action': 'new', 'mode': 'chromium'}
    }
})
print(resp.json())
```

## With Authentication

If Moonsurf is running with authentication enabled:

### Bearer Token in Header

```javascript
const eventSource = new EventSource(
  'http://localhost:3300/sse?token=your-auth-token'
);

await fetch(messageEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-auth-token'
  },
  body: JSON.stringify({ ... })
});
```

### MCP Configuration with Token

```json
{
  "mcpServers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse?token=your-auth-token"
    }
  }
}
```

## Remote Connection

If Moonsurf is running on a remote server:

### Server Setup

```bash
REMOTE_MODE=true AUTH_TOKENS=secret-token-123 moonsurf
```

### Client Configuration

```json
{
  "mcpServers": {
    "moonsurf": {
      "url": "https://your-server.com:3300/sse?token=secret-token-123"
    }
  }
}
```

## Verifying Connection

### Check Server Health

```bash
curl http://localhost:3300/health
```

Response:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "connectedInstances": 0,
  "sseClients": 1
}
```

### List Connected Instances

After launching a browser:
```bash
curl http://localhost:3300/instances
```

Response:
```json
{
  "instances": [{
    "id": "inst_123...",
    "port": 3301,
    "browserType": "Chromium",
    "connectedAt": 1706234567890
  }]
}
```

## Troubleshooting

### "Connection refused"

Ensure Moonsurf is running:
```bash
moonsurf
```

### "Authentication required"

If auth is enabled, include the token:
```
http://localhost:3300/sse?token=your-token
```

### "No tools available"

Verify the SSE connection and call `initialize` before `tools/list`.

### "Tool not found"

Moonsurf uses 9 consolidated tools. Make sure you're using the correct tool names:
- `browser_instance`
- `browser_tab`
- `browser_navigate`
- `browser_content`
- `browser_interact`
- `browser_execute`
- `browser_network`
- `browser_emulate`
- `browser_debug`

## Next Steps

- [Tools Reference](../tools/README.md) - Complete tool documentation
- [Configuration](../configuration/README.md) - Server configuration options
- [Guides](../guides/README.md) - Common automation patterns
