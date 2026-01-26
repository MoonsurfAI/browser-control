# browser_debug

Debugging and monitoring tools. Handle dialogs, view console logs, get performance metrics, trace execution, and track downloads.

## Actions

| Action | Description |
|--------|-------------|
| `dialog` | Handle JavaScript dialogs (alert, confirm, prompt) |
| `console` | Get console log messages |
| `performance` | Get performance metrics |
| `trace_start` | Start performance tracing |
| `trace_stop` | Stop tracing and get results |
| `downloads` | List tracked downloads |
| `download_wait` | Wait for a download to complete |

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | One of the actions above |
| `instanceId` | string | No | Target browser instance |
| `tabId` | number | No | Target tab ID |
| `dialogAction` | string | For `dialog` | `accept` or `dismiss` |
| `promptText` | string | For `dialog` | Text for prompt dialogs |
| `level` | string | For `console` | Log level filter |
| `clear` | boolean | For `console` | Clear logs after retrieval |
| `categories` | string[] | For `trace_start` | Trace categories |
| `state` | string | For `downloads` | Download state filter |
| `downloadId` | string | For `download_wait` | Download ID to wait for |
| `timeout` | number | For `download_wait` | Wait timeout (ms) |

## Action: dialog

Handle JavaScript dialogs (alert, confirm, prompt).

### Accept Alert/Confirm
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "dialog",
    "dialogAction": "accept"
  }
}
```

### Dismiss Dialog
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "dialog",
    "dialogAction": "dismiss"
  }
}
```

### Answer Prompt
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "dialog",
    "dialogAction": "accept",
    "promptText": "My answer"
  }
}
```

### Response
```json
{
  "handled": true,
  "dialogType": "confirm",
  "message": "Are you sure?",
  "action": "accept"
}
```

## Action: console

Get console log messages.

### Get All Logs
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "console"
  }
}
```

### Get Error Logs Only
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "console",
    "level": "error"
  }
}
```

### Get Warnings
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "console",
    "level": "warning"
  }
}
```

### Get and Clear Logs
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "console",
    "level": "all",
    "clear": true
  }
}
```

### Response
```json
{
  "logs": [
    {
      "level": "log",
      "text": "Page loaded",
      "timestamp": 1706234567890,
      "source": "console"
    },
    {
      "level": "error",
      "text": "Failed to fetch /api/data",
      "timestamp": 1706234567900,
      "source": "network"
    }
  ],
  "count": 2
}
```

### Log Levels
- `log` - Regular logs
- `info` - Informational messages
- `warning` - Warnings
- `error` - Errors
- `all` - All levels

## Action: performance

Get performance metrics for the page.

### Request
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "performance"
  }
}
```

### Response
```json
{
  "metrics": {
    "Timestamp": 1234567.89,
    "Documents": 1,
    "Frames": 1,
    "JSEventListeners": 42,
    "Nodes": 1250,
    "LayoutCount": 5,
    "RecalcStyleCount": 8,
    "LayoutDuration": 0.023,
    "RecalcStyleDuration": 0.015,
    "ScriptDuration": 0.456,
    "TaskDuration": 0.789,
    "JSHeapUsedSize": 12345678,
    "JSHeapTotalSize": 23456789
  },
  "timing": {
    "navigationStart": 1706234567000,
    "domContentLoadedEventEnd": 1706234567500,
    "loadEventEnd": 1706234568000
  }
}
```

## Action: trace_start

Start performance tracing for detailed analysis.

### Basic Tracing
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "trace_start"
  }
}
```

### With Specific Categories
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "trace_start",
    "categories": ["devtools.timeline", "disabled-by-default-devtools.timeline"]
  }
}
```

### Response
```json
{
  "tracing": true,
  "message": "Tracing started"
}
```

## Action: trace_stop

Stop tracing and get the trace data.

### Request
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "trace_stop"
  }
}
```

### Response
```json
{
  "tracing": false,
  "trace": "base64-encoded-trace-data...",
  "message": "Tracing stopped"
}
```

The trace can be loaded into Chrome DevTools Performance panel for analysis.

## Action: downloads

List tracked downloads.

### List All Downloads
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "downloads"
  }
}
```

### List In-Progress Downloads
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "downloads",
    "state": "in_progress"
  }
}
```

### List Completed Downloads
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "downloads",
    "state": "complete"
  }
}
```

