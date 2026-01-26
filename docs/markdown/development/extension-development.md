# Extension Development

Guide to developing the Chrome extension alongside the MCP server.

## Overview

Moonsurf consists of two main components:
1. **MCP Server** (this repository) - Node.js server that handles MCP protocol
2. **Chrome Extension** (separate repository) - Executes commands in the browser

This guide covers developing both together.

## Extension Architecture

```
MCP Server                    Chrome Extension
    │                              │
    │ ←── WebSocket ───────────────┤
    │                              │
    └── HTTP (/register) ──────────┘
```

The extension:
1. Registers with the server on startup
2. Receives commands via WebSocket
3. Executes actions in the browser
4. Returns results via WebSocket

## Repository Structure

```
MoonsurfAI/
├── browser-control/       # MCP Server (this repo)
└── chrome-extension/      # Chrome Extension
    ├── src/
    │   ├── background.ts  # Service worker
    │   ├── content.ts     # Content script
    │   └── ...
    ├── manifest.json      # Extension manifest
    └── package.json
```

## Setting Up Extension Development

### 1. Clone Both Repositories

```bash
# Clone extension alongside server
cd ~/projects  # or wherever you keep projects
git clone https://github.com/MoonsurfAI/browser-control
git clone https://github.com/MoonsurfAI/chrome-extension
```

### 2. Install Extension Dependencies

```bash
cd chrome-extension
npm install
```

### 3. Build Extension

```bash
npm run build
```

Output goes to `dist/` directory.

### 4. Configure Server for Local Extension

```bash
cd ../browser-control
export EXTENSION_PATH=../chrome-extension/dist
npm start
```

## Development Workflow

### Recommended Setup

Use three terminals:

**Terminal 1 - Extension Watch:**
```bash
cd chrome-extension
npm run dev
```

**Terminal 2 - Server Watch:**
```bash
cd browser-control
npm run dev
```

**Terminal 3 - Run Server:**
```bash
cd browser-control
EXTENSION_PATH=../chrome-extension/dist npm start
```

### Making Changes

1. Edit extension code in `chrome-extension/src/`
2. Extension rebuilds automatically (watch mode)
3. Launch new browser instance to pick up changes
4. Or reload extension in existing browser

### Reloading Extension

If the browser is already running:
1. Go to `chrome://extensions`
2. Find Moonsurf extension
3. Click "Reload" button
4. Re-register with server (may need new browser instance)

## Extension Components

### Background Script (`background.ts`)

The service worker handles:
- Server registration
- WebSocket connection
- Message routing
- Tool execution coordination

### Content Script (`content.ts`)

Injected into web pages to:
- Execute DOM operations
- Handle interactions
- Extract content
- Monitor events

### Manifest (`manifest.json`)

Declares permissions and components:
```json
{
  "manifest_version": 3,
  "permissions": [
    "tabs",
    "activeTab",
    "scripting",
    "downloads",
    "webRequest"
  ]
}
```

## Communication Flow

### 1. Registration

```
Extension                    MCP Server
    │                            │
    │── POST /register ─────────→│
    │   {extensionId, userAgent} │
    │                            │
    │←── {instanceId, port} ─────│
    │                            │
    │── WebSocket connect ──────→│
    │   ws://localhost:{port}    │
```

### 2. Tool Execution

```
Extension                    MCP Server                  AI Client
    │                            │                          │
    │                            │←── tools/call ──────────│
    │                            │                          │
    │←── WebSocket {command} ────│                          │
    │                            │                          │
    │── Execute in browser ──────│                          │
    │                            │                          │
    │── WebSocket {result} ─────→│                          │
    │                            │                          │
    │                            │── MCP response ─────────→│
```

## Adding New Functionality

### Adding Server-Side Tool

In `browser-control/src/tool-definitions.ts`:

```typescript
// 1. Add to tools array
{
  name: 'browser_new_tool',
  description: 'Description here',
  inputSchema: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['do_something'] },
      // ... parameters
    }
  }
}

// 2. Add execution handler
async function executeTool(name, args) {
  // ... existing code ...

  if (name === 'browser_new_tool') {
    return handleNewTool(args);
  }
}
```

### Adding Extension Command Handler

In `chrome-extension/src/background.ts`:

```typescript
// Handle new command type
function handleCommand(command) {
  switch (command.type) {
    case 'new_command':
      return executeNewCommand(command.params);
    // ... existing handlers
  }
}
```

### Adding Content Script Functionality

In `chrome-extension/src/content.ts`:

```typescript
// Add new DOM operation
function newOperation(params) {
  // Execute in page context
  return document.querySelector(params.selector)?.textContent;
}

// Register message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'new_operation') {
    sendResponse(newOperation(message.params));
  }
});
```

## Debugging Extension

### Background Script

1. Go to `chrome://extensions`
2. Find Moonsurf extension
3. Click "Service worker" link
4. DevTools opens for background script

### Content Script

1. Open any web page
2. Open DevTools (F12)
3. Go to Sources tab
4. Find content script under "Content scripts"

### Console Logging

Background script logs appear in its DevTools.
Content script logs appear in page DevTools.

Add logging for debugging:
```typescript
console.log('[Moonsurf Extension]', 'message', data);
```

## Testing Extension Changes

### Manual Testing

1. Make extension change
2. Rebuild: `npm run build`
3. Launch browser: `npm start` (in server)
4. Test functionality

### With Debug Logging

```bash
LOG_LEVEL=debug EXTENSION_PATH=../chrome-extension/dist npm start
```

Shows WebSocket messages and tool calls.

## Common Issues

### Extension Not Loading

1. Check manifest.json is valid
2. Verify dist/ directory exists
3. Check EXTENSION_PATH is correct
4. Look for errors in chrome://extensions

### WebSocket Connection Failed

1. Check server is running
2. Verify port is available
3. Check firewall settings
4. Look for errors in extension DevTools

### Content Script Not Injecting

1. Check permissions in manifest
2. Verify URL patterns match
3. Check for CSP restrictions
4. Try different page

### Changes Not Applying

1. Rebuild extension: `npm run build`
2. Reload extension in chrome://extensions
3. Launch new browser instance
4. Clear browser cache

## Extension Best Practices

### 1. Error Handling

Always handle errors gracefully:
```typescript
try {
  const result = await executeCommand(cmd);
  return { success: true, result };
} catch (error) {
  return { success: false, error: error.message };
}
```

### 2. Message Validation

Validate incoming messages:
```typescript
if (!message.type || !message.params) {
  throw new Error('Invalid message format');
}
```

### 3. Resource Cleanup

Clean up on disconnect:
```typescript
ws.onclose = () => {
  // Clean up timers, listeners, etc.
  cleanup();
};
```

### 4. Timeout Handling

Add timeouts for operations:
```typescript
const result = await Promise.race([
  executeOperation(),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 30000)
  )
]);
```

## Related

- [Project Structure](project-structure.md) - Server code organization
- [Adding Tools](adding-tools.md) - Extend tool functionality
- [Debugging](debugging.md) - Troubleshooting
