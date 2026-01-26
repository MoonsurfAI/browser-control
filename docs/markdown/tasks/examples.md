# Examples

This document provides practical examples for common browser automation scenarios.

## Basic Examples

### Navigate and Screenshot

```json
{
  "task_name": "Capture Homepage",
  "task_intention": "Navigate to website and capture screenshot",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to homepage",
      "args": { "action": "goto", "url": "https://example.com" }
    },
    {
      "tool_name": "browser_content",
      "intention": "Take screenshot",
      "args": { "action": "screenshot" }
    }
  ]
}
```

### Click and Navigate

```json
{
  "task_name": "Navigate via Click",
  "task_intention": "Click a link and wait for new page",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to homepage",
      "args": { "action": "goto", "url": "https://example.com" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Click About link",
      "args": { "action": "click", "selector": "a[href='/about']" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for About page",
      "args": { "action": "wait_for", "selector": ".about-content", "timeout": 5000 }
    }
  ]
}
```

---

## Form Interactions

### Login Form

```json
{
  "task_name": "Login",
  "task_intention": "Log into application with credentials",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to login page",
      "args": { "action": "goto", "url": "https://app.example.com/login" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for form to load",
      "args": { "action": "wait_for", "selector": "#login-form", "timeout": 5000 }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Enter username",
      "args": { "action": "type", "selector": "#username", "text": "testuser" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Enter password",
      "args": { "action": "type", "selector": "#password", "text": "testpass123" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Click login button",
      "args": { "action": "click", "selector": "button[type=submit]" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for dashboard",
      "args": { "action": "wait_for", "selector": ".dashboard", "timeout": 10000 }
    }
  ]
}
```

### Contact Form

```json
{
  "task_name": "Submit Contact Form",
  "task_intention": "Fill out and submit contact form",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to contact page",
      "args": { "action": "goto", "url": "https://example.com/contact" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Enter name",
      "args": { "action": "type", "selector": "#name", "text": "John Doe" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Enter email",
      "args": { "action": "type", "selector": "#email", "text": "john@example.com" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Select subject",
      "args": { "action": "select", "selector": "#subject", "value": "support" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Enter message",
      "args": { "action": "type", "selector": "#message", "text": "Hello, I have a question about your product." }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Submit form",
      "args": { "action": "click", "selector": "#submit" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for confirmation",
      "args": { "action": "wait_for", "selector": ".success-message", "timeout": 5000 }
    }
  ]
}
```

---

## Search Operations

### Google Search

```json
{
  "task_name": "Google Search",
  "task_intention": "Search Google and capture results",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to Google",
      "args": { "action": "goto", "url": "https://www.google.com" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Type search query",
      "args": { "action": "type", "selector": "textarea[name=q]", "text": "Moonsurf browser automation" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Press Enter to search",
      "args": { "action": "keyboard", "key": "Enter" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for results",
      "args": { "action": "wait_for", "selector": "#search", "timeout": 10000 }
    },
    {
      "tool_name": "browser_content",
      "intention": "Screenshot results",
      "args": { "action": "screenshot" }
    }
  ]
}
```

### Wikipedia Search

```json
{
  "task_name": "Wikipedia Article",
  "task_intention": "Search Wikipedia and read an article",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to Wikipedia",
      "args": { "action": "goto", "url": "https://en.wikipedia.org" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Click search input",
      "args": { "action": "click", "selector": "#searchInput" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Type search term",
      "args": { "action": "type", "selector": "#searchInput", "text": "Artificial Intelligence" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Submit search",
      "args": { "action": "keyboard", "key": "Enter" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for article",
      "args": { "action": "wait_for", "selector": "#firstHeading", "timeout": 10000 }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Scroll to content",
      "args": { "action": "scroll", "direction": "down", "amount": 300 }
    },
    {
      "tool_name": "browser_content",
      "intention": "Get article intro",
      "args": { "action": "get_text", "selector": ".mw-parser-output > p:first-of-type" }
    }
  ]
}
```

---

## Data Extraction

### Extract Product Information

```json
{
  "task_name": "Extract Product Data",
  "task_intention": "Get product details from e-commerce page",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to product page",
      "args": { "action": "goto", "url": "https://shop.example.com/products/widget-pro" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for product details",
      "args": { "action": "wait_for", "selector": ".product-details", "timeout": 5000 }
    },
    {
      "tool_name": "browser_content",
      "intention": "Get product title",
      "args": { "action": "get_text", "selector": ".product-title" }
    },
    {
      "tool_name": "browser_content",
      "intention": "Get product price",
      "args": { "action": "get_text", "selector": ".product-price" }
    },
    {
      "tool_name": "browser_content",
      "intention": "Get product description",
      "args": { "action": "get_text", "selector": ".product-description" }
    },
    {
      "tool_name": "browser_content",
      "intention": "Screenshot product image",
      "args": { "action": "screenshot", "selector": ".product-image" }
    }
  ]
}
```

