# Custom Client Integration

Build your own client to connect to Moonsurf using SSE, HTTP, or WebSocket protocols.

## Overview

Moonsurf exposes three connection methods:

1. **SSE (Server-Sent Events)** - Standard MCP transport for real-time communication
2. **HTTP POST** - Request/response for individual MCP messages
3. **WebSocket** - Task execution with real-time progress updates

## SSE Connection (Recommended)

### Connecting

```javascript
const eventSource = new EventSource('http://localhost:3300/sse');

eventSource.onopen = () => {
  console.log('Connected to Moonsurf');
};

eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
};
```

### With Authentication

```javascript
// Token via URL parameter
const eventSource = new EventSource(
  'https://mcp.example.com/sse?token=your-secret-token'
);
```

### Session ID

The SSE connection receives a session ID for subsequent requests:

```javascript
eventSource.addEventListener('endpoint', (event) => {
  const data = JSON.parse(event.data);
  const sessionId = data.sessionId;
  const messageEndpoint = data.messageEndpoint;
  console.log('Session established:', sessionId);
});
```

## HTTP Message API

### Sending Requests

```javascript
async function sendMcpRequest(sessionId, method, params = {}) {
  const response = await fetch(
    `http://localhost:3300/message?sessionId=${sessionId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer your-token'  // For authenticated servers
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      })
    }
  );

  return response.json();
}
```

### List Available Tools

```javascript
const tools = await sendMcpRequest(sessionId, 'tools/list');
console.log('Available tools:', tools.result.tools);
```

### Call a Tool

```javascript
// Launch browser
const result = await sendMcpRequest(sessionId, 'tools/call', {
  name: 'browser_instance',
  arguments: {
    action: 'launch',
    mode: 'chromium'
  }
});

console.log('Browser launched:', result);
```

## Complete SSE Client Example

```javascript
class MoonsurfClient {
  constructor(baseUrl = 'http://localhost:3300', token = null) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.sessionId = null;
    this.eventSource = null;
    this.requestId = 0;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const url = this.token
        ? `${this.baseUrl}/sse?token=${this.token}`
        : `${this.baseUrl}/sse`;

      this.eventSource = new EventSource(url);

      this.eventSource.addEventListener('endpoint', (event) => {
        const data = JSON.parse(event.data);
        this.sessionId = data.sessionId;
        resolve(this.sessionId);
      });

