# Architecture

Moonsurf uses a three-layer architecture that separates concerns and enables flexible deployment options.

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AI Client Layer                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Claude    │  │   Cursor    │  │  Custom AI  │  │  Other MCP Clients  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          │ HTTP/SSE       │ HTTP/SSE       │ HTTP/SSE           │ HTTP/SSE
          │ (MCP Protocol) │                │                    │
          ▼                ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MCP Server Layer                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      Moonsurf MCP Server                              │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │   │
│  │  │ HTTP/SSE   │  │  MCP       │  │  Instance  │  │  Browser       │  │   │
│  │  │ Server     │  │  Handler   │  │  Manager   │  │  Launcher      │  │   │
│  │  │ :3300      │  │            │  │            │  │                │  │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────────┘  │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │   │
│  │  │ Task       │  │ Task WS    │  │ Download   │  │  Tool          │  │   │
│  │  │ Manager    │  │ Server     │  │ Watcher    │  │  Definitions   │  │   │
│  │  │            │  │ :3400      │  │            │  │                │  │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
          │
          │ WebSocket (localhost:3301-3399)
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Browser Extension Layer                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                    Moonsurf Chrome Extension                             ││
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────────────┐ ││
│  │  │ Background │  │  Content   │  │  DevTools  │  │  DOM               │ ││
│  │  │ Script     │  │  Scripts   │  │  Protocol  │  │  Interaction       │ ││
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         Browser Instance                                 ││
│  │                    (Chrome / Chromium / Testing)                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

## Layer Details

### AI Client Layer

**Purpose:** Interface for AI assistants to request browser operations.

**Components:**
- Any MCP-compatible client (Claude, Cursor, custom implementations)
- Connects via HTTP/SSE to the MCP server

**Communication:**
- Protocol: HTTP with Server-Sent Events (SSE)
- Port: 3300 (configurable)
- Format: JSON-RPC 2.0 over MCP

### MCP Server Layer

**Purpose:** Process tool requests, manage browser instances, orchestrate operations.

**Components:**

| Component | Responsibility |
|-----------|---------------|
| HTTP/SSE Server | Accept client connections, route requests |
| MCP Handler | Parse MCP protocol, execute tool calls |
| Instance Manager | Track browser instances, route messages |
| Browser Launcher | Spawn browser processes, load extensions |
| Task Manager | Queue and execute batched commands |
| Task WS Server | Real-time task progress via WebSocket |
| Download Watcher | Monitor file downloads |
| Tool Definitions | Define 9 consolidated tools |

**Ports:**
- `3300` - HTTP/SSE server for MCP clients
- `3301-3399` - WebSocket servers for browser instances
- `3400` - WebSocket server for task updates

### Browser Extension Layer

**Purpose:** Execute commands within the browser context.

**Components:**
- Background Script - WebSocket connection, message routing
- Content Scripts - DOM interaction on pages
- DevTools Protocol - Low-level browser control

**Communication:**
- Protocol: WebSocket
- Host: Always `localhost` (security)
- Port: Assigned dynamically (3301-3399)

## Data Flow

### Tool Call Flow

```
1. AI Client sends tool/call request
   └─► HTTP POST to /message?sessionId=xxx

2. MCP Server receives and parses request
   └─► handleMCPRequest() in mcp-handler.ts

3. Tool is resolved and routed
   └─► Consolidated tool → Original tool name
   └─► Server-side tool → Execute locally
   └─► Extension tool → Route to browser

4. Extension executes command
   └─► WebSocket message to browser
   └─► Extension executes in browser context

5. Result returns through same path
   └─► Extension → Server → SSE → Client
```

### Browser Launch Flow

```
1. AI requests browser_instance action:new
   └─► browser_instance tool call

2. Browser Launcher prepares environment
   └─► Ensure extension downloaded
   └─► Determine browser path
   └─► Set up user data directory

3. Browser process spawned
   └─► Chrome/Chromium started with flags
   └─► Extension auto-loaded (or manual)

4. Extension connects to server
   └─► POST /register with instance info
   └─► Server assigns WebSocket port
   └─► Extension connects via WebSocket

5. Instance registered and ready
   └─► Instance added to manager
   └─► Download watcher started
   └─► Instance ID returned to AI
```

## Port Allocation

| Port Range | Purpose | Configurable |
|------------|---------|--------------|
| 3300 | HTTP/SSE server | `PORT` env var |
| 3301-3399 | Instance WebSockets | `WS_PORT_START`, `WS_PORT_END` |
| 3400 | Task WebSocket | `TASKS_WS_PORT` |

**Maximum Concurrent Instances:** 99 (ports 3301-3399)

## Security Boundaries

### Remote vs Local

```
                    ┌──────────────────────────┐
  Remote Network    │     MCP Server           │    Local Only
        │           │    ┌─────────────┐       │         │
        │           │    │             │       │         │
   AI Client ────────────►  HTTP :3300 ├───────────► Browser Extension
        │           │    │             │       │    (localhost:3301-3399)
        │           │    └─────────────┘       │         │
                    └──────────────────────────┘         │
                                                         ▼
                                                    Browser Process
```

Key security properties:
- AI clients can connect remotely (with auth)
- Browser extension ONLY connects via localhost
- WebSocket ports never exposed externally
- All browser state stays local

### Authentication Points

1. **HTTP/SSE endpoint** - Bearer token or query parameter
2. **WebSocket (instance)** - Instance ID validation
3. **WebSocket (task)** - No additional auth (localhost only)

## Scaling Considerations

### Horizontal

Not directly supported - each server manages its own browser instances. For horizontal scaling:
- Deploy multiple Moonsurf instances
- Use a load balancer for AI client connections
- Each instance manages its own browsers

### Vertical

Single server can handle:
- Up to 99 concurrent browser instances
- Multiple AI clients connected simultaneously
- Parallel tool calls within reason

### Resource Usage

Per browser instance:
- ~150-300MB RAM (varies by page content)
- One WebSocket connection
- File system watcher for downloads

Per AI client:
- One SSE connection
- Minimal memory

## Related Topics

- [MCP Protocol](mcp-protocol.md) - Protocol details
- [Instance Lifecycle](instance-lifecycle.md) - Instance management
- [Extension Communication](extension-communication.md) - WebSocket protocol