### Extract Table Data

```json
{
  "task_name": "Extract Table",
  "task_intention": "Get data from HTML table",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to data page",
      "args": { "action": "goto", "url": "https://example.com/data-table" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for table",
      "args": { "action": "wait_for", "selector": "table.data-table", "timeout": 5000 }
    },
    {
      "tool_name": "browser_content",
      "intention": "Get table HTML",
      "args": { "action": "get_html", "selector": "table.data-table" }
    }
  ]
}
```

---

## Page Manipulation

### Scroll and Capture

```json
{
  "task_name": "Scroll Page",
  "task_intention": "Scroll through page and take screenshots",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to long page",
      "args": { "action": "goto", "url": "https://example.com/long-article" }
    },
    {
      "tool_name": "browser_content",
      "intention": "Screenshot top",
      "args": { "action": "screenshot" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Scroll down",
      "args": { "action": "scroll", "direction": "down", "amount": 800 }
    },
    {
      "tool_name": "browser_content",
      "intention": "Screenshot middle",
      "args": { "action": "screenshot" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Scroll to bottom",
      "args": { "action": "scroll", "direction": "down", "amount": 2000 }
    },
    {
      "tool_name": "browser_content",
      "intention": "Screenshot bottom",
      "args": { "action": "screenshot" }
    }
  ]
}
```

### Hover and Capture Dropdown

```json
{
  "task_name": "Capture Dropdown Menu",
  "task_intention": "Hover to show dropdown and capture it",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to page with dropdown",
      "args": { "action": "goto", "url": "https://example.com" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Hover over menu",
      "args": { "action": "hover", "selector": ".nav-dropdown-trigger" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for dropdown",
      "args": { "action": "wait_for", "selector": ".dropdown-menu.visible", "timeout": 2000 }
    },
    {
      "tool_name": "browser_content",
      "intention": "Screenshot dropdown",
      "args": { "action": "screenshot", "selector": ".dropdown-menu" }
    }
  ]
}
```

---

## JavaScript Execution

### Get Page Data via JS

```json
{
  "task_name": "Execute JavaScript",
  "task_intention": "Run JavaScript to extract data",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to page",
      "args": { "action": "goto", "url": "https://example.com/app" }
    },
    {
      "tool_name": "browser_execute",
      "intention": "Get page title",
      "args": { "action": "evaluate", "script": "return document.title" }
    },
    {
      "tool_name": "browser_execute",
      "intention": "Get all links",
      "args": { "action": "evaluate", "script": "return Array.from(document.querySelectorAll('a')).map(a => ({href: a.href, text: a.textContent}))" }
    },
    {
      "tool_name": "browser_execute",
      "intention": "Get localStorage data",
      "args": { "action": "evaluate", "script": "return JSON.stringify(localStorage)" }
    }
  ]
}
```

### Modify Page State

```json
{
  "task_name": "Modify Page",
  "task_intention": "Use JavaScript to modify page state",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to page",
      "args": { "action": "goto", "url": "https://example.com/settings" }
    },
    {
      "tool_name": "browser_execute",
      "intention": "Enable dark mode",
      "args": { "action": "evaluate", "script": "document.body.classList.add('dark-mode'); return 'Dark mode enabled'" }
    },
    {
      "tool_name": "browser_content",
      "intention": "Screenshot dark mode",
      "args": { "action": "screenshot" }
    }
  ]
}
```

---

## Multi-Step Workflows

### E-commerce Checkout Flow

```json
{
  "task_name": "Add to Cart Flow",
  "task_intention": "Add product to cart and proceed to checkout",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to product page",
      "args": { "action": "goto", "url": "https://shop.example.com/products/widget" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for product",
      "args": { "action": "wait_for", "selector": ".add-to-cart", "timeout": 5000 }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Select quantity",
      "args": { "action": "select", "selector": "#quantity", "value": "2" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Click Add to Cart",
      "args": { "action": "click", "selector": ".add-to-cart" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for cart update",
      "args": { "action": "wait_for", "selector": ".cart-count:not(:empty)", "timeout": 3000 }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Go to cart",
      "args": { "action": "click", "selector": ".cart-icon" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for cart page",
      "args": { "action": "wait_for", "selector": ".cart-items", "timeout": 5000 }
    },
    {
      "tool_name": "browser_content",
      "intention": "Screenshot cart",
      "args": { "action": "screenshot" }
    }
  ]
}
```

### Social Media Post

