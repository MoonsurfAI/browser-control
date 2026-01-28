# Google Search Task

Perform a Google search and extract results (title, description, URL) using Moonsurf Browser Control MCP tools.

## Browser Instance Management

Always reuse existing browser instances. Only create a new instance if none exists.

### Step 1: Check for existing browser instance

```
browser_instance:
  action: list
```

**If instances exist:** Use the `instanceId` from the response and create a new tab.

**If no instances:** Launch a new browser instance (see Step 2b).

### Step 2a: Create new tab in existing instance (Preferred)

```
browser_tab:
  action: new
  instanceId: <existing_instance_id>
  url: https://www.google.com/search?q=<URL_ENCODED_SEARCH_TERM>
```

Save the returned `tabId` for subsequent operations and cleanup.

### Step 2b: Launch new instance (Only if no instance exists)

```
browser_instance:
  action: new
  mode: chromium
  url: https://www.google.com/search?q=<URL_ENCODED_SEARCH_TERM>
```

---

## Method 1: Direct URL Navigation (Recommended)

The simplest approach - navigate directly to Google search URL with query parameters.

### Steps

1. **Get or create browser instance** (see Browser Instance Management above)

2. **Wait for results to load**
```
browser_navigate:
  action: wait
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: div#search
  timeout: 5000
```

3. **Extract results using JavaScript**
```
browser_execute:
  instanceId: <instance_id>
  tabId: <tab_id>
  expression: <extraction script below>
```

4. **Cleanup: Close the tab** (keep browser instance for future tasks)
```
browser_tab:
  action: close
  instanceId: <instance_id>
  tabId: <tab_id>
```

## Method 2: Interactive Search

Mimics human interaction - type in search box and press Enter.

### Steps

1. **Get or create browser instance** (see Browser Instance Management above)

2. **Open new tab to Google homepage**
```
browser_tab:
  action: new
  instanceId: <instance_id>
  url: https://www.google.com
```

3. **Click on search input**
```
browser_interact:
  action: click
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: textarea[name="q"]
```

4. **Type search query**
```
browser_interact:
  action: type
  instanceId: <instance_id>
  tabId: <tab_id>
  text: <your search term>
```

5. **Press Enter to submit**
```
browser_interact:
  action: press
  instanceId: <instance_id>
  tabId: <tab_id>
  key: Enter
```

6. **Wait for results**
```
browser_navigate:
  action: wait
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: div#search
  timeout: 5000
```

7. **Extract results using JavaScript**

8. **Cleanup: Close the tab**
```
browser_tab:
  action: close
  instanceId: <instance_id>
  tabId: <tab_id>
```

---

## Result Extraction Script

Use `browser_execute` with this JavaScript to extract search results:

```javascript
(function() {
  var results = [];
  var h3s = document.querySelectorAll('h3');
  for (var i = 0; i < h3s.length; i++) {
    var h3 = h3s[i];
    var link = h3.closest('a');
    if (link && link.href && link.href.indexOf('http') === 0) {
      // Navigate up to find the result container
      var container = link;
      for (var j = 0; j < 5; j++) {
        if (container.parentElement) container = container.parentElement;
      }

      // Find description text
      var desc = '';
      var spans = container.querySelectorAll('span, em');
      for (var k = 0; k < spans.length; k++) {
        var text = spans[k].textContent;
        if (text && text.length > 40 && text.length < 400 && text !== h3.textContent) {
          if (text.length > desc.length) {
            desc = text;
          }
        }
      }

      results.push({
        title: h3.textContent,
        url: link.href,
        description: desc || 'No description'
      });
    }
  }
  return JSON.stringify(results.slice(0, 10));
})();
```

## Output Format

The extraction script returns a JSON array:

```json
[
  {
    "title": "Page Title",
    "url": "https://example.com/page",
    "description": "Brief description of the page content..."
  },
  ...
]
```

## Key Selectors

| Element | Selector |
|---------|----------|
| Search input | `textarea[name="q"]` |
| Search results container | `div#search` or `#rso` |
| Result titles | `h3` |
| Result links | `h3` parent `<a>` element |

## Notes

- **Instance reuse**: Always check for existing instances before creating new ones
- **Tab cleanup**: Close tabs after task completion, but keep the browser instance running
- **URL encoding**: When using Method 1, encode the search query (spaces become `+` or `%20`)
- **Popups**: Google may show location or cookie consent dialogs. Handle with `browser_interact` click on dismiss buttons like `text=Not now`
- **Rate limiting**: Avoid rapid successive searches to prevent CAPTCHA challenges
- **Results vary**: Google personalizes results based on location and browsing history
