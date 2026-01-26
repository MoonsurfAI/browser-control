# Integration

Connect Moonsurf with AI clients, development tools, and CI/CD pipelines.

## Overview

Moonsurf uses the Model Context Protocol (MCP) to integrate with AI assistants and other clients. This section covers how to connect various tools and platforms.

## Available Integrations

### AI Assistants

| Client | Connection Type | Setup Complexity |
|--------|-----------------|------------------|
| [Claude Code](claude-code.md) | MCP Skill or Config | Simple |
| [Claude Desktop](claude-desktop.md) | MCP Config | Simple |
| [Cursor](cursor.md) | MCP Config | Simple |
| [Custom Clients](custom-clients.md) | SSE/HTTP | Moderate |

### Development Pipelines

| Platform | Documentation |
|----------|---------------|
| [CI/CD](ci-cd.md) | GitHub Actions, Docker |

## Quick Start

### Fastest Setup (Claude Code)

Install the skill for automatic integration:

```bash
npx @moonsurf/browser-control --install-skill
```

Claude Code will automatically use Moonsurf when you ask about browser automation.

### Manual MCP Configuration

Add to your MCP config file:

```json
{
  "mcpServers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

## Connection Methods

### 1. SSE (Server-Sent Events)

Standard MCP connection method:

```
GET /sse
```

Used by:
- Claude Code
- Claude Desktop
- Cursor
- Most MCP clients

### 2. HTTP POST

For message-based communication:

```
POST /message?sessionId=<id>
Content-Type: application/json

{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{...}}
```

### 3. WebSocket (Tasks)

For real-time task execution:

```
ws://localhost:3400
```

Used by:
- Custom task runners
- Real-time automation dashboards

## Authentication

### Local Mode (Default)

No authentication required:

```json
{
  "mcpServers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

### Remote Mode

Add token to URL:

```json
{
  "mcpServers": {
    "moonsurf": {
      "url": "https://mcp.example.com/sse?token=your-secret-token"
    }
  }
}
```

Or use Authorization header (for custom clients).

## Server Requirements

### Local Development

```bash
# Start server
npx @moonsurf/browser-control
```

Requirements:
- Node.js 18+
- Chrome/Chromium browser

### Production/Remote

```bash
REMOTE_MODE=true \
AUTH_TOKENS=your-token \
npx @moonsurf/browser-control
```

Requirements:
- Node.js 18+
- Chrome/Chromium
- Network accessibility
- TLS recommended

## Testing Connection

### Health Check

```bash
curl http://localhost:3300/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "connectedInstances": 0,
  "sseClients": 0
}
```

### List Tools

```bash
curl -X POST http://localhost:3300/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Troubleshooting

### Client Can't Connect

1. Verify server is running: `curl http://localhost:3300/health`
2. Check port is correct
3. Verify no firewall blocking
4. Check authentication if remote

### Tools Not Available

1. Verify MCP config is correct
2. Restart the AI client
3. Check server logs for errors

### Browser Not Launching

1. Verify Chrome/Chromium is installed
2. Check `BROWSER_DEFAULT_MODE` setting
3. Try headless mode for CI

## Related

- [Getting Started](../getting-started/README.md) - Initial setup
- [Configuration](../configuration/README.md) - Server configuration
- [API Reference](../api-reference/README.md) - Protocol details
