# Testing Workflows Guide

Use Moonsurf for automated testing including UI testing, regression testing, and CI/CD integration.

## Overview

Moonsurf is well-suited for automated testing because:

- Real browser execution (no mocked environments)
- Consistent state with testing mode
- Screenshot capture for visual comparison
- Network monitoring for API testing
- Flexible JavaScript execution

## Testing Browser Mode

Use the `testing` browser mode for isolated test runs:

```bash
BROWSER_DEFAULT_MODE=testing moonsurf
```

This mode:
- Uses a fresh profile for each instance
- No cached data between runs
- Clean extensions state
- Predictable starting point

## Basic Test Pattern

### 1. Setup

```
# Launch browser in testing mode
browser_instance
  action: "launch"
  mode: "testing"
  headless: true
```

### 2. Navigate

```
browser_navigate
  action: "goto"
  url: "https://app.example.com"
  waitUntil: "networkidle"
```

### 3. Interact

```
browser_interact action="type" selector="#email" text="test@example.com"
browser_interact action="type" selector="#password" text="testpass123"
browser_interact action="click" selector="#login-button"
```

### 4. Assert

```
# Wait for expected element
browser_interact
  action: "click"
  selector: ".dashboard"
  waitForSelector: true
  timeout: 10000

# Extract and verify content
browser_content
  action: "extract"
  selector: ".welcome-message"
```

### 5. Teardown

```
browser_instance action="close"
```

## UI Testing Examples

### Login Flow Test

```
# Test: Valid login redirects to dashboard

# Setup
browser_instance action="launch" mode="testing" headless=true
browser_navigate action="goto" url="https://app.example.com/login"

# Action
browser_interact action="type" selector="#email" text="user@test.com"
browser_interact action="type" selector="#password" text="validpass"
browser_interact action="click" selector="#submit"

# Wait for navigation
browser_navigate action="waitForNavigation" timeout=10000

# Assert
browser_content action="extract" selector="h1"
# Expected: "Dashboard" or similar

# Verify URL changed
browser_tab action="list"
# URL should be /dashboard

# Cleanup
browser_instance action="close"
```

### Form Validation Test

```
# Test: Empty form shows validation errors

browser_instance action="launch" mode="testing" headless=true
browser_navigate action="goto" url="https://app.example.com/register"

# Submit empty form
browser_interact action="click" selector="#submit"

# Check for validation errors
browser_content
  action: "extract"
  selector: ".error"
  multiple: true

# Verify errors appear for required fields
# Expected: Array of error messages

browser_instance action="close"
```

### Navigation Test

```
# Test: All main navigation links work

browser_instance action="launch" mode="testing" headless=true
browser_navigate action="goto" url="https://app.example.com"

const navLinks = ['#nav-home', '#nav-about', '#nav-products', '#nav-contact'];

for (const link of navLinks) {
  browser_interact action="click" selector=link
  browser_navigate action="waitForNavigation"

  # Verify page loaded
  browser_content action="text"
  # Should have content
}

browser_instance action="close"
```

## Visual Regression Testing

### Capture Baseline

```
# First run: capture baseline screenshots
browser_instance action="launch" mode="testing" headless=true
browser_navigate action="goto" url="https://app.example.com"

# Full page screenshot
browser_content
  action: "screenshot"
  fullPage: true
# Save as baseline/homepage.png

# Key components
browser_content action="screenshot" selector="#header"
# Save as baseline/header.png

browser_content action="screenshot" selector="#footer"
# Save as baseline/footer.png

browser_instance action="close"
```

### Compare Against Baseline

```
# Subsequent runs: capture and compare
browser_instance action="launch" mode="testing" headless=true
browser_navigate action="goto" url="https://app.example.com"

browser_content action="screenshot" fullPage=true
# Save as current/homepage.png

# Compare with image diff tool
# Flag differences for review

browser_instance action="close"
```

### Responsive Testing

```
# Test at different viewport sizes
const viewports = [
  { width: 1920, height: 1080, name: 'desktop' },
  { width: 1024, height: 768, name: 'tablet' },
  { width: 375, height: 667, name: 'mobile' }
];

browser_instance action="launch" mode="testing" headless=true
browser_navigate action="goto" url="https://app.example.com"

for (const vp of viewports) {
  browser_emulate
    action: "setViewport"
    width: vp.width
    height: vp.height

  browser_content action="screenshot" fullPage=true
  # Save as screenshots/{vp.name}.png
}

browser_instance action="close"
```

