# browser_interact

Simulate user input. Click, type, scroll, select from dropdowns, upload files, and more.

## Actions

| Action | Description |
|--------|-------------|
| `click` | Click an element |
| `move` | Move mouse to position |
| `type` | Type text into an element |
| `press` | Press a keyboard key |
| `scroll` | Scroll the page |
| `hover` | Hover over an element |
| `select` | Select option from dropdown |
| `upload` | Upload files to input |

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | One of the actions above |
| `instanceId` | string | No | Target browser instance |
| `tabId` | number | No | Target tab ID |
| `selector` | string | Varies | CSS selector or text selector |
| `x` | number | For `move`, `click` | X coordinate |
| `y` | number | For `move`, `click` | Y coordinate |
| `text` | string | For `type` | Text to type |
| `key` | string | For `press` | Key to press |
| `ctrl` | boolean | For `press` | Hold Ctrl key |
| `alt` | boolean | For `press` | Hold Alt key |
| `shift` | boolean | For `press` | Hold Shift key |
| `meta` | boolean | For `press` | Hold Meta/Cmd key |
| `delay` | number | For `type` | Delay between keystrokes (ms) |
| `deltaX` | number | For `scroll` | Horizontal scroll amount |
| `deltaY` | number | For `scroll` | Vertical scroll amount |
| `value` | string | For `select` | Option value to select |
| `label` | string | For `select` | Option label to select |
| `index` | number | For `select` | Option index to select |
| `files` | string[] | For `upload` | File paths to upload |

## Action: click

Click an element or coordinates.

### Click by Selector
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "click",
    "selector": "#submit-button"
  }
}
```

### Click by Text Content
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "click",
    "selector": "text=Sign In"
  }
}
```

### Click by Coordinates
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "click",
    "x": 150,
    "y": 200
  }
}
```

### Response
```json
{
  "clicked": true,
  "selector": "#submit-button"
}
```

## Action: move

Move the mouse to a position.

### Move to Coordinates
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "move",
    "x": 300,
    "y": 400
  }
}
```

### Move to Element
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "move",
    "selector": "#target-element"
  }
}
```

## Action: type

Type text into an element. Uses human-like typing by default.

### Basic Typing
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "type",
    "selector": "#email",
    "text": "user@example.com"
  }
}
```

### Human-Like Typing (Default)
When no `delay` is specified, typing simulates human behavior:
- 100-200 WPM speed
- Random delays between keystrokes
- Natural pauses after punctuation
- Occasional "thinking" delays

```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "type",
    "selector": "#message",
    "text": "Hello, world! How are you today?"
  }
}
```

### Instant Typing
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "type",
    "selector": "#search",
    "text": "search query",
    "delay": 0
  }
}
```

### Custom Delay
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "type",
    "selector": "#input",
    "text": "slow typing",
    "delay": 100
  }
}
```

### Response
```json
{
  "typed": true,
  "text": "user@example.com"
}
```

## Action: press

Press keyboard keys.

### Press Enter
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "press",
    "key": "Enter"
  }
}
```

### Press Tab
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "press",
    "key": "Tab"
  }
}
```

### Press Escape
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "press",
    "key": "Escape"
  }
}
```

### Keyboard Shortcut (Ctrl+A)
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "press",
    "key": "a",
    "ctrl": true
  }
}
```

### Copy (Cmd+C on Mac, Ctrl+C on others)
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "press",
    "key": "c",
    "meta": true
  }
}
```

### Shift+Enter (New Line in Some Apps)
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "press",
    "key": "Enter",
    "shift": true
  }
}
```

### Common Key Names
- `Enter`, `Tab`, `Escape`, `Backspace`, `Delete`
- `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`
- `Home`, `End`, `PageUp`, `PageDown`
- `F1` through `F12`
- Single characters: `a`, `A`, `1`, `!`, etc.

## Action: scroll

Scroll the page or element.

### Scroll Down
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "scroll",
    "deltaY": 500
  }
}
```

### Scroll Up
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "scroll",
    "deltaY": -500
  }
}
```

