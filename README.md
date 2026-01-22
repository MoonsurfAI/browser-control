# Moonsurf Browser MCP Server

**AI-native browser automation.**

Moonsurf is a Model Context Protocol (MCP) server built from the ground up for AI agents. Unlike traditional browser automation tools designed for human developers, Moonsurf is optimized for how large language models think, communicate, and operate.

## Table of Contents

- [Overview](#overview)
- [Why AI-Native?](#why-ai-native)
- [Architecture](#architecture)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [IDE and AI Tool Configuration](#ide-and-ai-tool-configuration)
- [Claude Skill Installation](#claude-skill-installation)
- [Usage Examples](#usage-examples)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [MCP Tools](#mcp-tools)
- [Browser Modes](#browser-modes)
- [Security](#security)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Overview

Moonsurf gives AI agents complete control over web browsers through a clean, structured interface. The server handles all the complexity of browser management, letting AI focus on what it does best: understanding intent and executing tasks.

**Core Capabilities:**

- Full browser automation through the Model Context Protocol (MCP)
- Support for Chrome, Chrome for Testing, and Chromium browsers
- Multi-instance browser management with WebSocket communication
- Human-like interaction simulation (typing at natural speeds, clicking, scrolling)
- Screenshot, PDF generation, and content extraction
- Network interception, cookie management, and storage control
- Device emulation and network throttling
- Download tracking with progress monitoring

## Why AI-Native?

Traditional browser automation tools (Selenium, Puppeteer, Playwright) were designed for human developers writing scripts. They expose hundreds of low-level methods that require deep browser knowledge. AI agents struggle with these interfaces because:

- Large API surfaces consume precious context window space
- Granular methods require multi-step reasoning for simple tasks
- Return values are often raw data structures that need interpretation

Moonsurf takes a different approach, purpose-built for AI agents:

### Context-Efficient Tool Design

Instead of 50+ individual methods, Moonsurf provides **9 consolidated tools** with action parameters. This reduces the tool definitions that AI must process by over 80%, leaving more context window for actual work.

```
Traditional approach:     AI-native approach:
- browser_click           - browser_interact
- browser_double_click      action: click | type | scroll | hover | ...
- browser_type
- browser_scroll
- browser_hover
- ... (50+ more)
```

### Semantic Actions Over Low-Level Commands

Each tool groups related operations by intent. When an AI needs to "interact with an element," it uses `browser_interact` with the appropriate action. The tool name itself describes the category of operation, making tool selection intuitive for language models.

### Human-Like Behavior by Default

AI agents often need to interact with websites that detect automation. Moonsurf defaults to human-like behavior:

- **Typing simulation**: 100-200 WPM with randomized delays, natural pauses after punctuation, and occasional thinking delays
- **No special flags needed**: Realistic behavior is the default, not an option to enable

### Structured Input and Output

All tool parameters use clear, typed schemas that AI models can reliably generate. Responses are structured data, not raw browser objects. AI can parse and act on results without additional processing.

### Built on MCP

The Model Context Protocol is the standard for AI-tool communication. Moonsurf implements MCP natively, ensuring compatibility with any MCP-enabled AI assistant without adapters or wrappers.

## Architecture

Moonsurf uses a layered architecture that separates AI communication from browser control. This design allows the AI-facing interface to remain stable and optimized while the browser integration layer handles platform-specific details.

```
+-------------------+          HTTP/SSE          +--------------------+
|                   | <------------------------> |                    |
|    MCP Client     |                            |   Moonsurf Server  |
|  (AI Assistant)   |                            |    (Node.js/TS)    |
|                   |                            |                    |
+-------------------+                            +--------------------+
                                                          ^
                                                          |
                                                    WebSocket
                                                          |
                                                          v
                                                 +--------------------+
                                                 |                    |
                                                 | Browser Extension  |
                                                 |   (in Chrome)      |
                                                 |                    |
                                                 +--------------------+
```

**Communication Flow:**

1. AI assistant connects via SSE (Server-Sent Events) for real-time communication
2. AI sends structured tool calls to the `/message` endpoint
3. Moonsurf routes requests to the appropriate browser instance via WebSocket
4. Browser extension executes the command and returns structured results
5. AI receives the response and continues its task

**Key Components:**

| Component | File | Description |
|-----------|------|-------------|
| Entry Point | `src/index.ts` | Application bootstrap |
| Configuration | `src/config.ts` | Environment-based settings |
| HTTP Server | `src/http-server.ts` | HTTP/HTTPS with SSE support |
| WebSocket Server | `src/websocket-server.ts` | Extension communication |
| Instance Manager | `src/instance-manager.ts` | Browser instance lifecycle |
| Browser Launcher | `src/browser-launcher.ts` | Browser process management |
| Download Watcher | `src/download-watcher.ts` | File download monitoring |
| MCP Handler | `src/mcp-handler.ts` | MCP protocol routing |
| Tool Definitions | `src/tool-definitions.ts` | 9 consolidated MCP tools |

## Installation

### Prerequisites

- Node.js 18 or higher
- Chrome, Chrome for Testing, or Chromium browser
- Moonsurf Browser Extension (installed in browser)

### Install from npm

```bash
npm install -g @moonsurf/browser-control
```

### Run with npx (no install)

```bash
npx @moonsurf/browser-control
```

### Run from Source

```bash
git clone https://github.com/MoonsurfAI/browser-control.git
cd browser-control
npm install
npm run build
npm start
```

## Quick Start

### Using npx

The fastest way to start Moonsurf:

```bash
npx @moonsurf/browser-control
```

The server starts on `http://localhost:3300` by default.

### Using Global Install

```bash
# Install globally
npm install -g @moonsurf/browser-control

# Run from anywhere
moonsurf
```

### With Environment Variables

```bash
PORT=3400 npx @moonsurf/browser-control
```

## IDE and AI Tool Configuration

Moonsurf works with any MCP-compatible AI assistant. Below are configuration examples for popular tools.

### Claude Code CLI

Add to your Claude Code MCP settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["@moonsurf/browser-control"]
    }
  }
}
```

Or with environment variables:

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["@moonsurf/browser-control"],
      "env": {
        "PORT": "3300",
        "BROWSER_DEFAULT_MODE": "chromium"
      }
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["@moonsurf/browser-control"]
    }
  }
}
```

### Cursor IDE

Add to Cursor MCP settings (`.cursor/mcp.json` in your project or global config):

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["@moonsurf/browser-control"]
    }
  }
}
```

### Windsurf IDE

Add to Windsurf MCP configuration (`~/.windsurf/mcp.json`):

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["@moonsurf/browser-control"]
    }
  }
}
```

### Antigravity IDE

Add to Antigravity settings:

```json
{
  "mcp": {
    "servers": {
      "browser": {
        "command": "npx",
        "args": ["@moonsurf/browser-control"]
      }
    }
  }
}
```

### Gemini CLI

Add to Gemini CLI MCP configuration:

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["@moonsurf/browser-control"]
    }
  }
}
```

### Codex CLI

Add to Codex CLI configuration:

```json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["@moonsurf/browser-control"]
    }
  }
}
```

### Generic MCP Client

For any MCP-compatible client, use:

```json
{
  "command": "npx",
  "args": ["@moonsurf/browser-control"],
  "env": {
    "PORT": "3300"
  }
}
```

Or connect directly to a running server:

```
SSE Endpoint: http://localhost:3300/sse
Message Endpoint: http://localhost:3300/message
```

## Claude Skill Installation

Moonsurf includes a Claude Skill that teaches Claude how to effectively use the browser automation tools. Installing the skill improves Claude's understanding of the tools and enables automatic activation when you request browser-related tasks.

### Install the Skill

```bash
# Install the skill to ~/.claude/skills/
npx @moonsurf/browser-control --install-skill
```

Or if you have Moonsurf installed globally:

```bash
moonsurf --install-skill
```

### Verify Installation

```bash
npx @moonsurf/browser-control --skill-status
```

### Uninstall the Skill

```bash
npx @moonsurf/browser-control --uninstall-skill
```

### Manual Installation

If you prefer to install manually, copy the skill files from the package:

```bash
# Create the skills directory
mkdir -p ~/.claude/skills/moonsurf-browser

