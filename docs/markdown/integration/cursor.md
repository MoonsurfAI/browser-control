# Cursor Integration

Connect Moonsurf with Cursor IDE for browser automation in your development workflow.

## Overview

Cursor supports MCP servers for AI tool integration. By connecting Moonsurf, you can automate browser tasks directly from your IDE.

## Configuration

### Config File Location

Cursor's MCP configuration is typically in your workspace or user settings.

**Workspace settings:** `.cursor/mcp.json`

**User settings:** Check Cursor's settings UI for MCP configuration.

### Basic Configuration

```json
{
  "mcp.servers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

### With Authentication

For remote servers:

```json
{
  "mcp.servers": {
    "moonsurf": {
      "url": "https://mcp.example.com/sse?token=your-secret-token"
    }
  }
}
```

## Setup Steps

### 1. Install Moonsurf

```bash
npm install -g @moonsurf/browser-control
```

### 2. Start the Server

In a terminal:

```bash
moonsurf
```

Or use Cursor's integrated terminal.

### 3. Configure Cursor

Create `.cursor/mcp.json` in your project root:

```json
{
  "mcp.servers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

### 4. Reload Cursor

Restart Cursor or reload the window to pick up the configuration.

### 5. Verify Connection

Ask Cursor's AI:

```
What browser automation tools are available?
```

## Usage Examples

### Testing Your Application

```
User: Launch a browser and navigate to my local dev server at localhost:3000

Cursor: I'll open your development server in a browser.
[Uses browser_instance and browser_navigate]
```

### UI Testing

```
User: Click the login button on localhost:3000 and verify the login form appears

Cursor: I'll test the login flow for you.
[Uses browser tools to interact and verify]
```

### Screenshot Documentation

```
User: Take screenshots of each page of my app for documentation

Cursor: I'll capture screenshots of your application pages.
[Navigates and captures screenshots]
```

### Debugging Visual Issues

```
User: Navigate to my app and check if the header is displaying correctly

Cursor: I'll check the header rendering.
[Uses browser tools, captures screenshot, analyzes]
```

## Development Workflow Integration

### 1. Run Server with Your App

**Terminal 1 - Your app:**
```bash
npm run dev
```

**Terminal 2 - Moonsurf:**
```bash
moonsurf
```

**Terminal 3 - Use Cursor**

### 2. Test-Driven Development

```
User: Run my app, test the signup form with email test@example.com and password test123, then verify the welcome page loads

Cursor: I'll test the complete signup flow.
[Executes test steps with browser tools]
```

### 3. Visual Regression Checks

```
User: Take a screenshot of the homepage and compare it to what you saw before my CSS changes

Cursor: I'll capture the current state for comparison.
[Takes screenshot, compares to previous]
```

## Workspace Configuration

### Per-Project Setup

Create `.cursor/mcp.json` in each project that needs browser automation:

```json
{
  "mcp.servers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

### Different Ports per Project

If running multiple instances:

**Project A - `.cursor/mcp.json`:**
```json
{
  "mcp.servers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

**Project B - `.cursor/mcp.json`:**
```json
{
  "mcp.servers": {
    "moonsurf": {
      "url": "http://localhost:3400/sse"
    }
  }
}
```

### Shared Remote Server

For team development:

```json
{
  "mcp.servers": {
    "moonsurf": {
      "url": "https://dev-tools.company.com/sse?token=team-token"
    }
  }
}
```

## Cursor-Specific Tips

### 1. Use Integrated Terminal

Run Moonsurf in Cursor's integrated terminal for easy access:

```bash
# In Cursor terminal
moonsurf
```

### 2. Split Terminal View

- Left terminal: Your app (`npm run dev`)
- Right terminal: Moonsurf (`moonsurf`)

### 3. Debug Logging

Enable verbose logging to see what's happening:

```bash
LOG_LEVEL=debug moonsurf
```

### 4. Visible Browser for Debugging

```bash
HEADLESS_DEFAULT=false moonsurf
```

Watch the browser alongside your code.

## Common Use Cases

### Frontend Development

```
User: Open localhost:3000/dashboard and tell me if there are any console errors

Cursor: I'll check for JavaScript errors.
[Navigates, checks console, reports]
```

### API Integration Testing

```
User: Navigate to the API test page, submit a form, and verify the response

Cursor: I'll test the API integration.
[Uses browser to submit form, monitors network]
```

### Cross-Browser Testing

```
User: Check how my app looks in mobile viewport

Cursor: I'll check the mobile view.
[Uses browser_emulate to set mobile viewport]
```

### Documentation Generation

```
User: Navigate through my app and take screenshots of each main feature

Cursor: I'll capture screenshots for documentation.
[Systematically navigates and captures]
```

## Troubleshooting

### "MCP server not found"

1. Check `.cursor/mcp.json` exists and is valid JSON
2. Verify file is in correct location
3. Reload Cursor window

### "Connection refused"

1. Verify Moonsurf server is running
2. Check port matches configuration
3. Ensure firewall isn't blocking

### "Tools not available"

1. Verify MCP configuration is correct
2. Restart Cursor
3. Check server health: `curl http://localhost:3300/health`

### Browser not visible

If you need to see the browser:

```bash
HEADLESS_DEFAULT=false moonsurf
```

### Slow response

1. Check server logs for errors
2. Ensure browser isn't overloaded
3. Close unused browser instances

## Best Practices

### 1. Keep Server Running

Start Moonsurf at the beginning of your dev session.

### 2. Use Testing Mode for Tests

```bash
BROWSER_DEFAULT_MODE=testing moonsurf
```

Clean state for each test.

### 3. Close Instances

Ask the AI to close browser instances when done to free memory.

### 4. Combine with Unit Tests

Use browser automation for E2E testing alongside your unit tests.

## Related

- [Installation](../getting-started/installation.md) - Setup guide
- [Testing Workflows](../guides/testing-workflows.md) - Testing patterns
- [Custom Clients](custom-clients.md) - Direct integration
