# Moonsurf Browser Control Documentation

Moonsurf is an AI-native browser automation MCP server that gives AI agents complete control over web browsers. Unlike traditional automation tools designed for human developers, Moonsurf is optimized for how large language models think, communicate, and operate.

## Quick Links

| Getting Started | Core Concepts | Reference |
|-----------------|---------------|-----------|
| [Installation](getting-started/installation.md) | [Architecture](concepts/architecture.md) | [Tool Reference](tools/README.md) |
| [First Automation](getting-started/first-automation.md) | [Browser Modes](concepts/browser-modes.md) | [API Reference](api-reference/README.md) |
| [Connecting AI Clients](getting-started/connecting-ai-clients.md) | [MCP Protocol](concepts/mcp-protocol.md) | [Configuration](configuration/README.md) |

## Documentation Structure

### Getting Started
New to Moonsurf? Start here.

- **[Overview](getting-started/README.md)** - Introduction and quick start
- **[Installation](getting-started/installation.md)** - npm install, CLI setup, prerequisites
- **[First Automation](getting-started/first-automation.md)** - Launch a browser, navigate, take a screenshot
- **[Connecting AI Clients](getting-started/connecting-ai-clients.md)** - Claude, Cursor, custom MCP clients

### Core Concepts
Understand how Moonsurf works.

- **[Architecture](concepts/architecture.md)** - Three-layer model, data flow
- **[MCP Protocol](concepts/mcp-protocol.md)** - Model Context Protocol fundamentals
- **[Browser Modes](concepts/browser-modes.md)** - Chrome vs Testing vs Chromium
- **[Instance Lifecycle](concepts/instance-lifecycle.md)** - Launch, connect, operate, close
- **[Extension Communication](concepts/extension-communication.md)** - Server-extension WebSocket protocol

### Tools Reference
Complete reference for all 10 MCP tools.

- **[Tools Overview](tools/README.md)** - Consolidated tool design philosophy
- **[browser_instance](tools/browser-instance.md)** - Manage browser instances
- **[browser_tab](tools/browser-tab.md)** - Tab management
- **[browser_navigate](tools/browser-navigate.md)** - Navigation and waiting
- **[browser_content](tools/browser-content.md)** - Screenshots, PDFs, DOM extraction
- **[browser_interact](tools/browser-interact.md)** - Click, type, scroll, select
- **[browser_execute](tools/browser-execute.md)** - JavaScript execution
- **[browser_network](tools/browser-network.md)** - Cookies, headers, storage
- **[browser_emulate](tools/browser-emulate.md)** - Device and network emulation
- **[browser_debug](tools/browser-debug.md)** - Debugging and monitoring
- **[sleep](tools/sleep.md)** - Wait for a specified duration

### Task Execution
Submit batched commands with real-time progress.

- **[Task System Overview](tasks/README.md)** - Introduction to task execution
- **[Getting Started with Tasks](tasks/getting-started.md)** - Quick start guide
- **[WebSocket API](tasks/websocket-api.md)** - Real-time protocol
- **[REST API](tasks/rest-api.md)** - HTTP endpoints
- **[Task Format](tasks/task-format.md)** - Command structure

### Configuration
Configure Moonsurf for your environment.

- **[Configuration Overview](configuration/README.md)** - Configuration concepts
- **[Environment Variables](configuration/environment-variables.md)** - Complete reference
- **[Local Mode](configuration/local-mode.md)** - Development setup
- **[Remote Mode](configuration/remote-mode.md)** - Production deployment
- **[Authentication](configuration/authentication.md)** - Token-based auth
- **[TLS Setup](configuration/tls-setup.md)** - HTTPS/WSS configuration
- **[Security Hardening](configuration/security-hardening.md)** - Rate limiting, CORS, audit logs

### Practical Guides
Learn common patterns and techniques.

- **[Guides Overview](guides/README.md)** - Available guides
- **[Form Filling](guides/form-filling.md)** - Login flows, multi-step forms
- **[Web Scraping](guides/web-scraping.md)** - Content extraction patterns
- **[File Downloads](guides/file-downloads.md)** - Download tracking
- **[Testing Workflows](guides/testing-workflows.md)** - E2E testing with AI
- **[Handling Popups](guides/handling-popups.md)** - Dialogs, new windows
- **[Network Interception](guides/network-interception.md)** - Request mocking
- **[Debugging Tips](guides/debugging-tips.md)** - Troubleshooting

### Integration
Connect Moonsurf to your tools.

- **[Integration Overview](integration/README.md)** - Available integrations
- **[Claude Code](integration/claude-code.md)** - Claude Code skill setup
- **[Claude Desktop](integration/claude-desktop.md)** - Claude Desktop MCP config
- **[Cursor](integration/cursor.md)** - Cursor IDE integration
- **[Custom Clients](integration/custom-clients.md)** - Building your own MCP client
- **[CI/CD](integration/ci-cd.md)** - GitHub Actions, headless mode

### API Reference
Technical specifications.

- **[API Overview](api-reference/README.md)** - Available APIs
- **[REST Tools API](api-reference/rest-api.md)** - Execute tools via simple HTTP calls
- **[HTTP Endpoints](api-reference/http-endpoints.md)** - All HTTP routes
- **[SSE Protocol](api-reference/sse-protocol.md)** - SSE message format
- **[WebSocket Protocol](api-reference/websocket-protocol.md)** - Extension messages
- **[Error Codes](api-reference/error-codes.md)** - All error types

### Development
For Moonsurf contributors.

- **[Development Overview](development/README.md)** - Contributor guide
- **[Project Structure](development/project-structure.md)** - Source file layout
- **[Local Setup](development/local-setup.md)** - Development environment
- **[Extension Development](development/extension-development.md)** - Chrome extension
- **[Adding Tools](development/adding-tools.md)** - Extending Moonsurf
- **[Testing](development/testing.md)** - Testing procedures
- **[Debugging](development/debugging.md)** - Logs, breakpoints
- **[Release Process](development/release-process.md)** - Publishing
- **[Internals](development/internals.md)** - Deep dive into state management

## Key Features

### 10 Consolidated Tools
Moonsurf reduces 50+ individual browser operations to 10 unified tools with action parameters. This significantly reduces context window usage for AI agents while maintaining full functionality.

### Three Browser Modes
- **Chrome** - Use your existing Chrome with saved profiles and extensions
- **Testing** - Temporary Chrome for Testing with clean state
- **Chromium** - Persistent Chromium profile optimized for automation

### Real-time Task Execution
Submit batched commands that execute sequentially with real-time progress reporting via WebSocket.

### Production Ready
Built-in support for authentication, TLS, rate limiting, CORS, and audit logging.

## Support

- **GitHub Issues**: [github.com/MoonsurfAI/browser-control/issues](https://github.com/MoonsurfAI/browser-control/issues)
- **Documentation**: You're reading it!

## Version

This documentation is for Moonsurf Browser Control v2.1.0.
