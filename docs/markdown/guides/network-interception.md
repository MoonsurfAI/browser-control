# Network Interception Guide

Monitor, intercept, and modify network requests for testing, debugging, and automation.

## Overview

Moonsurf's network tools allow you to:

- **Monitor** - See all requests and responses
- **Intercept** - Pause and inspect requests
- **Mock** - Return custom responses
- **Block** - Prevent certain requests
- **Modify** - Change requests/responses

## Basic Request Monitoring

### Enable Interception

```
browser_network
  action: "intercept"
  patterns: ["**/*"]
```

This captures all requests. Use specific patterns for targeted monitoring.

### View Captured Requests

```
browser_network
  action: "requests"
```

Returns:
```json
{
  "requests": [
    {
      "url": "https://api.example.com/users",
      "method": "GET",
      "status": 200,
      "type": "fetch",
      "timing": { "duration": 145 }
    },
    {
      "url": "https://example.com/image.png",
      "method": "GET",
      "status": 200,
      "type": "image"
    }
  ]
}
```

### Clear Request Log

```
browser_network
  action: "clear"
```

## Pattern Matching

### URL Patterns

```
# All API requests
browser_network action="intercept" patterns=["**/api/**"]

# Specific domain
browser_network action="intercept" patterns=["*://api.example.com/*"]

# Specific file types
browser_network action="intercept" patterns=["**/*.json"]

# Multiple patterns
browser_network action="intercept" patterns=["**/api/**", "**/*.js"]
```

### Pattern Syntax

| Pattern | Matches |
|---------|---------|
| `*` | Any characters except `/` |
| `**` | Any characters including `/` |
| `?` | Single character |
| `[abc]` | Character class |

Examples:
- `**/api/users` - Any URL ending in `/api/users`
- `https://*.example.com/*` - Any subdomain of example.com
- `**/*.{png,jpg,gif}` - Image files

## Mocking Responses

### Return Custom JSON

```
browser_network
  action: "intercept"
  patterns: ["**/api/users"]
  mock: {
    "status": 200,
    "headers": { "Content-Type": "application/json" },
    "body": "{\"users\": [{\"id\": 1, \"name\": \"Mock User\"}]}"
  }
```

### Return Error Response

```
browser_network
  action: "intercept"
  patterns: ["**/api/data"]
  mock: {
    "status": 500,
    "body": "{\"error\": \"Internal Server Error\"}"
  }
```

### Return Empty Response

```
browser_network
  action: "intercept"
  patterns: ["**/tracking/*"]
  mock: {
    "status": 204
  }
```

### Mock HTML Page

```
browser_network
  action: "intercept"
  patterns: ["**/page"]
  mock: {
    "status": 200,
    "headers": { "Content-Type": "text/html" },
    "body": "<html><body><h1>Mocked Page</h1></body></html>"
  }
```

## Blocking Requests

### Block Analytics

```
browser_network
  action: "intercept"
  patterns: ["**/google-analytics.com/**", "**/gtag/**"]
  block: true
```

### Block Ads

```
browser_network
  action: "intercept"
  patterns: ["**/ads/**", "**/adserver/**", "**/*.doubleclick.net/**"]
  block: true
```

### Block Images (Performance Testing)

```
browser_network
  action: "intercept"
  patterns: ["**/*.png", "**/*.jpg", "**/*.gif", "**/*.webp"]
  block: true
```

### Block External Scripts

```
browser_network
  action: "intercept"
  patterns: ["https://cdn.example.com/**"]
  block: true
```

## API Testing

### Verify API Calls

```
# Start monitoring
browser_network action="intercept" patterns=["**/api/**"]

# Perform action that calls API
browser_interact action="click" selector="#submit-form"

# Wait for request
browser_execute
  action: "evaluate"
  script: "await new Promise(r => setTimeout(r, 2000))"

# Check requests
browser_network action="requests"

# Verify expected API was called
# Check method, URL, and response status
```

### Test API Error Handling

```
# Mock error before user action
browser_network
  action: "intercept"
  patterns: ["**/api/submit"]
  mock: {
    "status": 400,
    "body": "{\"error\": \"Validation failed\"}"
  }

# Perform action
browser_interact action="click" selector="#submit"

# Verify error is handled in UI
browser_content action="extract" selector=".error-message"
```

### Test Slow Network

```
# Add delay to responses
browser_network
  action: "intercept"
  patterns: ["**/api/**"]
  delay: 3000  # 3 second delay
```

### Test Offline Mode

```
# Block all requests
browser_network
  action: "intercept"
  patterns: ["**/*"]
  block: true

# Verify offline handling
browser_content action="extract" selector=".offline-message"
```

## Request Inspection

### View Request Details

After capturing requests:

```
browser_network action="requests"
```

Each request includes:
- `url` - Full request URL
- `method` - HTTP method
- `status` - Response status code
- `type` - Resource type (document, script, fetch, etc.)
- `headers` - Request headers
- `timing` - Timing information

### Filter by Type

