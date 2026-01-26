# Configuration

Moonsurf is configured through environment variables, making it easy to customize for different environments and deployment scenarios.

## Configuration Modes

### Local Mode (Default)

For development and local use:
- Binds to `localhost` only
- No authentication required
- No TLS
- No rate limiting

```bash
moonsurf
```

### Remote Mode

For production deployments accepting external connections:
- Binds to `0.0.0.0` (all interfaces)
- Authentication enabled by default
- Rate limiting enabled by default
- TLS recommended

```bash
REMOTE_MODE=true AUTH_TOKENS=your-secret-token moonsurf
```

## Configuration Topics

### [Environment Variables](environment-variables.md)
Complete reference of all environment variables:
- Server binding (`PORT`, `HOST`)
- Authentication (`AUTH_ENABLED`, `AUTH_TOKENS`)
- TLS (`TLS_ENABLED`, `TLS_CERT_PATH`, `TLS_KEY_PATH`)
- Browser defaults (`BROWSER_DEFAULT_MODE`, `HEADLESS_DEFAULT`)
- Task system (`TASKS_ENABLED`, `TASKS_WS_PORT`)

### [Local Mode](local-mode.md)
Development setup:
- Running with local extension
- Debug logging
- Hot reload workflows

### [Remote Mode](remote-mode.md)
Production deployment:
- Accepting external connections
- Public URL configuration
- Security considerations

### [Authentication](authentication.md)
Securing access:
- Bearer token authentication
- Query parameter tokens
- Protected endpoints

### [TLS Setup](tls-setup.md)
Enabling HTTPS/WSS:
- Certificate configuration
- Self-signed certificates
- Let's Encrypt

### [Security Hardening](security-hardening.md)
Production security:
- Rate limiting
- CORS configuration
- Audit logging

## Quick Reference

### Essential Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3300` |
| `HOST` | Bind address | `localhost` |
| `REMOTE_MODE` | Enable remote mode | `false` |
| `AUTH_TOKENS` | Comma-separated tokens | (none) |
| `BROWSER_DEFAULT_MODE` | Default browser | `chromium` |

### Security Variables

| Variable | Description | Default (Local) | Default (Remote) |
|----------|-------------|-----------------|------------------|
| `AUTH_ENABLED` | Require authentication | `false` | `true` |
| `TLS_ENABLED` | Use HTTPS/WSS | `false` | `false` |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `false` | `true` |
| `CORS_ENABLED` | Enable CORS handling | `false` | `true` |
| `AUDIT_LOG_ENABLED` | Enable audit logging | `false` | `true` |

### Task System Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TASKS_ENABLED` | Enable task system | `true` |
| `TASKS_WS_PORT` | Task WebSocket port | `3400` |
| `TASKS_COMMAND_TIMEOUT` | Per-command timeout (ms) | `60000` |
| `TASKS_MAX_QUEUE_SIZE` | Max queued tasks | `100` |

## Configuration Examples

### Development
```bash
# Default settings, verbose logging
LOG_LEVEL=debug moonsurf
```

### CI/CD
```bash
# Headless, testing mode, no task system
BROWSER_DEFAULT_MODE=testing HEADLESS_DEFAULT=true TASKS_ENABLED=false moonsurf
```

### Production (Minimal)
```bash
REMOTE_MODE=true AUTH_TOKENS=secret123 moonsurf
```

### Production (Full)
```bash
REMOTE_MODE=true \
AUTH_TOKENS=token1,token2 \
TLS_ENABLED=true \
TLS_CERT_PATH=/etc/ssl/cert.pem \
TLS_KEY_PATH=/etc/ssl/key.pem \
RATE_LIMIT_MAX_CALLS=50 \
moonsurf
```

## Configuration Validation

Moonsurf validates configuration on startup and warns about potential issues:

```
[Config] Server Configuration:
[Config]   Mode: REMOTE
[Config]   HTTP: https://0.0.0.0:3300
[Config]   WebSocket: wss://localhost:3301-3399
[Config]   Auth: ENABLED (tokens: 2)
[Config]   TLS: ENABLED
[Config]   CORS: ENABLED
[Config]   Rate Limit: ENABLED (max: 100/min)
```

### Warnings

```
[Config] ⚠️  WARNING: Server accepting external connections but authentication is disabled
[Config] ⚠️  WARNING: Server accepting external connections over unencrypted HTTP/WS
```

### Errors

```
[Config] ❌ ERROR: TLS enabled but cert/key paths not provided
[Config] ❌ ERROR: Authentication enabled but no tokens configured
```

## Next Steps

- [Environment Variables](environment-variables.md) - Complete reference
- [Local Mode](local-mode.md) - Development setup
- [Remote Mode](remote-mode.md) - Production deployment
