---
name: moonsurf-browser
description: Control web browsers using Moonsurf MCP tools. Use when the user wants to automate browsers, navigate websites, take screenshots, fill forms, click elements, scrape content, or perform any web automation task.
---

# Moonsurf Browser Automation

This skill teaches you how to use the Moonsurf Browser MCP server to automate web browsers. Moonsurf provides 9 consolidated tools optimized for AI agents.

## Quick Start Workflow

1. **Launch a browser** with `browser_instance` action `new`
2. **Navigate** with `browser_navigate` action `goto`
3. **Interact** with `browser_interact` (click, type, scroll)
4. **Extract content** with `browser_content` (screenshot, get, query)
5. **Close** with `browser_instance` action `close` when done

## The 9 Tools

| Tool | Purpose |
|------|---------|
| `browser_instance` | Launch, list, and close browser instances |
| `browser_tab` | Manage tabs (open, close, switch) |
| `browser_navigate` | Navigate URLs and wait for conditions |
| `browser_content` | Screenshots, PDFs, DOM extraction |
| `browser_interact` | Click, type, scroll, hover, select |
| `browser_execute` | Run JavaScript in page context |
| `browser_network` | Cookies, storage, headers |
| `browser_emulate` | Device/viewport emulation |
| `browser_debug` | Console logs, dialogs, downloads |

## Tool Reference

### browser_instance

Manage browser instances.

**Actions:**
- `list` - Show all connected browser instances
- `new` - Launch a new browser
- `close` - Terminate a browser instance (requires `instanceId`)
- `profiles` - List available Chrome profiles

**Key Parameters:**
- `mode`: `chromium` (default, recommended), `chrome` (use existing profiles), `testing` (clean slate)
- `url`: Initial URL to open
- `headless`: Run without visible window (chromium only)
- `profile`: Chrome profile name (chrome mode only)

**Examples:**

```json
// Launch browser and go to a URL
{
  "action": "new",
  "url": "https://google.com",
  "mode": "chromium"
}

// Launch headless browser
{
  "action": "new",
  "headless": true
}

// List all browser instances
{
  "action": "list"
}

// Close a specific instance
{
  "action": "close",
  "instanceId": "abc123"
}
```

### browser_tab

Manage browser tabs within an instance.

**Actions:**
- `list` - List all tabs
- `new` - Open a new tab
- `close` - Close a specific tab
- `close_others` - Close all tabs except one
- `activate` - Focus a tab

**Examples:**

```json
// Open new tab with URL
{
  "action": "new",
  "instanceId": "abc123",
  "url": "https://example.com"
}

// List all tabs
{
  "action": "list",
  "instanceId": "abc123"
}

// Close a tab
{
  "action": "close",
  "instanceId": "abc123",
  "tabId": 456
}

// Switch to a tab
{
  "action": "activate",
  "instanceId": "abc123",
  "tabId": 456
}
```

### browser_navigate

Navigate pages and wait for conditions.

**Actions:**
- `goto` - Navigate to a URL
- `reload` - Reload the current page
- `back` - Go back in history
- `forward` - Go forward in history
- `wait` - Wait for a selector or condition

**Key Parameters:**
- `url`: Target URL (for goto)
- `waitUntil`: `load` or `domcontentloaded`
- `selector`: CSS selector to wait for
- `expression`: JavaScript expression that must return truthy
- `timeout`: Wait timeout in milliseconds

**Examples:**

```json
// Navigate to URL
{
  "action": "goto",
  "instanceId": "abc123",
  "url": "https://example.com"
}

// Navigate and wait for DOM ready
{
  "action": "goto",
  "instanceId": "abc123",
  "url": "https://example.com",
  "waitUntil": "domcontentloaded"
}

// Wait for an element to appear
{
  "action": "wait",
  "instanceId": "abc123",
  "selector": "#login-form",
  "timeout": 10000
}

// Wait for a JavaScript condition
{
  "action": "wait",
  "instanceId": "abc123",
  "expression": "window.dataLoaded === true"
}

// Reload without cache
{
  "action": "reload",
  "instanceId": "abc123",
  "ignoreCache": true
}
```

### browser_content

Extract content from pages.

**Actions:**
- `screenshot` - Capture the page as an image
- `pdf` - Generate a PDF
- `get` - Get page HTML or text
- `query` - Find elements by CSS selector
- `attribute` - Get an element's attribute value

**Key Parameters:**
- `format`: `png`/`jpeg`/`webp` (screenshot) or `html`/`text` (get)
- `fullPage`: Capture entire scrollable page
- `selector`: CSS selector for targeting elements
- `attribute`: Attribute name to retrieve

**Examples:**

