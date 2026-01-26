# browser_emulate

Device and network emulation. Set viewport size, user agent, geolocation, timezone, simulate devices, and throttle network.

## Actions

| Action | Description |
|--------|-------------|
| `viewport` | Set viewport dimensions |
| `user_agent` | Set user agent string |
| `geolocation` | Set geolocation coordinates |
| `timezone` | Set timezone |
| `device` | Emulate a device preset |
| `offline` | Enable/disable offline mode |
| `throttle` | Throttle network speed |

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | One of the actions above |
| `instanceId` | string | No | Target browser instance |
| `tabId` | number | No | Target tab ID |
| `width` | number | For `viewport` | Viewport width |
| `height` | number | For `viewport` | Viewport height |
| `deviceScaleFactor` | number | For `viewport` | Device pixel ratio |
| `mobile` | boolean | For `viewport` | Mobile device mode |
| `userAgent` | string | For `user_agent` | User agent string |
| `platform` | string | For `user_agent` | Platform (Win32, MacIntel, Linux) |
| `latitude` | number | For `geolocation` | Latitude |
| `longitude` | number | For `geolocation` | Longitude |
| `accuracy` | number | For `geolocation` | Accuracy in meters |
| `timezoneId` | string | For `timezone` | Timezone ID |
| `device` | string | For `device` | Device preset name |
| `offline` | boolean | For `offline` | Enable offline mode |
| `preset` | string | For `throttle` | Network preset |
| `downloadThroughput` | number | For `throttle` | Download speed (bytes/s) |
| `uploadThroughput` | number | For `throttle` | Upload speed (bytes/s) |
| `latency` | number | For `throttle` | Network latency (ms) |

## Action: viewport

Set the viewport dimensions.

### Desktop Viewport
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "viewport",
    "width": 1920,
    "height": 1080
  }
}
```

### Mobile Viewport
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "viewport",
    "width": 375,
    "height": 812,
    "mobile": true,
    "deviceScaleFactor": 3
  }
}
```

### Tablet Viewport
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "viewport",
    "width": 768,
    "height": 1024,
    "deviceScaleFactor": 2
  }
}
```

### Response
```json
{
  "success": true,
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}
```

## Action: user_agent

Set the browser's user agent string.

### Mobile User Agent
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "user_agent",
    "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
  }
}
```

### Custom Bot User Agent
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "user_agent",
    "userAgent": "MyBot/1.0 (+https://example.com/bot)"
  }
}
```

### With Platform Override
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "user_agent",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...",
    "platform": "Win32"
  }
}
```

## Action: geolocation

Set the device's geolocation.

### New York City
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "geolocation",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 100
  }
}
```

### London
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "geolocation",
    "latitude": 51.5074,
    "longitude": -0.1278,
    "accuracy": 50
  }
}
```

### Tokyo
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "geolocation",
    "latitude": 35.6762,
    "longitude": 139.6503,
    "accuracy": 100
  }
}
```

## Action: timezone

Set the browser's timezone.

### US Eastern
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "timezone",
    "timezoneId": "America/New_York"
  }
}
```

### US Pacific
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "timezone",
    "timezoneId": "America/Los_Angeles"
  }
}
```

### UTC
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "timezone",
    "timezoneId": "UTC"
  }
}
```

### Europe/London
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "timezone",
    "timezoneId": "Europe/London"
  }
}
```

## Action: device

Emulate a device preset (applies viewport, user agent, and other settings).

### iPhone 14
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "device",
    "device": "iPhone 14"
  }
}
```

### Pixel 7
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "device",
    "device": "Pixel 7"
  }
}
```

### iPad Pro
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "device",
    "device": "iPad Pro"
  }
}
```

### Common Device Presets
- `iPhone 14`
- `iPhone 14 Pro Max`
- `iPhone SE`
- `Pixel 7`
- `Pixel 7 Pro`
- `Samsung Galaxy S23`
- `iPad Pro`
- `iPad Mini`

