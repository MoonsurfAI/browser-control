# Error Codes

Reference for error codes, meanings, and troubleshooting guidance.

## HTTP Status Codes

### 200 OK

Request succeeded.

### 201 Created

Resource created successfully (e.g., task submitted).

### 204 No Content

Request succeeded with no response body (e.g., CORS preflight).

### 302 Found

Redirect (used in OAuth flow).

### 400 Bad Request

Invalid request format or parameters.

```json
{
  "error": "Invalid request"
}
```

**Causes:**
- Malformed JSON in request body
- Missing required fields
- Invalid parameter values

**Solutions:**
- Verify JSON syntax
- Check required parameters
- Validate parameter types

### 401 Unauthorized

Authentication required or invalid token.

```json
{
  "error": "Authentication required"
}
```

**Causes:**
- No token provided when auth is enabled
- Invalid or expired token
- Incorrect token format

**Solutions:**
- Include token in URL: `/sse?token=xxx`
- Or use header: `Authorization: Bearer xxx`
- Verify token matches server configuration

### 404 Not Found

Endpoint or resource not found.

```json
{
  "error": "Not found"
}
```

**Causes:**
- Invalid URL path
- Task ID doesn't exist
- Instance ID doesn't exist

**Solutions:**
- Check URL spelling
- Verify resource exists
- List resources first

### 429 Too Many Requests

Rate limit exceeded.

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45

