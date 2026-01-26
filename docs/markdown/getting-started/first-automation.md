# First Automation

This guide walks you through creating your first browser automation with Moonsurf. We'll launch a browser, navigate to a website, interact with it, and take a screenshot.

## Prerequisites

- Moonsurf installed and running (`moonsurf`)
- An AI client connected, or you can follow along using curl

## Understanding the Tools

Before we start, let's understand the tools we'll use:

| Tool | Purpose |
|------|---------|
| `browser_instance` | Launch and manage browser instances |
| `browser_navigate` | Navigate to URLs, go back/forward |
| `browser_interact` | Click, type, scroll, select |
| `browser_content` | Take screenshots, get page content |

## Step 1: Launch a Browser

First, we launch a browser instance:

```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "new",
    "mode": "chromium",
    "url": "https://www.google.com"
  }
}
```

**Response:**
```json
{
  "instanceId": "inst_1706234567890_abc123",
  "browserType": "Chromium",
  "profile": "(persistent)",
  "downloadDirectory": "/Users/you/Downloads",
  "extensionAutoLoaded": true,
  "message": "Browser launched with extension auto-loaded."
}
```

**Key points:**
- `instanceId` is used for all subsequent commands
- `mode: "chromium"` uses the persistent Chromium profile
- The extension is auto-loaded

## Step 2: Navigate to a Page

Now let's navigate to a specific page:

```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "goto",
    "instanceId": "inst_1706234567890_abc123",
    "url": "https://news.ycombinator.com",
    "waitUntil": "domcontentloaded"
  }
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://news.ycombinator.com/",
  "title": "Hacker News"
}
```

## Step 3: Interact with the Page

Let's click on a link. First, we can query elements:

```json
{
  "name": "browser_content",
  "arguments": {
    "action": "query",
    "instanceId": "inst_1706234567890_abc123",
    "selector": ".titleline a"
  }
}
```

This returns information about matching elements. Now let's click the first link:

```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "click",
    "instanceId": "inst_1706234567890_abc123",
    "selector": ".titleline a"
  }
}
```

## Step 4: Type into a Search Box

Let's go to Google and search for something:

```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "goto",
    "instanceId": "inst_1706234567890_abc123",
    "url": "https://www.google.com"
  }
}
```

Type into the search box:

```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "type",
    "instanceId": "inst_1706234567890_abc123",
    "selector": "textarea[name='q']",
    "text": "Moonsurf browser automation"
  }
}
```

**Note:** The `type` action uses human-like typing with natural delays (100-200 WPM). This helps avoid detection and makes the automation more natural.

Press Enter to search:

```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "press",
    "instanceId": "inst_1706234567890_abc123",
    "key": "Enter"
  }
}
```

## Step 5: Wait for Content

After navigation, wait for specific elements to appear:

```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "wait",
    "instanceId": "inst_1706234567890_abc123",
    "selector": "#search",
    "timeout": 10000
  }
}
```

You can also wait for JavaScript conditions:

```json
{
  "name": "browser_navigate",
  "arguments": {
    "action": "wait",
    "instanceId": "inst_1706234567890_abc123",
    "expression": "document.querySelectorAll('.g').length > 0",
    "timeout": 10000
  }
}
```

## Step 6: Take a Screenshot

Capture what's on screen:

```json
{
  "name": "browser_content",
  "arguments": {
    "action": "screenshot",
    "instanceId": "inst_1706234567890_abc123",
    "format": "png"
  }
}
```

For a full-page screenshot:

```json
{
  "name": "browser_content",
  "arguments": {
    "action": "screenshot",
    "instanceId": "inst_1706234567890_abc123",
    "fullPage": true,
    "format": "png"
  }
}
```

## Step 7: Get Page Content

Extract the visible DOM elements:

```json
{
  "name": "browser_content",
  "arguments": {
    "action": "get_viewport_dom",
    "instanceId": "inst_1706234567890_abc123",
    "maxElements": 100,
    "domDepth": 3
  }
}
```

This returns a structured representation of visible elements with their positions and text content.

## Step 8: Close the Browser

When done, close the browser instance:

```json
{
  "name": "browser_instance",
  "arguments": {
    "action": "close",
    "instanceId": "inst_1706234567890_abc123"
  }
}
```

## Complete Example: Login Flow

Here's a complete example automating a login flow:

```json
// 1. Launch browser
{ "name": "browser_instance", "arguments": { "action": "new", "mode": "chromium" }}

// 2. Navigate to login page
{ "name": "browser_navigate", "arguments": { "action": "goto", "url": "https://example.com/login" }}

// 3. Wait for form to load
{ "name": "browser_navigate", "arguments": { "action": "wait", "selector": "#login-form" }}

// 4. Enter username
{ "name": "browser_interact", "arguments": { "action": "type", "selector": "#username", "text": "myuser" }}

// 5. Enter password
{ "name": "browser_interact", "arguments": { "action": "type", "selector": "#password", "text": "mypassword" }}

// 6. Click login button
{ "name": "browser_interact", "arguments": { "action": "click", "selector": "#login-button" }}

// 7. Wait for dashboard
{ "name": "browser_navigate", "arguments": { "action": "wait", "selector": ".dashboard", "timeout": 10000 }}

// 8. Take screenshot of result
{ "name": "browser_content", "arguments": { "action": "screenshot" }}
```

## Tips for Effective Automation

### Use Robust Selectors

Prefer selectors that are unlikely to change:
- `#unique-id` - IDs are most stable
- `[data-testid="login"]` - Test IDs are designed for automation
- `button[type="submit"]` - Semantic attributes
- Avoid: `.btn-primary-xl-2` - Class names often change

### Handle Dynamic Content

Wait for elements before interacting:
```json
{ "name": "browser_navigate", "arguments": { "action": "wait", "selector": "#element" }}
{ "name": "browser_interact", "arguments": { "action": "click", "selector": "#element" }}
```

### Debug with Screenshots

Take screenshots at key points to see what the browser sees:
```json
{ "name": "browser_content", "arguments": { "action": "screenshot" }}
```

### Use Text-Based Selectors

When elements don't have good IDs, use text content:
```json
{ "name": "browser_interact", "arguments": { "action": "click", "selector": "text=Sign In" }}
```

Or find elements containing text:
```json
{ "name": "browser_interact", "arguments": { "action": "click", "selector": "button:has-text(Submit)" }}
```

## Next Steps

- [Connecting AI Clients](connecting-ai-clients.md) - Connect Claude, Cursor, etc.
- [Tools Reference](../tools/README.md) - Complete tool documentation
- [Guides](../guides/README.md) - Common automation patterns