```json
{
  "task_name": "Create Social Post",
  "task_intention": "Log in and create a new post",
  "commands": [
    {
      "tool_name": "browser_navigate",
      "intention": "Go to social platform",
      "args": { "action": "goto", "url": "https://social.example.com" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Click login",
      "args": { "action": "click", "selector": ".login-btn" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for login form",
      "args": { "action": "wait_for", "selector": "#login-form", "timeout": 5000 }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Enter username",
      "args": { "action": "type", "selector": "#username", "text": "myuser" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Enter password",
      "args": { "action": "type", "selector": "#password", "text": "mypass" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Submit login",
      "args": { "action": "click", "selector": "button[type=submit]" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for feed",
      "args": { "action": "wait_for", "selector": ".feed", "timeout": 10000 }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Click new post",
      "args": { "action": "click", "selector": ".new-post-btn" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for post editor",
      "args": { "action": "wait_for", "selector": ".post-editor", "timeout": 3000 }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Type post content",
      "args": { "action": "type", "selector": ".post-editor textarea", "text": "Hello world! Testing browser automation 🚀" }
    },
    {
      "tool_name": "browser_interact",
      "intention": "Click post button",
      "args": { "action": "click", "selector": ".submit-post" }
    },
    {
      "tool_name": "browser_navigate",
      "intention": "Wait for post to appear",
      "args": { "action": "wait_for", "selector": ".post-success", "timeout": 5000 }
    }
  ]
}
```

---

## Client Code Examples

### Node.js WebSocket Client

```javascript
const WebSocket = require('ws');

async function runTask(task) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:3400');
    let taskId = null;
    const results = [];

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'task_submit',
        ...task
      }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'task_submit_response':
          if (!msg.success) {
            ws.close();
            reject(new Error(msg.error));
          }
          taskId = msg.taskId;
          console.log(`Task started: ${taskId}`);
          break;

        case 'task_progress':
          console.log(`[${msg.commandIndex + 1}/${msg.totalCommands}] ${msg.status}: ${msg.intention}`);
          if (msg.status === 'success' && msg.result) {
            results.push(msg.result);
          }
          break;

        case 'task_complete':
          ws.close();
          if (msg.status === 'completed') {
            resolve({ taskId, status: msg.status, results, summary: msg.summary });
          } else {
            reject(new Error(`Task ${msg.status}: ${msg.error?.message}`));
          }
          break;
      }
    });

    ws.on('error', reject);
  });
}

// Usage
runTask({
  task_name: 'Example',
  task_intention: 'Navigate to example.com',
  commands: [
    { tool_name: 'browser_navigate', intention: 'Navigate', args: { action: 'goto', url: 'https://example.com' } }
  ]
}).then(console.log).catch(console.error);
```

### Python Client

```python
import asyncio
import websockets
import json

async def run_task(task):
    uri = "ws://localhost:3400"
    async with websockets.connect(uri) as ws:
        # Submit task
        await ws.send(json.dumps({
            "type": "task_submit",
            **task
        }))

        results = []

        async for message in ws:
            msg = json.loads(message)

            if msg["type"] == "task_submit_response":
                if not msg.get("success"):
                    raise Exception(msg.get("error"))
                print(f"Task started: {msg['taskId']}")

            elif msg["type"] == "task_progress":
                idx = msg["commandIndex"] + 1
                total = msg["totalCommands"]
                print(f"[{idx}/{total}] {msg['status']}: {msg['intention']}")
                if msg["status"] == "success" and msg.get("result"):
                    results.append(msg["result"])

            elif msg["type"] == "task_complete":
                if msg["status"] == "completed":
                    return {"status": msg["status"], "results": results, "summary": msg["summary"]}
                else:
                    raise Exception(f"Task {msg['status']}: {msg.get('error', {}).get('message')}")

# Usage
task = {
    "task_name": "Example",
    "task_intention": "Navigate to example.com",
    "commands": [
        {"tool_name": "browser_navigate", "intention": "Navigate", "args": {"action": "goto", "url": "https://example.com"}}
    ]
}

result = asyncio.run(run_task(task))
print(result)
```

### Bash/cURL Client

```bash
#!/bin/bash

BASE_URL="http://localhost:3300"

# Submit task
RESPONSE=$(curl -s -X POST "$BASE_URL/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "task_name": "Screenshot Example",
    "task_intention": "Navigate and screenshot",
    "commands": [
      {"tool_name": "browser_navigate", "intention": "Navigate", "args": {"action": "goto", "url": "https://example.com"}},
      {"tool_name": "browser_content", "intention": "Screenshot", "args": {"action": "screenshot"}}
    ]
  }')

TASK_ID=$(echo $RESPONSE | jq -r '.taskId')
echo "Task submitted: $TASK_ID"

# Poll for completion
while true; do
  TASK=$(curl -s "$BASE_URL/tasks/$TASK_ID")
  STATUS=$(echo $TASK | jq -r '.task.status')
  echo "Status: $STATUS"

  if [[ "$STATUS" == "completed" || "$STATUS" == "failed" || "$STATUS" == "cancelled" ]]; then
    echo "Final result:"
    echo $TASK | jq '.task.commands[] | {intention, status}'
    break
  fi

  sleep 1
done
```
