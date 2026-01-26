# Claude Code Integration

Connect Moonsurf with Claude Code (the CLI-based AI assistant) for browser automation directly from your terminal.

## Overview

Claude Code can use Moonsurf in two ways:

1. **Skill Installation** (Recommended) - Claude automatically knows about browser tools
2. **MCP Configuration** - Direct connection via config file

## Method 1: Skill Installation

### Install the Skill

```bash
npx @moonsurf/browser-control --install-skill
```

This copies skill files to `~/.claude/skills/moonsurf-browser/`.

### How It Works

After installation, Claude Code automatically recognizes browser automation requests:

```
User: "Navigate to example.com and take a screenshot"
Claude: [Uses Moonsurf tools automatically]
```

### Verify Installation

```bash
npx @moonsurf/browser-control --skill-status
```

### Uninstall

```bash
npx @moonsurf/browser-control --uninstall-skill
```

## Method 2: MCP Configuration

### Config File Location

- macOS/Linux: `~/.claude/mcp.json`
- Windows: `%USERPROFILE%\.claude\mcp.json`

### Basic Configuration

```json
{
  "mcpServers": {
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
  "mcpServers": {
    "moonsurf": {
      "url": "https://mcp.example.com/sse?token=your-secret-token"
    }
  }
}
```

## Starting the Server

### Basic Start

Before using Moonsurf with Claude Code, start the server:

```bash
npx @moonsurf/browser-control
```

### Development Mode

```bash
# With debug logging
LOG_LEVEL=debug npx @moonsurf/browser-control

# With visible browser
HEADLESS_DEFAULT=false npx @moonsurf/browser-control
```

### Keep Running

Use a separate terminal or run in background:

```bash
# Run in background (Unix)
npx @moonsurf/browser-control &

# Or use a process manager
pm2 start "npx @moonsurf/browser-control" --name moonsurf
```

## Usage Examples

### Simple Navigation

```
User: "Go to https://news.ycombinator.com and tell me the top 3 stories"

Claude: I'll navigate to Hacker News and extract the top stories.
[Uses browser_instance, browser_navigate, browser_content tools]
```

### Form Automation

```
User: "Fill out the contact form at example.com/contact with name 'Test User'"

Claude: I'll fill out the contact form for you.
[Uses browser tools to navigate and interact with form]
```

### Web Scraping

```
User: "Scrape all product prices from shop.example.com/products"

Claude: I'll extract the product prices from that page.
[Uses browser_content to extract data]
```

### Screenshot Capture

```
User: "Take a screenshot of google.com"

Claude: I'll capture a screenshot of Google's homepage.
[Uses browser_content action="screenshot"]
```

## Workflow Tips

### 1. Start Server First

Always ensure the Moonsurf server is running before asking Claude to use browser tools:

```bash
# Terminal 1: Start server
npx @moonsurf/browser-control

# Terminal 2: Use Claude Code
claude
```

### 2. Be Specific

Claude works best with clear instructions:

```
# Good
"Navigate to github.com/anthropics, click on 'Repositories', and list the first 5 repos"

# Less clear
"Show me Anthropic's repos"
```

### 3. Use Step-by-Step for Complex Tasks

```
User: "I need to:
1. Go to my-app.com/admin
2. Log in with username 'admin' and password 'test123'
3. Click on 'Reports'
4. Download the monthly report"

Claude: I'll complete this multi-step task for you.
```

### 4. Verify Results

Ask Claude to confirm actions:

```
User: "After submitting the form, verify the success message appears"
```

## Troubleshooting

### "Server not available"

1. Check server is running:
   ```bash
   curl http://localhost:3300/health
   ```
2. Verify port matches config
3. Restart the server

### "Tool not found"

1. Check MCP config is valid JSON
2. Verify config file location
3. Restart Claude Code

### "Browser not launching"

1. Check Chrome/Chromium is installed
2. Try with `BROWSER_DEFAULT_MODE=chromium`
3. Check server logs for errors

### "Permission denied"

For skill installation issues:

```bash
# Check directory permissions
ls -la ~/.claude/skills/

# Manual fix if needed
mkdir -p ~/.claude/skills
chmod 755 ~/.claude/skills
```

### Slow Performance

1. Run browser in headless mode:
   ```bash
   HEADLESS_DEFAULT=true npx @moonsurf/browser-control
   ```
2. Close unused browser instances
3. Reduce screenshot quality if taking many

## Best Practices

### 1. Dedicated Terminal

Keep a terminal dedicated to the Moonsurf server so you can see logs and restart easily.

### 2. Use Testing Mode for Scripts

```bash
BROWSER_DEFAULT_MODE=testing npx @moonsurf/browser-control
```

This ensures clean browser state each time.

### 3. Close Instances When Done

Ask Claude to close browser instances after tasks:

```
User: "Close all browser windows when you're done"
```

### 4. Monitor Resource Usage

Browser instances consume memory. Keep an eye on system resources for long-running sessions.

## Advanced Configuration

### Multiple Servers

Connect to multiple Moonsurf instances:

```json
{
  "mcpServers": {
    "moonsurf-local": {
      "url": "http://localhost:3300/sse"
    },
    "moonsurf-remote": {
      "url": "https://remote.example.com/sse?token=xxx"
    }
  }
}
```

### Custom Port

```bash
# Server
PORT=3400 npx @moonsurf/browser-control

# Config
{
  "mcpServers": {
    "moonsurf": {
      "url": "http://localhost:3400/sse"
    }
  }
}
```

## Related

- [Installation](../getting-started/installation.md) - Server setup
- [First Automation](../getting-started/first-automation.md) - Tutorial
- [Tools Reference](../tools/README.md) - Available tools
