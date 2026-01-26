# browser_network

Control network and storage. Manage cookies, set custom headers, intercept requests, and access localStorage/sessionStorage.

## Actions

| Action | Description |
|--------|-------------|
| `get_cookies` | Get cookies |
| `set_cookie` | Set a cookie |
| `clear_cookies` | Clear cookies |
| `set_headers` | Set custom HTTP headers |
| `intercept` | Intercept network requests |
| `get_storage` | Get localStorage/sessionStorage values |
| `set_storage` | Set localStorage/sessionStorage values |
| `clear_storage` | Clear localStorage/sessionStorage |

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | One of the actions above |
| `instanceId` | string | No | Target browser instance |
| `tabId` | number | No | Target tab ID |
| `name` | string | For cookies | Cookie name |
| `value` | string | For cookies/storage | Cookie or storage value |
| `key` | string | For storage | Storage key |
| `url` | string | For cookies | Cookie URL |
| `urls` | string[] | For `get_cookies` | URLs to get cookies for |
| `domain` | string | For cookies | Cookie domain |
| `path` | string | For cookies | Cookie path |
| `secure` | boolean | For cookies | Secure flag |
| `httpOnly` | boolean | For cookies | HttpOnly flag |
| `sameSite` | string | For cookies | SameSite attribute: `Strict`, `Lax`, `None` |
| `expires` | number | For cookies | Expiration (Unix timestamp) |
| `headers` | object | For `set_headers` | Header key-value pairs |
| `enabled` | boolean | For `intercept` | Enable/disable interception |
| `patterns` | array | For `intercept` | URL patterns to intercept |
| `storageType` | string | For storage | `localStorage`, `sessionStorage`, or `all` |

## Action: get_cookies

Get cookies for the current page or specific URLs.

### Get All Cookies
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "get_cookies"
  }
}
```

### Get Cookies for Specific URLs
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "get_cookies",
    "urls": ["https://example.com", "https://api.example.com"]
  }
}
```

### Response
```json
{
  "cookies": [
    {
      "name": "session_id",
      "value": "abc123...",
      "domain": ".example.com",
      "path": "/",
      "secure": true,
      "httpOnly": true,
      "sameSite": "Lax",
      "expires": 1735689600
    }
  ]
}
```

## Action: set_cookie

Set a cookie.

### Basic Cookie
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "set_cookie",
    "name": "user_preference",
    "value": "dark_mode",
    "url": "https://example.com"
  }
}
```

### Secure Session Cookie
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "set_cookie",
    "name": "session_id",
    "value": "abc123xyz",
    "url": "https://example.com",
    "secure": true,
    "httpOnly": true,
    "sameSite": "Strict"
  }
}
```

### Cookie with Expiration
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "set_cookie",
    "name": "remember_me",
    "value": "user123",
    "url": "https://example.com",
    "domain": ".example.com",
    "path": "/",
    "expires": 1735689600
  }
}
```

### Response
```json
{
  "success": true,
  "cookie": {
    "name": "user_preference",
    "value": "dark_mode"
  }
}
```

## Action: clear_cookies

Clear cookies.

### Clear All Cookies
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "clear_cookies"
  }
}
```

### Clear Specific Domain
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "clear_cookies",
    "domain": "example.com"
  }
}
```

## Action: set_headers

Set custom HTTP headers for all requests.

### Set Authorization Header
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "set_headers",
    "headers": {
      "Authorization": "Bearer your-token-here"
    }
  }
}
```

### Set Multiple Headers
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "set_headers",
    "headers": {
      "Authorization": "Bearer token",
      "X-Custom-Header": "custom-value",
      "Accept-Language": "en-US"
    }
  }
}
```

### Clear Custom Headers
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "set_headers",
    "headers": {}
  }
}
```

## Action: intercept

Intercept and modify network requests.

### Enable Interception
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "intercept",
    "enabled": true,
    "patterns": [
      { "urlPattern": "*://*.example.com/*" }
    ]
  }
}
```

### Intercept Specific Resource Types
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "intercept",
    "enabled": true,
    "patterns": [
      { "urlPattern": "*", "resourceType": "Image" },
      { "urlPattern": "*", "resourceType": "Script" }
    ]
  }
}
```

