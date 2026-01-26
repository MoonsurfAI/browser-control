# Guides

Practical guides for common browser automation tasks with Moonsurf.

## Overview

These guides provide step-by-step instructions for implementing real-world automation scenarios. Each guide includes complete examples you can adapt for your own projects.

## Available Guides

### [Form Filling](form-filling.md)
Automate form interactions including text input, dropdowns, checkboxes, file uploads, and multi-step forms.

### [Web Scraping](web-scraping.md)
Extract data from web pages using selectors, handle pagination, and work with dynamic content.

### [File Downloads](file-downloads.md)
Manage file downloads, track progress, and handle different file types.

### [Testing Workflows](testing-workflows.md)
Use Moonsurf for automated testing, including UI testing, regression testing, and CI/CD integration.

### [Handling Popups](handling-popups.md)
Deal with alerts, dialogs, authentication prompts, and popup windows.

### [Network Interception](network-interception.md)
Monitor, intercept, and modify network requests for testing and debugging.

### [Debugging Tips](debugging-tips.md)
Troubleshoot automation issues with screenshots, logging, and diagnostic tools.

## Quick Reference

| Task | Primary Tool | Key Actions |
|------|--------------|-------------|
| Fill text input | `browser_interact` | `type` |
| Click button | `browser_interact` | `click` |
| Select dropdown | `browser_interact` | `select` |
| Upload file | `browser_interact` | `upload` |
| Extract text | `browser_content` | `extract` |
| Take screenshot | `browser_content` | `screenshot` |
| Track download | `browser_navigate` | `downloads` |
| Monitor network | `browser_network` | `intercept`, `requests` |
| Execute JavaScript | `browser_execute` | `evaluate` |

## Prerequisites

Before following these guides, ensure you have:

1. **Moonsurf installed and running**
   ```bash
   npx @anthropic/browser-control
   ```

2. **A browser instance created**
   ```
   browser_instance action="launch"
   ```

3. **Basic understanding of CSS selectors**
   - ID: `#my-element`
   - Class: `.my-class`
   - Attribute: `[name="email"]`
   - Combination: `form#login input[type="submit"]`

## Common Patterns

### Wait for Element

Many actions require waiting for elements to appear:

```
browser_interact
  action: "click"
  selector: "#submit-button"
  waitForSelector: true
  timeout: 10000
```

### Error Recovery

Handle failures gracefully:

```
1. Try the primary action
2. If it fails, take a screenshot for debugging
3. Check if the page state is as expected
4. Retry or report the error
```

### State Verification

Always verify actions succeeded:

```
1. Perform action (e.g., click submit)
2. Wait for expected result (e.g., success message)
3. Extract confirmation data
4. Continue or handle failure
```

## Best Practices

### Selectors

1. **Prefer stable selectors**
   - Good: `[data-testid="submit"]`, `#login-form`
   - Avoid: `.btn-primary:nth-child(3)`, complex XPath

2. **Use semantic selectors when possible**
   - Good: `button[type="submit"]`, `input[name="email"]`
   - Avoid: `.sc-abc123`, dynamic class names

3. **Fall back gracefully**
   - Try ID first, then name, then other attributes

### Timing

1. **Use explicit waits** instead of fixed delays
2. **Set appropriate timeouts** for slow pages
3. **Wait for network idle** after navigation

### Debugging

1. **Take screenshots** at key points
2. **Log page state** when errors occur
3. **Use visible mode** during development

## Related

- [Tools Reference](../tools/README.md) - Complete tool documentation
- [Concepts](../concepts/README.md) - Understand how Moonsurf works
- [API Reference](../api-reference/README.md) - Detailed API documentation
