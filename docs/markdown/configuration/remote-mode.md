# Remote Mode

Remote mode enables Moonsurf to accept connections from external clients. This is used for production deployments where AI clients connect over the network.

## Enabling Remote Mode

```bash
REMOTE_MODE=true moonsurf
```

This changes default settings to be more secure:

| Setting | Local Default | Remote Default |
|---------|---------------|----------------|
| `HOST` | `localhost` | `0.0.0.0` |
| `AUTH_ENABLED` | `false` | `true` |
| `CORS_ENABLED` | `false` | `true` |
| `RATE_LIMIT_ENABLED` | `false` | `true` |
| `AUDIT_LOG_ENABLED` | `false` | `true` |
| `HEADLESS_DEFAULT` | `false` | `true` |

## Minimum Remote Configuration

You must provide authentication tokens:

```bash
REMOTE_MODE=true AUTH_TOKENS=your-secret-token moonsurf
```

Without tokens, the server will error on startup.

## Recommended Production Configuration

```bash
REMOTE_MODE=true \
AUTH_TOKENS=token-for-claude,token-for-cursor \
TLS_ENABLED=true \
TLS_CERT_PATH=/path/to/cert.pem \
TLS_KEY_PATH=/path/to/key.pem \
CORS_ORIGINS=https://your-app.com \
RATE_LIMIT_MAX_CALLS=50 \
moonsurf
```

## Public URL

When behind a proxy or load balancer, set the public URL:

```bash
REMOTE_MODE=true \
PUBLIC_URL=https://mcp.example.com \
AUTH_TOKENS=secret-token \
moonsurf
```

The public URL is used for:
- SSE endpoint announcements
- Client configuration
- OAuth endpoints

## Architecture Considerations

### WebSocket Locality

Browser extension WebSockets always connect to `localhost`:

```
┌──────────────────────────────────────────────────────┐
│                     Server Host                       │
│                                                       │
│   ┌─────────────────┐    ┌────────────────────────┐  │
│   │   MCP Server    │    │     Browser Process    │  │
│   │                 │    │                        │  │
│   │  HTTP :3300     │◄───│     Extension ─────────│  │
│   │  (0.0.0.0)      │    │    ws://localhost:3301 │  │
│   │                 │    │                        │  │
│   └────────┬────────┘    └────────────────────────┘  │
│            │                                          │
└────────────┼──────────────────────────────────────────┘
             │ External Network
             │
        AI Client (Remote)
```

This means:
- Browsers must run on the same host as the MCP server
- AI clients can connect remotely
- WebSocket ports (3301-3399) don't need external exposure

### Firewall Configuration

Only the HTTP port needs to be accessible:

```bash
# Allow HTTP/HTTPS port
ufw allow 3300/tcp

# WebSocket ports stay local - no firewall rule needed
```

## Using a Reverse Proxy

### Nginx Configuration

```nginx
upstream moonsurf {
    server 127.0.0.1:3300;
}

server {
    listen 443 ssl http2;
    server_name mcp.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://moonsurf;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE specific settings
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

Then run Moonsurf without TLS (proxy handles it):

```bash
REMOTE_MODE=true \
PUBLIC_URL=https://mcp.example.com \
AUTH_TOKENS=secret-token \
TLS_ENABLED=false \
moonsurf
```

### Caddy Configuration

```
mcp.example.com {
    reverse_proxy localhost:3300
}
```

Caddy automatically handles TLS.

## Docker Deployment

```dockerfile
FROM node:20-slim

# Install Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Moonsurf
RUN npm install -g @moonsurf/browser-control

# Configure
ENV PORT=3300
ENV HOST=0.0.0.0
ENV REMOTE_MODE=true
ENV BROWSER_DEFAULT_MODE=chromium
ENV HEADLESS_DEFAULT=true

EXPOSE 3300

CMD ["moonsurf"]
```

Run with:
```bash
docker run -p 3300:3300 -e AUTH_TOKENS=your-token moonsurf
```

## Client Configuration

### Claude Code

```json
{
  "mcpServers": {
    "moonsurf": {
      "url": "https://mcp.example.com/sse?token=your-token"
    }
  }
}
```

### Custom Client

```javascript
const eventSource = new EventSource(
  'https://mcp.example.com/sse?token=your-token'
);
```

## Monitoring

### Health Check

```bash
curl https://mcp.example.com/health
```

Response:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "connectedInstances": 2,
  "sseClients": 5,
  "auth": "enabled",
  "tls": "enabled",
  "rateLimit": "enabled"
}
```

### Audit Logs

With `AUDIT_LOG_ENABLED=true`, security events are logged:

```
[AUDIT] {"timestamp":"2024-01-15T10:30:00Z","action":"SSE_CONNECTED","sessionId":"abc...","ip":"1.2.3.4"}
[AUDIT] {"timestamp":"2024-01-15T10:30:01Z","action":"MCP_REQUEST","method":"tools/call","ip":"1.2.3.4"}
[AUDIT] {"timestamp":"2024-01-15T10:30:05Z","action":"AUTH_FAILED","ip":"5.6.7.8"}
```

## Security Checklist

- [ ] Authentication enabled (`AUTH_ENABLED=true`)
- [ ] Strong tokens configured (`AUTH_TOKENS`)
- [ ] TLS enabled (direct or via proxy)
- [ ] Rate limiting configured
- [ ] CORS origins restricted
- [ ] Audit logging enabled
- [ ] Firewall configured (only HTTP port exposed)
- [ ] Regular token rotation planned

## Troubleshooting

### "Authentication enabled but no tokens configured"

You must provide tokens in remote mode:
```bash
AUTH_TOKENS=secret-token moonsurf
```

### "Connection refused from remote client"

Check:
1. HOST is `0.0.0.0` or the correct interface
2. Firewall allows the port
3. Client is using correct URL

### "SSE connection drops"

For long-lived SSE connections behind a proxy:
- Increase proxy timeouts
- Disable proxy buffering
- Check keep-alive settings

## Related

- [Environment Variables](environment-variables.md) - All configuration options
- [Authentication](authentication.md) - Token configuration
- [TLS Setup](tls-setup.md) - HTTPS configuration
- [Security Hardening](security-hardening.md) - Additional security measures
