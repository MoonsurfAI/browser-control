# Core Concepts

Understanding Moonsurf's architecture and design principles will help you use it effectively. This section covers the fundamental concepts.

## Overview

Moonsurf is built on three key principles:

1. **AI-First Design** - Optimized for LLM context windows and natural language
2. **Protocol Standards** - Built on MCP (Model Context Protocol)
3. **Security by Default** - Proper isolation between AI client and browser

## Concept Index

### [Architecture](architecture.md)
Understanding the three-layer architecture:
- AI Client layer
- MCP Server layer
- Browser Extension layer

### [MCP Protocol](mcp-protocol.md)
How Moonsurf implements the Model Context Protocol:
- SSE transport
- JSON-RPC messages
- Tool discovery and execution

### [Browser Modes](browser-modes.md)
Three ways to launch browsers:
- `chrome` - Use existing Chrome profiles
- `testing` - Clean temporary environment
- `chromium` - Persistent automation profile

### [Instance Lifecycle](instance-lifecycle.md)
How browser instances are managed:
- Registration
- Connection
- Operation
- Cleanup

### [Extension Communication](extension-communication.md)
How the server talks to browsers:
- WebSocket protocol
- Message types
- Tool routing

## Key Design Decisions

### Consolidated Tools

Traditional browser automation exposes 50+ individual methods. Moonsurf consolidates these into 9 unified tools with action parameters:

```
Traditional: browser.click(), browser.type(), browser.scroll(), ...
Moonsurf:    browser_interact with action: "click" | "type" | "scroll" | ...
```

**Benefits:**
- Smaller context window footprint
- Easier for AI to understand the tool landscape
- Consistent parameter patterns

### Human-like Interaction

The `type` action simulates human typing:
- 100-200 WPM speed (not instant)
- Random delay between keystrokes
- Natural pauses after punctuation
- Occasional "thinking" delays

This helps avoid bot detection and creates more realistic automation.

### Local WebSocket

The server always communicates with browsers via localhost WebSocket, even when the MCP server accepts remote connections. This:
- Keeps browser communication fast
- Maintains security boundaries
- Allows remote AI clients while browsers run locally

### Instance Isolation

Each browser instance:
- Gets its own WebSocket port (3301-3399)
- Has independent state
- Can be controlled separately
- Cleans up on disconnect

## Related Topics

- [Tools Reference](../tools/README.md) - Complete tool documentation
- [Configuration](../configuration/README.md) - Server settings
- [API Reference](../api-reference/README.md) - Protocol details
