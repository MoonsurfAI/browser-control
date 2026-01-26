# SSE Protocol

Server-Sent Events protocol for MCP client connections.

## Overview

Moonsurf uses SSE (Server-Sent Events) as the transport layer for the Model Context Protocol (MCP). SSE provides a one-way channel from server to client, while HTTP POST is used for client-to-server messages.

## Connection Flow

```
1. Client opens SSE connection to /sse
2. Server sends 'endpoint' event with message URL
3. Client sends requests via POST to message URL
4. Server sends responses via SSE 'message' events
```

## Connecting

### Basic Connection

```javascript
const eventSource = new EventSource('http://localhost:3300/sse');

eventSource.onopen = () => {
  console.log('Connected');
};

eventSource.onerror = (error) => {
  console.error('Error:', error);
};
```

### With Authentication

```javascript
// Token via URL parameter (recommended for SSE)
const eventSource = new EventSource(
  'http://localhost:3300/sse?token=your-secret-token'
);
```

### Connection Timeout

SSE connections are long-lived. The server keeps the connection open indefinitely.

## SSE Events

### endpoint

Sent immediately after connection. Contains the message endpoint URL with session ID.

**Format:**
```
event: endpoint
data: http://localhost:3300/message?sessionId=abc123-def456-789
```

**Usage:**
```javascript
eventSource.addEventListener('endpoint', (event) => {
  const messageUrl = event.data;
  console.log('Message endpoint:', messageUrl);
});
```

### message

Sent when the server has a response to a request.

**Format:**
```
event: message
data: {"jsonrpc":"2.0","id":1,"result":{"tools":[...]}}
```

**Usage:**
```javascript
eventSource.addEventListener('message', (event) => {
  const response = JSON.parse(event.data);
  console.log('Response:', response);
});
```

Alternatively, use the generic handler:
```javascript
eventSource.onmessage = (event) => {
  const response = JSON.parse(event.data);
  // Handle response
};
```

## Sending Requests

Requests are sent via HTTP POST to the message endpoint.

### Request Format (JSON-RPC 2.0)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

### Example: List Tools

```javascript
const response = await fetch(messageUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Authorization header if using token auth
    // 'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  })
});

const result = await response.json();
```

### Example: Call Tool

```javascript
const response = await fetch(messageUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'browser_instance',
      arguments: {
        action: 'launch',
        mode: 'chromium'
      }
    }
  })
});
```

## MCP Methods

### tools/list

List all available tools.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "browser_instance",
        "description": "Manage browser instances",
        "inputSchema": { ... }
      },
      {
        "name": "browser_navigate",
        "description": "Navigate and control page loading",
        "inputSchema": { ... }
      }
    ]
  }
}
```

### tools/call

Execute a tool.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "browser_navigate",
    "arguments": {
      "action": "goto",
      "url": "https://example.com"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Navigated to https://example.com"
      }
    ]
  }
}
```

### initialize

Initialize MCP session (optional).

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "my-client",
      "version": "1.0.0"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 0,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "moonsurf-mcp",
      "version": "2.0.0"
    }
  }
}
```

### resources/list

List resources (returns empty).

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "resources": []
  }
}
```

### prompts/list

List prompts (returns empty).

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "prompts/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "prompts": []
  }
}
```

## Complete Client Example

```javascript
class MoonsurfMCPClient {
  constructor(baseUrl = 'http://localhost:3300', token = null) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.messageUrl = null;
    this.eventSource = null;
    this.requestId = 0;
    this.pendingRequests = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      const url = this.token
        ? `${this.baseUrl}/sse?token=${this.token}`
        : `${this.baseUrl}/sse`;

      this.eventSource = new EventSource(url);

      this.eventSource.addEventListener('endpoint', (event) => {
        this.messageUrl = event.data;
        resolve();
      });

      this.eventSource.addEventListener('message', (event) => {
        const response = JSON.parse(event.data);
        const pending = this.pendingRequests.get(response.id);
        if (pending) {
          pending.resolve(response);
          this.pendingRequests.delete(response.id);
        }
      });

      this.eventSource.onerror = (error) => {
        reject(error);
      };
    });
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }

  async request(method, params = {}) {
    const id = ++this.requestId;

    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const fetchPromise = fetch(this.messageUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params
      })
    });

    const response = await fetchPromise;
    return response.json();
  }

  async listTools() {
    const response = await this.request('tools/list');
    return response.result.tools;
  }

  async callTool(name, args) {
    const response = await this.request('tools/call', {
      name,
      arguments: args
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }
}

// Usage
const client = new MoonsurfMCPClient();
await client.connect();

const tools = await client.listTools();
console.log('Available tools:', tools.map(t => t.name));

const result = await client.callTool('browser_instance', { action: 'launch' });
console.log('Browser launched:', result);

client.disconnect();
```

## Error Handling

### Connection Errors

```javascript
eventSource.onerror = (event) => {
  if (eventSource.readyState === EventSource.CLOSED) {
    console.error('Connection closed');
    // Reconnect logic
  } else if (eventSource.readyState === EventSource.CONNECTING) {
    console.log('Reconnecting...');
  }
};
```

### Request Errors

MCP errors are returned in the response:

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

### Reconnection

Implement automatic reconnection:

```javascript
function connect() {
  const eventSource = new EventSource(url);

  eventSource.onerror = () => {
    eventSource.close();
    setTimeout(connect, 5000); // Retry after 5 seconds
  };
}
```

## Session Management

Each SSE connection has a unique session ID:

- Session ID is embedded in the message URL
- Use the same message URL for all requests in a session
- Session ends when SSE connection closes
- Server tracks session for audit logging

## Best Practices

### 1. Keep Connection Alive

SSE connections should remain open for the duration of your session.

### 2. Handle Disconnections

Implement reconnection logic for robustness.

### 3. Use Request IDs

Always use unique, incrementing request IDs.

### 4. Parse Responses Safely

```javascript
try {
  const response = JSON.parse(event.data);
  // Handle response
} catch (error) {
  console.error('Invalid JSON:', event.data);
}
```

### 5. Close When Done

```javascript
eventSource.close();
```

## Browser Compatibility

SSE is supported in all modern browsers:
- Chrome 6+
- Firefox 6+
- Safari 5+
- Edge 79+

For older browsers, consider using a polyfill or the HTTP POST API directly.

## Related

- [HTTP Endpoints](http-endpoints.md) - Full HTTP API
- [WebSocket Protocol](websocket-protocol.md) - Task execution API
- [Custom Clients](../integration/custom-clients.md) - Integration guide
