# Instance Lifecycle

This document explains how browser instances are created, managed, and destroyed in Moonsurf.

## Overview

A browser instance in Moonsurf represents:
- A running browser process
- A connected Chrome extension
- A WebSocket communication channel
- Associated state (downloads, tabs, etc.)

## Lifecycle Stages

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Launch    │────►│  Register   │────►│  Operate    │────►│   Close     │
│             │     │             │     │             │     │             │
│ - Spawn     │     │ - Assign ID │     │ - Tool calls│     │ - Cleanup   │
│ - Extension │     │ - WebSocket │     │ - Downloads │     │ - Unregister│
│ - Wait      │     │ - Download  │     │ - State     │     │ - Kill proc │
│             │     │   watcher   │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Stage 1: Launch

When `browser_instance action:new` is called:

### 1.1 Prepare Environment

```javascript
// Determine browser mode and paths
const mode = options.mode || 'chromium';
const browserPath = findBrowserPath(mode);
const userDataDir = getUserDataDir(mode);
```

### 1.2 Ensure Extension

```javascript
// For chromium/testing modes
await ensureExtension();
// Downloads from CDN if not present: ~/.moonsurf/extension/
```

### 1.3 Spawn Process

```javascript
const args = [
  `--user-data-dir=${userDataDir}`,
  `--load-extension=${extensionPath}`,
  '--no-first-run',
  // ... more flags
];

const process = spawn(browserPath, args);
```

### 1.4 Wait for Extension Connection

```javascript
// Poll for new connected instance (up to 30 seconds)
while (Date.now() - startTime < 30000) {
  const newInstance = findNewConnectedInstance();
  if (newInstance) return newInstance;
  await sleep(100);
}
throw new Error('Extension failed to connect');
```

## Stage 2: Register

When the extension connects:

### 2.1 Extension Sends Registration

```javascript
// Extension POSTs to /register
POST /register
{
  "userAgent": "Mozilla/5.0...",
  "windowId": 123
}
```

### 2.2 Server Assigns Resources

```javascript
// Server assigns instance ID and WebSocket port
const instanceId = `inst_${timestamp}_${random}`;
const port = getNextAvailablePort(); // 3301-3399

instances.set(instanceId, {
  id: instanceId,
  port: port,
  userAgent: request.userAgent,
  windowId: request.windowId,
  connectedAt: Date.now()
});
```

### 2.3 WebSocket Server Started

```javascript
// Start WebSocket server for this instance
startWebSocketServer(port);

// Return to extension
{ "instanceId": instanceId, "port": port }
```

### 2.4 Extension Connects via WebSocket

```javascript
// Extension connects to ws://localhost:{port}
ws.send({ type: "hello", instanceId: instanceId });

// Server validates and confirms
ws.send({ type: "welcome", instanceId: instanceId });
```

### 2.5 Download Watcher Started

```javascript
// Start watching download directory
downloadWatcher.watchDirectory(instanceId, downloadDir);
```

## Stage 3: Operate

During normal operation:

### 3.1 Tool Call Flow

```
AI Client                MCP Server              Extension              Browser
    │                        │                       │                     │
    │  tools/call            │                       │                     │
    │ ─────────────────────► │                       │                     │
    │                        │  tool_call (WS)       │                     │
    │                        │ ────────────────────► │                     │
    │                        │                       │  Execute            │
    │                        │                       │ ──────────────────► │
    │                        │                       │                     │
    │                        │                       │  Result             │
    │                        │                       │ ◄────────────────── │
    │                        │  tool_result (WS)     │                     │
    │                        │ ◄──────────────────── │                     │
    │  MCP response          │                       │                     │
    │ ◄───────────────────── │                       │                     │
```

### 3.2 Instance State

Each instance tracks:

```javascript
{
  id: "inst_xxx",           // Unique identifier
  port: 3301,               // WebSocket port
  ws: WebSocket,            // Connection to extension
  userAgent: "...",         // Browser user agent
  windowId: 123,            // Chrome window ID
  connectedAt: timestamp,   // When connected
  lastActivity: timestamp   // Last tool call
}
```

### 3.3 Pending Calls

Tool calls are tracked with timeouts:

```javascript
const callId = `call_${counter++}`;
pendingCalls.set(callId, {
  resolve: ...,
  reject: ...,
  timeout: setTimeout(() => reject('Timeout'), 30000)
});
ws.send({ type: 'tool_call', id: callId, name: toolName, args: args });
```

## Stage 4: Close

When `browser_instance action:close` is called or connection is lost:

### 4.1 Graceful Close

```javascript
// Send SIGTERM to browser process
process.kill('SIGTERM');

// Wait 5 seconds, then force kill
setTimeout(() => {
  if (!process.killed) {
    process.kill('SIGKILL');
  }
}, 5000);
```

### 4.2 Cleanup

```javascript
// Stop download watcher
downloadWatcher.stopWatching(instanceId);

// Remove from instance manager
instances.delete(instanceId);
portToInstance.delete(port);

// Notify task manager (fails running tasks)
taskManager.handleInstanceDisconnect(instanceId);
```

### 4.3 WebSocket Close

```javascript
// Extension disconnection triggers cleanup
ws.on('close', () => {
  instanceManager.unregister(instanceId);
});
```

## Abnormal Termination

### Browser Crash

If the browser process crashes:
1. WebSocket connection closes
2. Server detects disconnect
3. Cleanup runs automatically
4. Running tasks are failed

### Extension Disconnect

If the extension disconnects unexpectedly:
1. Server receives WebSocket close event
2. Instance is unregistered
3. Download watcher is stopped
4. Tasks are failed with `INSTANCE_DISCONNECTED`

### Server Shutdown

On SIGTERM:
1. HTTP server closes
2. All WebSocket connections close
3. Browser processes receive SIGTERM
4. Clean exit

## Instance ID Format

Instance IDs follow this format:

```
inst_{timestamp}_{random}

Example: inst_1706234567890_abc123
```

- `inst_` - Prefix for instance IDs
- `{timestamp}` - Unix timestamp in milliseconds
- `{random}` - 6 character random string

## Port Allocation

WebSocket ports are allocated from a pool:

```javascript
const PORT_START = 3301;
const PORT_END = 3399;

function getNextAvailablePort() {
  for (let port = PORT_START; port <= PORT_END; port++) {
    if (!portToInstance.has(port)) {
      return port;
    }
  }
  return null; // No ports available
}
```

Maximum concurrent instances: **99**

## Instance Lookup

Instances can be found by:

```javascript
// By ID
getInstance(instanceId)

// By port
getInstanceByPort(port)

// First connected (when no ID specified)
getFirstConnectedInstance()

// All connected
getConnectedInstances()
```

## Related Topics

- [Architecture](architecture.md) - System overview
- [Extension Communication](extension-communication.md) - WebSocket protocol
- [browser_instance Tool](../tools/browser-instance.md) - Tool reference
