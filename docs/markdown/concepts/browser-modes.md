# Browser Modes

Moonsurf supports three browser modes, each optimized for different use cases. Understanding these modes helps you choose the right one for your automation needs.

## Overview

| Mode | Browser | Profile | Extension | Best For |
|------|---------|---------|-----------|----------|
| `chromium` | Chromium | Persistent (`~/.moonsurf`) | Auto-loaded | General automation |
| `testing` | Chrome for Testing | Temporary | Auto-loaded | CI/CD, clean tests |
| `chrome` | Google Chrome | Your profiles | Manual install | Using existing logins |

## Chromium Mode

**Default mode.** Uses standalone Chromium with a persistent profile.

### Characteristics

- **Profile Location:** `~/.moonsurf/`
- **Extension:** Auto-loaded on launch
- **State:** Persistent between sessions
- **Headless:** Supported

### When to Use

- General browser automation
- Development and testing
- When you want consistent state
- When headless mode is needed

### Launch Example

```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new",
    "mode": "chromium"
  }
}
```

### With Headless

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

### Prerequisites

Chromium must be installed:

**macOS:**
```bash
brew install --cask chromium
```

**Linux:**
```bash
sudo apt install chromium-browser  # Ubuntu/Debian
sudo dnf install chromium          # Fedora
```

### Expected Paths

- macOS: `/Applications/Chromium.app/Contents/MacOS/Chromium`
- Linux: `/usr/bin/chromium` or `/usr/bin/chromium-browser`

## Testing Mode

Uses Chrome for Testing with temporary profiles. Each launch starts fresh.

### Characteristics

- **Profile Location:** `/tmp/moonsurf-{timestamp}/`
- **Extension:** Auto-loaded on launch
- **State:** Cleared after close
- **Headless:** Not supported (use chromium mode)

### When to Use

- CI/CD pipelines
- Automated testing
- When clean state is required
- When you don't want to pollute any profile

### Launch Example

```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new",
    "mode": "testing"
  }
}
```

### Prerequisites

Install Chrome for Testing:

```bash
npx @puppeteer/browsers install chrome@stable
```

Or specify a custom path:
```bash
npx @puppeteer/browsers install chrome@stable --path /tmp/chrome-for-testing
```

### Expected Paths

**macOS:**
- `/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`
- `~/.cache/puppeteer/chrome/mac-*/chrome-mac-*/Google Chrome for Testing.app/...`
- `/tmp/chrome-for-testing/chrome/mac-*/chrome-mac-*/Google Chrome for Testing.app/...`

**Linux:**
- `/opt/chrome-for-testing/chrome`
- `~/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome`

## Chrome Mode

Uses your existing Google Chrome installation with your saved profiles.

### Characteristics

- **Profile Location:** Your Chrome user data directory
- **Extension:** Must be manually installed
- **State:** Uses your existing logins, cookies, extensions
- **Headless:** Not supported

### When to Use

- Automating tasks that require existing logins
- Using saved passwords and sessions
- Working with sites that detect automation
- Accessing internal/VPN-protected sites through existing setup

### Launch Example

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

### Profile Selection

If you have multiple Chrome profiles, you must specify which one:

```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new",
    "mode": "chrome",
    "profile": "Profile 1"
  }
}
```

List available profiles:
```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "profiles"
  }
}
```

Response:
```json
{
  "profiles": [
    { "directory": "Default", "name": "Personal" },
    { "directory": "Profile 1", "name": "Work" }
  ]
}
```

### Manual Extension Installation

Chrome mode requires manual extension installation:

1. Download the extension from releases
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extension folder

### Expected Paths

**macOS:**
- `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- `/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary`

**Linux:**
- `/usr/bin/google-chrome`
- `/usr/bin/google-chrome-stable`

**Windows:**
- `C:\Program Files\Google\Chrome\Application\chrome.exe`
- `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`

## Mode Comparison

### Extension Loading

| Mode | Extension Loading |
|------|-------------------|
| `chromium` | Automatic via `--load-extension` flag |
| `testing` | Automatic via `--load-extension` flag |
| `chrome` | Manual installation required |

### Profile Persistence

| Mode | Profile Persists? | Location |
|------|-------------------|----------|
| `chromium` | Yes | `~/.moonsurf/` |
| `testing` | No | `/tmp/moonsurf-{timestamp}/` |
| `chrome` | Yes | Your Chrome user data dir |

### Feature Support

| Feature | chromium | testing | chrome |
|---------|----------|---------|--------|
| Headless | Yes | No | No |
| Profile Selection | No | No | Yes |
| Auto Extension | Yes | Yes | No |
| Additional Extensions | Yes | Yes | No |
| Persistent State | Yes | No | Yes |

## Additional Extensions

In `chromium` and `testing` modes, you can load additional extensions:

```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new",
    "mode": "chromium",
    "extensions": [
      "/path/to/extension1",
      "/path/to/extension2"
    ]
  }
}
```

**Note:** This is not supported in `chrome` mode.

## Choosing the Right Mode

```
Start
  │
  ├─ Need existing logins/cookies?
  │   └─ Yes → chrome mode
  │
  ├─ Need clean state each run?
  │   └─ Yes → testing mode
  │
  ├─ Need headless?
  │   └─ Yes → chromium mode
  │
  └─ Default → chromium mode
```

## Troubleshooting

### "Chromium not found"

Install Chromium or set a custom path. See Prerequisites above.

### "Chrome for Testing not found"

```bash
npx @puppeteer/browsers install chrome@stable
```

### "Multiple profiles found"

Specify the profile:
```json
{ "action": "new", "mode": "chrome", "profile": "Default" }
```

Or use `chromium` or `testing` mode instead.

### "Extension not manually installed"

For Chrome mode, you must manually install the extension. See Manual Extension Installation above.

## Related Topics

- [Instance Lifecycle](instance-lifecycle.md) - How instances are managed
- [browser_instance Tool](../tools/browser-instance.md) - Tool reference
- [Configuration](../configuration/README.md) - Default mode settings
