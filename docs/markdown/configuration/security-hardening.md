# Security Hardening

Additional security measures for production Moonsurf deployments.

## Security Features Overview

| Feature | Purpose | Default (Remote) |
|---------|---------|------------------|
| Authentication | Verify client identity | Enabled |
| TLS | Encrypt traffic | Disabled (use proxy) |
| Rate Limiting | Prevent abuse | Enabled |
| CORS | Control cross-origin access | Enabled |
| Audit Logging | Track security events | Enabled |

## Rate Limiting

Prevents abuse by limiting requests per IP address.

### Configuration

```bash
RATE_LIMIT_ENABLED=true \
RATE_LIMIT_MAX_CONNECTIONS=10 \
RATE_LIMIT_MAX_CALLS=100 \
moonsurf
```

### Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `RATE_LIMIT_ENABLED` | Enable rate limiting | `true` (remote) |
| `RATE_LIMIT_MAX_CONNECTIONS` | Max connections per IP | `10` |
| `RATE_LIMIT_MAX_CALLS` | Max calls per minute per IP | `100` |

### Behavior

When rate limited:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 45

{"error": "Too many requests", "retryAfter": 45}
```

### Recommendations

- **API clients**: 50-100 calls/minute
- **Interactive use**: 100-200 calls/minute
- **Shared IP (NAT)**: Higher limits

## CORS Configuration

Controls which origins can access the server.

### Configuration

```bash
CORS_ENABLED=true \
CORS_ORIGINS=https://app.example.com,https://admin.example.com \
CORS_CREDENTIALS=true \
moonsurf
```

### Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ENABLED` | Enable CORS handling | `true` (remote) |
| `CORS_ORIGINS` | Allowed origins | Empty (all allowed) |
| `CORS_CREDENTIALS` | Allow credentials | `true` |

### Recommendations

- **Specify origins** in production
- **Avoid wildcards** for sensitive deployments
- **Enable credentials** only if needed

### Example

Restrict to specific applications:
```bash
CORS_ORIGINS=https://claude.ai,https://cursor.sh
```

## Audit Logging

Track security-relevant events for compliance and forensics.

### Configuration

```bash
AUDIT_LOG_ENABLED=true moonsurf
```

### Logged Events

| Event | Description |
|-------|-------------|
| `SSE_CONNECTED` | Client connected |
| `SSE_DISCONNECTED` | Client disconnected |
| `AUTH_FAILED` | Authentication failure |
| `RATE_LIMITED` | Client rate limited |
| `MCP_REQUEST` | MCP method called |
| `EXTENSION_REGISTERED` | Browser extension connected |
| `TASK_SUBMITTED` | Task created |
| `TASK_CANCELLED` | Task cancelled |

### Log Format

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "action": "AUTH_FAILED",
  "ip": "1.2.3.4",
  "path": "/sse"
}
```

### Log Collection

Send logs to a log aggregation service:

```bash
# With Docker
docker run moonsurf 2>&1 | tee /var/log/moonsurf/audit.log

# With systemd
StandardOutput=append:/var/log/moonsurf/stdout.log
StandardError=append:/var/log/moonsurf/stderr.log
```

## Network Security

### Firewall Configuration

Only expose the HTTP port:

```bash
# UFW (Ubuntu)
ufw allow 3300/tcp
ufw deny 3301:3399/tcp  # Block WebSocket ports
ufw deny 3400/tcp       # Block task WebSocket

# iptables
iptables -A INPUT -p tcp --dport 3300 -j ACCEPT
```

### WebSocket Ports

WebSocket ports (3301-3399) should **never** be exposed:
- They're for localhost browser communication only
- No authentication on these ports
- Exposing them is a security risk

### Reverse Proxy

Always use a reverse proxy in production:

```
Internet ──► Nginx/Caddy ──► Moonsurf (localhost)
                 │
                 └── TLS termination
                 └── Additional security headers
                 └── Request filtering
```

## Secure Headers

Configure your reverse proxy to add security headers:

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## Token Security

### Token Generation

Use cryptographically secure tokens:

```bash
# 32-byte hex (64 characters)
openssl rand -hex 32

# Or with Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Token Storage

- Use environment variables or secrets management
- Never commit tokens to version control
- Rotate tokens periodically

### Token Rotation

Zero-downtime rotation:

1. Add new token: `AUTH_TOKENS=old-token,new-token`
2. Update clients to use new token
3. Remove old token: `AUTH_TOKENS=new-token`

## Docker Security

### Non-root User

```dockerfile
FROM node:20-slim

# Create non-root user
RUN useradd -m moonsurf
USER moonsurf

# Install and run
RUN npm install -g @moonsurf/browser-control
CMD ["moonsurf"]
```

### Read-only Filesystem

```yaml
services:
  moonsurf:
    image: moonsurf
    read_only: true
    tmpfs:
      - /tmp
```

### Resource Limits

```yaml
services:
  moonsurf:
    image: moonsurf
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

## Monitoring and Alerting

### Health Check Monitoring

```bash
# Simple health check
curl -f http://localhost:3300/health || exit 1

# With expected response
curl -s http://localhost:3300/health | jq -e '.status == "ok"'
```

### Alert Conditions

Monitor for:
- Authentication failures spike
- Rate limiting triggers
- Unusual connection patterns
- Server errors

### Prometheus Metrics

Health endpoint provides basic metrics:
```json
{
  "connectedInstances": 5,
  "sseClients": 10
}
```

## Security Checklist

### Pre-deployment

- [ ] Strong, unique authentication tokens generated
- [ ] TLS enabled (direct or via proxy)
- [ ] Rate limiting configured appropriately
- [ ] CORS origins restricted
- [ ] Firewall rules configured
- [ ] Audit logging enabled

### Operations

- [ ] Token rotation schedule established
- [ ] Log aggregation configured
- [ ] Alerting set up for security events
- [ ] Regular security reviews planned
- [ ] Incident response plan documented

### Development

- [ ] Tokens never committed to version control
- [ ] Development uses different tokens than production
- [ ] Security testing included in CI/CD

## Production Configuration Example

```bash
# Server
REMOTE_MODE=true
PORT=3300
PUBLIC_URL=https://mcp.example.com

# Authentication
AUTH_ENABLED=true
AUTH_TOKENS=prod-token-claude-abc123,prod-token-api-xyz789

# TLS (if not using proxy)
TLS_ENABLED=true
TLS_CERT_PATH=/etc/letsencrypt/live/mcp.example.com/fullchain.pem
TLS_KEY_PATH=/etc/letsencrypt/live/mcp.example.com/privkey.pem

# Security
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_CALLS=50
CORS_ENABLED=true
CORS_ORIGINS=https://claude.ai,https://app.example.com
AUDIT_LOG_ENABLED=true

# Browser
BROWSER_DEFAULT_MODE=chromium
HEADLESS_DEFAULT=true

# Logging
LOG_LEVEL=info
```

## Related

- [Authentication](authentication.md) - Token configuration
- [TLS Setup](tls-setup.md) - HTTPS configuration
- [Remote Mode](remote-mode.md) - Production deployment
