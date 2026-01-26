# Installation

This guide covers installing Moonsurf Browser Control and its prerequisites.

## Prerequisites

### Node.js 18+

Moonsurf requires Node.js version 18 or higher.

**Check your version:**
```bash
node --version
# Should output v18.x.x or higher
```

**Install Node.js:**
- macOS: `brew install node` or download from [nodejs.org](https://nodejs.org)
- Linux: Use your package manager or [NodeSource](https://github.com/nodesource/distributions)
- Windows: Download from [nodejs.org](https://nodejs.org)

### Browser Installation

You need at least one Chromium-based browser installed:

#### Chromium (Recommended)

Best for automation - persistent profile, auto-loads extension.

**macOS:**
```bash
brew install --cask chromium
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install chromium-browser

# Fedora
sudo dnf install chromium
```

#### Chrome for Testing

Best for CI/CD - clean state each run, auto-loads extension.

```bash
npx @puppeteer/browsers install chrome@stable
```

#### Google Chrome

Use your existing Chrome with saved profiles. Requires manual extension installation.

Download from [google.com/chrome](https://www.google.com/chrome/)

## Installing Moonsurf

### Global Installation (Recommended)

```bash
npm install -g @moonsurf/browser-control
```

This installs the `moonsurf` command globally.

**Verify installation:**
```bash
moonsurf --version
# Moonsurf Browser Control v2.0.0
```

### Local Installation

For project-specific usage:

```bash
npm install @moonsurf/browser-control
```

Run with:
```bash
npx moonsurf
```

### From Source

For development or to get the latest features:

```bash
git clone https://github.com/MoonsurfAI/browser-control.git
cd browser-control
npm install
npm run build
npm start
```

## Extension Installation

The Moonsurf extension is required for browser communication. It's handled automatically in most cases:

### Automatic Installation

When using `chromium` or `testing` modes, the extension is:
1. Downloaded from CDN on first launch
2. Stored at `~/.moonsurf/extension/`
3. Loaded automatically when launching browsers

### Manual Installation (Chrome Mode)

If using Chrome with existing profiles:

1. Download the extension from the [releases page](https://github.com/MoonsurfAI/browser-control/releases)
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode" (top right)
4. Click "Load unpacked" and select the extension folder

## Verifying the Installation

### 1. Start the Server

```bash
moonsurf
```

Expected output:
```
[Moonsurf] Server starting...
[Server] Mode: LOCAL
[Server] SSE endpoint: http://localhost:3300/sse
[Config] Server Configuration:
[Config]   Mode: LOCAL
[Config]   HTTP: http://localhost:3300
[Config]   WebSocket: ws://localhost:3301-3399
[Config]   Auth: disabled
[Config]   TLS: disabled
[Config]   CORS: disabled
[Config]   Rate Limit: disabled
[Config]   Headless Default: false
[Config]   Tasks: ENABLED (port: 3400, timeout: 60000ms)
[HTTP] Server listening on localhost:3300
[HTTP] MCP SSE endpoint: http://localhost:3300/sse
[HTTP] Extension registration: http://localhost:3300/register
[HTTP] Health check: http://localhost:3300/health
[WebSocket] Server listening on port 3301
[TaskWS] Server listening on localhost:3400
```

### 2. Check Health Endpoint

```bash
curl http://localhost:3300/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "connectedInstances": 0,
  "sseClients": 0,
  "auth": "disabled",
  "tls": "disabled",
  "rateLimit": "disabled"
}
```

### 3. Test Browser Launch

Using curl to test the MCP interface:

```bash
# Initialize connection
curl -X POST http://localhost:3300/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'

# List tools
curl -X POST http://localhost:3300/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

## Troubleshooting

### "Chromium not found"

Ensure Chromium is installed at one of these paths:
- macOS: `/Applications/Chromium.app`
- Linux: `/usr/bin/chromium` or `/usr/bin/chromium-browser`

### "Extension not found"

The extension should auto-download on first run. If it fails:
1. Check internet connectivity
2. Manually download from CDN
3. Set `EXTENSION_PATH` environment variable

### Permission Denied

On Linux, you may need to run with appropriate permissions:
```bash
sudo chmod +x $(which moonsurf)
```

### Port Already in Use

If port 3300 is occupied:
```bash
PORT=3400 moonsurf
```

## Next Steps

- [First Automation](first-automation.md) - Create your first browser automation
- [Connecting AI Clients](connecting-ai-clients.md) - Set up Claude, Cursor, etc.
- [Configuration](../configuration/README.md) - Customize Moonsurf settings
