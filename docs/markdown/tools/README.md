# Tools Reference

Moonsurf provides 10 consolidated MCP tools for browser automation. This design reduces the number of tools AI agents need to understand while providing full functionality.

## Design Philosophy

Traditional browser automation libraries expose 50+ individual methods:
```
click(), type(), navigate(), reload(), goBack(), goForward(),
screenshot(), pdf(), getCookies(), setCookie(), ...
```

Moonsurf consolidates these into 10 unified tools with `action` parameters:
```
browser_instance   action: list | new | close | profiles
browser_tab        action: list | new | close | close_others | activate
browser_navigate   action: goto | reload | back | forward | wait
browser_content    action: screenshot | pdf | get | query | attribute | get_viewport_dom
browser_interact   action: click | move | type | press | scroll | hover | select | upload
browser_execute    (no action - direct JavaScript execution)
browser_network    action: get_cookies | set_cookie | clear_cookies | set_headers | intercept | get_storage | set_storage | clear_storage
browser_emulate    action: viewport | user_agent | geolocation | timezone | device | offline | throttle
browser_debug      action: dialog | console | performance | trace_start | trace_stop | downloads | download_wait
sleep              (no action - wait for a specified duration)
```

**Benefits:**
- Reduced context window usage
- Easier for AI to understand the tool landscape
- Consistent parameter patterns across tools
- Natural language mapping (action names are descriptive)

## Tools at a Glance

| Tool | Purpose | Actions |
|------|---------|---------|
| [browser_instance](browser-instance.md) | Manage browser instances | list, new, close, profiles |
| [browser_tab](browser-tab.md) | Tab management | list, new, close, close_others, activate |
| [browser_navigate](browser-navigate.md) | Navigation and waiting | goto, reload, back, forward, wait |
| [browser_content](browser-content.md) | Content extraction | screenshot, pdf, get, query, attribute, get_viewport_dom |
| [browser_interact](browser-interact.md) | User input simulation | click, move, type, press, scroll, hover, select, upload |
| [browser_execute](browser-execute.md) | JavaScript execution | (none) |
| [browser_network](browser-network.md) | Network and storage | get_cookies, set_cookie, clear_cookies, set_headers, intercept, get_storage, set_storage, clear_storage |
| [browser_emulate](browser-emulate.md) | Device emulation | viewport, user_agent, geolocation, timezone, device, offline, throttle |
| [browser_debug](browser-debug.md) | Debugging tools | dialog, console, performance, trace_start, trace_stop, downloads, download_wait |
| [sleep](sleep.md) | Wait/delay | (none) |

## Common Parameters

Most tools share these parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `action` | string | The specific operation to perform |
| `instanceId` | string | Target browser instance (optional - uses first if not specified) |
| `tabId` | number | Target tab ID (optional - uses active tab if not specified) |

## Quick Reference

### Launch a Browser
```json
{ "name": "browser_instance", "arguments": { "action": "new", "mode": "chromium" } }
```

### Navigate to URL
```json
{ "name": "browser_navigate", "arguments": { "action": "goto", "url": "https://example.com" } }
```

### Click an Element
```json
{ "name": "browser_interact", "arguments": { "action": "click", "selector": "#button" } }
```

### Type Text
```json
{ "name": "browser_interact", "arguments": { "action": "type", "selector": "#input", "text": "Hello" } }
```

### Take Screenshot
```json
{ "name": "browser_content", "arguments": { "action": "screenshot" } }
```

### Execute JavaScript
```json
{ "name": "browser_execute", "arguments": { "expression": "document.title" } }
```

### Close Browser
```json
{ "name": "browser_instance", "arguments": { "action": "close", "instanceId": "inst_xxx" } }
```

## Using tools via REST API

All tools can be called directly via HTTP without the MCP protocol. Send a POST request to `/api/tools/{toolName}` with the arguments as JSON body:

```bash
# Launch a browser
curl -X POST http://localhost:3300/api/tools/browser_instance \
  -H "Content-Type: application/json" \
  -d '{"action": "new", "mode": "testing"}'

# Navigate to URL
curl -X POST http://localhost:3300/api/tools/browser_navigate \
  -H "Content-Type: application/json" \
  -d '{"action": "goto", "instanceId": "inst_xxx", "url": "https://example.com"}'

# Click an element
curl -X POST http://localhost:3300/api/tools/browser_interact \
  -H "Content-Type: application/json" \
  -d '{"action": "click", "instanceId": "inst_xxx", "selector": "#button"}'

# Execute JavaScript
curl -X POST http://localhost:3300/api/tools/browser_execute \
  -H "Content-Type: application/json" \
  -d '{"instanceId": "inst_xxx", "expression": "document.title"}'
```

REST API responses use a clean format:
```json
{
  "success": true,
  "result": { "value": "Example Domain", "tabId": 12345 }
}
```

For the full reference, see [REST Tools API](../api-reference/rest-api.md).

## Selector Syntax

Most interaction tools accept CSS selectors with extensions:

| Selector Type | Example | Description |
|---------------|---------|-------------|
| CSS ID | `#login-button` | Element with ID |
| CSS Class | `.btn-primary` | Element with class |
| CSS Attribute | `[data-testid="submit"]` | Element with attribute |
| Tag | `button` | Element by tag name |
| Text | `text=Sign In` | Element containing exact text |
| Has Text | `button:has-text(Submit)` | Element containing text |
| Nth | `li:nth-child(2)` | Positional selector |

## Error Handling

Tool errors are returned in a consistent format:

```json
{
  "content": [{
    "type": "text",
    "text": "{\"error\":{\"code\":\"ELEMENT_NOT_FOUND\",\"message\":\"No element matches selector: #nonexistent\"}}"
  }],
  "isError": true
}
```

Common error codes:
- `NO_INSTANCE` - Browser instance not found
- `NOT_CONNECTED` - Instance WebSocket not connected
- `ELEMENT_NOT_FOUND` - Selector didn't match any element
- `TIMEOUT` - Operation timed out
- `TOOL_ERROR` - General tool error

## Tool Categories

### Lifecycle Tools
- `browser_instance` - Manage browser processes

### Navigation Tools
- `browser_tab` - Manage browser tabs
- `browser_navigate` - Page navigation

### Interaction Tools
- `browser_interact` - User input simulation
- `browser_execute` - JavaScript execution

### Content Tools
- `browser_content` - Extract page content

### State Tools
- `browser_network` - Cookies, headers, storage
- `browser_emulate` - Device and network emulation

### Debug Tools
- `browser_debug` - Debugging and monitoring

### Utility Tools
- `sleep` - Wait for a specified duration

## Next Steps

- [browser_instance](browser-instance.md) - Start with browser management
- [browser_interact](browser-interact.md) - Learn interaction patterns
- [Guides](../guides/README.md) - Common automation patterns
