# Debugging

Guide to debugging Moonsurf during development.

## Debug Logging

### Enable Debug Mode

```bash
LOG_LEVEL=debug npm start
```

### Log Levels

| Level | Description |
|-------|-------------|
| `debug` | All messages including internal details |
| `info` | Normal operation messages |
| `warn` | Warning messages |
| `error` | Error messages only |

### Debug Output Examples

```
[Debug] WebSocket message received: {"action":"click","selector":"#btn"}
[Debug] Tool call: browser_interact, args: {"action":"click","selector":"#btn"}
[Debug] Routing to instance: inst_abc123
[Debug] Extension response: {"success":true}
[Debug] Tool call completed in 145ms
```

## Server Debugging

### Startup Issues

**Check port availability:**
```bash
lsof -i :3300
```

**Check process:**
```bash
ps aux | grep node
```

**Check logs:**
```bash
npm start 2>&1 | grep -E "(Error|error|ERROR)"
```

### Connection Issues

**Health check:**
```bash
curl -v http://localhost:3300/health
```

**Check instances:**
```bash
curl http://localhost:3300/instances
```

**Check SSE endpoint:**
```bash
curl -v -N http://localhost:3300/sse
```

### Authentication Issues

**Test without auth:**
```bash
curl http://localhost:3300/instances
# If 401, auth is enabled
```

**Test with auth:**
```bash
curl -H "Authorization: Bearer your-token" http://localhost:3300/instances
```

**Check configured tokens:**
Look in server startup output or check environment:
```bash
echo $AUTH_TOKENS
```

## Extension Debugging

### Extension Not Connecting

1. **Check browser launched:**
   - Look for browser window (if headless=false)
   - Check server logs for launch message

2. **Check extension loaded:**
   - Go to `chrome://extensions` in the browser
   - Verify Moonsurf extension is present and enabled

3. **Check registration:**
   - Server logs should show "Extension registered"
   - Check `/instances` endpoint

4. **Check WebSocket:**
   - Server logs should show WebSocket connection
   - Port should be in range 3301-3399

### Extension Console

1. Go to `chrome://extensions`
2. Find Moonsurf extension
3. Click "Service worker" link
4. DevTools opens with console

### Content Script Debugging

1. Open target web page
2. Open DevTools (F12)
3. Go to Console tab
4. Filter by "Moonsurf" or your extension ID

### Extension Errors

Common errors and solutions:

**"Cannot read property of null"**
- Element not found
- Page not loaded
- Wrong selector

**"Permission denied"**
- Check manifest permissions
- Check URL patterns

**"Extension context invalidated"**
- Extension was reloaded
- Need to restart browser

## Tool Execution Debugging

### Tool Not Found

```bash
curl -X POST http://localhost:3300/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools[].name'
```

Verify tool name is in the list.

### Tool Execution Timeout

```bash
LOG_LEVEL=debug npm start
```

Watch for:
- Tool call start
- Extension command sent
- Extension response (or timeout)

### Tool Returns Error

Check response structure:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{"type": "text", "text": "Error: ..."}],
    "isError": true
  }
}
```

## WebSocket Debugging

### Using wscat

```bash
npm install -g wscat
wscat -c ws://localhost:3301
```

### Monitor Messages

In debug mode, all WebSocket messages are logged:
```
[WebSocket] Message to extension: {...}
[WebSocket] Message from extension: {...}
```

### Connection Issues

**Check port:**
```bash
lsof -i :3301
```

**Check firewall:**
```bash
# macOS
sudo pfctl -s rules

# Linux
sudo iptables -L
```

## Task Debugging

### Task Not Starting

1. Check instance exists
2. Check task queue isn't full
3. Verify task submission response

### Task Stuck

```bash
curl http://localhost:3300/tasks/<taskId>
```

Check:
- Status
- Current command index
- Command status

### Task Progress Missing

Connect to WebSocket and subscribe:
```json
{"type":"subscribe_task","taskId":"<taskId>"}
```

## Network Debugging

### HTTP Requests

Use verbose curl:
```bash
curl -v http://localhost:3300/health
```

### View All Requests

In Chrome DevTools:
1. Open Network tab
2. Preserve log
3. Filter by domain

### Proxy for Inspection

Use mitmproxy or similar:
```bash
mitmproxy -p 8080
# Configure browser to use proxy
```

## Memory and Performance

### Check Memory Usage

```bash
ps -o pid,rss,command -p $(pgrep -f "node.*moonsurf")
```

### Node.js Heap

Add to environment:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Profile Performance

```bash
NODE_OPTIONS="--inspect" npm start
```

Then connect Chrome DevTools to `chrome://inspect`.

## Common Issues

### Issue: Browser Launches Then Closes

**Causes:**
- Extension failed to load
- Invalid extension path
- Permission errors

**Debug:**
```bash
HEADLESS_DEFAULT=false LOG_LEVEL=debug npm start
```

Watch browser for errors.

### Issue: "No browser instance available"

**Causes:**
- No browser launched
- Browser disconnected
- Wrong instance ID

**Debug:**
```bash
curl http://localhost:3300/instances
```

### Issue: Element Not Found

**Causes:**
- Wrong selector
- Element not loaded yet
- Element in iframe

**Debug:**
- Take screenshot before action
- Check selector in browser DevTools
- Add wait for selector

### Issue: Timeout on Navigation

**Causes:**
- Page slow to load
- Network issues
- Page never finishes loading

**Debug:**
- Check network tab
- Try with `waitUntil: "domcontentloaded"`
- Increase timeout

### Issue: Extension Commands Timeout

**Causes:**
- Content script not loaded
- Page blocking scripts
- Extension crashed

**Debug:**
- Check extension DevTools
- Check content script injection
- Try different page

## Debug Utilities

### Pretty Print Responses

```bash
curl ... | jq .
```

### Watch Server Logs

```bash
npm start 2>&1 | tee server.log
# Then: tail -f server.log
```

### Timestamp Logs

```bash
npm start 2>&1 | while read line; do echo "$(date +%H:%M:%S) $line"; done
```

### Filter Logs

```bash
npm start 2>&1 | grep -E "(Error|Tool|WebSocket)"
```

## IDE Debugging

### VS Code

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Moonsurf",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/dist/index.js",
      "env": {
        "LOG_LEVEL": "debug"
      },
      "preLaunchTask": "npm: build"
    }
  ]
}
```

Press F5 to debug with breakpoints.

### Breakpoints

Set breakpoints in:
- `src/http-server.ts` - Request handling
- `src/mcp-handler.ts` - MCP routing
- `src/tool-definitions.ts` - Tool execution
- `src/instance-manager.ts` - Instance operations

## Related

- [Testing](testing.md) - Test procedures
- [Local Setup](local-setup.md) - Development environment
- [Debugging Guide](../guides/debugging-tips.md) - User-facing debugging
