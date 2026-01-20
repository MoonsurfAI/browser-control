# Moonsurf Browser Tools - Quick Reference

## All Parameters by Tool

### browser_instance

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `list` \| `new` \| `close` \| `profiles` |
| `instanceId` | string | close | Instance ID to close |
| `url` | string | No | URL to open on launch |
| `mode` | string | No | `chrome` \| `testing` \| `chromium` (default) |
| `headless` | boolean | No | Headless mode (chromium only) |
| `profile` | string | No | Chrome profile name (chrome mode only) |
| `extensions` | string[] | No | Additional extension paths |
| `closeOtherTabs` | boolean | No | Close other tabs after launch |

### browser_tab

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `list` \| `new` \| `close` \| `close_others` \| `activate` |
| `instanceId` | string | Yes | Target browser instance |
| `tabId` | number | close/activate | Target tab ID |
| `keepTabId` | number | close_others | Tab to keep open |
| `url` | string | new | URL for new tab |

### browser_navigate

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `goto` \| `reload` \| `back` \| `forward` \| `wait` |
| `instanceId` | string | Yes | Target browser instance |
| `tabId` | number | No | Target tab (uses active if omitted) |
| `url` | string | goto | URL to navigate to |
| `waitUntil` | string | No | `load` \| `domcontentloaded` |
| `ignoreCache` | boolean | reload | Bypass cache |
| `selector` | string | wait | CSS selector to wait for |
| `expression` | string | wait | JS expression (must return truthy) |
| `timeout` | number | No | Wait timeout in ms |

### browser_content

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `screenshot` \| `pdf` \| `get` \| `query` \| `attribute` |
| `instanceId` | string | Yes | Target browser instance |
| `tabId` | number | No | Target tab |
| `selector` | string | get/query/attribute | CSS selector |
| `attribute` | string | attribute | Attribute name to get |
| `format` | string | No | `png`/`jpeg`/`webp` (screenshot) or `html`/`text` (get) |
| `quality` | number | No | Image quality 0-100 (jpeg/webp) |
| `fullPage` | boolean | No | Capture full scrollable page |
| `landscape` | boolean | pdf | Landscape orientation |
| `printBackground` | boolean | pdf | Include background graphics |
| `scale` | number | pdf | Page scale 0.1-2 |
| `paperWidth` | number | pdf | Paper width in inches |
| `paperHeight` | number | pdf | Paper height in inches |

### browser_interact

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `click` \| `move` \| `type` \| `press` \| `scroll` \| `hover` \| `select` \| `upload` |
| `instanceId` | string | Yes | Target browser instance |
| `tabId` | number | No | Target tab |
| `selector` | string | Varies | CSS selector, `text=X`, or `element:has-text(X)` |
| `x` | number | No | X coordinate |
| `y` | number | No | Y coordinate |
| `text` | string | type | Text to type |
| `key` | string | press | Key name (Enter, Tab, Escape, etc.) |
| `ctrl` | boolean | No | Hold Ctrl modifier |
| `alt` | boolean | No | Hold Alt modifier |
| `shift` | boolean | No | Hold Shift modifier |
| `meta` | boolean | No | Hold Meta/Cmd modifier |
| `delay` | number | No | Typing delay in ms (omit for human-like, 0 for instant) |
| `deltaX` | number | scroll | Horizontal scroll amount |
| `deltaY` | number | scroll | Vertical scroll amount |
| `value` | string | select | Option value |
| `label` | string | select | Option visible text |
| `index` | number | select | Option index |
| `files` | string[] | upload | File paths to upload |

### browser_execute

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | No | Target browser instance |
| `tabId` | number | No | Target tab |
| `expression` | string | Yes | JavaScript code to execute |
| `awaitPromise` | boolean | No | Wait for Promise resolution |