### Scroll Right
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "scroll",
    "deltaX": 300
  }
}
```

### Scroll Within Element
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "scroll",
    "selector": ".scrollable-container",
    "deltaY": 200
  }
}
```

## Action: hover

Hover over an element.

### Basic Hover
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "hover",
    "selector": ".dropdown-trigger"
  }
}
```

### Hover to Show Tooltip
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "hover",
    "selector": "[data-tooltip]"
  }
}
```

## Action: select

Select an option from a dropdown.

### Select by Value
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "select",
    "selector": "#country",
    "value": "US"
  }
}
```

### Select by Label
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "select",
    "selector": "#country",
    "label": "United States"
  }
}
```

### Select by Index
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "select",
    "selector": "#country",
    "index": 2
  }
}
```

## Action: upload

Upload files to a file input.

### Single File
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "upload",
    "selector": "#file-input",
    "files": ["/path/to/document.pdf"]
  }
}
```

### Multiple Files
```json
{
  "name": "browser_interact",
  "arguments": {
    "action": "upload",
    "selector": "#photos",
    "files": [
      "/path/to/photo1.jpg",
      "/path/to/photo2.jpg",
      "/path/to/photo3.jpg"
    ]
  }
}
```

## Selector Syntax

The `selector` parameter supports:

| Type | Example | Description |
|------|---------|-------------|
| CSS ID | `#login-button` | By ID |
| CSS Class | `.btn-primary` | By class |
| CSS Attribute | `[data-testid="submit"]` | By attribute |
| Tag | `button` | By tag name |
| Text | `text=Sign In` | By exact text |
| Has Text | `button:has-text(Submit)` | Contains text |

## Examples

### Fill Login Form
```json
// 1. Type username
{ "name": "browser_interact", "arguments": { "action": "type", "selector": "#username", "text": "myuser" }}

// 2. Type password
{ "name": "browser_interact", "arguments": { "action": "type", "selector": "#password", "text": "mypassword" }}

// 3. Click login
{ "name": "browser_interact", "arguments": { "action": "click", "selector": "#login-button" }}
```

### Search and Submit
```json
// 1. Type search query
{ "name": "browser_interact", "arguments": { "action": "type", "selector": "input[name='q']", "text": "search term" }}

// 2. Press Enter to submit
{ "name": "browser_interact", "arguments": { "action": "press", "key": "Enter" }}
```

### Navigate Dropdown Menu
```json
// 1. Hover to open menu
{ "name": "browser_interact", "arguments": { "action": "hover", "selector": ".menu-trigger" }}

// 2. Click menu item
{ "name": "browser_interact", "arguments": { "action": "click", "selector": ".menu-item-settings" }}
```

### Scroll and Load More
```json
// 1. Scroll down to trigger lazy loading
{ "name": "browser_interact", "arguments": { "action": "scroll", "deltaY": 1000 }}

// 2. Wait for content
{ "name": "browser_navigate", "arguments": { "action": "wait", "selector": ".new-items" }}
```

### Clear and Retype
```json
// 1. Click the input
{ "name": "browser_interact", "arguments": { "action": "click", "selector": "#email" }}

// 2. Select all
{ "name": "browser_interact", "arguments": { "action": "press", "key": "a", "ctrl": true }}

// 3. Type new value (replaces selected)
{ "name": "browser_interact", "arguments": { "action": "type", "selector": "#email", "text": "new@email.com" }}
```

## Notes

- Human-like typing helps avoid bot detection
- Click waits for element to be visible and clickable
- File paths for upload must be absolute paths on the server
- Coordinates are relative to the viewport

## Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Element not found" | Selector didn't match | Check selector or wait for element |
| "Element not visible" | Element exists but hidden | Wait for visibility or scroll into view |
| "Element not clickable" | Element covered by another | Close overlays or scroll |
| "File not found" | Upload file doesn't exist | Check file path |

## Related

- [browser_content](browser-content.md) - Find elements to interact with
- [browser_navigate](browser-navigate.md) - Wait for elements
- [browser_execute](browser-execute.md) - Custom JavaScript interactions