```
browser_execute
  action: "evaluate"
  script: |
    // Get requests from previous capture
    // Filter in your processing logic
    // Type can be: document, script, stylesheet, image, font, fetch, xhr
```

### Check for Specific Requests

```
# Verify tracking pixel was sent
browser_network action="requests"

# Look for request to tracking endpoint
# Check that conversion tracking fired
```

## Response Modification

### Modify Response Headers

```
browser_network
  action: "intercept"
  patterns: ["**/api/**"]
  modifyHeaders: {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-cache"
  }
```

### Inject CORS Headers

```
browser_network
  action: "intercept"
  patterns: ["**/external-api/**"]
  modifyHeaders: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  }
```

## Authentication Testing

### Test with Auth Token

```
# Intercept and add auth header
browser_network
  action: "intercept"
  patterns: ["**/api/**"]
  modifyHeaders: {
    "Authorization": "Bearer test-token-123"
  }
```

### Test Token Expiration

```
# Mock expired token response
browser_network
  action: "intercept"
  patterns: ["**/api/**"]
  mock: {
    "status": 401,
    "body": "{\"error\": \"Token expired\"}"
  }

# Verify refresh logic
```

## Performance Analysis

### Measure Request Timing

```
browser_network action="intercept" patterns=["**/*"]
browser_navigate action="goto" url="https://example.com"

# Get timing data
browser_network action="requests"

# Analyze timing information
# - Total requests
# - Slowest requests
# - Request waterfall
```

### Find Large Resources

```
browser_network action="requests"

# Filter for large responses
# Check content-length headers
# Identify optimization opportunities
```

### Check Caching

```
# Make request
browser_navigate action="goto" url="https://example.com"

# Check cache headers in responses
browser_network action="requests"

# Look for Cache-Control, ETag, Last-Modified
```

## Common Scenarios

### E2E Test with Mocked Backend

```
# Mock all API endpoints
browser_network
  action: "intercept"
  patterns: ["**/api/users"]
  mock: { "status": 200, "body": "[{\"id\":1,\"name\":\"Test\"}]" }

browser_network
  action: "intercept"
  patterns: ["**/api/products"]
  mock: { "status": 200, "body": "[{\"id\":1,\"price\":99}]" }

# Run UI tests with predictable data
browser_navigate action="goto" url="https://app.example.com"
```

### Debug Failed Requests

```
# Enable full monitoring
browser_network action="intercept" patterns=["**/*"]

# Reproduce the issue
browser_navigate action="goto" url="https://app.example.com"
browser_interact action="click" selector="#problematic-action"

# Check for failed requests
browser_network action="requests"

# Look for 4xx/5xx status codes
# Check request payloads
```

### Test Third-Party Integrations

```
# Mock third-party service
browser_network
  action: "intercept"
  patterns: ["**/api.stripe.com/**"]
  mock: {
    "status": 200,
    "body": "{\"id\": \"mock_payment_intent\"}"
  }

# Test payment flow with mocked Stripe
```

### Capture API Responses

```
# Monitor API calls
browser_network action="intercept" patterns=["**/api/**"]

# Trigger API call
browser_interact action="click" selector="#load-data"

# Get captured response
browser_network action="requests"

# Response body available in request log
```

## WebSocket Monitoring

WebSocket connections are tracked separately:

```
browser_network action="intercept" patterns=["wss://**"]

# WebSocket messages in request log
browser_network action="requests"
```

## Best Practices

### 1. Be Specific with Patterns

```
# Good - specific pattern
browser_network action="intercept" patterns=["**/api/users/*"]

# Avoid - too broad
browser_network action="intercept" patterns=["**/*"]
```

### 2. Clean Up After Tests

```
# Clear interception rules
browser_network action="clear"
```

### 3. Mock Realistically

```
# Include proper headers
browser_network
  action: "intercept"
  patterns: ["**/api/**"]
  mock: {
    "status": 200,
    "headers": {
      "Content-Type": "application/json",
      "X-Request-Id": "mock-123"
    },
    "body": "{...}"
  }
```

### 4. Test Edge Cases

```
# Empty responses
mock: { "status": 200, "body": "[]" }

# Malformed JSON
mock: { "status": 200, "body": "not json" }

# Slow responses
delay: 5000

# Timeouts
block: true
```

### 5. Document Mocked Endpoints

Keep track of what's mocked in tests for debugging.

## Troubleshooting

### Interception Not Working

1. Check pattern syntax
2. Verify interception is enabled before navigation
3. Check for HTTPS/HTTP mismatch

### Requests Still Going Through

1. Pattern may not match URL
2. Request may happen before interception enabled
3. Check for redirects

### Mock Not Returning

1. Verify JSON is valid
2. Check Content-Type header
3. Ensure pattern matches request URL

## Related

- [browser_network](../tools/browser-network.md) - Network tool reference
- [Testing Workflows](testing-workflows.md) - API testing patterns
- [Debugging Tips](debugging-tips.md) - Network debugging
