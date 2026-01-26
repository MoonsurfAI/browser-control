# Getting Started

Welcome to Moonsurf Browser Control! This guide will help you get up and running with AI-powered browser automation.

## What is Moonsurf?

Moonsurf is a Model Context Protocol (MCP) server that enables AI agents to control web browsers. Unlike traditional browser automation tools (Selenium, Puppeteer, Playwright) designed for human developers, Moonsurf is optimized for AI:

- **Consolidated Tools**: 9 unified tools instead of 50+, reducing context window usage
- **Natural Language Ready**: Tool descriptions and error messages designed for LLM understanding
- **Human-like Interaction**: Typing simulates human speed with natural pauses
- **AI-First Architecture**: Built from the ground up for MCP protocol

## Prerequisites

Before installing Moonsurf, ensure you have:

- **Node.js 18+** - Required for running the MCP server
- **A Chromium-based browser** - One of:
  - Google Chrome (any recent version)
  - Chromium (recommended for automation)
  - Chrome for Testing (for CI/CD)

## Quick Start

### 1. Install Moonsurf

```bash
npm install -g @moonsurf/browser-control
```

### 2. Start the Server

```bash
moonsurf
```

You'll see output like:
```
[Moonsurf] Server starting...
[Server] Mode: LOCAL
[Server] SSE endpoint: http://localhost:3300/sse
[Config] Server Configuration:
[Config]   Mode: LOCAL
[Config]   HTTP: http://localhost:3300
[Config]   WebSocket: ws://localhost:3301-3399
[HTTP] Server listening on localhost:3300
[HTTP] MCP SSE endpoint: http://localhost:3300/sse
```

### 3. Connect an AI Client

Configure your AI client (Claude, Cursor, etc.) to connect to the SSE endpoint:
```
http://localhost:3300/sse
```

### 4. Start Automating

Once connected, the AI can use browser automation tools. Example interaction:

**You**: "Open Google and search for 'AI automation'"

**AI**: Uses `browser_instance` to launch a browser, `browser_navigate` to go to Google, `browser_interact` to type and search.

## Next Steps

- **[Installation](installation.md)** - Detailed installation instructions
- **[First Automation](first-automation.md)** - Step-by-step first automation
- **[Connecting AI Clients](connecting-ai-clients.md)** - Configure Claude, Cursor, and more

## Architecture Overview

```
┌─────────────────┐     HTTP/SSE      ┌─────────────────┐    WebSocket    ┌─────────────────┐
│                 │ ◄───────────────► │                 │ ◄─────────────► │                 │
│   AI Client     │                   │  Moonsurf MCP   │                 │ Chrome Extension│
│ (Claude, etc.)  │                   │     Server      │                 │                 │
│                 │                   │                 │                 │                 │
└─────────────────┘                   └─────────────────┘                 └─────────────────┘
                                              │                                    │
                                              │                                    │
                                              │                              ┌─────┴─────┐
                                              │                              │           │
                                              │                              │  Browser  │
                                              │                              │           │
                                              └──────────────────────────────┴───────────┘
```

1. **AI Client** connects to the MCP server via SSE (Server-Sent Events)
2. **MCP Server** receives tool calls and routes them to browser instances
3. **Chrome Extension** executes commands in the browser context
4. Results flow back through the same path

## Choosing a Browser Mode

Moonsurf supports three browser modes:

| Mode | Use Case | Extension | Profile |
|------|----------|-----------|---------|
| `chromium` | General automation | Auto-loaded | Persistent (`~/.moonsurf`) |
| `testing` | CI/CD, clean tests | Auto-loaded | Temporary |
| `chrome` | Use existing profiles | Manual install | Your Chrome profiles |

For most users, `chromium` mode is recommended. See [Browser Modes](../concepts/browser-modes.md) for details.
