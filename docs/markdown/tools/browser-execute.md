# browser_execute

Execute JavaScript in the page context. Run custom code, access page variables, and perform operations not covered by other tools.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `instanceId` | string | No | Target browser instance |
| `tabId` | number | No | Target tab ID |
| `expression` | string | Yes | JavaScript code to execute |
| `awaitPromise` | boolean | No | Wait for promise resolution |

**Note:** This tool does not have an `action` parameter. It directly executes JavaScript.

## Basic Usage

### Get Page Title
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "document.title"
  }
}
```

### Response
```json
{
  "result": "Example Domain"
}
```

### Get Page URL
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "window.location.href"
  }
}
```

### Get Element Text
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "document.querySelector('#main').textContent"
  }
}
```

## Working with Promises

### Fetch API Data
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "fetch('/api/user').then(r => r.json())",
    "awaitPromise": true
  }
}
```

### Wait for Condition
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "new Promise(resolve => { const check = () => { if (window.dataLoaded) resolve(true); else setTimeout(check, 100); }; check(); })",
    "awaitPromise": true
  }
}
```

## Returning Data

### Return Object
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "({ title: document.title, url: location.href, scrollY: window.scrollY })"
  }
}
```

### Response
```json
{
  "result": {
    "title": "Example",
    "url": "https://example.com/",
    "scrollY": 500
  }
}
```

### Return Array
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "Array.from(document.querySelectorAll('a')).map(a => ({ text: a.textContent, href: a.href }))"
  }
}
```

## DOM Manipulation

### Scroll to Element
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "document.querySelector('#section').scrollIntoView({ behavior: 'smooth' })"
  }
}
```

### Click Hidden Button
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "document.querySelector('#hidden-submit').click()"
  }
}
```

### Set Input Value
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "document.querySelector('#date-picker').value = '2024-01-15'"
  }
}
```

### Trigger Events
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "document.querySelector('#input').dispatchEvent(new Event('change', { bubbles: true }))"
  }
}
```

## Accessing Page Variables

### Get React State
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "window.__REDUX_STATE__ || window.__NEXT_DATA__"
  }
}
```

### Get Application Data
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "window.APP_CONFIG"
  }
}
```

### Check if Library Loaded
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "typeof jQuery !== 'undefined'"
  }
}
```

## Multi-Line Scripts

For complex scripts, use template literals or concatenation:

### Extract Table Data
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "(() => { const rows = document.querySelectorAll('table tr'); return Array.from(rows).map(row => { const cells = row.querySelectorAll('td, th'); return Array.from(cells).map(cell => cell.textContent.trim()); }); })()"
  }
}
```

### Infinite Scroll Handler
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "(() => { let count = document.querySelectorAll('.item').length; window.scrollTo(0, document.body.scrollHeight); return new Promise(resolve => setTimeout(() => resolve({ before: count, after: document.querySelectorAll('.item').length }), 2000)); })()",
    "awaitPromise": true
  }
}
```

## Error Handling

### Handle Missing Elements
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "document.querySelector('#maybe-exists')?.textContent || 'Not found'"
  }
}
```

### Try-Catch
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "(() => { try { return JSON.parse(document.querySelector('#data').textContent); } catch (e) { return { error: e.message }; } })()"
  }
}
```

## Examples

### Check Login State
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "!!document.querySelector('.user-avatar') || document.cookie.includes('auth_token')"
  }
}
```

### Get All Form Data
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "Object.fromEntries(new FormData(document.querySelector('form')))"
  }
}
```

### Measure Performance
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "({ timing: performance.timing.loadEventEnd - performance.timing.navigationStart, entries: performance.getEntriesByType('resource').length })"
  }
}
```

### Interact with Shadow DOM
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "document.querySelector('custom-element').shadowRoot.querySelector('#inner-button').click()"
  }
}
```

### Call Page Functions
```json
{
  "name": "browser_execute",
  "arguments": {
    "expression": "window.myApp.refreshData()",
    "awaitPromise": true
  }
}
```

## Return Value Serialization

The result is JSON-serialized. This means:

- Primitives (strings, numbers, booleans) work directly
- Objects and arrays are converted to JSON
- Functions cannot be returned (they become null/undefined)
- DOM elements return a limited representation
- Circular references will cause errors

### What Works
```javascript
"string value"                    // ✓
42                                // ✓
true                              // ✓
{ key: "value" }                  // ✓
[1, 2, 3]                         // ✓
null                              // ✓
```

### What Doesn't Work
```javascript
document.body                     // ✗ DOM element (limited info)
function() {}                     // ✗ Function (becomes null)
window                            // ✗ Circular reference
```

## Security Notes

- Code runs in the page context with full access
- Can read cookies, localStorage, sessionStorage
- Can modify the DOM
- Can make network requests (subject to CORS)
- Cannot access browser APIs outside the page

## Notes

- Expression is evaluated in the page's JavaScript context
- `awaitPromise: true` is required for async operations
- Complex scripts should be wrapped in an IIFE: `(() => { ... })()`
- Results must be JSON-serializable

## Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Script error" | JavaScript error in expression | Check syntax and variable existence |
| "Timeout" | Promise didn't resolve | Check async code, increase timeout |
| "Cannot serialize" | Return value not JSON-compatible | Return primitive or simple object |

## Related

- [browser_content](browser-content.md) - Get content without custom JS
- [browser_interact](browser-interact.md) - Standard interactions
- [browser_network](browser-network.md) - Access cookies/storage
