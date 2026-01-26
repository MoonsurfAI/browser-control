# browser_instance

Manage browser instances. Launch new browsers, list connected instances, close browsers, and list Chrome profiles.

## Actions

| Action | Description |
|--------|-------------|
| `list` | List all connected browser instances |
| `new` | Launch a new browser instance |
| `close` | Close a browser instance |
| `profiles` | List available Chrome profiles |

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | One of: `list`, `new`, `close`, `profiles` |
| `instanceId` | string | For `close` | Instance ID to close |
| `url` | string | No | URL to open on launch |
| `mode` | string | No | Browser mode: `chrome`, `testing`, `chromium` |
| `headless` | boolean | No | Run headless (chromium mode only) |
| `profile` | string | No | Chrome profile name (chrome mode only) |
| `extensions` | string[] | No | Additional extension paths |
| `closeOtherTabs` | boolean | No | Close other tabs after launch |

## Action: list

List all connected browser instances.

### Request
```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "list"
  }
}
```

### Response
```json
{
  "instances": [
    {
      "id": "inst_1706234567890_abc123",
      "browserType": "Chromium",
      "profile": "(persistent)",
      "port": 3301,
      "userAgent": "Mozilla/5.0 ...",
      "windowId": 123,
      "connectedAt": 1706234567890,
      "lastActivity": 1706234567900
    }
  ]
}
```

## Action: new

Launch a new browser instance.

### Basic Launch
```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new"
  }
}
```

### With URL
```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new",
    "url": "https://example.com"
  }
}
```

### Chromium Mode (Default)
```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new",
    "mode": "chromium"
  }
}
```

### Testing Mode
```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new",
    "mode": "testing"
  }
}
```

### Chrome with Profile
```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new",
    "mode": "chrome",
    "profile": "Default"
  }
}
```

### Headless Mode
```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new",
    "mode": "chromium",
    "headless": true
  }
}
```

### With Additional Extensions
```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new",
    "mode": "chromium",
    "extensions": ["/path/to/extension1", "/path/to/extension2"]
  }
}
```

### Close Other Tabs on Launch
```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new",
    "url": "https://example.com",
    "closeOtherTabs": true
  }
}
```

### Response
```json
{
  "instanceId": "inst_1706234567890_abc123",
  "browserType": "Chromium",
  "profile": "(persistent)",
  "downloadDirectory": "/Users/you/Downloads",
  "extensionAutoLoaded": true,
  "message": "Browser launched with extension auto-loaded."
}
```

### Profile Selection Required Response
If Chrome mode is used with multiple profiles and no profile specified:

```json
{
  "action": "profile_selection_required",
  "profiles": [
    { "id": "Default", "name": "Personal" },
    { "id": "Profile 1", "name": "Work" }
  ],
  "message": "Multiple Chrome profiles found. Please specify which profile to use.",
  "hint": "Use browser_instance with action:\"new\" and profile parameter, or mode:\"testing\"/\"chromium\""
}
```

## Action: close

Close a browser instance.

### Request
```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "close",
    "instanceId": "inst_1706234567890_abc123"
  }
}
```

### Response
```json
{
  "success": true,
  "message": "Browser instance closed"
}
```

### Not Found Response
```json
{
  "success": false,
  "message": "Instance not found"
}
```

## Action: profiles

List available Chrome profiles.

### Request
```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "profiles"
  }
}
```

### Response
```json
{
  "profiles": [
    { "directory": "Default", "name": "Personal" },
    { "directory": "Profile 1", "name": "Work" },
    { "directory": "Profile 2", "name": "Testing" }
  ]
}
```

## Browser Modes

### chromium (Default)

- Uses standalone Chromium
- Persistent profile at `~/.moonsurf/`
- Extension auto-loaded
- Supports headless mode

### testing

- Uses Chrome for Testing
- Temporary profile (deleted after close)
- Extension auto-loaded
- Clean state each time

### chrome

- Uses Google Chrome
- Uses your existing profiles
- Extension must be manually installed
- Access to saved logins and cookies

## Examples

### Launch and Use Browser
```json
// 1. Launch browser
{ "name": "browser_instance", "arguments": { "action": "new", "mode": "chromium" }}
// Response: { "instanceId": "inst_xxx", ... }

// 2. Navigate
{ "name": "browser_navigate", "arguments": { "action": "goto", "instanceId": "inst_xxx", "url": "https://google.com" }}

// 3. Do work...

// 4. Close browser
{ "name": "browser_instance", "arguments": { "action": "close", "instanceId": "inst_xxx" }}
```

### Check for Running Browsers
```json
// List instances
{ "name": "browser_instance", "arguments": { "action": "list" }}

// If none, launch one
{ "name": "browser_instance", "arguments": { "action": "new" }}
```

### Use Specific Chrome Profile
```json
// 1. List profiles
{ "name": "browser_instance", "arguments": { "action": "profiles" }}
// Response: { "profiles": [{ "directory": "Default", "name": "Work" }, ...] }

// 2. Launch with profile
{ "name": "browser_instance", "arguments": { "action": "new", "mode": "chrome", "profile": "Work" }}
```

## Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Chromium not found" | Chromium not installed | Install Chromium |
| "Chrome for Testing not found" | Chrome for Testing not installed | Run `npx @puppeteer/browsers install chrome@stable` |
| "No available ports" | 99 instances already running | Close some instances |
| "Extension failed to connect" | Extension didn't connect in 30s | Check extension is built, browser launched correctly |
| "Profile not found" | Specified profile doesn't exist | Use `action: profiles` to list available profiles |

## Notes

- Maximum concurrent instances: 99 (ports 3301-3399)
- Default timeout waiting for extension: 30 seconds
- Extension is auto-downloaded on first use (if not using `EXTENSION_PATH`)
- When no `instanceId` is specified in other tools, the first connected instance is used

## Related

- [Browser Modes](../concepts/browser-modes.md) - Detailed mode comparison
- [Instance Lifecycle](../concepts/instance-lifecycle.md) - How instances work
- [browser_tab](browser-tab.md) - Tab management