```json
// Take a screenshot
{
  "action": "screenshot",
  "instanceId": "abc123",
  "format": "png"
}

// Full page screenshot
{
  "action": "screenshot",
  "instanceId": "abc123",
  "fullPage": true
}

// Get page text content
{
  "action": "get",
  "instanceId": "abc123",
  "format": "text"
}

// Get HTML of a specific element
{
  "action": "get",
  "instanceId": "abc123",
  "selector": "#main-content",
  "format": "html"
}

// Find all links on page
{
  "action": "query",
  "instanceId": "abc123",
  "selector": "a[href]"
}

// Get href attribute of a link
{
  "action": "attribute",
  "instanceId": "abc123",
  "selector": "a.download-link",
  "attribute": "href"
}

// Generate PDF
{
  "action": "pdf",
  "instanceId": "abc123",
  "printBackground": true
}
```

### browser_interact

Simulate user interactions. **Typing uses human-like speed (100-200 WPM) by default.**

**Actions:**
- `click` - Click an element or coordinates
- `type` - Type text into an input
- `press` - Press a keyboard key
- `scroll` - Scroll the page
- `hover` - Hover over an element
- `select` - Select dropdown option
- `upload` - Upload files
- `move` - Move mouse to coordinates

**Selector Formats:**
- CSS selector: `#id`, `.class`, `input[name="email"]`
- Text content: `text=Submit`
- Contains text: `button:has-text(Login)`

**Key Parameters:**
- `selector`: Target element
- `text`: Text to type
- `key`: Key to press (Enter, Tab, Escape, etc.)
- `delay`: Custom typing delay (omit for human-like, 0 for instant)
- `deltaX`/`deltaY`: Scroll amounts
- `ctrl`/`alt`/`shift`/`meta`: Modifier keys

**Examples:**

```json
// Click a button
{
  "action": "click",
  "instanceId": "abc123",
  "selector": "button[type='submit']"
}

// Click by text content
{
  "action": "click",
  "instanceId": "abc123",
  "selector": "text=Sign In"
}

// Type into input (human-like speed)
{
  "action": "type",
  "instanceId": "abc123",
  "selector": "input[name='email']",
  "text": "user@example.com"
}

// Type instantly (no delay)
{
  "action": "type",
  "instanceId": "abc123",
  "selector": "input[name='search']",
  "text": "search query",
  "delay": 0
}

// Press Enter key
{
  "action": "press",
  "instanceId": "abc123",
  "key": "Enter"
}

// Keyboard shortcut (Ctrl+A)
{
  "action": "press",
  "instanceId": "abc123",
  "key": "a",
  "ctrl": true
}

// Scroll down
{
  "action": "scroll",
  "instanceId": "abc123",
  "deltaY": 500
}

// Select dropdown option by value
{
  "action": "select",
  "instanceId": "abc123",
  "selector": "select#country",
  "value": "US"
}

// Select by visible text
{
  "action": "select",
  "instanceId": "abc123",
  "selector": "select#country",
  "label": "United States"
}

// Upload a file
{
  "action": "upload",
  "instanceId": "abc123",
  "selector": "input[type='file']",
  "files": ["/path/to/document.pdf"]
}
```

### browser_execute

Run JavaScript in the page context.

**Parameters:**
- `expression`: JavaScript code to execute (required)
- `awaitPromise`: Wait for Promise to resolve

**Examples:**

```json
// Get page title
{
  "instanceId": "abc123",
  "expression": "document.title"
}

// Get all text from an element
{
  "instanceId": "abc123",
  "expression": "document.querySelector('#content').innerText"
}

// Execute async code
{
  "instanceId": "abc123",
  "expression": "await fetch('/api/data').then(r => r.json())",
  "awaitPromise": true
}

// Scroll to element
{
  "instanceId": "abc123",
  "expression": "document.querySelector('#footer').scrollIntoView()"
}

// Get computed style
{
  "instanceId": "abc123",
  "expression": "getComputedStyle(document.body).backgroundColor"
}
```

### browser_network

Control cookies, storage, and network.

**Actions:**
- `get_cookies` - Get cookies
- `set_cookie` - Set a cookie
- `clear_cookies` - Clear all cookies
- `set_headers` - Set custom request headers
- `intercept` - Intercept network requests
- `get_storage` - Get localStorage/sessionStorage
- `set_storage` - Set storage value
- `clear_storage` - Clear storage

**Examples:**

```json
// Get all cookies
{
  "action": "get_cookies",
  "instanceId": "abc123"
}

// Set a cookie
{
  "action": "set_cookie",
  "instanceId": "abc123",
  "name": "session",
  "value": "abc123",
  "domain": "example.com",
  "secure": true
}

// Set custom headers
{
  "action": "set_headers",
  "instanceId": "abc123",
  "headers": {
    "Authorization": "Bearer token123",
    "X-Custom-Header": "value"
  }
}

// Get localStorage
{
  "action": "get_storage",
  "instanceId": "abc123"
}

// Set localStorage value
{
  "action": "set_storage",
  "instanceId": "abc123",
  "key": "userPrefs",
  "value": "{\"theme\": \"dark\"}"
}

// Clear all storage
{
  "action": "clear_storage",
  "instanceId": "abc123",
  "storageType": "all"
}
```

### browser_emulate

Emulate devices and network conditions.

**Actions:**
- `viewport` - Set viewport size
- `user_agent` - Set user agent string
- `geolocation` - Set GPS coordinates
- `timezone` - Set timezone
- `device` - Use device preset
- `offline` - Toggle offline mode
- `throttle` - Throttle network speed

