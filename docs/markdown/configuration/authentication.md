# Authentication

Moonsurf uses token-based authentication to secure access to the MCP server. This document covers authentication configuration and usage.

## Overview

Authentication is:
- **Disabled** by default in local mode
- **Enabled** by default in remote mode

When enabled, clients must provide a valid token to access protected endpoints.

## Enabling Authentication

### Basic Configuration

```bash
AUTH_ENABLED=true AUTH_TOKENS=your-secret-token moonsurf
```

### Multiple Tokens

Useful for different clients or token rotation:

```bash
AUTH_TOKENS=token-for-claude,token-for-cursor,token-for-api moonsurf
```

### With Remote Mode

Remote mode enables auth by default:

```bash
REMOTE_MODE=true AUTH_TOKENS=secret-token moonsurf
```

## Token Requirements

- Tokens can be any string
- No specific format required
- Recommend: Random strings, 32+ characters
- Example generation: `openssl rand -hex 32`

## Providing Tokens

Clients can provide tokens in two ways:

### 1. Authorization Header

```http
GET /sse HTTP/1.1
Authorization: Bearer your-secret-token
```

```http
POST /message?sessionId=xxx HTTP/1.1
Authorization: Bearer your-secret-token
Content-Type: application/json
```

### 2. Query Parameter

Useful for SSE connections that can't set headers:

```
GET /sse?token=your-secret-token
```

## Protected Endpoints

Authentication is required for:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/sse` | GET | SSE connection |
| `/message` | POST | MCP requests |
| `/register` | POST | Extension registration |
| `/instances` | GET | List browser instances |
| `/tasks` | GET | List tasks |
| `/tasks` | POST | Submit task |
| `/tasks/:id` | GET | Get task details |
| `/tasks/:id/cancel` | POST | Cancel task |

## Unprotected Endpoints

These endpoints don't require authentication:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Server health check |
| `/info` | GET | Server information |
| `/.well-known/oauth-authorization-server` | GET | OAuth metadata |
| `/oauth/*` | * | OAuth endpoints |

## Client Configuration

### Claude Code

```json
{
  "mcpServers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse?token=your-secret-token"
    }
  }
}
```

### Cursor

```json
{
  "mcp.servers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse?token=your-secret-token"
    }
  }
}
```

### Custom Client (JavaScript)

```javascript
// SSE connection with token
const eventSource = new EventSource(
  'http://localhost:3300/sse?token=your-secret-token'
);

// Or with header (using fetch for messages)
await fetch('http://localhost:3300/message?sessionId=xxx', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-secret-token'
  },
  body: JSON.stringify({...})
});
```

### Custom Client (Python)

```python
import requests

headers = {'Authorization': 'Bearer your-secret-token'}

# SSE connection
response = requests.get(
    'http://localhost:3300/sse',
    headers=headers,
    stream=True
)

# Or with query parameter
response = requests.get(
    'http://localhost:3300/sse?token=your-secret-token',
    stream=True
)
```

### cURL

```bash
# With header
curl -H "Authorization: Bearer your-secret-token" \
  http://localhost:3300/instances

# With query parameter
curl "http://localhost:3300/instances?token=your-secret-token"
```

## Authentication Failures

### Response

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{"error": "Authentication required"}
```

### Server Logs

```
[Auth] No token provided for /sse
[Auth] Invalid token for /message
```

### Audit Logs (if enabled)

```
[AUDIT] {"action":"AUTH_FAILED","ip":"1.2.3.4","path":"/sse"}
```

## Token Rotation

To rotate tokens with zero downtime:

1. Add new token to the list:
   ```bash
   AUTH_TOKENS=old-token,new-token moonsurf
   ```

2. Update all clients to use new token

3. Remove old token:
   ```bash
   AUTH_TOKENS=new-token moonsurf
   ```

## Security Best Practices

### Token Generation

Use cryptographically secure random tokens:

```bash
# Generate a 32-byte hex token
openssl rand -hex 32

# Generate a base64 token
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Token Storage

- Store tokens in environment variables, not code
- Use secrets management (AWS Secrets Manager, HashiCorp Vault, etc.)
- Never commit tokens to version control

### Token Scope

Consider using different tokens for:
- Different clients (Claude, Cursor, API)
- Different environments (dev, staging, prod)
- Different permission levels (if implementing custom authorization)

### HTTPS

Always use TLS when transmitting tokens:

```bash
TLS_ENABLED=true \
TLS_CERT_PATH=/path/to/cert.pem \
TLS_KEY_PATH=/path/to/key.pem \
AUTH_TOKENS=secret-token \
moonsurf
```

### Token Expiration

Moonsurf doesn't have built-in token expiration. Implement rotation policies:
- Rotate tokens regularly (monthly, quarterly)
- Rotate immediately if compromised
- Keep token list minimal

## Troubleshooting

### "Authentication enabled but no tokens configured"

```bash
# Must provide tokens when auth is enabled
AUTH_ENABLED=true AUTH_TOKENS=your-token moonsurf
```

### "Authentication required" error

Check:
1. Token is being sent correctly
2. Token matches one in `AUTH_TOKENS`
3. Using correct header format (`Bearer ` prefix)

### Token not working

Verify token exactly matches:
```bash
# Check configured tokens
echo $AUTH_TOKENS

# Test with curl
curl -v -H "Authorization: Bearer your-token" http://localhost:3300/instances
```

## Related

- [Remote Mode](remote-mode.md) - Production configuration
- [TLS Setup](tls-setup.md) - Secure transport
- [Security Hardening](security-hardening.md) - Additional security measures