      this.eventSource.onerror = (error) => {
        reject(error);
      };
    });
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  async request(method, params = {}) {
    if (!this.sessionId) {
      throw new Error('Not connected. Call connect() first.');
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(
      `${this.baseUrl}/message?sessionId=${this.sessionId}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: ++this.requestId,
          method,
          params
        })
      }
    );

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.result;
  }

  // Convenience methods
  async listTools() {
    return this.request('tools/list');
  }

  async callTool(name, args) {
    return this.request('tools/call', { name, arguments: args });
  }
}

// Usage
const client = new MoonsurfClient();
await client.connect();

// Launch browser
await client.callTool('browser_instance', { action: 'launch' });

// Navigate
await client.callTool('browser_navigate', {
  action: 'goto',
  url: 'https://example.com'
});

// Take screenshot
const screenshot = await client.callTool('browser_content', {
  action: 'screenshot'
});

// Close browser
await client.callTool('browser_instance', { action: 'close' });

client.disconnect();
```

## Python Client Example

```python
import requests
import sseclient
import json
import threading

class MoonsurfClient:
    def __init__(self, base_url='http://localhost:3300', token=None):
        self.base_url = base_url
        self.token = token
        self.session_id = None
        self.request_id = 0

    def connect(self):
        url = f"{self.base_url}/sse"
        if self.token:
            url += f"?token={self.token}"

        response = requests.get(url, stream=True)
        client = sseclient.SSEClient(response)

        for event in client.events():
            if event.event == 'endpoint':
                data = json.loads(event.data)
                self.session_id = data['sessionId']
                break

        return self.session_id

    def request(self, method, params=None):
        if not self.session_id:
            raise Exception('Not connected')

        self.request_id += 1

        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        response = requests.post(
            f"{self.base_url}/message?sessionId={self.session_id}",
            headers=headers,
            json={
                'jsonrpc': '2.0',
                'id': self.request_id,
                'method': method,
                'params': params or {}
            }
        )

        result = response.json()

        if 'error' in result:
            raise Exception(result['error']['message'])

        return result.get('result')

    def call_tool(self, name, args):
        return self.request('tools/call', {'name': name, 'arguments': args})

# Usage
client = MoonsurfClient()
client.connect()

# Launch browser
client.call_tool('browser_instance', {'action': 'launch'})

# Navigate
client.call_tool('browser_navigate', {'action': 'goto', 'url': 'https://example.com'})

# Get page content
content = client.call_tool('browser_content', {'action': 'text'})
print(content)

# Close
client.call_tool('browser_instance', {'action': 'close'})
```

## WebSocket Task API

For batched task execution with real-time progress:

### Connect

```javascript
const ws = new WebSocket('ws://localhost:3400');

ws.onopen = () => {
  console.log('Connected to task server');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Task message:', message);
};
```

### Submit Task

```javascript
ws.send(JSON.stringify({
  type: 'task_submit',
  task_name: 'Login Flow',
  task_intention: 'Log into the website',
  commands: [
    {
      tool_name: 'browser_navigate',
      intention: 'Go to login page',
      args: { action: 'goto', url: 'https://example.com/login' }
    },
    {
      tool_name: 'browser_interact',
      intention: 'Enter email',
      args: { action: 'type', selector: '#email', text: 'user@example.com' }
    },
    {
      tool_name: 'browser_interact',
      intention: 'Click login',
      args: { action: 'click', selector: '#submit' }
    }
  ]
}));
```

### Handle Task Events

```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case 'welcome':
      console.log('Session:', message.sessionId);
      break;

    case 'task_submit_response':
      console.log('Task created:', message.taskId);
      break;

    case 'task_progress':
      console.log(`Command ${message.commandIndex}: ${message.status}`);
      if (message.error) console.error(message.error);
      break;

    case 'task_complete':
      console.log('Task finished:', message.status);
      console.log('Results:', message.results);
      break;
  }
};
```

## REST API Endpoints

### Health Check

```bash
curl http://localhost:3300/health
```

### Server Info

```bash
curl http://localhost:3300/info
```

### List Browser Instances

```bash
curl http://localhost:3300/instances
```

### List Tasks (with auth)

```bash
curl -H "Authorization: Bearer your-token" \
  http://localhost:3300/tasks
```

### Submit Task (REST)

```bash
curl -X POST http://localhost:3300/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "task_name": "Test Task",
    "commands": [
      {"tool_name": "browser_navigate", "args": {"action": "goto", "url": "https://example.com"}}
    ]
  }'
```

## Error Handling

### MCP Errors

```javascript
try {
  const result = await client.callTool('browser_instance', { action: 'launch' });
} catch (error) {
  if (error.code === -32600) {
    console.error('Invalid request');
  } else if (error.code === -32601) {
    console.error('Tool not found');
  } else {
    console.error('Tool error:', error.message);
  }
}
```

### Connection Errors

```javascript
eventSource.onerror = (event) => {
  if (eventSource.readyState === EventSource.CLOSED) {
    console.error('Connection closed');
    // Attempt reconnection
    setTimeout(() => connect(), 5000);
  }
};
```

## Authentication

### Query Parameter

```javascript
const url = 'http://localhost:3300/sse?token=your-secret-token';
```

### Authorization Header

```javascript
// For HTTP requests
headers['Authorization'] = 'Bearer your-secret-token';
```

## Best Practices

### 1. Reuse Connections

Keep SSE connection open for multiple requests instead of reconnecting.

### 2. Handle Reconnection

```javascript
function connect() {
  const eventSource = new EventSource(url);

  eventSource.onerror = () => {
    eventSource.close();
    setTimeout(connect, 5000);  // Reconnect after 5s
  };
}
```

### 3. Clean Up Resources

```javascript
// Close browser instances when done
await client.callTool('browser_instance', { action: 'close' });

// Disconnect when finished
client.disconnect();
```

### 4. Use Timeouts

```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```

### 5. Log for Debugging

```javascript
eventSource.onmessage = (event) => {
  console.debug('SSE message:', event.data);
  // Process message
};
```

## Related

- [API Reference](../api-reference/README.md) - Full API documentation
- [SSE Protocol](../api-reference/sse-protocol.md) - SSE details
- [WebSocket Protocol](../api-reference/websocket-protocol.md) - Task WebSocket API
