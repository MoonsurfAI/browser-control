# Environment Variables

Complete reference for all Moonsurf configuration environment variables.

## Server Binding

### PORT

HTTP server port.

| Property | Value |
|----------|-------|
| Default | `3300` |
| Type | Integer |
| Example | `PORT=8080` |

### HOST

Server bind address.

| Property | Value |
|----------|-------|
| Default | `localhost` (local mode) or `0.0.0.0` (remote mode) |
| Type | String |
| Example | `HOST=0.0.0.0` |

### PUBLIC_URL

Public URL for client-facing endpoints. Used when the server is behind a proxy or load balancer.

| Property | Value |
|----------|-------|
| Default | (none) |
| Type | URL |
| Example | `PUBLIC_URL=https://api.example.com` |

### REMOTE_MODE

Enable remote mode. Sets defaults appropriate for accepting external connections.

| Property | Value |
|----------|-------|
| Default | `false` |
| Type | Boolean (`true`/`false` or `1`/`0`) |
| Example | `REMOTE_MODE=true` |

**When enabled:**
- `HOST` defaults to `0.0.0.0`
- `AUTH_ENABLED` defaults to `true`
- `CORS_ENABLED` defaults to `true`
- `RATE_LIMIT_ENABLED` defaults to `true`
- `AUDIT_LOG_ENABLED` defaults to `true`
- `HEADLESS_DEFAULT` defaults to `true`

## WebSocket Configuration

### WS_PORT_START

Starting port for browser instance WebSocket servers.

| Property | Value |
|----------|-------|
| Default | `3301` |
| Type | Integer |
| Example | `WS_PORT_START=4001` |

### WS_PORT_END

Ending port for browser instance WebSocket servers.

| Property | Value |
|----------|-------|
| Default | `3399` |
| Type | Integer |
| Example | `WS_PORT_END=4099` |

**Note:** The number of available ports determines the maximum concurrent browser instances.

## Authentication

### AUTH_ENABLED

Enable token-based authentication.

| Property | Value |
|----------|-------|
| Default | `false` (local) / `true` (remote) |
| Type | Boolean |
| Example | `AUTH_ENABLED=true` |

### AUTH_TOKENS

Comma-separated list of valid authentication tokens.

| Property | Value |
|----------|-------|
| Default | (none) |
| Type | Comma-separated strings |
| Example | `AUTH_TOKENS=token1,token2,token3` |

**Required** when `AUTH_ENABLED=true` and accepting external connections.

## TLS/HTTPS

### TLS_ENABLED

Enable HTTPS/WSS instead of HTTP/WS.

| Property | Value |
|----------|-------|
| Default | `false` |
| Type | Boolean |
| Example | `TLS_ENABLED=true` |

### TLS_CERT_PATH

Path to TLS certificate file.

| Property | Value |
|----------|-------|
| Default | (none) |
| Type | File path |
| Example | `TLS_CERT_PATH=/etc/ssl/cert.pem` |

**Required** when `TLS_ENABLED=true`.

### TLS_KEY_PATH

Path to TLS private key file.

| Property | Value |
|----------|-------|
| Default | (none) |
| Type | File path |
| Example | `TLS_KEY_PATH=/etc/ssl/key.pem` |

**Required** when `TLS_ENABLED=true`.

## CORS

### CORS_ENABLED

Enable CORS handling with configurable origins.

| Property | Value |
|----------|-------|
| Default | `false` (local) / `true` (remote) |
| Type | Boolean |
| Example | `CORS_ENABLED=true` |

### CORS_ORIGINS

Comma-separated list of allowed origins.

| Property | Value |
|----------|-------|
| Default | Empty (allows all origins when CORS enabled) |
| Type | Comma-separated URLs |
| Example | `CORS_ORIGINS=https://app.example.com,https://admin.example.com` |

### CORS_CREDENTIALS

Allow credentials in CORS requests.

| Property | Value |
|----------|-------|
| Default | `true` |
| Type | Boolean |
| Example | `CORS_CREDENTIALS=false` |

## Rate Limiting

### RATE_LIMIT_ENABLED

Enable rate limiting.

| Property | Value |
|----------|-------|
| Default | `false` (local) / `true` (remote) |
| Type | Boolean |
| Example | `RATE_LIMIT_ENABLED=true` |

### RATE_LIMIT_MAX_CONNECTIONS

Maximum connections per IP address.

