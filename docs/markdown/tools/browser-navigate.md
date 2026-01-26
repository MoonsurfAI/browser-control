# browser_navigate

Navigate pages and browser history. Go to URLs, reload pages, navigate back/forward, and wait for conditions.

## Actions

| Action | Description |
|--------|-------------|
| `goto` | Navigate to a URL |
| `reload` | Reload the current page |
| `back` | Go back in history |
| `forward` | Go forward in history |
| `wait` | Wait for a selector or condition |

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | One of: `goto`, `reload`, `back`, `forward`, `wait` |
| `instanceId` | string | No | Target browser instance |
| `tabId` | number | No | Target tab ID |
| `url` | string | For `goto` | URL to navigate to |
| `waitUntil` | string | No | When to consider navigation complete: `load`, `domcontentloaded` |
| `ignoreCache` | boolean | For `reload` | Bypass cache when reloading |
| `selector` | string | For `wait` | CSS selector to wait for |
| `expression` | string | For `wait` | JavaScript expression to wait for (truthy) |
| `timeout` | number | For `wait` | Maximum wait time in milliseconds |

## Action: goto

Navigate to a URL.

### Basic Navigation
```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "goto",
    "url": "https://example.com"
  }
}
```

### Wait for DOM Content Loaded
```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "goto",
    "url": "https://example.com",
    "waitUntil": "domcontentloaded"
  }
}
```

### Wait for Full Load
```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "goto",
    "url": "https://example.com",
    "waitUntil": "load"
  }
}
```

### Response
```json
{
  "success": true,
  "url": "https://example.com/",
  "title": "Example Domain"
}
```

## Action: reload

Reload the current page.

### Basic Reload
```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "reload"
  }
}
```

### Hard Reload (Ignore Cache)
```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "reload",
    "ignoreCache": true
  }
}
```

### Response
```json
{
  "success": true,
  "url": "https://example.com/",
  "title": "Example Domain"
}
```

## Action: back

Navigate back in browser history.

### Request
```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "back"
  }
}
```

### Response
```json
{
  "success": true,
  "url": "https://previous-page.com/",
  "title": "Previous Page"
}
```

## Action: forward

Navigate forward in browser history.

### Request
```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "forward"
  }
}
```

### Response
```json
{
  "success": true,
  "url": "https://next-page.com/",
  "title": "Next Page"
}
```

## Action: wait

Wait for a condition before proceeding.

### Wait for CSS Selector
```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "wait",
    "selector": "#main-content"
  }
}
```

### Wait with Timeout
```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "wait",
    "selector": ".dynamic-element",
    "timeout": 10000
  }
}
```

### Wait for JavaScript Condition
```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "wait",
    "expression": "document.querySelectorAll('.item').length > 5"
  }
}
```

### Wait for Page Load State
```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "wait",
    "expression": "document.readyState === 'complete'"
  }
}
```

### Response
```json
{
  "success": true,
  "waited": true,
  "selector": "#main-content"
}
```

## Wait Until Options

| Option | Description | Use When |
|--------|-------------|----------|
| `domcontentloaded` | DOM is ready, subresources may still load | Need to interact with page quickly |
| `load` | Page fully loaded including images/styles | Need all resources available |

## Examples

### Navigate and Wait for Content
```json
// 1. Navigate to page
{ "name": "browser_navigate", "arguments": { "action": "goto", "url": "https://spa-app.com" }}

// 2. Wait for dynamic content to load
{ "name": "browser_navigate", "arguments": { "action": "wait", "selector": ".content-loaded", "timeout": 10000 }}

// 3. Now interact with the content
{ "name": "browser_interact", "arguments": { "action": "click", "selector": ".content-button" }}
```

### Navigate Back After Following Link
```json
// 1. On a page with links
{ "name": "browser_interact", "arguments": { "action": "click", "selector": "a.details-link" }}

// 2. View the details page
{ "name": "browser_navigate", "arguments": { "action": "wait", "selector": ".details-content" }}

// 3. Go back to the list
{ "name": "browser_navigate", "arguments": { "action": "back" }}
```

### Refresh to Get Latest Data
```json
// 1. Hard refresh to bypass cache
{ "name": "browser_navigate", "arguments": { "action": "reload", "ignoreCache": true }}

// 2. Wait for fresh data
{ "name": "browser_navigate", "arguments": { "action": "wait", "selector": ".data-loaded" }}
```

### Wait for API-Loaded Content
```json
// Wait for items to be fetched and rendered
{ "name": "browser_navigate", "arguments": {
  "action": "wait",
  "expression": "window.dataLoaded === true && document.querySelectorAll('.item').length > 0",
  "timeout": 15000
}}
```

## Timeout Behavior

- Default timeout varies by action
- For `wait`, if timeout expires, an error is returned
- Navigation actions (`goto`, `reload`) have implicit timeouts

## Notes

- URLs should include the protocol (`https://` or `http://`)
- Relative URLs are resolved against the current page
- `waitUntil: "load"` waits longer but ensures all resources are loaded
- Wait expressions run in page context and can access any global variables

## Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Navigation timeout" | Page took too long to load | Increase timeout or check URL |
| "Wait timeout" | Selector/condition not met within timeout | Increase timeout or check selector |
| "Cannot go back" | No history to go back to | Check navigation history |
| "Invalid URL" | Malformed URL | Include protocol (https://) |

## Related

- [browser_tab](browser-tab.md) - Open new tabs
- [browser_interact](browser-interact.md) - Interact with page elements
- [browser_content](browser-content.md) - Get page content
