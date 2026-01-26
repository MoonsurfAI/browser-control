# Local Development Setup

Complete guide to setting up a local development environment for Moonsurf.

## Prerequisites

### Required

- **Node.js 18+** - JavaScript runtime
- **npm** - Package manager (comes with Node.js)
- **Git** - Version control
- **Chrome or Chromium** - Browser for testing

### Recommended

- **Visual Studio Code** - IDE with TypeScript support
- **Chrome DevTools** - Browser debugging
- **curl** or **Postman** - API testing

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/MoonsurfAI/browser-control
cd browser-control
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the Project

```bash
npm run build
```

### 4. Verify Installation

```bash
npm start
```

You should see:
```
[Moonsurf] Server starting...
[Server] Mode: LOCAL
[Server] SSE endpoint: http://localhost:3300/sse
[HTTP] Server listening on localhost:3300
```

Test the health endpoint:
```bash
curl http://localhost:3300/health
```

## Development Workflow

### Watch Mode

Run TypeScript compiler in watch mode for automatic rebuilds:

**Terminal 1 - Build:**
```bash
npm run dev
```

**Terminal 2 - Run:**
```bash
npm start
```

When you modify TypeScript files, they're automatically recompiled. Restart the server to apply changes.

### Debug Mode

Enable verbose logging:

```bash
LOG_LEVEL=debug npm start
```

### Visible Browser

See the browser during testing:

```bash
HEADLESS_DEFAULT=false npm start
```

## Browser Setup

### Option 1: Chromium (Recommended)

Install Chromium:

**macOS:**
```bash
brew install --cask chromium
```

**Ubuntu/Debian:**
```bash
sudo apt install chromium-browser
```

Run with Chromium:
```bash
BROWSER_DEFAULT_MODE=chromium npm start
```

### Option 2: Chrome for Testing

Chrome for Testing provides a stable, isolated environment.

```bash
BROWSER_DEFAULT_MODE=testing npm start
```

Moonsurf downloads Chrome for Testing automatically on first use.

### Option 3: System Chrome

Use existing Chrome installation:

```bash
BROWSER_DEFAULT_MODE=chrome npm start
```

Note: System Chrome may have existing profiles and extensions.

## Extension Development

If you're also developing the Chrome extension:

### 1. Clone Extension Repository

```bash
cd ..
git clone https://github.com/MoonsurfAI/chrome-extension
cd chrome-extension
npm install
```

### 2. Build Extension

```bash
npm run build
# Or for watch mode:
npm run dev
```

### 3. Run with Local Extension

```bash
cd ../browser-control
EXTENSION_PATH=../chrome-extension/dist npm start
```

### 4. Development Workflow

**Terminal 1 - Extension (watch):**
```bash
cd chrome-extension
npm run dev
```

**Terminal 2 - MCP Server:**
```bash
cd browser-control
npm run dev
```

**Terminal 3 - Run:**
```bash
cd browser-control
EXTENSION_PATH=../chrome-extension/dist npm start
```

## Testing with Claude Code

### Install the Skill

```bash
npm start -- --install-skill
```

### Configure MCP

Add to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

### Test in Claude Code

```bash
# Start Moonsurf
npm start

# In another terminal, use Claude Code
claude "Open example.com and take a screenshot"
```

## Common Commands

### Build

```bash
npm run build        # Compile TypeScript
npm run dev          # Compile in watch mode
npm run typecheck    # Type check without emitting
```

### Run

```bash
npm start                                    # Start server
LOG_LEVEL=debug npm start                   # With debug logging
HEADLESS_DEFAULT=false npm start            # With visible browser
EXTENSION_PATH=../chrome-extension/dist npm start  # With local extension
```

### Test

```bash
# Manual testing with curl
curl http://localhost:3300/health
curl http://localhost:3300/info

# Test SSE connection
curl -N http://localhost:3300/sse

# Test tool listing
curl -X POST http://localhost:3300/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Skill Management

```bash
npm start -- --install-skill    # Install Claude skill
npm start -- --uninstall-skill  # Uninstall skill
npm start -- --skill-status     # Check installation
```

## Environment Variables

Common development variables:

```bash
# Server
PORT=3300               # HTTP port
HOST=localhost          # Bind address
LOG_LEVEL=debug         # debug | info | warn | error

# Browser
BROWSER_DEFAULT_MODE=chromium  # chromium | chrome | testing
HEADLESS_DEFAULT=false         # Show browser window
EXTENSION_PATH=./extension     # Local extension path

# Features
TASKS_ENABLED=true      # Enable task system
TASKS_WS_PORT=3400      # Task WebSocket port
```

## IDE Setup

### Visual Studio Code

Recommended extensions:
- ESLint
- Prettier
- TypeScript Vue Plugin

Settings (`.vscode/settings.json`):
```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### Launch Configuration

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Moonsurf",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/dist/index.js",
      "env": {
        "LOG_LEVEL": "debug",
        "HEADLESS_DEFAULT": "false"
      },
      "preLaunchTask": "npm: build"
    }
  ]
}
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3300

# Kill process
kill -9 <PID>

# Or use different port
PORT=3400 npm start
```

### Extension Not Connecting

1. Check browser launched successfully
2. Verify extension loaded (chrome://extensions in browser)
3. Check server logs for registration
4. Ensure correct port range available (3301-3399)

### TypeScript Errors

```bash
# Clean build
rm -rf dist
npm run build
```

### Permission Errors

```bash
# Fix npm global permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.moonsurf
```

### Browser Not Found

```bash
# Check Chrome/Chromium path
which chromium
which google-chrome

# Set custom path if needed
CHROME_PATH=/path/to/chrome npm start
```

## Related

- [Project Structure](project-structure.md) - Code organization
- [Extension Development](extension-development.md) - Chrome extension
- [Debugging](debugging.md) - Troubleshooting guide