### Disable Interception
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "intercept",
    "enabled": false
  }
}
```

## Action: get_storage

Get localStorage or sessionStorage values.

### Get All localStorage
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "get_storage",
    "storageType": "localStorage"
  }
}
```

### Get Specific Key
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "get_storage",
    "storageType": "localStorage",
    "key": "user_settings"
  }
}
```

### Get sessionStorage
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "get_storage",
    "storageType": "sessionStorage"
  }
}
```

### Response
```json
{
  "storage": {
    "user_settings": "{\"theme\":\"dark\"}",
    "last_visit": "2024-01-15"
  },
  "storageType": "localStorage"
}
```

## Action: set_storage

Set localStorage or sessionStorage values.

### Set localStorage Value
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "set_storage",
    "storageType": "localStorage",
    "key": "user_settings",
    "value": "{\"theme\":\"dark\",\"notifications\":true}"
  }
}
```

### Set sessionStorage Value
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "set_storage",
    "storageType": "sessionStorage",
    "key": "form_data",
    "value": "{\"step\":2}"
  }
}
```

## Action: clear_storage

Clear localStorage or sessionStorage.

### Clear All localStorage
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "clear_storage",
    "storageType": "localStorage"
  }
}
```

### Clear sessionStorage
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "clear_storage",
    "storageType": "sessionStorage"
  }
}
```

### Clear Both
```json
{
  "name": "browser_network",
  "arguments": {
    "action": "clear_storage",
    "storageType": "all"
  }
}
```

## Examples

### Persist Login Session
```json
// 1. Get current cookies
{ "name": "browser_network", "arguments": { "action": "get_cookies" }}

// 2. Save important cookie for later
// Response: { "cookies": [{ "name": "auth_token", "value": "xyz..." }] }

// 3. Later, restore the cookie
{ "name": "browser_network", "arguments": {
  "action": "set_cookie",
  "name": "auth_token",
  "value": "xyz...",
  "url": "https://example.com",
  "secure": true,
  "httpOnly": true
}}
```

### Clear All Session Data
```json
// 1. Clear cookies
{ "name": "browser_network", "arguments": { "action": "clear_cookies" }}

// 2. Clear storage
{ "name": "browser_network", "arguments": { "action": "clear_storage", "storageType": "all" }}

// 3. Reload page
{ "name": "browser_navigate", "arguments": { "action": "reload" }}
```

### Set API Authentication
```json
// Set auth header for all requests
{ "name": "browser_network", "arguments": {
  "action": "set_headers",
  "headers": {
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..."
  }
}}
```

### Block Images to Speed Up Loading
```json
// Intercept and block images
{ "name": "browser_network", "arguments": {
  "action": "intercept",
  "enabled": true,
  "patterns": [
    { "urlPattern": "*", "resourceType": "Image" }
  ]
}}
```

### Preserve User Preferences
```json
// 1. Get current preferences
{ "name": "browser_network", "arguments": {
  "action": "get_storage",
  "storageType": "localStorage",
  "key": "preferences"
}}

// 2. After clearing, restore preferences
{ "name": "browser_network", "arguments": {
  "action": "set_storage",
  "storageType": "localStorage",
  "key": "preferences",
  "value": "{\"theme\":\"dark\"}"
}}
```

## Cookie Attributes

| Attribute | Description |
|-----------|-------------|
| `name` | Cookie name |
| `value` | Cookie value |
| `domain` | Domain the cookie belongs to |
| `path` | URL path the cookie applies to |
| `secure` | Only send over HTTPS |
| `httpOnly` | Not accessible via JavaScript |
| `sameSite` | Cross-site request behavior |
| `expires` | Expiration time (Unix timestamp) |

## Notes

- Cookie operations may be restricted by browser security policies
- HttpOnly cookies can be set but not read via JavaScript
- Custom headers apply to all subsequent requests
- Storage operations are per-origin
- Intercepted requests can be blocked or modified

## Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Cannot set cookie" | Invalid cookie parameters | Check domain, path, and URL |
| "Storage not available" | Storage disabled or blocked | Check browser settings |

## Related

- [browser_execute](browser-execute.md) - JavaScript access to storage
- [browser_emulate](browser-emulate.md) - Network throttling
- [Network Interception Guide](../guides/network-interception.md)