## API Response Testing

### Verify API Calls

```
# Start intercepting
browser_network action="intercept" patterns=["**/api/**"]

browser_instance action="launch" mode="testing" headless=true
browser_navigate action="goto" url="https://app.example.com"

# Trigger action that calls API
browser_interact action="click" selector="#load-data"

# Check captured requests
browser_network action="requests"

# Verify expected API was called with correct parameters
# Check response status and data

browser_instance action="close"
```

### Mock API Responses

```
# Set up mock before navigation
browser_network
  action: "intercept"
  patterns: ["**/api/users"]
  mock: {
    "status": 200,
    "body": "{\"users\": [{\"id\": 1, \"name\": \"Test User\"}]}"
  }

browser_navigate action="goto" url="https://app.example.com/users"

# Page should show mocked data
browser_content action="extract" selector=".user-name"
# Expected: "Test User"
```

### Test Error Handling

```
# Mock error response
browser_network
  action: "intercept"
  patterns: ["**/api/data"]
  mock: {
    "status": 500,
    "body": "{\"error\": \"Server error\"}"
  }

browser_navigate action="goto" url="https://app.example.com"
browser_interact action="click" selector="#fetch-data"

# Verify error is displayed
browser_content action="extract" selector=".error-message"
# Expected: Error message to user
```

## End-to-End Test Suites

### E-commerce Checkout Flow

```
# Test complete purchase flow

browser_instance action="launch" mode="testing" headless=true

# 1. Browse products
browser_navigate action="goto" url="https://shop.example.com"
browser_interact action="click" selector=".product:first-child"

# 2. Add to cart
browser_interact action="click" selector="#add-to-cart"
browser_content action="extract" selector=".cart-count"
# Verify: count increased

# 3. Go to cart
browser_interact action="click" selector="#cart-icon"
browser_content action="extract" selector=".cart-item"
# Verify: item in cart

# 4. Checkout
browser_interact action="click" selector="#checkout"

# 5. Fill shipping
browser_interact action="type" selector="#name" text="Test User"
browser_interact action="type" selector="#address" text="123 Test St"
browser_interact action="type" selector="#city" text="Test City"
browser_interact action="select" selector="#state" value="CA"
browser_interact action="type" selector="#zip" text="12345"
browser_interact action="click" selector="#continue"

# 6. Fill payment (test card)
browser_interact action="type" selector="#card" text="4111111111111111"
browser_interact action="type" selector="#expiry" text="12/25"
browser_interact action="type" selector="#cvv" text="123"

# 7. Place order
browser_interact action="click" selector="#place-order"

# 8. Verify confirmation
browser_navigate action="waitForNavigation"
browser_content action="extract" selector=".order-confirmation"
# Verify: Order number present

browser_instance action="close"
```

### User Registration Flow

```
browser_instance action="launch" mode="testing" headless=true

# Generate unique test email
const testEmail = `test+${Date.now()}@example.com`;

# 1. Go to registration
browser_navigate action="goto" url="https://app.example.com/register"

# 2. Fill form
browser_interact action="type" selector="#email" text=testEmail
browser_interact action="type" selector="#password" text="SecurePass123!"
browser_interact action="type" selector="#confirm" text="SecurePass123!"
browser_interact action="check" selector="#terms"

# 3. Submit
browser_interact action="click" selector="#register"

# 4. Verify success
browser_navigate action="waitForNavigation"
browser_content action="extract" selector=".success-message"

# 5. Verify can login
browser_navigate action="goto" url="https://app.example.com/login"
browser_interact action="type" selector="#email" text=testEmail
browser_interact action="type" selector="#password" text="SecurePass123!"
browser_interact action="click" selector="#login"

browser_navigate action="waitForNavigation"
# Verify: Logged in successfully

browser_instance action="close"
```

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Start app
        run: npm start &
        env:
          PORT: 3000

      - name: Wait for app
        run: npx wait-on http://localhost:3000

      - name: Start Moonsurf
        run: |
          npx @moonsurf/browser-control &
          sleep 5
        env:
          BROWSER_DEFAULT_MODE: testing
          HEADLESS_DEFAULT: true

      - name: Run tests
        run: npm run test:e2e

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: screenshots
          path: test-screenshots/
