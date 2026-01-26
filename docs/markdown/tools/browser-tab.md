# browser_tab

Manage browser tabs. List tabs, create new tabs, close tabs, and switch between tabs.

## Actions

| Action | Description |
|--------|-------------|
| `list` | List all tabs in the browser |
| `new` | Open a new tab |
| `close` | Close a specific tab |
| `close_others` | Close all tabs except one |
| `activate` | Switch to a specific tab |

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | One of: `list`, `new`, `close`, `close_others`, `activate` |
| `instanceId` | string | No | Target browser instance |
| `tabId` | number | For `close`, `activate` | Tab ID to operate on |
| `keepTabId` | number | For `close_others` | Tab ID to keep open |
| `url` | string | For `new` | URL to open in new tab |

## Action: list

List all tabs in the browser.

### Request
```json
{
  "name": "browser_tab",
  "arguments": {
    "action": "list",
    "instanceId": "inst_xxx"
  }
}
```

### Response
```json
{
  "tabs": [
    {
      "id": 123,
      "url": "https://google.com/",
      "title": "Google",
      "active": true,
      "index": 0
    },
    {
      "id": 124,
      "url": "https://github.com/",
      "title": "GitHub",
      "active": false,
      "index": 1
    }
  ],
  "activeTabId": 123,
  "count": 2
}
```

## Action: new

Open a new tab.

### Basic New Tab
```json
{
  "name": "browser_tab",
  "arguments": {
    "action": "new",
    "instanceId": "inst_xxx"
  }
}
```

### New Tab with URL
```json
{
  "name": "browser_tab",
  "arguments": {
    "action": "new",
    "instanceId": "inst_xxx",
    "url": "https://example.com"
  }
}
```

### Response
```json
{
  "tabId": 125,
  "url": "https://example.com/",
  "title": "Example Domain"
}
```

## Action: close

Close a specific tab.

### Request
```json
{
  "name": "browser_tab",
  "arguments": {
    "action": "close",
    "instanceId": "inst_xxx",
    "tabId": 124
  }
}
```

### Response
```json
{
  "success": true,
  "closedTabId": 124
}
```

## Action: close_others

Close all tabs except the specified one.

### Request
```json
{
  "name": "browser_tab",
  "arguments": {
    "action": "close_others",
    "instanceId": "inst_xxx",
    "keepTabId": 123
  }
}
```

### Response
```json
{
  "success": true,
  "closedCount": 3,
  "remainingTabId": 123
}
```

## Action: activate

Switch to (focus) a specific tab.

### Request
```json
{
  "name": "browser_tab",
  "arguments": {
    "action": "activate",
    "instanceId": "inst_xxx",
    "tabId": 124
  }
}
```

### Response
```json
{
  "success": true,
  "activeTabId": 124
}
```

## Examples

### Open Multiple Tabs and Switch Between Them
```json
// 1. Open first tab
{ "name": "browser_tab", "arguments": { "action": "new", "url": "https://google.com" }}
// Response: { "tabId": 123 }

// 2. Open second tab
{ "name": "browser_tab", "arguments": { "action": "new", "url": "https://github.com" }}
// Response: { "tabId": 124 }

// 3. Switch back to first tab
{ "name": "browser_tab", "arguments": { "action": "activate", "tabId": 123 }}

// 4. Close second tab
{ "name": "browser_tab", "arguments": { "action": "close", "tabId": 124 }}
```

### Clean Up Tabs
```json
// List all tabs
{ "name": "browser_tab", "arguments": { "action": "list" }}
// Response: { "tabs": [{ "id": 123 }, { "id": 124 }, { "id": 125 }], ... }

// Keep only the first tab
{ "name": "browser_tab", "arguments": { "action": "close_others", "keepTabId": 123 }}
```

### Work with Specific Tab
```json
// 1. Open new tab for a task
{ "name": "browser_tab", "arguments": { "action": "new", "url": "https://example.com" }}
// Response: { "tabId": 126 }

// 2. Use tabId in subsequent operations
{ "name": "browser_navigate", "arguments": { "action": "goto", "tabId": 126, "url": "https://example.com/page" }}

// 3. Take screenshot of that tab
{ "name": "browser_content", "arguments": { "action": "screenshot", "tabId": 126 }}

// 4. Close when done
{ "name": "browser_tab", "arguments": { "action": "close", "tabId": 126 }}
```

## Tab IDs

Tab IDs are:
- Assigned by Chrome
- Unique within a browser session
- Stable until the tab is closed
- Integers (e.g., 123, 124, 125)

When you don't specify a `tabId` in other tools, the active tab is used.

## Notes

- New tabs are automatically focused (made active)
- Closing the last tab may close the browser window (browser-dependent)
- Tab IDs are not preserved across browser restarts
- When `instanceId` is not specified, the first connected instance is used

## Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Tab not found" | Tab ID doesn't exist | List tabs to get valid IDs |
| "Cannot close last tab" | Attempted to close only tab | Open a new tab first, or close the browser |

## Related

- [browser_navigate](browser-navigate.md) - Navigate within tabs
- [browser_instance](browser-instance.md) - Manage browser instances
- [browser_content](browser-content.md) - Get tab content
