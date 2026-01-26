# MCP Protocol

Moonsurf implements the Model Context Protocol (MCP), a standard for connecting AI assistants to external tools. This document explains how Moonsurf uses MCP.

## What is MCP?

The Model Context Protocol is a specification for:
- Discovering available tools
- Calling tools with arguments
- Receiving results

It enables AI assistants to interact with external systems in a standardized way.

## Protocol Version

Moonsurf implements MCP protocol version `2024-11-05`.

## Transport Layer

### Server-Sent Events (SSE)

Moonsurf uses SSE as the transport layer for MCP:

**SSE Endpoint:** `GET /sse`

When a client connects:
1. Server sends an `endpoint` event with the message URL
2. Client uses this URL for all subsequent requests
3. Server sends `message` events with responses

```
Client                                          Server
  │                                               │
  │  GET /sse                                     │
  │ ─────────────────────────────────────────────►│
  │                                               │
  │  event: endpoint                              │
  │  data: http://localhost:3300/message?sessionId=xxx
  │ ◄─────────────────────────────────────────────│
  │                                               │
  │  POST /message?sessionId=xxx                  │
  │  {"jsonrpc":"2.0","method":"initialize",...}  │
  │ ─────────────────────────────────────────────►│
  │                                               │
  │  event: message                               │
  │  data: {"jsonrpc":"2.0","result":{...}}       │
  │ ◄─────────────────────────────────────────────│
```

### Message Endpoint

**Message Endpoint:** `POST /message?sessionId={sessionId}`

All MCP requests are sent here. The `sessionId` ties requests to SSE connections.

## Message Format

All messages use JSON-RPC 2.0:

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "method_name",
  "params": { ... }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { ... }
}
```

**Error:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid Request"
  }
}
```

## MCP Methods

### initialize

Initializes the connection and returns server capabilities.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "serverInfo": {
      "name": "moonsurf-mcp",
      "version": "2.0.0"
    },
    "capabilities": {
      "tools": {}
    }
  }
}
```

### initialized

Client acknowledgment that initialization is complete.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "initialized",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {}
}
```

### tools/list

Lists all available tools.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "tools": [
      {
        "name": "browser_instance",
        "description": "Manage browser instances...",
        "inputSchema": {
          "type": "object",
          "properties": {
            "action": { "type": "string", "enum": ["list", "new", "close", "profiles"] },
            ...
          },
          "required": ["action"]
        }
      },
      ...
    ]
  }
}
```

### tools/call

Executes a tool with given arguments.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "browser_instance",
    "arguments": {
      "action": "new",
      "mode": "chromium"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"instanceId\":\"inst_xxx\",\"browserType\":\"Chromium\",...}"
      }
    ]
  }
}
```

### ping

Keep-alive message.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "ping"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {}
}
```

## Tool Result Format

Tool results are returned in the MCP content format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "JSON-encoded result"
    }
  ]
}
```

For errors:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"error\":{\"code\":\"ERROR_CODE\",\"message\":\"Error description\"}}"
    }
  ],
  "isError": true
}
```

## Error Codes

### JSON-RPC Errors

| Code | Message | Description |
|------|---------|-------------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid Request | Missing required fields |
| -32601 | Method not found | Unknown MCP method |
| -32602 | Invalid params | Invalid method parameters |
| -32603 | Internal error | Server error |

### Tool Errors

Tool-specific errors are returned in the result:

```json
{
  "content": [{
    "type": "text",
    "text": "{\"error\":{\"code\":\"NO_INSTANCE\",\"message\":\"Instance not found\"}}"
  }],
  "isError": true
}
```

Common tool error codes:
- `NO_INSTANCE` - Browser instance not found
- `NOT_CONNECTED` - Instance not connected
- `TOOL_TIMEOUT` - Tool call timed out
- `TOOL_ERROR` - General tool error

## Connection Lifecycle

```
1. Client connects to /sse
   └─► Receives sessionId via 'endpoint' event

2. Client sends 'initialize' request
   └─► Server returns capabilities

3. Client sends 'initialized' acknowledgment
   └─► Connection ready

4. Client discovers tools with 'tools/list'
   └─► Server returns available tools

5. Client calls tools with 'tools/call'
   └─► Server executes and returns results

6. Client disconnects
   └─► Server cleans up session
```

## Timeouts

- **Tool call timeout:** 30 seconds (default)
- **SSE keep-alive:** 30 second pings
- **Connection timeout:** No explicit limit

## Authentication

When authentication is enabled:

**SSE Connection:**
```
GET /sse?token=your-token
```

**Message Requests:**
```
POST /message?sessionId=xxx
Authorization: Bearer your-token
```

## Example Session

```bash
# 1. Connect to SSE (in background)
curl -N "http://localhost:3300/sse" &

# Output:
# event: endpoint
# data: http://localhost:3300/message?sessionId=abc-123

# 2. Initialize
curl -X POST "http://localhost:3300/message?sessionId=abc-123" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'

# 3. List tools
curl -X POST "http://localhost:3300/message?sessionId=abc-123" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# 4. Launch browser
curl -X POST "http://localhost:3300/message?sessionId=abc-123" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"browser_instance","arguments":{"action":"new","mode":"chromium"}}}'
```

## Related Topics

- [Architecture](architecture.md) - System architecture
- [HTTP Endpoints](../api-reference/http-endpoints.md) - All HTTP routes
- [SSE Protocol](../api-reference/sse-protocol.md) - SSE details