| Property | Value |
|----------|-------|
| Default | `10` |
| Type | Integer |
| Example | `RATE_LIMIT_MAX_CONNECTIONS=5` |

### RATE_LIMIT_MAX_CALLS

Maximum API calls per minute per IP address.

| Property | Value |
|----------|-------|
| Default | `100` |
| Type | Integer |
| Example | `RATE_LIMIT_MAX_CALLS=50` |

## Browser Defaults

### BROWSER_DEFAULT_MODE

Default browser mode when not specified in tool call.

| Property | Value |
|----------|-------|
| Default | `chromium` |
| Type | `chrome`, `testing`, or `chromium` |
| Example | `BROWSER_DEFAULT_MODE=testing` |

### HEADLESS_DEFAULT

Run browsers in headless mode by default.

| Property | Value |
|----------|-------|
| Default | `false` (local) / `true` (remote) |
| Type | Boolean |
| Example | `HEADLESS_DEFAULT=true` |

**Note:** Headless only works with `chromium` mode.

### EXTENSION_PATH

Path to Chrome extension directory. For development with local extension.

| Property | Value |
|----------|-------|
| Default | `~/.moonsurf/extension` |
| Type | Directory path |
| Example | `EXTENSION_PATH=../chrome-extension/dist` |

## Logging

### LOG_LEVEL

Logging verbosity level.

| Property | Value |
|----------|-------|
| Default | `info` |
| Type | `debug`, `info`, `warn`, or `error` |
| Example | `LOG_LEVEL=debug` |

### AUDIT_LOG_ENABLED

Enable audit logging of security-relevant events.

| Property | Value |
|----------|-------|
| Default | `false` (local) / `true` (remote) |
| Type | Boolean |
| Example | `AUDIT_LOG_ENABLED=true` |

Logged events:
- `SSE_CONNECTED` / `SSE_DISCONNECTED`
- `AUTH_FAILED`
- `RATE_LIMITED`
- `MCP_REQUEST`
- `EXTENSION_REGISTERED`
- `TASK_SUBMITTED` / `TASK_CANCELLED`

## Task Execution

### TASKS_ENABLED

Enable the task execution system.

| Property | Value |
|----------|-------|
| Default | `true` |
| Type | Boolean |
| Example | `TASKS_ENABLED=false` |

### TASKS_WS_PORT

WebSocket port for task updates.

| Property | Value |
|----------|-------|
| Default | `3400` |
| Type | Integer |
| Example | `TASKS_WS_PORT=4400` |

### TASKS_COMMAND_TIMEOUT

Timeout for individual task commands in milliseconds.

| Property | Value |
|----------|-------|
| Default | `60000` (60 seconds) |
| Type | Integer |
| Example | `TASKS_COMMAND_TIMEOUT=120000` |

### TASKS_MAX_QUEUE_SIZE

Maximum number of tasks that can be queued per browser instance.

| Property | Value |
|----------|-------|
| Default | `100` |
| Type | Integer |
| Example | `TASKS_MAX_QUEUE_SIZE=50` |

## Example Configurations

### Development
```bash
LOG_LEVEL=debug \
EXTENSION_PATH=../chrome-extension/dist \
moonsurf
```

### CI/CD Testing
```bash
BROWSER_DEFAULT_MODE=testing \
HEADLESS_DEFAULT=true \
TASKS_ENABLED=false \
moonsurf
```

### Production
```bash
REMOTE_MODE=true \
PORT=443 \
PUBLIC_URL=https://mcp.example.com \
AUTH_TOKENS=secret-token-1,secret-token-2 \
TLS_ENABLED=true \
TLS_CERT_PATH=/etc/letsencrypt/live/mcp.example.com/fullchain.pem \
TLS_KEY_PATH=/etc/letsencrypt/live/mcp.example.com/privkey.pem \
CORS_ORIGINS=https://app.example.com \
RATE_LIMIT_MAX_CALLS=50 \
LOG_LEVEL=info \
moonsurf
```

### Docker
```dockerfile
ENV PORT=3300
ENV HOST=0.0.0.0
ENV REMOTE_MODE=true
ENV AUTH_TOKENS=${AUTH_TOKENS}
ENV BROWSER_DEFAULT_MODE=chromium
ENV HEADLESS_DEFAULT=true
```

## Related

- [Local Mode](local-mode.md) - Development configuration
- [Remote Mode](remote-mode.md) - Production configuration
- [Security Hardening](security-hardening.md) - Security best practices