### browser_network

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `get_cookies` \| `set_cookie` \| `clear_cookies` \| `set_headers` \| `intercept` \| `get_storage` \| `set_storage` \| `clear_storage` |
| `instanceId` | string | Yes | Target browser instance |
| `tabId` | number | No | Target tab |
| `name` | string | set_cookie | Cookie name |
| `value` | string | set_cookie/set_storage | Cookie or storage value |
| `key` | string | set_storage | Storage key |
| `url` | string | No | Cookie URL |
| `urls` | string[] | get_cookies | Filter cookies by URLs |
| `domain` | string | No | Cookie domain |
| `path` | string | No | Cookie path |
| `secure` | boolean | No | Secure cookie flag |
| `httpOnly` | boolean | No | HTTP-only flag |
| `sameSite` | string | No | `Strict` \| `Lax` \| `None` |
| `expires` | number | No | Expiration Unix timestamp |
| `headers` | object | set_headers | Headers object `{name: value}` |
| `enabled` | boolean | intercept | Enable/disable interception |
| `patterns` | array | intercept | URL patterns to intercept |
| `storageType` | string | clear_storage | `localStorage` \| `sessionStorage` \| `all` |

### browser_emulate

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `viewport` \| `user_agent` \| `geolocation` \| `timezone` \| `device` \| `offline` \| `throttle` |
| `instanceId` | string | Yes | Target browser instance |
| `tabId` | number | No | Target tab |
| `width` | number | viewport | Viewport width in pixels |
| `height` | number | viewport | Viewport height in pixels |
| `deviceScaleFactor` | number | No | Device pixel ratio |
| `mobile` | boolean | No | Enable mobile mode |
| `userAgent` | string | user_agent | User agent string |
| `platform` | string | No | Platform: `Win32` \| `MacIntel` \| `Linux` |
| `latitude` | number | geolocation | GPS latitude |
| `longitude` | number | geolocation | GPS longitude |
| `accuracy` | number | No | Geolocation accuracy in meters |
| `timezoneId` | string | timezone | Timezone ID (e.g., `America/New_York`) |
| `device` | string | device | Device preset name |
| `offline` | boolean | offline | Enable offline mode |
| `preset` | string | throttle | `slow-3g` \| `fast-3g` \| `4g` \| `wifi` \| `offline` \| `none` |
| `downloadThroughput` | number | No | Download speed in bytes/s |
| `uploadThroughput` | number | No | Upload speed in bytes/s |
| `latency` | number | No | Network latency in ms |

### browser_debug

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | `dialog` \| `console` \| `performance` \| `trace_start` \| `trace_stop` \| `downloads` \| `download_wait` |
| `instanceId` | string | Yes | Target browser instance |
| `tabId` | number | No | Target tab |
| `dialogAction` | string | dialog | `accept` \| `dismiss` |
| `promptText` | string | No | Text for prompt dialogs |
| `level` | string | console | `log` \| `info` \| `warning` \| `error` \| `all` |
| `clear` | boolean | No | Clear logs after retrieval |
| `categories` | string[] | trace_start | Trace categories |
| `state` | string | downloads | `in_progress` \| `complete` \| `error` \| `all` |
| `downloadId` | string | download_wait | Download ID to wait for |
| `timeout` | number | No | Wait timeout in ms |

## Common Keyboard Keys

For use with `browser_interact` action `press`:

| Key | Description |
|-----|-------------|
| `Enter` | Enter/Return key |
| `Tab` | Tab key |
| `Escape` | Escape key |
| `Backspace` | Backspace key |
| `Delete` | Delete key |
| `ArrowUp` | Up arrow |
| `ArrowDown` | Down arrow |
| `ArrowLeft` | Left arrow |
| `ArrowRight` | Right arrow |
| `Home` | Home key |
| `End` | End key |
| `PageUp` | Page up |
| `PageDown` | Page down |
| `F1`-`F12` | Function keys |

## Device Presets

For use with `browser_emulate` action `device`:

- `iPhone 14`
- `Pixel 7`
- `iPad Pro`

## Network Throttle Presets

For use with `browser_emulate` action `throttle`:

| Preset | Download | Upload | Latency |
|--------|----------|--------|---------|
| `slow-3g` | 500 Kbps | 500 Kbps | 400ms |
| `fast-3g` | 1.5 Mbps | 750 Kbps | 150ms |
| `4g` | 4 Mbps | 3 Mbps | 20ms |
| `wifi` | 30 Mbps | 15 Mbps | 2ms |
| `offline` | 0 | 0 | 0 |
| `none` | Unlimited | Unlimited | 0 |

## Browser Modes

| Mode | Description | Headless | Extension |
|------|-------------|----------|-----------|
| `chromium` | Recommended default | Yes | Auto-loaded |
| `chrome` | Use existing profiles/sessions | No | Manual install |
| `testing` | Clean slate each time | No | Auto-loaded |
