# Extension Communication

This document explains how the Moonsurf MCP server communicates with the Chrome extension.

## Overview

The server and extension communicate via WebSocket. Each browser instance has its own WebSocket connection on a unique port.

```
MCP Server                           Chrome Extension
    │                                      │
    │◄────── POST /register ───────────────│
    │                                      │
    │─────── { instanceId, port } ────────►│
    │                                      │
    │◄══════ WebSocket Connect ════════════│
    │        (localhost:{port})            │
    │                                      │
    │◄────── { type: "hello" } ────────────│
    │                                      │
    │─────── { type: "welcome" } ─────────►│
    │                                      │
    │═══════ Bidirectional Messages ═══════│
```

## Connection Flow

### 1. Extension Registration

When the browser launches with the extension:

**Extension → Server:**
```http
POST /register HTTP/1.1
Content-Type: application/json

{
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...",
  "windowId": 123
}
```

**Server → Extension:**
```json
{
  "instanceId": "inst_1706234567890_abc123",
  "port": 3301,
  "websocketUrl": "ws://localhost:3301"
}
```

### 2. WebSocket Connection

Extension connects to the assigned port:

```javascript
const ws = new WebSocket(`ws://localhost:${port}`);
```

**Key point:** WebSocket is always `localhost`, even when the MCP server accepts remote HTTP connections.

### 3. Hello/Welcome Handshake

**Extension → Server:**
```json
{
  "type": "hello",
  "instanceId": "inst_1706234567890_abc123"
}
```

**Server → Extension:**
```json
{
  "type": "welcome",
  "instanceId": "inst_1706234567890_abc123",
  "serverVersion": "2.0.0"
}
```

## Message Types

### Server → Extension

#### tool_call

Server requests extension to execute a tool.

```json
{
  "type": "tool_call",
  "id": "call_1",
  "name": "browser_navigate",
  "args": {
    "url": "https://example.com",
    "waitUntil": "domcontentloaded"
  }
}
```

Fields:
- `type` - Always `"tool_call"`
- `id` - Unique call ID for response matching
- `name` - Original tool name (after consolidation)
- `args` - Tool arguments

### Extension → Server

#### hello

Initial handshake message.

```json
{
  "type": "hello",
  "instanceId": "inst_xxx"
}
```

#### tool_result

Successful tool execution result.

```json
{
  "type": "tool_result",
  "id": "call_1",
  "result": {
    "success": true,
    "url": "https://example.com/",
    "title": "Example Domain"
  }
}
```

Fields:
- `type` - Always `"tool_result"`
- `id` - Matches the `tool_call` id
- `result` - Tool-specific result data

#### tool_error

Tool execution failure.

```json
{
  "type": "tool_error",
  "id": "call_1",
  "error": {
    "code": "ELEMENT_NOT_FOUND",
    "message": "No element matches selector: #nonexistent"
  }
}
```

Fields:
- `type` - Always `"tool_error"`
- `id` - Matches the `tool_call` id
- `error.code` - Error code
- `error.message` - Human-readable error message

## Message Flow Examples

### Navigation

```
Server                                  Extension
   │                                        │
   │  tool_call: browser_navigate           │
   │  { url: "https://google.com" }         │
   │ ─────────────────────────────────────► │
   │                                        │ Navigate
   │                                        │ ────────► Browser
   │                                        │
   │                                        │ ◄──────── Page loaded
   │  tool_result                           │
   │  { success: true, title: "Google" }    │
   │ ◄───────────────────────────────────── │
```

### Click

```
Server                                  Extension
   │                                        │
   │  tool_call: browser_mouse_click        │
   │  { selector: "#button" }               │
   │ ─────────────────────────────────────► │
   │                                        │ Find element
   │                                        │ Click
   │                                        │
   │  tool_result                           │
   │  { clicked: true }                     │
   │ ◄───────────────────────────────────── │
```

### Error Case

```
Server                                  Extension
   │                                        │
   │  tool_call: browser_mouse_click        │
   │  { selector: "#nonexistent" }          │
   │ ─────────────────────────────────────► │
   │                                        │ Element not found
   │                                        │
   │  tool_error                            │
   │  { code: "ELEMENT_NOT_FOUND", ... }    │
   │ ◄───────────────────────────────────── │
```

## Call ID Tracking

The server tracks pending calls with timeouts:

```javascript
// Server sends tool_call
const callId = `call_${++counter}`;
const timeout = setTimeout(() => {
  pendingCalls.delete(callId);
  reject(new Error('Tool call timeout'));
}, 30000);

pendingCalls.set(callId, { resolve, reject, timeout });
ws.send(JSON.stringify({
  type: 'tool_call',
  id: callId,
  name: toolName,
  args: args
}));

// When result received
pendingCalls.get(message.id).resolve(message.result);
clearTimeout(pendingCalls.get(message.id).timeout);
pendingCalls.delete(message.id);
```

## Keep-Alive

WebSocket connections are kept alive with pings:

```javascript
// Server pings every 30 seconds
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.ping();
  }
}, 30000);
```

## Connection Loss Handling

### Extension Disconnects

```javascript
ws.on('close', () => {
  console.log('Extension disconnected');
  instanceManager.unregister(instanceId);
  // Triggers cleanup: download watcher, tasks, etc.
});
```

### Server Detects Timeout

If no response within timeout:
```javascript
setTimeout(() => {
  pendingCalls.delete(callId);
  reject(new Error('Tool call timeout: browser_navigate'));
}, 30000);
```

## Tool Name Mapping

The server maps consolidated tools to original tool names before sending to extension:

```javascript
// AI calls
{ name: "browser_navigate", arguments: { action: "goto", url: "..." } }

// Server resolves to
{ name: "browser_navigate", args: { url: "..." } }

// Or for other actions
{ name: "browser_navigate", arguments: { action: "wait", selector: "..." } }
// Becomes
{ name: "browser_wait_for", args: { selector: "..." } }
```

## Port Security

WebSocket connections are always on localhost:

```javascript
const wss = new WebSocketServer({
  port: port,
  host: 'localhost'  // Never 0.0.0.0
});
```

This ensures:
- Browser communication stays local
- No external access to WebSocket
- Remote AI clients can connect via HTTP, but browsers run locally

## Debugging WebSocket

To see WebSocket traffic, set log level to debug:

```bash
LOG_LEVEL=debug moonsurf
```

Output:
```
[WebSocket:3301] New connection
[WebSocket:3301] Instance inst_xxx connected
[WebSocket:3301] Received: {"type":"tool_result","id":"call_1",...}
```

## Related Topics

- [Architecture](architecture.md) - System overview
- [Instance Lifecycle](instance-lifecycle.md) - Instance management
- [WebSocket Protocol](../api-reference/websocket-protocol.md) - Full protocol reference