## Action: offline

Enable or disable offline mode.

### Go Offline
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "offline",
    "offline": true
  }
}
```

### Go Online
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "offline",
    "offline": false
  }
}
```

## Action: throttle

Throttle network speed to simulate various conditions.

### Slow 3G
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "throttle",
    "preset": "slow-3g"
  }
}
```

### Fast 3G
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "throttle",
    "preset": "fast-3g"
  }
}
```

### 4G/LTE
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "throttle",
    "preset": "4g"
  }
}
```

### WiFi
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "throttle",
    "preset": "wifi"
  }
}
```

### Custom Throttling
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "throttle",
    "downloadThroughput": 500000,
    "uploadThroughput": 250000,
    "latency": 100
  }
}
```

### No Throttling
```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "throttle",
    "preset": "none"
  }
}
```

### Network Presets

| Preset | Download | Upload | Latency |
|--------|----------|--------|---------|
| `slow-3g` | 500 Kbps | 500 Kbps | 400ms |
| `fast-3g` | 1.6 Mbps | 750 Kbps | 150ms |
| `4g` | 4 Mbps | 3 Mbps | 20ms |
| `wifi` | 30 Mbps | 15 Mbps | 2ms |
| `offline` | 0 | 0 | 0 |
| `none` | No limit | No limit | 0 |

## Examples

### Test Mobile Responsiveness
```json
// 1. Emulate iPhone
{ "name": "browser_emulate", "arguments": { "action": "device", "device": "iPhone 14" }}

// 2. Navigate to page
{ "name": "browser_navigate", "arguments": { "action": "goto", "url": "https://example.com" }}

// 3. Screenshot
{ "name": "browser_content", "arguments": { "action": "screenshot" }}
```

### Test Location-Based Features
```json
// 1. Set location to Paris
{ "name": "browser_emulate", "arguments": {
  "action": "geolocation",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "accuracy": 50
}}

// 2. Set timezone to Paris
{ "name": "browser_emulate", "arguments": {
  "action": "timezone",
  "timezoneId": "Europe/Paris"
}}

// 3. Navigate to location-aware app
{ "name": "browser_navigate", "arguments": { "action": "goto", "url": "https://example.com/nearby" }}
```

### Test Slow Network
```json
// 1. Throttle to slow 3G
{ "name": "browser_emulate", "arguments": { "action": "throttle", "preset": "slow-3g" }}

// 2. Navigate and measure load time
{ "name": "browser_navigate", "arguments": { "action": "goto", "url": "https://example.com" }}

// 3. Get performance metrics
{ "name": "browser_debug", "arguments": { "action": "performance" }}

// 4. Reset throttling
{ "name": "browser_emulate", "arguments": { "action": "throttle", "preset": "none" }}
```

### Test Offline Handling
```json
// 1. Load page normally
{ "name": "browser_navigate", "arguments": { "action": "goto", "url": "https://example.com" }}

// 2. Go offline
{ "name": "browser_emulate", "arguments": { "action": "offline", "offline": true }}

// 3. Try to navigate (test offline behavior)
{ "name": "browser_interact", "arguments": { "action": "click", "selector": ".refresh-data" }}

// 4. Go back online
{ "name": "browser_emulate", "arguments": { "action": "offline", "offline": false }}
```

## Notes

- Device emulation changes multiple settings at once
- Viewport changes may trigger responsive breakpoints
- Geolocation requires page permission grant (handled automatically)
- Network throttling affects all requests from the tab
- Changes persist until explicitly changed or browser closed

## Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid timezone" | Unknown timezone ID | Use valid IANA timezone |
| "Invalid coordinates" | Lat/long out of range | Lat: -90 to 90, Long: -180 to 180 |
| "Unknown device" | Device preset not found | Check available presets |

## Related

- [browser_content](browser-content.md) - Take screenshots
- [browser_debug](browser-debug.md) - Performance metrics
- [Testing Workflows Guide](../guides/testing-workflows.md)