# Copy from the installed package (adjust path as needed)
cp -r node_modules/@moonsurf/browser-control/skills/moonsurf-browser/* ~/.claude/skills/moonsurf-browser/
```

Or download directly from the repository:

```bash
mkdir -p ~/.claude/skills/moonsurf-browser
curl -o ~/.claude/skills/moonsurf-browser/SKILL.md \
  https://raw.githubusercontent.com/MoonsurfAI/browser-control/main/skills/moonsurf-browser/SKILL.md
curl -o ~/.claude/skills/moonsurf-browser/REFERENCE.md \
  https://raw.githubusercontent.com/MoonsurfAI/browser-control/main/skills/moonsurf-browser/REFERENCE.md
```

### What the Skill Provides

The Moonsurf skill includes:

- **Quick start workflows** for common browser automation tasks
- **Detailed documentation** for all 9 browser tools
- **Code examples** for every action and parameter
- **Common workflows** like login, form filling, and data scraping
- **Best practices** for reliable browser automation
- **Troubleshooting guide** for common issues

Once installed, Claude will automatically use this skill when you ask it to:
- Open or control browsers
- Navigate to websites
- Take screenshots
- Fill forms or click buttons
- Scrape web content
- Perform any browser automation task

## Usage Examples

Once configured, your AI assistant can control browsers. Here are example prompts:

**Basic Navigation:**
> "Open a browser and go to github.com"

**Form Interaction:**
> "Go to google.com and search for 'MCP protocol'"

**Screenshot:**
> "Take a screenshot of the current page"

**Multi-step Task:**
> "Go to Hacker News, find the top 5 stories, and save their titles"

### Example Tool Call

The AI can launch a browser with a single tool call:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "browser_instance",
    "arguments": {
      "action": "new",
      "url": "https://example.com",
      "mode": "chromium"
    }
  }
}
```

## Configuration

Configuration is managed through environment variables. The server supports two modes:

- **LOCAL** (default): For development and single-machine AI setups. Runs on localhost with minimal security overhead.
- **REMOTE**: For production deployments where AI assistants connect over a network. Enables authentication, TLS, and rate limiting by default.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REMOTE_MODE` | `false` | Enable remote mode (0.0.0.0 binding) |
| `HOST` | `localhost` | Server bind address |
| `PORT` | `3300` | HTTP server port |
| `PUBLIC_URL` | (none) | Public URL for remote clients (e.g., `http://1.2.3.4:3300`) |
| `WS_PORT_START` | `3301` | WebSocket port range start |
| `WS_PORT_END` | `3399` | WebSocket port range end |

**Authentication:**

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_ENABLED` | `false` (local), `true` (remote) | Enable token authentication |
| `AUTH_TOKENS` | (empty) | Comma-separated list of valid tokens |

**TLS/HTTPS:**

| Variable | Default | Description |
|----------|---------|-------------|
| `TLS_ENABLED` | `false` | Enable HTTPS |
| `TLS_CERT_PATH` | (none) | Path to TLS certificate file |
| `TLS_KEY_PATH` | (none) | Path to TLS private key file |

**CORS:**

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ENABLED` | `false` (local), `true` (remote) | Enable CORS |
| `CORS_ORIGINS` | `*` (local), (empty) (remote) | Comma-separated allowed origins |
| `CORS_CREDENTIALS` | `true` | Allow credentials in CORS |

**Rate Limiting:**

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_ENABLED` | `false` (local), `true` (remote) | Enable rate limiting |
| `RATE_LIMIT_MAX_CONNECTIONS` | `10` | Max connections per IP |
| `RATE_LIMIT_MAX_CALLS` | `100` | Max API calls per minute per IP |

**Browser:**

| Variable | Default | Description |
|----------|---------|-------------|
| `HEADLESS_DEFAULT` | `false` (local), `true` (remote) | Default headless mode |
| `BROWSER_DEFAULT_MODE` | `chromium` | Default browser mode |

**Logging:**

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Log level: debug, info, warn, error |
| `AUDIT_LOG_ENABLED` | `false` (local), `true` (remote) | Enable audit logging |

### Example Configurations

**Local Development:**

```bash
# No configuration needed, defaults work
npm start
```

**Remote/Production:**

```bash
export REMOTE_MODE=true
export PUBLIC_URL=http://your-server-ip:3300  # Required for remote MCP clients
export AUTH_ENABLED=true
export AUTH_TOKENS=token1,token2,token3
export TLS_ENABLED=true
export TLS_CERT_PATH=/path/to/cert.pem
export TLS_KEY_PATH=/path/to/key.pem
export RATE_LIMIT_ENABLED=true
npm start
```

> **Note:** `PUBLIC_URL` is required when running in remote mode. Without it, MCP clients will receive `localhost` URLs which won't work for remote connections.

## API Reference

### HTTP Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/info` | No | Server information |
| GET | `/sse` | Yes | SSE connection for MCP clients |
| POST | `/message` | Yes | MCP request handler |
| POST | `/register` | No | Extension registration |
| GET | `/instances` | Yes | List connected browser instances |

### SSE Connection

Connect to receive server events:

```
GET /sse
Authorization: Bearer <token>
```

The server sends:
- Connection acknowledgment with session ID
- MCP responses to requests
- Periodic keep-alive messages

### MCP Message Format

Send requests to `/message?sessionId=<session-id>`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "browser_navigate",
    "arguments": {
      "action": "goto",
      "instanceId": "abc123",
      "url": "https://example.com"
    }
  }
}
```

### Authentication

When authentication is enabled, provide a token via:

**Header:**
```
Authorization: Bearer <token>
```

**Query Parameter:**
```
GET /sse?token=<token>
```

## MCP Tools

Moonsurf exposes **9 consolidated tools** that cover all browser automation needs. This deliberate design choice optimizes for AI context windows. Rather than forcing AI to parse 50+ tool definitions, each tool groups related actions under a single, semantically clear name.

**The 9 Tools:**

| Tool | Purpose |
|------|---------|
| `browser_instance` | Manage browser instances (launch, close, list) |
| `browser_tab` | Control tabs (open, close, switch) |
| `browser_navigate` | Page navigation and history |
| `browser_content` | Extract content (screenshots, PDFs, DOM) |
| `browser_interact` | User input simulation (click, type, scroll) |
| `browser_execute` | Run JavaScript in page context |
| `browser_network` | Cookies, storage, headers, interception |
| `browser_emulate` | Device and network emulation |
| `browser_debug` | Debugging and diagnostics |

### browser_instance

Manage browser instances.

| Action | Description | Required Parameters |
|--------|-------------|---------------------|
| `list` | List connected instances | (none) |
| `new` | Launch new browser | (none) |
| `close` | Terminate instance | `instanceId` |
| `profiles` | List Chrome profiles | (none) |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `action` | string | Required. One of: list, new, close, profiles |
| `instanceId` | string | Instance ID (for close) |
| `url` | string | URL to open on launch |
| `mode` | string | Browser mode: chrome, testing, chromium |
| `headless` | boolean | Headless mode (chromium only) |
| `profile` | string | Chrome profile name (chrome mode only) |
| `extensions` | string[] | Additional extension paths |
| `closeOtherTabs` | boolean | Close other tabs after launch |

**Example:**

```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new",
    "url": "https://google.com",
    "mode": "chromium"
  }
}
```

### browser_tab

Manage browser tabs.

| Action | Description | Required Parameters |
|--------|-------------|---------------------|
| `list` | List all tabs | `instanceId` |
| `new` | Open new tab | `instanceId` |
| `close` | Close tab | `instanceId`, `tabId` |
| `close_others` | Close other tabs | `instanceId` |
| `activate` | Focus tab | `instanceId`, `tabId` |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `action` | string | Required. One of: list, new, close, close_others, activate |
| `instanceId` | string | Target browser instance ID |
| `tabId` | number | Tab ID (for close/activate) |
| `keepTabId` | number | Tab to keep (for close_others) |
| `url` | string | URL for new tab |

**Example:**

```json
{
  "name": "browser_tab",
  "arguments": {
    "action": "new",
    "instanceId": "abc123",
    "url": "https://example.com"
  }
}
```

### browser_navigate

Navigate pages and history.

| Action | Description | Required Parameters |
|--------|-------------|---------------------|
| `goto` | Navigate to URL | `instanceId`, `url` |
| `reload` | Reload page | `instanceId` |
| `back` | Go back | `instanceId` |
| `forward` | Go forward | `instanceId` |
| `wait` | Wait for condition | `instanceId` |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `action` | string | Required. One of: goto, reload, back, forward, wait |
| `instanceId` | string | Target browser instance ID |
| `tabId` | number | Target tab ID |
| `url` | string | URL to navigate to (for goto) |
| `waitUntil` | string | Wait condition: load, domcontentloaded |
| `ignoreCache` | boolean | Bypass cache (for reload) |
| `selector` | string | CSS selector to wait for |
| `expression` | string | JS expression to wait for (truthy) |
| `timeout` | number | Wait timeout in milliseconds |

**Example:**

```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "goto",
    "instanceId": "abc123",
    "url": "https://example.com",
    "waitUntil": "domcontentloaded"
  }
}
```

### browser_content

Get page content.

| Action | Description | Required Parameters |
|--------|-------------|---------------------|
| `screenshot` | Capture screenshot | `instanceId` |
| `pdf` | Generate PDF | `instanceId` |
| `get` | Get page content | `instanceId` |
| `query` | Find elements | `instanceId`, `selector` |
| `attribute` | Get element attribute | `instanceId`, `selector`, `attribute` |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `action` | string | Required. One of: screenshot, pdf, get, query, attribute |
| `instanceId` | string | Target browser instance ID |
| `tabId` | number | Target tab ID |
| `selector` | string | CSS selector (for get/query/attribute) |
| `attribute` | string | Attribute name (for attribute action) |
| `format` | string | Output format: png/jpeg/webp (screenshot) or html/text (get) |
| `quality` | number | Image quality 0-100 (jpeg/webp) |
| `fullPage` | boolean | Capture full scrollable page |
| `landscape` | boolean | Landscape orientation (pdf) |
| `printBackground` | boolean | Print background graphics (pdf) |
| `scale` | number | Page scale 0.1-2 (pdf) |
| `paperWidth` | number | Paper width in inches (pdf) |
| `paperHeight` | number | Paper height in inches (pdf) |

**Example:**

```json
{
  "name": "browser_content",
  "arguments": {
    "action": "screenshot",
    "instanceId": "abc123",
    "format": "png",
    "fullPage": true
  }
}
```

### browser_interact

Simulate user input with human-like behavior. This is where Moonsurf's AI-native design shines: the `type` action defaults to realistic typing patterns (100-200 WPM with natural variations), so AI agents produce human-like interactions without extra configuration.

| Action | Description | Required Parameters |
|--------|-------------|---------------------|
| `click` | Click element | `instanceId` |
| `move` | Move mouse | `instanceId` |
| `type` | Type text | `instanceId`, `text` |
| `press` | Press key | `instanceId`, `key` |
| `scroll` | Scroll page | `instanceId` |
| `hover` | Hover element | `instanceId`, `selector` |
| `select` | Select dropdown option | `instanceId`, `selector` |
| `upload` | Upload files | `instanceId`, `selector`, `files` |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `action` | string | Required. One of: click, move, type, press, scroll, hover, select, upload |
| `instanceId` | string | Target browser instance ID |
| `tabId` | number | Target tab ID |
| `selector` | string | CSS selector, text=X, or element:has-text(X) |
| `x` | number | X coordinate |
| `y` | number | Y coordinate |
| `text` | string | Text to type |
| `key` | string | Key to press (Enter, Tab, Escape, etc.) |
| `ctrl` | boolean | Hold Ctrl key |
| `alt` | boolean | Hold Alt key |
| `shift` | boolean | Hold Shift key |
| `meta` | boolean | Hold Meta/Cmd key |
| `delay` | number | Custom delay between keystrokes (ms). Omit for human-like typing. Set to 0 for instant. |
| `deltaX` | number | Horizontal scroll amount |
| `deltaY` | number | Vertical scroll amount |
| `value` | string | Option value (select) |
| `label` | string | Option label (select) |
| `index` | number | Option index (select) |
| `files` | string[] | File paths (upload) |

**Example:**

```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "type",
    "instanceId": "abc123",
    "selector": "input[name='search']",
    "text": "hello world"
  }
}
```

### browser_execute

Execute JavaScript in page context.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `instanceId` | string | Target browser instance ID |
| `tabId` | number | Target tab ID |
| `expression` | string | Required. JavaScript code to execute |
| `awaitPromise` | boolean | Wait for promise resolution |

**Example:**

```json
{
  "name": "browser_execute",
  "arguments": {
    "instanceId": "abc123",
    "expression": "document.title",
    "awaitPromise": false
  }
}
```

### browser_network

Control network and storage.

| Action | Description | Required Parameters |
|--------|-------------|---------------------|
| `get_cookies` | Get cookies | `instanceId` |
| `set_cookie` | Set cookie | `instanceId`, `name`, `value` |
| `clear_cookies` | Clear cookies | `instanceId` |
| `set_headers` | Set request headers | `instanceId`, `headers` |
| `intercept` | Intercept requests | `instanceId` |
| `get_storage` | Get local/session storage | `instanceId` |
| `set_storage` | Set storage value | `instanceId`, `key`, `value` |
| `clear_storage` | Clear storage | `instanceId` |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `action` | string | Required. Action type |
| `instanceId` | string | Target browser instance ID |
| `tabId` | number | Target tab ID |
| `name` | string | Cookie name |
| `value` | string | Cookie/storage value |
| `key` | string | Storage key |
| `url` | string | Cookie URL |
| `urls` | string[] | URLs for get_cookies |
| `domain` | string | Cookie domain |
| `path` | string | Cookie path |
| `secure` | boolean | Secure cookie |
| `httpOnly` | boolean | HTTP-only cookie |
| `sameSite` | string | SameSite: Strict, Lax, None |
| `expires` | number | Cookie expiration (Unix timestamp) |
| `headers` | object | HTTP headers to set |
| `enabled` | boolean | Enable/disable interception |
| `patterns` | array | Interception patterns |
| `storageType` | string | Storage type: localStorage, sessionStorage, all |

**Example:**

```json
{
  "name": "browser_network",
  "arguments": {
    "action": "set_cookie",
    "instanceId": "abc123",
    "name": "session",
    "value": "abc123",
    "domain": "example.com",
    "secure": true
  }
}
```

### browser_emulate

Device and network emulation.

| Action | Description | Required Parameters |
|--------|-------------|---------------------|
| `viewport` | Set viewport size | `instanceId`, `width`, `height` |
| `user_agent` | Set user agent | `instanceId`, `userAgent` |
| `geolocation` | Set geolocation | `instanceId`, `latitude`, `longitude` |
| `timezone` | Set timezone | `instanceId`, `timezoneId` |
| `device` | Emulate device preset | `instanceId`, `device` |
| `offline` | Toggle offline mode | `instanceId`, `offline` |
| `throttle` | Throttle network | `instanceId` |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `action` | string | Required. Action type |
| `instanceId` | string | Target browser instance ID |
| `tabId` | number | Target tab ID |
| `width` | number | Viewport width |
| `height` | number | Viewport height |
| `deviceScaleFactor` | number | Device pixel ratio |
| `mobile` | boolean | Mobile device mode |
| `userAgent` | string | User agent string |
| `platform` | string | Platform (Win32, MacIntel, Linux) |
| `latitude` | number | Latitude coordinate |
| `longitude` | number | Longitude coordinate |
| `accuracy` | number | Geolocation accuracy (meters) |
| `timezoneId` | string | Timezone ID (e.g., America/New_York) |
| `device` | string | Device preset: iPhone 14, Pixel 7, iPad Pro |
| `offline` | boolean | Enable offline mode |
| `preset` | string | Network throttle: slow-3g, fast-3g, 4g, wifi, offline, none |
| `downloadThroughput` | number | Download speed (bytes/s) |
| `uploadThroughput` | number | Upload speed (bytes/s) |
| `latency` | number | Network latency (ms) |

**Example:**

```json
{
  "name": "browser_emulate",
  "arguments": {
    "action": "device",
    "instanceId": "abc123",
    "device": "iPhone 14"
  }
}
```

### browser_debug

Debugging and diagnostics.

| Action | Description | Required Parameters |
|--------|-------------|---------------------|
| `dialog` | Handle alert/confirm/prompt | `instanceId`, `dialogAction` |
| `console` | Get console logs | `instanceId` |
| `performance` | Get performance metrics | `instanceId` |
| `trace_start` | Start tracing | `instanceId` |
| `trace_stop` | Stop tracing | `instanceId` |
| `downloads` | List downloads | `instanceId` |
| `download_wait` | Wait for download | `instanceId`, `downloadId` |

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `action` | string | Required. Action type |
| `instanceId` | string | Target browser instance ID |
| `tabId` | number | Target tab ID |
| `dialogAction` | string | Dialog action: accept, dismiss |
| `promptText` | string | Text for prompt dialogs |
| `level` | string | Console log level: log, info, warning, error, all |
| `clear` | boolean | Clear logs after retrieval |
| `categories` | string[] | Trace categories |
| `state` | string | Download state filter: in_progress, complete, error, all |
| `downloadId` | string | Download ID to wait for |
| `timeout` | number | Wait timeout (ms) |

**Example:**

```json
{
  "name": "browser_debug",
  "arguments": {
    "action": "console",
    "instanceId": "abc123",
    "level": "error",
    "clear": true
  }
}
```

## Browser Modes

Moonsurf supports three browser modes, each suited for different AI automation scenarios:

### chrome

Uses the system-installed Chrome with existing user profiles. Best for AI agents that need to work with the user's existing sessions, cookies, and saved logins.

- Requires manual installation of the Moonsurf extension
- Supports multiple Chrome profiles
- AI can leverage existing authenticated sessions
- No headless support (designed for visible automation)

**Profile Selection:**

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

### testing

Uses Chrome for Testing with a temporary profile. Best for AI agents running repeatable tasks that need a clean slate each time.

- Clean browser state for each launch
- Auto-loads the Moonsurf extension
- Ideal for AI-driven testing and CI/CD pipelines
- Temporary profile deleted on close (no state leakage between runs)

**Detection Paths:**

- `/tmp/chrome-for-testing`
- `~/.cache/puppeteer/chrome`
- `/Applications/Google Chrome for Testing.app` (macOS)

### chromium

Uses Chromium with a persistent profile at `~/.moonsurf`. The recommended mode for most AI automation tasks.

- Auto-loads the Moonsurf extension
- Persistent profile preserves state between AI sessions
- Supports headless mode for background AI operations
- Default mode for Moonsurf

**Enable Headless:**

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

## Security

### Authentication

Enable authentication for production deployments:

```bash
export AUTH_ENABLED=true
export AUTH_TOKENS=secret-token-1,secret-token-2
```

Clients authenticate via:

```
Authorization: Bearer secret-token-1
```

Or:

```
GET /sse?token=secret-token-1
```

### TLS/HTTPS

Enable HTTPS for encrypted communication:

```bash
export TLS_ENABLED=true
export TLS_CERT_PATH=/path/to/cert.pem
export TLS_KEY_PATH=/path/to/key.pem
```

### CORS

Configure allowed origins:

```bash
export CORS_ENABLED=true
export CORS_ORIGINS=https://example.com,https://app.example.com
```

### Rate Limiting

Protect against abuse:

```bash
export RATE_LIMIT_ENABLED=true
export RATE_LIMIT_MAX_CONNECTIONS=10
export RATE_LIMIT_MAX_CALLS=100
```

### Security Warnings

The server warns about insecure configurations:

- Remote mode without authentication
- Remote mode without TLS
- CORS enabled with no specific origins

## Development

This section covers how to work on Moonsurf itself. When extending or modifying the server, keep the AI-native principles in mind: minimize tool count, use semantic naming, and return structured data.

### Project Structure

```
browser-mcp-server/
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # Configuration
│   ├── types.ts              # TypeScript interfaces
│   ├── http-server.ts        # HTTP/HTTPS server
│   ├── websocket-server.ts   # WebSocket server
│   ├── instance-manager.ts   # Instance management
│   ├── browser-launcher.ts   # Browser launching
│   ├── download-watcher.ts   # Download monitoring
│   ├── mcp-handler.ts        # MCP protocol
│   ├── sse-transport.ts      # SSE transport
│   └── tool-definitions.ts   # Tool schemas
├── dist/                     # Compiled output
├── package.json
├── tsconfig.json
└── LICENSE
```

### Build Commands

```bash
# Build TypeScript
npm run build

# Watch mode for development
npm run dev

# Start server
npm start
```

### TypeScript Configuration

The project uses:

- Target: ES2022
- Module: NodeNext
- Strict mode enabled
- Declaration files generated

### Adding New Tools

When adding new functionality, prefer adding an action to an existing tool over creating a new tool. This keeps the AI-facing interface compact.

**To add a new action to an existing tool:**

1. Add the action to the tool's `enum` in `src/tool-definitions.ts`
2. Add any new parameters needed
3. Add the action mapping to `actionToToolMap`
4. Implement the handler in the browser extension or server

**To add a new tool (only if semantically distinct):**

1. Add the tool definition to `src/tool-definitions.ts`
2. Add the action mapping to `actionToToolMap`
3. Handle the tool in `src/mcp-handler.ts`
4. Implement in browser extension or server-side handler

**AI-native design checklist:**

- Tool name describes a category of operations, not a single action
- All parameters have clear types and descriptions
- Responses are structured JSON, not raw values
- Default behavior is sensible (AI should not need to specify obvious defaults)

### Logging

All logs go to stderr (stdout is reserved for data output).

Log prefixes:

- `[Server]` - Main server
- `[HTTP]` - HTTP server
- `[WebSocket]` - WebSocket server
- `[MCP]` - MCP handler
- `[BrowserLauncher]` - Browser processes
- `[DownloadWatcher]` - Download tracking
- `[InstanceManager]` - Instance management

Enable debug logging:

```bash
export LOG_LEVEL=debug
```

### Audit Logging

Enable audit logs for security events:

```bash
export AUDIT_LOG_ENABLED=true
```

Audit events:

- `AUTH_FAILED` - Failed authentication attempt
- `RATE_LIMITED` - Rate limit exceeded
- `SSE_CONNECTED` - New SSE connection
- `MCP_REQUEST` - MCP tool call
- `EXTENSION_REGISTERED` - Extension connected

## Troubleshooting

### Server Won't Start

**Port already in use:**

```bash
# Find process using port 3300
lsof -i :3300

# Use a different port
export PORT=3400
npm start
```

### Extension Won't Connect

**Check WebSocket port range:**

Ensure ports 3301-3399 are available:

```bash
# Check for conflicts
lsof -i :3301-3399
```

**Verify extension is installed:**

The extension must be loaded in the browser for testing/chromium modes or manually installed for chrome mode.

### Browser Launch Fails

**Chrome not found:**

The server searches common paths. Check logs for detection attempts:

```bash
export LOG_LEVEL=debug
npm start
```

**Permission denied on Linux:**

```bash
chmod +x /path/to/chrome
```

### Tool Calls Timeout

Default timeout is 30 seconds. The browser extension may be unresponsive.

**Check WebSocket connection:**

```bash
curl http://localhost:3300/instances
```

**Verify instance is connected:**

The instance should show a WebSocket connection in the response.

### Download Tracking Not Working

Ensure the download directory is being watched:

1. Browser must be launched through the server
2. Downloads must go to a monitored directory
3. Check for filesystem watch errors in logs

### TLS Certificate Issues

**Self-signed certificate:**

For development, generate a self-signed certificate:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem -out cert.pem
```

**Certificate path errors:**

Verify paths are absolute and files are readable:

```bash
ls -la /path/to/cert.pem /path/to/key.pem
```

### Rate Limiting

If you hit rate limits during development:

```bash
# Disable rate limiting locally
export RATE_LIMIT_ENABLED=false
```

Or increase limits:

```bash
export RATE_LIMIT_MAX_CALLS=1000
```

## License

Apache 2.0
