# API Reference

Complete reference for Moonsurf's HTTP, SSE, and WebSocket APIs.

## Overview

Moonsurf exposes multiple APIs for different use cases:

| API | Transport | Port | Purpose |
|-----|-----------|------|---------|
| HTTP REST | HTTP/HTTPS | 3300 | Health checks, info, instance management |
| REST Tools API | HTTP/HTTPS | 3300 | Execute browser tools via simple HTTP calls |
| MCP | SSE + HTTP | 3300 | AI client tool integration |
| Tasks | WebSocket | 3400 | Batched command execution |
| Extension | WebSocket | 3301-3399 | Browser extension communication |

## Documentation

### [HTTP Endpoints](http-endpoints.md)
REST API for server management, health checks, and task operations.

### [REST Tools API](rest-api.md)
Execute browser automation tools via simple HTTP POST requests. No MCP protocol or SSE required.

### [SSE Protocol](sse-protocol.md)
Server-Sent Events protocol for MCP client connections.

### [WebSocket Protocol](websocket-protocol.md)
Task execution WebSocket API for real-time command batching.

### [Error Codes](error-codes.md)
Error codes, meanings, and troubleshooting guidance.

## Quick Reference

### Base URLs

**Local Mode:**
```
HTTP:      http://localhost:3300
WebSocket: ws://localhost:3400 (tasks)
WebSocket: ws://localhost:3301-3399 (extension)
```

**Remote Mode:**
```
HTTP:      https://your-server.com:3300
WebSocket: wss://your-server.com:3400 (tasks)
```

### Authentication

**Query Parameter:**
```
GET /sse?token=your-secret-token
```

**Authorization Header:**
```
Authorization: Bearer your-secret-token
```

### Common Headers

```
Content-Type: application/json
Authorization: Bearer your-token
```

## Endpoint Summary

### Unprotected Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |
| GET | `/info` | Server information |
| GET | `/.well-known/oauth-authorization-server` | OAuth metadata |
| GET | `/oauth/authorize` | OAuth authorization |
| POST | `/oauth/token` | OAuth token |
| POST | `/oauth/register` | OAuth client registration |

### Protected Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tools` | List available tools (REST API) |
| POST | `/api/tools/{name}` | Execute a tool (REST API) |
| GET | `/sse` | SSE connection for MCP |
| POST | `/message` | MCP request handling |
| POST | `/register` | Extension registration |
| GET | `/instances` | List browser instances |
| GET | `/tasks` | List tasks |
| POST | `/tasks` | Submit new task |
| GET | `/tasks/:id` | Get task details |
| POST | `/tasks/:id/cancel` | Cancel a task |

## Response Format

### Success Response

```json
{
  "status": "ok",
  "data": { ... }
}
```

### Error Response

```json
{
  "error": "Error message"
}
```

### REST API Response

```json
{
  "success": true,
  "result": { ... }
}
```

### REST API Error

```json
{
  "success": false,
  "error": {
    "code": "TOOL_ERROR",
    "message": "Error description"
  }
}
```

### MCP Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": { ... }
}
```

### MCP Error

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

## Rate Limiting

When enabled, requests are limited per IP:

**Response when rate limited:**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 45

{"error": "Too many requests", "retryAfter": 45}
```

**Default limits:**
- 100 requests per minute per IP
- 10 concurrent connections per IP

## CORS

CORS headers are included in all responses:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

When `CORS_ORIGINS` is set, origin checking is enforced.

## TLS/HTTPS

When TLS is enabled:
- All HTTP endpoints use HTTPS
- Use `https://` in URLs
- Certificate must be valid (or use `-k` with curl for self-signed)

## Version

Current API version: `2.0.0`

Check via health endpoint:
```bash
curl http://localhost:3300/health
```

## Related

- [Configuration](../configuration/README.md) - Server configuration
- [Tools Reference](../tools/README.md) - MCP tools
- [Custom Clients](../integration/custom-clients.md) - Client integration
