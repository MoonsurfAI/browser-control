# Debugging Tips Guide

Troubleshoot browser automation issues using screenshots, logging, console output, and diagnostic tools.

## Overview

Effective debugging in browser automation requires:

1. **Visual inspection** - Screenshots at key points
2. **Console monitoring** - JavaScript errors and logs
3. **Network analysis** - Failed requests and timing
4. **State inspection** - DOM and variable state
5. **Logging** - Server-side debug output

## Screenshots for Debugging

### Capture Current State

```
browser_content
  action: "screenshot"
```

### Full Page Screenshot

```
browser_content
  action: "screenshot"
  fullPage: true
```

### Screenshot Specific Element

```
browser_content
  action: "screenshot"
  selector: "#problem-area"
```

### Screenshot Before/After Actions

```
# Before clicking
browser_content action="screenshot"

# Perform action
browser_interact action="click" selector="#button"

# After clicking
browser_content action="screenshot"

# Compare to understand what changed
```

### Screenshot on Error

```
try {
  browser_interact action="click" selector="#missing-element"
} catch (error) {
  browser_content action="screenshot" fullPage=true
  # Save screenshot for analysis
  throw error;
}
```

## Console Monitoring

### Get Console Messages

```
browser_debug
  action: "console"
```

Returns:
```json
{
  "messages": [
    { "type": "log", "text": "App initialized" },
    { "type": "error", "text": "Failed to load resource" },
    { "type": "warning", "text": "Deprecated API used" }
  ]
}
```

### Check for JavaScript Errors

```
browser_debug action="console"

# Look for messages with type: "error"
# These indicate JavaScript issues
```

### Monitor Console During Action

```
# Clear existing messages
browser_debug action="clear"

# Perform action
browser_interact action="click" selector="#submit"

# Check console for new messages
browser_debug action="console"
```

### Log Custom Messages

```
browser_execute
  action: "evaluate"
  script: |
    console.log('Debug: Current state', {
      url: location.href,
      form: document.querySelector('form')?.innerHTML
    });
```

## DOM Inspection

### Get Element Information

```
browser_execute
  action: "evaluate"
  script: |
    const el = document.querySelector('#target');
    if (!el) return { found: false };

    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);

    return {
      found: true,
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      visible: style.display !== 'none' && style.visibility !== 'hidden',
      dimensions: { width: rect.width, height: rect.height },
      position: { top: rect.top, left: rect.left },
      text: el.textContent?.slice(0, 100)
    };
```

### Check Element Exists

```
browser_execute
  action: "evaluate"
  script: |
    const el = document.querySelector('.my-element');
    return {
      exists: !!el,
      count: document.querySelectorAll('.my-element').length
    };
```

### Find Matching Elements

```
browser_execute
  action: "evaluate"
  script: |
    const elements = document.querySelectorAll('button');
    return Array.from(elements).map(el => ({
      text: el.textContent.trim(),
      id: el.id,
      classes: el.className,
      disabled: el.disabled
    }));
```

### Check Element Visibility

```
browser_execute
  action: "evaluate"
  script: |
    const el = document.querySelector('#target');
    if (!el) return { reason: 'not found' };

    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);

    if (style.display === 'none') return { reason: 'display:none' };
    if (style.visibility === 'hidden') return { reason: 'visibility:hidden' };
    if (style.opacity === '0') return { reason: 'opacity:0' };
    if (rect.width === 0 || rect.height === 0) return { reason: 'zero dimensions' };

    return { visible: true, rect };
```

### Get Viewport DOM

```
browser_content
  action: "get_viewport_dom"
```

Returns simplified DOM of visible elements.

## Network Debugging

### Monitor All Requests

```
browser_network action="intercept" patterns=["**/*"]

# Perform actions
browser_interact action="click" selector="#load-data"

# Check requests
browser_network action="requests"
```

### Find Failed Requests

```
browser_network action="requests"

# Look for status >= 400
# Common issues:
# - 401: Authentication required
# - 403: Forbidden
# - 404: Not found
# - 500: Server error
```

### Check Request Timing

```
browser_network action="requests"

# Examine timing.duration for slow requests
# Identify bottlenecks
```

### Debug CORS Issues

```
browser_debug action="console"

# Look for CORS errors like:
# "Access to fetch has been blocked by CORS policy"
```

## Page State Debugging

### Get Current URL

```
browser_tab action="list"
# Returns current tab with URL
```

### Check Page Load State

```
browser_execute
  action: "evaluate"
  script: |
    return {
      readyState: document.readyState,
      url: location.href,
      title: document.title
    };
```

### Get Page HTML

```
browser_content action="html"
```

### Get Page Text

```
browser_content action="text"
```

## Form Debugging

### Get Form Values

```
browser_execute
  action: "evaluate"
  script: |
    const form = document.querySelector('form');
    const formData = new FormData(form);
    return Object.fromEntries(formData);
```

### Check Input State

```
browser_execute
  action: "evaluate"
  script: |
    const input = document.querySelector('#email');
    return {
      value: input.value,
      disabled: input.disabled,
      readonly: input.readOnly,
      required: input.required,
      valid: input.checkValidity(),
      validationMessage: input.validationMessage
    };
```

### Find Form Validation Errors

```
browser_execute
  action: "evaluate"
  script: |
    const inputs = document.querySelectorAll('input, select, textarea');
    return Array.from(inputs)
      .filter(el => !el.checkValidity())
      .map(el => ({
        name: el.name,
        message: el.validationMessage
      }));
```

## Server-Side Debugging

### Enable Debug Logging

```bash
LOG_LEVEL=debug moonsurf
```

