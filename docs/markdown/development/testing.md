# Testing

Guide to testing Moonsurf during development.

## Overview

Moonsurf testing includes:
- Manual API testing with curl
- Integration testing with real browsers
- Automated test suites (when available)

## Manual Testing

### Health Check

```bash
curl http://localhost:3300/health
```

Expected:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "connectedInstances": 0,
  "sseClients": 0
}
```

### Server Info

```bash
curl http://localhost:3300/info
```

### List Tools

```bash
curl -X POST http://localhost:3300/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Launch Browser

```bash
curl -X POST http://localhost:3300/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"tools/call",
    "params":{
      "name":"browser_instance",
      "arguments":{"action":"launch"}
    }
  }'
```

### Navigate to URL

```bash
curl -X POST http://localhost:3300/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"browser_navigate",
      "arguments":{"action":"goto","url":"https://example.com"}
    }
  }'
```

### Take Screenshot

```bash
curl -X POST http://localhost:3300/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":3,
    "method":"tools/call",
    "params":{
      "name":"browser_content",
      "arguments":{"action":"screenshot"}
    }
  }'
```

### List Instances

```bash
curl http://localhost:3300/instances
```

### Close Browser

```bash
curl -X POST http://localhost:3300/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":4,
    "method":"tools/call",
    "params":{
      "name":"browser_instance",
      "arguments":{"action":"close"}
    }
  }'
```

## SSE Testing

### Connect to SSE

```bash
curl -N http://localhost:3300/sse
```

The `-N` flag disables buffering for real-time output.

### Expected Output

```
event: endpoint
data: http://localhost:3300/message?sessionId=abc123-def456
```

## WebSocket Testing

### Using wscat

Install wscat:
```bash
npm install -g wscat
```

Connect:
```bash
wscat -c ws://localhost:3400
```

### Submit Task

```json
{
  "type": "task_submit",
  "task_name": "Test Task",
  "commands": [
    {"tool_name": "browser_navigate", "args": {"action": "goto", "url": "https://example.com"}}
  ]
}
```

### List Tasks

```json
{"type": "task_list"}
```

## Testing with Different Browser Modes

### Chromium

```bash
BROWSER_DEFAULT_MODE=chromium npm start
```

### Chrome for Testing

```bash
BROWSER_DEFAULT_MODE=testing npm start
```

### System Chrome

```bash
BROWSER_DEFAULT_MODE=chrome npm start
```

## Testing Authentication

### Enable Auth

```bash
AUTH_ENABLED=true AUTH_TOKENS=test-token npm start
```

### Test Without Token

```bash
curl http://localhost:3300/instances
# Expected: 401 Unauthorized
```

### Test With Token

```bash
curl -H "Authorization: Bearer test-token" http://localhost:3300/instances
# Expected: 200 OK
```

### Token in URL

```bash
curl "http://localhost:3300/instances?token=test-token"
# Expected: 200 OK
```

## Testing Rate Limiting

### Enable Rate Limiting

```bash
RATE_LIMIT_ENABLED=true RATE_LIMIT_MAX_CALLS=5 npm start
```

### Trigger Rate Limit

```bash
# Send many requests quickly
for i in {1..10}; do
  curl http://localhost:3300/instances
done

# Eventually returns 429 Too Many Requests
```

## Testing TLS

### Generate Self-Signed Certificate

```bash
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/CN=localhost"
```

### Start with TLS

```bash
TLS_ENABLED=true \
TLS_CERT_PATH=./cert.pem \
TLS_KEY_PATH=./key.pem \
npm start
```

### Test HTTPS

```bash
curl -k https://localhost:3300/health
```

The `-k` flag accepts self-signed certificates.

## Testing Task Execution

### Start Server with Tasks

```bash
TASKS_ENABLED=true npm start
```

### Submit Task via REST

```bash
curl -X POST http://localhost:3300/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "E2E Test",
    "commands": [
      {"tool_name": "browser_instance", "args": {"action": "launch"}},
      {"tool_name": "browser_navigate", "args": {"action": "goto", "url": "https://example.com"}},
      {"tool_name": "browser_content", "args": {"action": "screenshot"}},
      {"tool_name": "browser_instance", "args": {"action": "close"}}
    ]
  }'
```

### Check Task Status

```bash
curl http://localhost:3300/tasks/<taskId>
```

## Integration Test Script

Create a test script `test.sh`:

```bash
#!/bin/bash
set -e

BASE_URL="http://localhost:3300"

echo "Testing health endpoint..."
curl -s "$BASE_URL/health" | jq .

echo "Testing tool listing..."
TOOLS=$(curl -s -X POST "$BASE_URL/message" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}')
echo "$TOOLS" | jq '.result.tools | length'

echo "Launching browser..."
LAUNCH=$(curl -s -X POST "$BASE_URL/message" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":2,"method":"tools/call",
    "params":{"name":"browser_instance","arguments":{"action":"launch"}}
  }')
echo "$LAUNCH" | jq .

echo "Navigating to example.com..."
curl -s -X POST "$BASE_URL/message" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":3,"method":"tools/call",
    "params":{"name":"browser_navigate","arguments":{"action":"goto","url":"https://example.com"}}
  }' | jq .

echo "Taking screenshot..."
curl -s -X POST "$BASE_URL/message" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":4,"method":"tools/call",
    "params":{"name":"browser_content","arguments":{"action":"screenshot"}}
  }' | jq '.result.content[0].text | length'

echo "Closing browser..."
curl -s -X POST "$BASE_URL/message" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":5,"method":"tools/call",
    "params":{"name":"browser_instance","arguments":{"action":"close"}}
  }' | jq .

echo "All tests passed!"
```

Run:
```bash
chmod +x test.sh
./test.sh
```

## Testing with Claude Code

### Install Skill

```bash
npm start -- --install-skill
```

### Configure MCP

```json
{
  "mcpServers": {
    "moonsurf-dev": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

### Test in Claude

```bash
claude "Launch a browser, go to example.com, take a screenshot, and close the browser"
```

## Debugging Test Failures

### Enable Debug Logging

```bash
LOG_LEVEL=debug npm start
```

### Check Server Output

Watch for:
- Registration messages
- WebSocket connections
- Tool call details
- Error messages

### Browser Console

If browser is visible:
1. Open DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

### Extension Logs

1. Go to `chrome://extensions`
2. Find Moonsurf extension
3. Click "Service worker" to open DevTools

## Test Checklist

### Basic Functionality

- [ ] Health endpoint responds
- [ ] Info endpoint shows configuration
- [ ] Tools list returns 9 tools
- [ ] Browser launches successfully
- [ ] Navigation works
- [ ] Screenshots capture correctly
- [ ] Browser closes cleanly

### Authentication

- [ ] Requests fail without token
- [ ] Requests succeed with valid token
- [ ] Token works in header
- [ ] Token works in URL parameter

### Tasks

- [ ] Task submission works
- [ ] Task progress updates received
- [ ] Task completion reported
- [ ] Task cancellation works

### Multiple Instances

- [ ] Can launch multiple browsers
- [ ] Correct instance receives commands
- [ ] Close specific instance works
- [ ] Close all instances works

## Related

- [Local Setup](local-setup.md) - Development environment
- [Debugging](debugging.md) - Troubleshooting
- [CI/CD](../integration/ci-cd.md) - Automated testing
