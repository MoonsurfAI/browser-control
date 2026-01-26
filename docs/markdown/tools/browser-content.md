# browser_content

Extract page content. Take screenshots, generate PDFs, get page HTML/text, query elements, and extract the visible DOM.

## Actions

| Action | Description |
|--------|-------------|
| `screenshot` | Capture a screenshot |
| `pdf` | Generate a PDF of the page |
| `get` | Get page HTML or text content |
| `query` | Find elements matching a selector |
| `attribute` | Get an element's attribute value |
| `get_viewport_dom` | Get visible elements with layout info |

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | One of the actions above |
| `instanceId` | string | No | Target browser instance |
| `tabId` | number | No | Target tab ID |
| `selector` | string | For `get`, `query`, `attribute` | CSS selector |
| `attribute` | string | For `attribute` | Attribute name to get |
| `format` | string | No | Output format (varies by action) |
| `quality` | number | For `screenshot` | Image quality 0-100 (jpeg/webp) |
| `fullPage` | boolean | For `screenshot` | Capture full scrollable page |
| `landscape` | boolean | For `pdf` | Landscape orientation |
| `printBackground` | boolean | For `pdf` | Include background graphics |
| `scale` | number | For `pdf` | Scale 0.1-2 |
| `paperWidth` | number | For `pdf` | Paper width in inches |
| `paperHeight` | number | For `pdf` | Paper height in inches |
| `maxElements` | number | For `get_viewport_dom` | Max elements to return (default: 500) |
| `domDepth` | number | For `get_viewport_dom` | Max nesting depth (default: 2) |
| `includeHidden` | boolean | For `get_viewport_dom` | Include hidden elements |
| `minSize` | number | For `get_viewport_dom` | Min element size in pixels |

## Action: screenshot

Capture a screenshot of the page.

### Basic Screenshot
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "screenshot"
  }
}
```

### Full Page Screenshot
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "screenshot",
    "fullPage": true
  }
}
```

### JPEG with Quality
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "screenshot",
    "format": "jpeg",
    "quality": 80
  }
}
```

### WebP Format
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "screenshot",
    "format": "webp",
    "quality": 85
  }
}
```

### Response
```json
{
  "screenshot": "iVBORw0KGgoAAAANSUhEUgAA...",
  "format": "png",
  "width": 1920,
  "height": 1080
}
```

The `screenshot` field contains base64-encoded image data.

## Action: pdf

Generate a PDF of the page.

### Basic PDF
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "pdf"
  }
}
```

### Landscape PDF
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "pdf",
    "landscape": true
  }
}
```

### With Backgrounds
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "pdf",
    "printBackground": true
  }
}
```

### Custom Paper Size
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "pdf",
    "paperWidth": 8.5,
    "paperHeight": 11,
    "scale": 0.8
  }
}
```

### Response
```json
{
  "pdf": "JVBERi0xLjQKJcfs...",
  "pageCount": 3
}
```

The `pdf` field contains base64-encoded PDF data.

## Action: get

Get page content as HTML or text.

### Get Full HTML
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "get",
    "format": "html"
  }
}
```

### Get Text Only
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "get",
    "format": "text"
  }
}
```

### Get Specific Element's Content
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "get",
    "selector": "#main-content",
    "format": "html"
  }
}
```

### Response (HTML)
```json
{
  "content": "<!DOCTYPE html><html>...",
  "format": "html",
  "url": "https://example.com/"
}
```

### Response (Text)
```json
{
  "content": "Example Domain\n\nThis domain is for use in illustrative examples...",
  "format": "text",
  "url": "https://example.com/"
}
```

## Action: query

Find elements matching a selector.

### Basic Query
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "query",
    "selector": ".product-card"
  }
}
```

### Response
```json
{
  "elements": [
    {
      "tagName": "div",
      "id": "",
      "className": "product-card",
      "textContent": "Product 1...",
      "attributes": {
        "data-product-id": "123"
      },
      "boundingBox": {
        "x": 100,
        "y": 200,
        "width": 300,
        "height": 400
      }
    },
    {
      "tagName": "div",
      "className": "product-card",
      "textContent": "Product 2..."
    }
  ],
  "count": 2
}
```