{"error": "Too many requests", "retryAfter": 45}
```

**Causes:**
- Too many requests in short time
- Exceeds configured rate limit

**Solutions:**
- Wait for `Retry-After` seconds
- Reduce request frequency
- Request higher limits from admin

### 503 Service Unavailable

Server cannot handle request.

```json
{
  "error": "No available ports"
}
```

**Causes:**
- All WebSocket ports in use
- Too many browser instances
- Resource exhaustion

**Solutions:**
- Close unused browser instances
- Wait and retry
- Increase port range in config

## REST API Error Codes

The REST Tools API (`/api/tools/*`) returns errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
}
```

### TOOL_NOT_FOUND

Tool name does not exist. HTTP status: 404.

```json
{
  "success": false,
  "error": {
    "code": "TOOL_NOT_FOUND",
    "message": "Unknown tool: nonexistent"
  }
}
```

**Causes:**
- Typo in tool name
- Using original tool name instead of consolidated name (e.g., `browser_mouse_click` instead of `browser_interact`)

**Solutions:**
- Check tool name against `GET /api/tools`
- Use consolidated tool names: `browser_instance`, `browser_tab`, `browser_navigate`, `browser_content`, `browser_interact`, `browser_execute`, `browser_network`, `browser_emulate`, `browser_debug`, `sleep`

### TOOL_ERROR

Tool execution failed. HTTP status: 400.

```json
{
  "success": false,
  "error": {
    "code": "TOOL_ERROR",
    "message": "Invalid action \"bogus\" for tool \"browser_tab\""
  }
}
```

**Causes:**
- Invalid `action` value for the tool
- Missing required parameters
- Browser instance not connected
- Element not found
- Navigation failure

**Solutions:**
- Check the tool's `inputSchema` from `GET /api/tools`
- Verify action is valid for the tool
- Ensure a browser instance is running

### PARSE_ERROR

Request body is not valid JSON. HTTP status: 400.

```json
{
  "success": false,
  "error": {
    "code": "PARSE_ERROR",
    "message": "Invalid JSON body"
  }
}
```

**Solutions:**
- Validate JSON syntax
- Set `Content-Type: application/json` header
- Ensure request body is not empty (use `{}` for no arguments)

### MCP_ERROR

Internal MCP protocol error. HTTP status: 400.

```json
{
  "success": false,
  "error": {
    "code": "MCP_ERROR",
    "message": "Missing tool name"
  }
}
```

**Causes:**
- Internal routing error
- Missing required fields at the protocol level

**Solutions:**
- Check server logs for details
- Retry the request
- Report if persistent

### NO_INSTANCE

No browser instance connected. HTTP status: 400.

```json
{
  "success": false,
  "error": {
    "code": "NO_INSTANCE",
    "message": "No connected browser instances"
  }
}
```

**Solutions:**
- Launch a browser first: `POST /api/tools/browser_instance` with `{"action": "new"}`
- Check connected instances: `POST /api/tools/browser_instance` with `{"action": "list"}`

### DOWNLOAD_ERROR

Download operation failed. HTTP status: 400.

```json
{
  "success": false,
  "error": {
    "code": "DOWNLOAD_ERROR",
    "message": "Download timed out"
  }
}
```

**Solutions:**
- Increase timeout parameter
- Verify download started
- Check file system permissions

## JSON-RPC Error Codes

MCP uses JSON-RPC 2.0 error codes.

### -32700 Parse Error

Invalid JSON.

```json
{
  "jsonrpc": "2.0",
  "id": null,
  "error": {
    "code": -32700,
    "message": "Parse error"
  }
}
```

**Solutions:**
- Validate JSON syntax
- Check for unescaped characters
- Ensure proper encoding

### -32600 Invalid Request

Request object invalid.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid request"
  }
}
```

**Causes:**
- Missing `jsonrpc` field
- Missing `method` field
- Invalid `id` type

**Solutions:**
- Include all required fields
- Use valid JSON-RPC 2.0 format

### -32601 Method Not Found

MCP method doesn't exist.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Method not found"
  }
}
```

**Valid methods:**
- `initialize`
- `tools/list`
- `tools/call`
- `resources/list`
- `prompts/list`

### -32602 Invalid Params

Method parameters invalid.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params"
  }
}
```

**Causes:**
- Missing required parameter
- Wrong parameter type
- Invalid parameter value

**Solutions:**
- Check tool schema
- Verify parameter names
- Use correct types

### -32603 Internal Error

Server error during execution.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "Internal error"
  }
}
```

**Causes:**
- Unexpected server error
- Extension communication failure
- Resource unavailable

**Solutions:**
- Check server logs
- Retry the request
- Report if persistent

## Tool Error Codes

Custom error codes for tool execution.

### -1000 No Instance

No browser instance available.

```json
{
  "error": {
    "code": -1000,
    "message": "No browser instance available"
  }
}
```

**Solutions:**
- Launch a browser instance first
- Specify correct `instanceId`
- Check instance is still connected

### -1001 Instance Not Found

Specified instance doesn't exist.

```json
{
  "error": {
    "code": -1001,
    "message": "Instance not found"
  }
}
```

**Solutions:**
- List instances to verify
- Instance may have disconnected
- Launch new instance

### -1002 Tool Timeout

Tool execution timed out.

```json
{
  "error": {
    "code": -1002,
    "message": "Tool execution timed out"
  }
}
```

**Causes:**
- Page slow to load
- Element never appeared
- Network issues

**Solutions:**
- Increase timeout parameter
- Check network conditions
- Verify page accessibility

### -1003 Element Not Found

Target element doesn't exist.

```json
{
  "error": {
    "code": -1003,
    "message": "Element not found: #nonexistent"
  }
}
```

**Solutions:**
- Verify selector is correct
- Wait for element to load
- Check if element is in iframe

### -1004 Navigation Error

Page navigation failed.

```json
{
  "error": {
    "code": -1004,
    "message": "Navigation failed: net::ERR_NAME_NOT_RESOLVED"
  }
}
```

**Causes:**
- Invalid URL
- DNS resolution failed
- Network error
- SSL certificate error

**Solutions:**
- Check URL is valid
- Verify network connectivity
- Check DNS settings

### -1005 Extension Error

Browser extension error.

```json
{
  "error": {
    "code": -1005,
    "message": "Extension communication error"
  }
}
```

**Causes:**
- Extension disconnected
- Extension crashed
- WebSocket connection lost

**Solutions:**
- Relaunch browser instance
- Check extension logs in browser
- Restart server

## Task Error Messages

### No browser instance available

Task requires a browser but none exists.

```json
{
  "type": "task_submit_response",
  "status": "rejected",
  "error": "No browser instance available"
}
```

**Solutions:**
- Launch browser first
- Specify valid `instanceId`
- Wait for browser to connect

### Task not found

Referenced task doesn't exist.

```json
{
  "error": "Task not found"
}
```

**Causes:**
- Invalid task ID
- Task was cleaned up
- Typo in task ID

### Task not found or already completed

Can't cancel completed task.

```json
{
  "success": false,
  "error": "Task not found or already completed"
}
```

**Note:** Only `queued` or `running` tasks can be cancelled.

### Queue full

Too many pending tasks.

```json
{
  "error": "Task queue is full"
}
```

**Solutions:**
- Wait for tasks to complete
- Cancel unnecessary tasks
- Increase `TASKS_MAX_QUEUE_SIZE`

## WebSocket Errors

### Invalid message format

Message couldn't be parsed as JSON.

```json
{
  "type": "error",
  "message": "Invalid message format"
}
```

**Solutions:**
- Verify JSON syntax
- Check message encoding

### Unknown message type

Unrecognized message type.

```json
{
  "type": "error",
  "message": "Unknown message type: bad_type"
}
```

**Valid types:**
- `task_submit`
- `task_list`
- `task_status`
- `task_cancel`
- `subscribe_task`
- `subscribe_instance`

## Common Error Scenarios

### Scenario: "Authentication required" on every request

**Problem:** Server has auth enabled but client isn't sending token.

**Solution:**
1. Check if auth is enabled: `curl http://localhost:3300/health`
2. Add token to URL: `/sse?token=your-token`
3. Or add header: `Authorization: Bearer your-token`

### Scenario: "Element not found" when element is visible

**Problem:** Element exists but selector doesn't match or element is in iframe.

**Solution:**
1. Take screenshot to verify page state
2. Use browser DevTools to test selector
3. Check if element is inside iframe
4. Add wait for element to load

### Scenario: "Tool execution timed out" on slow pages

**Problem:** Page takes longer to load than default timeout.

**Solution:**
1. Increase timeout: `{ "timeout": 60000 }`
2. Use `waitUntil: "networkidle"` for full page load
3. Check network conditions

### Scenario: "No browser instance available" after launch

**Problem:** Browser launched but extension didn't connect.

**Solution:**
1. Check server logs for registration
2. Verify extension is loaded in browser
3. Check browser console for errors
4. Wait a few seconds after launch

### Scenario: Rate limited despite low traffic

**Problem:** IP-based rate limiting affects multiple users behind NAT.

**Solution:**
1. Increase rate limits: `RATE_LIMIT_MAX_CALLS=200`
2. Use different IPs for different clients
3. Implement client-side throttling

## Debugging Errors

### Enable Debug Logging

```bash
LOG_LEVEL=debug moonsurf
```

### Check Server Logs

```bash
# Errors go to stderr
moonsurf 2>&1 | grep ERROR
```

### Test Endpoints

```bash
# Health check
curl http://localhost:3300/health

# Info
curl http://localhost:3300/info

# List instances
curl http://localhost:3300/instances
```

### Capture Screenshots on Error

Always take screenshots when errors occur for visual debugging.

### Check Browser Console

Open DevTools in the browser to see extension errors and JavaScript issues.

## Related

- [HTTP Endpoints](http-endpoints.md) - API reference
- [Debugging Tips](../guides/debugging-tips.md) - Troubleshooting guide
- [Configuration](../configuration/README.md) - Server settings
