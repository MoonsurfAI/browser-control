# Claude Desktop Integration

Connect Moonsurf with Claude Desktop for browser automation through the desktop application.

## Overview

Claude Desktop supports MCP servers through its configuration file. Once connected, you can ask Claude to automate browser tasks directly from the desktop app.

## Configuration

### Config File Location

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

### Basic Configuration

Create or edit the config file:

```json
{
  "mcpServers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
```

### With Authentication (Remote Server)

```json
{
  "mcpServers": {
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

Or use npx (no install needed):

```bash
npx @moonsurf/browser-control
```

### 2. Start the Server

```bash
moonsurf
# Or: npx @moonsurf/browser-control
```

Keep this terminal open.

### 3. Create Config File

macOS/Linux:
```bash
# Create directory if needed
mkdir -p "~/Library/Application Support/Claude"

# Create config
cat > "~/Library/Application Support/Claude/claude_desktop_config.json" << 'EOF'
{
  "mcpServers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
EOF
```

Windows (PowerShell):
```powershell
# Create directory
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Claude"

# Create config
@'
{
  "mcpServers": {
    "moonsurf": {
      "url": "http://localhost:3300/sse"
    }
  }
}
'@ | Out-File "$env:APPDATA\Claude\claude_desktop_config.json" -Encoding utf8
```

### 4. Restart Claude Desktop

Close and reopen Claude Desktop to load the new configuration.

### 5. Verify Connection

In Claude Desktop, ask:

```
"What browser automation tools do you have available?"
```

Claude should list the Moonsurf tools.

## Usage

### Example Conversations

**Simple navigation:**
```
User: Navigate to github.com and tell me what's on the trending page

Claude: I'll navigate to GitHub and check the trending repositories.
[Uses browser tools]
```

**Taking screenshots:**
```
User: Take a screenshot of the Apple website homepage

Claude: I'll capture a screenshot of Apple's homepage for you.
[Uses browser_content screenshot]
```

**Form filling:**
```
User: Go to example.com/contact and fill out the form with:
- Name: John Doe
- Email: john@example.com
- Message: Hello, this is a test

Claude: I'll fill out that contact form for you.
[Uses browser tools to navigate and fill form]
```

**Data extraction:**
```
User: Get the current weather from weather.com for New York

Claude: I'll check the weather for New York.
[Uses browser to navigate and extract content]
```

## Auto-Start Server (Optional)

### macOS (launchd)

Create `~/Library/LaunchAgents/com.moonsurf.browser-control.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.moonsurf.browser-control</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/@moonsurf/browser-control/dist/index.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/moonsurf.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/moonsurf.log</string>
</dict>
</plist>
```

Load it:
```bash
launchctl load ~/Library/LaunchAgents/com.moonsurf.browser-control.plist
```

### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: "When I log on"
4. Action: Start a program
5. Program: `node`
6. Arguments: `C:\Users\YourName\AppData\Roaming\npm\node_modules\@moonsurf\browser-control\dist\index.js`

### Linux (systemd)

Create `~/.config/systemd/user/moonsurf.service`:

```ini
[Unit]
Description=Moonsurf Browser Control
After=network.target

[Service]
ExecStart=/usr/bin/npx @moonsurf/browser-control
Restart=always

[Install]
WantedBy=default.target
```

Enable:
```bash
systemctl --user enable moonsurf
systemctl --user start moonsurf
```

## Troubleshooting

### "Tools not available"

1. **Check server is running:**
   ```bash
   curl http://localhost:3300/health
   ```

2. **Verify config file:**
   - Check file exists at correct location
   - Validate JSON syntax
   - Confirm URL is correct

3. **Restart Claude Desktop:**
   - Fully quit (not just close window)
   - Reopen the app

### "Connection refused"

1. Start the Moonsurf server
2. Check if port 3300 is in use:
   ```bash
   lsof -i :3300
   ```
3. Try a different port:
   ```bash
   PORT=3400 moonsurf
   ```
   Update config to match.

### "Browser not launching"

1. Verify Chrome/Chromium is installed
2. Check server logs for errors
3. Try headless mode:
   ```bash
   HEADLESS_DEFAULT=true moonsurf
   ```

### Config file not found

Ensure the directory exists:

```bash
# macOS
mkdir -p ~/Library/Application\ Support/Claude

# Linux
mkdir -p ~/.config/Claude

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Claude"
```

## Best Practices

### 1. Keep Server Running

Moonsurf server must be running before you can use browser tools. Consider auto-start options above.

### 2. Use Visible Mode for Debugging

```bash
HEADLESS_DEFAULT=false moonsurf
```

Watch the browser to understand what's happening.

### 3. Close Instances When Done

Ask Claude to close browser windows when finished to free resources:

```
"Please close the browser when you're done"
```

### 4. Monitor Server Logs

Keep the server terminal visible to see activity and debug issues.

## Security Notes

### Local Use

Default configuration is safe for local use - server binds to localhost only.

### Remote Access

If running Moonsurf on a remote server:

1. Enable authentication:
   ```bash
   REMOTE_MODE=true AUTH_TOKENS=secret-token moonsurf
   ```

2. Use HTTPS:
   ```bash
   TLS_ENABLED=true TLS_CERT_PATH=... TLS_KEY_PATH=... moonsurf
   ```

3. Include token in config:
   ```json
   {
     "mcpServers": {
       "moonsurf": {
         "url": "https://your-server.com/sse?token=secret-token"
       }
     }
   }
   ```

## Related

- [Installation](../getting-started/installation.md) - Server setup
- [Configuration](../configuration/README.md) - Server options
- [Authentication](../configuration/authentication.md) - Security setup