**Device Presets:** iPhone 14, Pixel 7, iPad Pro

**Network Presets:** slow-3g, fast-3g, 4g, wifi, offline, none

**Examples:**

```json
// Set mobile viewport
{
  "action": "viewport",
  "instanceId": "abc123",
  "width": 375,
  "height": 812,
  "mobile": true
}

// Emulate iPhone 14
{
  "action": "device",
  "instanceId": "abc123",
  "device": "iPhone 14"
}

// Set geolocation (New York)
{
  "action": "geolocation",
  "instanceId": "abc123",
  "latitude": 40.7128,
  "longitude": -74.0060
}

// Set timezone
{
  "action": "timezone",
  "instanceId": "abc123",
  "timezoneId": "America/New_York"
}

// Simulate slow network
{
  "action": "throttle",
  "instanceId": "abc123",
  "preset": "slow-3g"
}

// Go offline
{
  "action": "offline",
  "instanceId": "abc123",
  "offline": true
}
```

### browser_debug

Debugging and monitoring tools.

**Actions:**
- `dialog` - Handle alerts/confirms/prompts
- `console` - Get console logs
- `performance` - Get performance metrics
- `trace_start` - Start performance tracing
- `trace_stop` - Stop tracing
- `downloads` - List downloads
- `download_wait` - Wait for a download to complete

**Examples:**

```json
// Accept an alert dialog
{
  "action": "dialog",
  "instanceId": "abc123",
  "dialogAction": "accept"
}

// Dismiss with prompt text
{
  "action": "dialog",
  "instanceId": "abc123",
  "dialogAction": "accept",
  "promptText": "user input"
}

// Get error logs
{
  "action": "console",
  "instanceId": "abc123",
  "level": "error"
}

// Get all logs and clear
{
  "action": "console",
  "instanceId": "abc123",
  "level": "all",
  "clear": true
}

// Get performance metrics
{
  "action": "performance",
  "instanceId": "abc123"
}

// List in-progress downloads
{
  "action": "downloads",
  "instanceId": "abc123",
  "state": "in_progress"
}

// Wait for download to complete
{
  "action": "download_wait",
  "instanceId": "abc123",
  "downloadId": "download-123",
  "timeout": 60000
}
```

## Common Workflows

### Login to a Website

```
1. browser_instance: action=new, url=https://example.com/login
2. browser_navigate: action=wait, selector=#login-form
3. browser_interact: action=type, selector=input[name=email], text=user@example.com
4. browser_interact: action=type, selector=input[name=password], text=password123
5. browser_interact: action=click, selector=button[type=submit]
6. browser_navigate: action=wait, selector=.dashboard
```

### Scrape Data from a Page

```
1. browser_instance: action=new, url=https://example.com/data
2. browser_navigate: action=wait, selector=.data-loaded
3. browser_content: action=get, selector=.data-container, format=text
   OR
3. browser_execute: expression=Array.from(document.querySelectorAll('.item')).map(el => el.textContent)
```

### Fill a Multi-Step Form

```
1. browser_instance: action=new, url=https://example.com/form
2. browser_interact: action=type, selector=#name, text=John Doe
3. browser_interact: action=select, selector=#country, label=United States
4. browser_interact: action=click, selector=text=Next
5. browser_navigate: action=wait, selector=#step-2
6. browser_interact: action=type, selector=#address, text=123 Main St
7. browser_interact: action=click, selector=text=Submit
```

### Take Screenshot of Mobile View

```
1. browser_instance: action=new, url=https://example.com
2. browser_emulate: action=device, device=iPhone 14
3. browser_navigate: action=wait, selector=body
4. browser_content: action=screenshot, fullPage=true
```

### Download a File and Wait

```
1. browser_instance: action=new, url=https://example.com/downloads
2. browser_interact: action=click, selector=a.download-link
3. browser_debug: action=downloads, state=in_progress
4. browser_debug: action=download_wait, downloadId=<id-from-step-3>, timeout=60000
```

## Best Practices

1. **Always store the instanceId** returned from `browser_instance` action `new` - you need it for all subsequent calls.

2. **Use `wait` after navigation** to ensure the page is ready before interacting.

3. **Prefer CSS selectors** over coordinates for reliable element targeting.

4. **Use text selectors** (`text=Submit`, `button:has-text(Login)`) when CSS selectors are complex.

5. **Let typing be human-like** by omitting the `delay` parameter - this helps avoid bot detection.

6. **Check console logs** with `browser_debug` action `console` when debugging issues.

7. **Close browsers** when done to free resources: `browser_instance` action `close`.

8. **Use headless mode** for background tasks that don't need visual feedback.

## Troubleshooting

- **Element not found**: Use `browser_navigate` action `wait` with the selector first
- **Click not working**: Try `browser_execute` with `element.click()` as fallback
- **Page not loading**: Increase timeout or use `waitUntil: domcontentloaded`
- **Bot detection**: Ensure typing uses default human-like behavior (no delay parameter)