This shows:
- WebSocket messages
- Tool call details
- Timing information
- Internal state changes

### Log Output Example

```
[Debug] WebSocket message received: {"action":"click","selector":"#btn"}
[Debug] Tool call: browser_interact, duration: 145ms
[Debug] Extension response: {"success":true}
```

## Common Issues and Solutions

### Element Not Found

**Symptoms:** "Element not found" or timeout errors

**Debug steps:**
1. Take screenshot to see actual page state
2. Check if element exists with JavaScript
3. Verify selector is correct
4. Check if element is in iframe

```
# Debug
browser_content action="screenshot" fullPage=true

browser_execute
  action: "evaluate"
  script: |
    return {
      elementExists: !!document.querySelector('#target'),
      allButtons: Array.from(document.querySelectorAll('button'))
        .map(b => b.textContent)
    };
```

### Element Not Clickable

**Symptoms:** Click doesn't work, no error

**Debug steps:**
1. Check element visibility
2. Look for overlapping elements
3. Verify element is not disabled

```
browser_execute
  action: "evaluate"
  script: |
    const el = document.querySelector('#target');
    const rect = el.getBoundingClientRect();

    // What's at this position?
    const elementAtPoint = document.elementFromPoint(
      rect.left + rect.width/2,
      rect.top + rect.height/2
    );

    return {
      target: el.outerHTML.slice(0, 200),
      elementAtPoint: elementAtPoint?.outerHTML.slice(0, 200),
      sameElement: el === elementAtPoint
    };
```

### Page Not Loading

**Symptoms:** Navigation timeout, blank page

**Debug steps:**
1. Check network requests
2. Look for JavaScript errors
3. Verify URL is correct

```
browser_network action="intercept" patterns=["**/*"]
browser_navigate action="goto" url="https://example.com"
browser_network action="requests"
browser_debug action="console"
```

### Form Not Submitting

**Symptoms:** Click submit, nothing happens

**Debug steps:**
1. Check form validation
2. Look for JavaScript errors
3. Check if form has `onsubmit` handler

```
browser_debug action="console"

browser_execute
  action: "evaluate"
  script: |
    const form = document.querySelector('form');
    return {
      valid: form.checkValidity(),
      action: form.action,
      method: form.method,
      hasSubmitHandler: !!form.onsubmit
    };
```

### Content Not Updating

**Symptoms:** Action completed but content unchanged

**Debug steps:**
1. Wait longer for dynamic content
2. Check for AJAX requests
3. Look at network requests

```
# Wait for content update
browser_execute
  action: "evaluate"
  script: |
    await new Promise(r => setTimeout(r, 2000));
    return document.querySelector('#dynamic-content')?.textContent;
```

### Iframe Issues

**Symptoms:** Can't find elements that visually exist

**Debug steps:**
1. Check for iframes
2. Get iframe content

```
browser_execute
  action: "evaluate"
  script: |
    const iframes = document.querySelectorAll('iframe');
    return Array.from(iframes).map(iframe => ({
      src: iframe.src,
      id: iframe.id,
      name: iframe.name
    }));
```

## Debug Checklist

When something isn't working:

### 1. Visual Check
- [ ] Take full page screenshot
- [ ] Screenshot specific area
- [ ] Compare with expected state

### 2. Console Check
- [ ] Look for JavaScript errors
- [ ] Check for warnings
- [ ] Review console logs

### 3. DOM Check
- [ ] Verify element exists
- [ ] Check element is visible
- [ ] Verify selector matches

### 4. Network Check
- [ ] Look for failed requests
- [ ] Check request timing
- [ ] Verify API responses

### 5. State Check
- [ ] Verify current URL
- [ ] Check page load state
- [ ] Review form values

## Debugging Workflow

1. **Reproduce the issue**
   - Use consistent browser mode (testing)
   - Same steps each time

2. **Capture state**
   - Screenshots before/after
   - Console messages
   - Network requests

3. **Isolate the problem**
   - Remove unrelated steps
   - Test individual actions

4. **Fix and verify**
   - Make minimal change
   - Rerun full workflow

## Advanced Debugging

### Pause Execution

```
browser_execute
  action: "evaluate"
  script: "debugger;"
```

Note: Only works in non-headless mode with DevTools open.

### Performance Profiling

```
browser_execute
  action: "evaluate"
  script: |
    const start = performance.now();
    // ... operations
    return performance.now() - start;
```

### Memory Usage

```
browser_execute
  action: "evaluate"
  script: |
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize
      };
    }
    return null;
```

## Best Practices

### 1. Debug in Visible Mode First

```bash
HEADLESS_DEFAULT=false moonsurf
```

Watch the browser to understand what's happening.

### 2. Add Debug Points

```
# Debug point 1
browser_content action="screenshot"
console.log('Step 1 complete');

# ... action ...

# Debug point 2
browser_content action="screenshot"
console.log('Step 2 complete');
```

### 3. Log Relevant State

```
browser_execute
  action: "evaluate"
  script: |
    console.log('Current state:', {
      url: location.href,
      elementCount: document.querySelectorAll('*').length,
      forms: document.forms.length
    });
```

### 4. Save Debug Artifacts

Save screenshots and logs with timestamps for comparison.

### 5. Use Testing Mode

```bash
BROWSER_DEFAULT_MODE=testing moonsurf
```

Clean state helps isolate issues.

## Related

- [browser_debug](../tools/browser-debug.md) - Debug tool reference
- [browser_content](../tools/browser-content.md) - Screenshots
- [browser_network](../tools/browser-network.md) - Network monitoring
- [Testing Workflows](testing-workflows.md) - Test debugging