## Action: attribute

Get a specific attribute from an element.

### Get href
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "attribute",
    "selector": "a.main-link",
    "attribute": "href"
  }
}
```

### Get data attribute
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "attribute",
    "selector": "#product",
    "attribute": "data-product-id"
  }
}
```

### Response
```json
{
  "selector": "a.main-link",
  "attribute": "href",
  "value": "https://example.com/page"
}
```

## Action: get_viewport_dom

Get visible elements with layout information. Optimized for AI understanding of page structure.

### Basic Usage
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "get_viewport_dom"
  }
}
```

### With Limits
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "get_viewport_dom",
    "maxElements": 100,
    "domDepth": 3
  }
}
```

### Filter Small Elements
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "get_viewport_dom",
    "minSize": 20
  }
}
```

### Include Hidden Elements
```json
{
  "name": "browser_content",
  "arguments": {
    "action": "get_viewport_dom",
    "includeHidden": true
  }
}
```

### Response
```json
{
  "viewport": {
    "width": 1920,
    "height": 1080,
    "scrollX": 0,
    "scrollY": 500
  },
  "elements": [
    {
      "tag": "button",
      "id": "submit-btn",
      "class": "btn btn-primary",
      "text": "Submit",
      "rect": { "x": 100, "y": 200, "width": 120, "height": 40 },
      "visible": true,
      "interactive": true,
      "selector": "#submit-btn"
    },
    {
      "tag": "input",
      "type": "text",
      "name": "email",
      "placeholder": "Enter email",
      "rect": { "x": 100, "y": 100, "width": 300, "height": 40 },
      "visible": true,
      "interactive": true,
      "selector": "input[name='email']"
    }
  ],
  "elementCount": 2
}
```

**Key features of `get_viewport_dom`:**
- Only returns elements visible in the current viewport
- Includes computed selectors for easy targeting
- Shows element positions and dimensions
- Indicates if elements are interactive
- Respects depth and count limits to avoid overwhelming responses

## Examples

### Screenshot for Debugging
```json
// Take a screenshot to see current state
{ "name": "browser_content", "arguments": { "action": "screenshot" }}

// If something's wrong, take a full page screenshot
{ "name": "browser_content", "arguments": { "action": "screenshot", "fullPage": true }}
```

### Extract Data from Page
```json
// 1. Query all product cards
{ "name": "browser_content", "arguments": { "action": "query", "selector": ".product" }}

// 2. Get specific product's data attribute
{ "name": "browser_content", "arguments": { "action": "attribute", "selector": ".product:first-child", "attribute": "data-price" }}
```

### AI Understanding of Page
```json
// Get structured view of what's on screen
{ "name": "browser_content", "arguments": {
  "action": "get_viewport_dom",
  "maxElements": 50,
  "domDepth": 2
}}
// Returns elements with selectors AI can use for interactions
```

### Generate Report as PDF
```json
// Navigate to report page
{ "name": "browser_navigate", "arguments": { "action": "goto", "url": "https://app.com/report" }}

// Wait for report to load
{ "name": "browser_navigate", "arguments": { "action": "wait", "selector": ".report-ready" }}

// Generate PDF with backgrounds
{ "name": "browser_content", "arguments": {
  "action": "pdf",
  "printBackground": true,
  "landscape": true
}}
```

## Notes

- Screenshots are returned as base64-encoded strings
- Full page screenshots can be very large
- PDF generation may not work well on all pages (designed for print-friendly content)
- `get_viewport_dom` is especially useful for AI agents to understand page structure

## Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Element not found" | Selector didn't match | Check selector syntax |
| "Screenshot failed" | Browser error | Check if page loaded correctly |

## Related

- [browser_navigate](browser-navigate.md) - Navigate to pages
- [browser_interact](browser-interact.md) - Interact with found elements
- [browser_execute](browser-execute.md) - Run custom JS to extract data