### Response
```json
{
  "downloads": [
    {
      "id": "abc123def456",
      "instanceId": "inst_xxx",
      "filename": "report.pdf",
      "filepath": "/Users/you/Downloads/report.pdf",
      "state": "complete",
      "bytesReceived": 1234567,
      "totalBytes": 1234567,
      "progress": 100,
      "startTime": 1706234567000,
      "endTime": 1706234568000
    },
    {
      "id": "xyz789abc123",
      "instanceId": "inst_xxx",
      "filename": "data.csv",
      "tempFilename": "data.csv.crdownload",
      "filepath": "/Users/you/Downloads/data.csv",
      "state": "in_progress",
      "bytesReceived": 500000,
      "totalBytes": 1000000,
      "progress": 50,
      "startTime": 1706234569000
    }
  ],
  "downloadDirectory": "/Users/you/Downloads",
  "count": 2
}
```

### Download States
- `in_progress` - Currently downloading
- `complete` - Download finished successfully
- `error` - Download failed

## Action: download_wait

Wait for a download to complete.

### Wait for Specific Download
```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "download_wait",
    "downloadId": "abc123def456",
    "timeout": 60000
  }
}
```

### Response (Success)
```json
{
  "id": "abc123def456",
  "filename": "report.pdf",
  "filepath": "/Users/you/Downloads/report.pdf",
  "state": "complete",
  "bytesReceived": 1234567,
  "totalBytes": 1234567,
  "progress": 100,
  "startTime": 1706234567000,
  "endTime": 1706234568000
}
```

### Response (Error)
```json
{
  "error": {
    "code": "DOWNLOAD_ERROR",
    "message": "Download timeout after 60000ms"
  }
}
```

## Examples

### Handle Confirmation Dialog
```json
// 1. Click delete button (triggers confirm dialog)
{ "name": "browser_interact", "arguments": { "action": "click", "selector": ".delete-btn" }}

// 2. Accept the confirmation
{ "name": "browser_debug", "arguments": { "action": "dialog", "dialogAction": "accept" }}
```

### Debug Page Errors
```json
// 1. Navigate to page
{ "name": "browser_navigate", "arguments": { "action": "goto", "url": "https://example.com" }}

// 2. Perform some actions...

// 3. Check for errors
{ "name": "browser_debug", "arguments": { "action": "console", "level": "error" }}

// If errors found, get more details
{ "name": "browser_debug", "arguments": { "action": "console", "level": "all" }}
```

### Measure Page Performance
```json
// 1. Start tracing
{ "name": "browser_debug", "arguments": { "action": "trace_start" }}

// 2. Navigate to page
{ "name": "browser_navigate", "arguments": { "action": "goto", "url": "https://example.com" }}

// 3. Wait for load
{ "name": "browser_navigate", "arguments": { "action": "wait", "expression": "document.readyState === 'complete'" }}

// 4. Stop tracing
{ "name": "browser_debug", "arguments": { "action": "trace_stop" }}

// 5. Get quick metrics
{ "name": "browser_debug", "arguments": { "action": "performance" }}
```

### Download and Verify File
```json
// 1. Click download button
{ "name": "browser_interact", "arguments": { "action": "click", "selector": ".download-report" }}

// 2. List downloads to get the ID
{ "name": "browser_debug", "arguments": { "action": "downloads", "state": "in_progress" }}
// Response: { "downloads": [{ "id": "abc123", ... }] }

// 3. Wait for download to complete
{ "name": "browser_debug", "arguments": {
  "action": "download_wait",
  "downloadId": "abc123",
  "timeout": 120000
}}

// 4. Verify completion
{ "name": "browser_debug", "arguments": { "action": "downloads", "state": "complete" }}
```

### Monitor for JavaScript Errors
```json
// 1. Clear existing logs
{ "name": "browser_debug", "arguments": { "action": "console", "level": "all", "clear": true }}

// 2. Perform test actions
{ "name": "browser_interact", "arguments": { "action": "click", "selector": ".risky-button" }}

// 3. Check for errors
{ "name": "browser_debug", "arguments": { "action": "console", "level": "error" }}
```

## Notes

- Dialog handling must be called after a dialog appears
- Console logs accumulate until cleared
- Performance metrics are point-in-time snapshots
- Trace data can be large; use for specific debugging
- Download tracking starts when browser instance launches
- Default download timeout is 5 minutes (300000ms)

## Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "No dialog present" | Dialog was already handled or doesn't exist | Check timing |
| "Download not found" | Invalid download ID | List downloads first |
| "Download timeout" | Download didn't complete in time | Increase timeout or check network |
| "Tracing not active" | trace_stop called without trace_start | Call trace_start first |

## Related

- [browser_content](browser-content.md) - Screenshots for debugging
- [browser_execute](browser-execute.md) - Custom debugging scripts
- [File Downloads Guide](../guides/file-downloads.md)
- [Debugging Tips Guide](../guides/debugging-tips.md)