```

### Docker-based Testing

```dockerfile
FROM node:20-slim

# Install Chrome
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Moonsurf
RUN npm install -g @moonsurf/browser-control

WORKDIR /app
COPY . .

ENV BROWSER_DEFAULT_MODE=testing
ENV HEADLESS_DEFAULT=true

CMD ["npm", "run", "test:e2e"]
```

### Parallel Test Execution

Run multiple browser instances:

```
# Instance 1: Test suite A
browser_instance action="launch" mode="testing" headless=true
# Run tests...
browser_instance action="close"

# Instance 2: Test suite B (can run in parallel)
browser_instance action="launch" mode="testing" headless=true
# Run tests...
browser_instance action="close"
```

## Test Utilities

### Wait for Element

```
browser_execute
  action: "evaluate"
  script: |
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);

      const check = () => {
        const el = document.querySelector('.expected-element');
        if (el) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
```

### Retry Failed Actions

```
const maxRetries = 3;
let attempt = 0;

while (attempt < maxRetries) {
  try {
    browser_interact action="click" selector="#flaky-button"
    break;
  } catch (error) {
    attempt++;
    if (attempt === maxRetries) throw error;
    browser_execute
      action: "evaluate"
      script: "await new Promise(r => setTimeout(r, 1000))"
  }
}
```

### Screenshot on Failure

```
try {
  # Test actions...
} catch (error) {
  # Capture state for debugging
  browser_content action="screenshot" fullPage=true
  # Save screenshot with test name

  browser_content action="html"
  # Save page HTML

  throw error;
}
```

### Generate Test Data

```
browser_execute
  action: "evaluate"
  script: |
    const timestamp = Date.now();
    return {
      email: `test+${timestamp}@example.com`,
      username: `user_${timestamp}`,
      password: `Pass${timestamp}!`
    };
```

## Performance Testing

### Measure Page Load

```
browser_navigate
  action: "goto"
  url: "https://app.example.com"
  waitUntil: "networkidle"

browser_execute
  action: "evaluate"
  script: |
    const perf = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: perf.domContentLoadedEventEnd,
      loadComplete: perf.loadEventEnd,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
    };
```

### Measure Interaction Time

```
browser_execute
  action: "evaluate"
  script: |
    const start = performance.now();
    document.querySelector('#action-button').click();

    await new Promise(resolve => {
      const check = () => {
        if (document.querySelector('.result')) {
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });

    return performance.now() - start;
```

## Best Practices

### 1. Use Testing Mode

Always use `testing` mode for tests to ensure clean state:

```
browser_instance action="launch" mode="testing"
```

### 2. Run Headless in CI

```bash
HEADLESS_DEFAULT=true moonsurf
```

### 3. Use Explicit Waits

Don't use fixed delays:

```
# Bad
browser_execute action="evaluate" script="await new Promise(r => setTimeout(r, 5000))"

# Good
browser_navigate action="waitForNavigation"
browser_interact action="click" selector=".result" waitForSelector=true
```

### 4. Isolate Tests

Each test should be independent:

```
# Setup fresh state
browser_instance action="launch" mode="testing"

# Run test

# Cleanup
browser_instance action="close"
```

### 5. Capture Evidence on Failure

```
try {
  # Test code
} catch (e) {
  browser_content action="screenshot"
  browser_content action="html"
  throw e;
}
```

### 6. Use Stable Selectors

Prefer:
- `[data-testid="submit"]`
- `#login-form`
- `[name="email"]`

Avoid:
- `.btn-primary:nth-child(2)`
- Dynamic class names

## Troubleshooting

### Test Flakiness

1. Add explicit waits for elements
2. Check for race conditions
3. Verify test isolation
4. Look for timing-dependent code

### Elements Not Found

1. Wait for element to appear
2. Check if element is in iframe
3. Verify selector is correct
4. Check page has fully loaded

### Tests Pass Locally, Fail in CI

1. Ensure headless mode works
2. Check for screen size differences
3. Verify all dependencies installed
4. Check network conditions

## Related

- [browser_instance](../tools/browser-instance.md) - Browser lifecycle
- [browser_content](../tools/browser-content.md) - Screenshots and extraction
- [browser_network](../tools/browser-network.md) - API mocking
- [CI/CD Integration](../integration/ci-cd.md) - Pipeline setup
