# Local Mode

Local mode is the default configuration for development and local use. The server binds to localhost and security features are disabled for convenience.

## Default Settings

When running without `REMOTE_MODE=true`:

| Setting | Value |
|---------|-------|
| `HOST` | `localhost` |
| `AUTH_ENABLED` | `false` |
| `TLS_ENABLED` | `false` |
| `CORS_ENABLED` | `false` |
| `RATE_LIMIT_ENABLED` | `false` |
| `AUDIT_LOG_ENABLED` | `false` |
| `HEADLESS_DEFAULT` | `false` |

## Basic Usage

Start the server with defaults:

```bash
moonsurf
```

Output:
```
[Moonsurf] Server starting...
[Server] Mode: LOCAL
[Server] SSE endpoint: http://localhost:3300/sse
[Config] Server Configuration:
[Config]   Mode: LOCAL
[Config]   HTTP: http://localhost:3300
[Config]   WebSocket: ws://localhost:3301-3399
[Config]   Auth: disabled
[Config]   TLS: disabled
[HTTP] Server listening on localhost:3300
```

## Development with Local Extension

For developing the Chrome extension alongside the MCP server:

### 1. Build the Extension

```bash
cd ../chrome-extension
npm install
npm run build
# Or for watch mode:
npm run dev
```

### 2. Run Server with Local Extension

```bash
EXTENSION_PATH=../chrome-extension/dist moonsurf
```

### 3. Watch Mode Workflow

**Terminal 1 - Extension (watch mode):**
```bash
cd ../chrome-extension
npm run dev
```

**Terminal 2 - MCP Server:**
```bash
EXTENSION_PATH=../chrome-extension/dist moonsurf
```

When you change extension code, rebuild it and restart any browser instances.

## Debug Logging

Enable verbose logging for troubleshooting:

```bash
LOG_LEVEL=debug moonsurf
```

This shows:
- All WebSocket messages
- Tool call details
- Timing information
- Internal state changes

## Custom Port

If port 3300 is in use:

```bash
PORT=3400 moonsurf
```

## Testing Different Browser Modes

### Chromium (Default)
```bash
BROWSER_DEFAULT_MODE=chromium moonsurf
```

### Chrome for Testing
```bash
BROWSER_DEFAULT_MODE=testing moonsurf
```

### Google Chrome
```bash
BROWSER_DEFAULT_MODE=chrome moonsurf
```

## Headless Development

Test headless mode locally:

```bash
BROWSER_DEFAULT_MODE=chromium HEADLESS_DEFAULT=true moonsurf
```

## Disable Task System

If you don't need the task execution feature:

```bash
TASKS_ENABLED=false moonsurf
```

This saves port 3400 and reduces log noise.

## Quick Test

After starting the server, verify it's working:

```bash
# Check health
curl http://localhost:3300/health

# List tools
curl -X POST http://localhost:3300/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Connecting Claude Code

For local development with Claude Code:

```bash
# Install the skill
moonsurf --install-skill

# Use in Claude Code
/moonsurf-browser
```

Or add to MCP config (`~/.claude/mcp.json`):
```json
{
  "mcpServers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

## Common Development Scenarios

### Debugging a Specific Tool

1. Enable debug logging
2. Make a tool call
3. Check the logs

```bash
LOG_LEVEL=debug moonsurf

# In another terminal
curl -X POST http://localhost:3300/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/call",
    "params":{
      "name":"browser_instance",
      "arguments":{"action":"list"}
    }
  }'
```

### Testing with Clean Browser State

Use testing mode for fresh state each time:

```bash
BROWSER_DEFAULT_MODE=testing moonsurf
```

### Simulating CI/CD Environment

```bash
BROWSER_DEFAULT_MODE=testing \
HEADLESS_DEFAULT=true \
LOG_LEVEL=info \
moonsurf
```

## File Locations

| Item | Path |
|------|------|
| Downloaded extension | `~/.moonsurf/extension/` |
| Chromium profile | `~/.moonsurf/` |
| Temp profiles (testing mode) | `/tmp/moonsurf-*/` |

## Troubleshooting

### "Extension failed to connect"

1. Check extension is built
2. Verify `EXTENSION_PATH` is correct
3. Check browser console for errors

### "Port already in use"

```bash
# Find process using port
lsof -i :3300

# Use different port
PORT=3400 moonsurf
```

### "Chromium not found"

Install Chromium:
```bash
# macOS
brew install --cask chromium

# Linux
sudo apt install chromium-browser
```

## Related

- [Environment Variables](environment-variables.md) - All configuration options
- [Remote Mode](remote-mode.md) - Production deployment
- [Development Setup](../development/local-setup.md) - Contributing guide
