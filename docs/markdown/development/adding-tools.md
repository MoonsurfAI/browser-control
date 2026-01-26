# Adding Tools

Guide to adding new MCP tools to Moonsurf.

## Overview

Moonsurf tools are defined in `src/tool-definitions.ts`. Each tool:
- Has a unique name
- Defines an input schema (JSON Schema)
- Maps to extension commands
- Returns structured results

## Tool Structure

### Tool Definition

```typescript
{
  name: 'browser_example',
  description: 'Example tool description',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['action1', 'action2'],
        description: 'Action to perform'
      },
      param1: {
        type: 'string',
        description: 'First parameter'
      },
      param2: {
        type: 'number',
        description: 'Second parameter'
      }
    },
    required: ['action']
  }
}
```

### Tool Execution

```typescript
async function handleExampleTool(args: any): Promise<ToolResult> {
  const { action, param1, param2 } = args;

  switch (action) {
    case 'action1':
      return executeAction1(param1);
    case 'action2':
      return executeAction2(param2);
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
```

## Adding a New Tool

### Step 1: Define the Tool Schema

Add to `src/tool-definitions.ts`:

```typescript
const tools = [
  // ... existing tools ...

  {
    name: 'browser_custom',
    description: 'Custom browser tool for specific functionality',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['do_thing', 'do_other_thing'],
          description: 'Action to perform'
        },
        selector: {
          type: 'string',
          description: 'CSS selector for target element'
        },
        value: {
          type: 'string',
          description: 'Value to use'
        },
        instanceId: {
          type: 'string',
          description: 'Browser instance ID'
        }
      },
      required: ['action']
    }
  }
];
```

### Step 2: Add Execution Handler

```typescript
async function executeTool(
  name: string,
  args: Record<string, any>
): Promise<ToolResult> {
  // ... existing handlers ...

  if (name === 'browser_custom') {
    return handleCustomTool(args);
  }

  throw new Error(`Unknown tool: ${name}`);
}

async function handleCustomTool(args: any): Promise<ToolResult> {
  const { action, selector, value, instanceId } = args;
  const instance = await getTargetInstance(instanceId);

  switch (action) {
    case 'do_thing':
      return doThing(instance, selector);

    case 'do_other_thing':
      return doOtherThing(instance, value);

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
```

### Step 3: Implement the Action

```typescript
async function doThing(
  instance: BrowserInstance,
  selector: string
): Promise<ToolResult> {
  // Send command to extension
  const result = await instanceManager.queueToolCall(
    instance.id,
    'custom_do_thing',
    { selector }
  );

  // Return result
  return {
    content: [
      {
        type: 'text',
        text: `Did thing with ${selector}: ${JSON.stringify(result)}`
      }
    ]
  };
}
```

### Step 4: Add Extension Handler

In `chrome-extension/src/background.ts`:

```typescript
function handleCommand(command) {
  switch (command.type) {
    // ... existing handlers ...

    case 'custom_do_thing':
      return handleCustomDoThing(command.params);
  }
}

async function handleCustomDoThing(params) {
  const { selector } = params;

  // Execute in content script
  const result = await executeInTab(tabId, (selector) => {
    const element = document.querySelector(selector);
    // Do something with element
    return { success: true, data: element?.textContent };
  }, selector);

  return result;
}
```

## Tool Design Guidelines

### 1. Action-Based Design

Use an `action` parameter to group related functionality:

```typescript
{
  name: 'browser_media',
  inputSchema: {
    properties: {
      action: {
        enum: ['play', 'pause', 'mute', 'unmute', 'seek']
      }
    }
  }
}
```

This consolidates related operations into one tool.

### 2. Clear Descriptions

Write clear descriptions for the tool and each parameter:

```typescript
{
  name: 'browser_example',
  description: 'Perform example operations on the current page. Use action="do_thing" to do something specific.',
  inputSchema: {
    properties: {
      action: {
        description: 'The action to perform. "do_thing" does X, "do_other" does Y.'
      },
      selector: {
        description: 'CSS selector for the target element (e.g., "#id", ".class", "button[type=submit]")'
      }
    }
  }
}
```

### 3. Sensible Defaults

Provide defaults for optional parameters:

```typescript
async function handleTool(args: any) {
  const {
    action,
    timeout = 30000,
    waitForSelector = true
  } = args;
}
```

### 4. Structured Results

Return structured, informative results:

```typescript
return {
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        success: true,
        action: 'do_thing',
        element: selector,
        result: data
      }, null, 2)
    }
  ]
};
```

### 5. Error Handling

Handle errors gracefully with useful messages:

```typescript
async function handleTool(args: any) {
  try {
    const result = await performAction(args);
    return formatSuccess(result);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`
        }
      ],
      isError: true
    };
  }
}
```

## Input Schema Reference

### String Parameter

```typescript
{
  param: {
    type: 'string',
    description: 'A string value'
  }
}
```

### Enum Parameter

```typescript
{
  action: {
    type: 'string',
    enum: ['option1', 'option2', 'option3'],
    description: 'Choose an action'
  }
}
```

### Number Parameter

```typescript
{
  timeout: {
    type: 'number',
    description: 'Timeout in milliseconds',
    default: 30000
  }
}
```

### Boolean Parameter

```typescript
{
  fullPage: {
    type: 'boolean',
    description: 'Capture full page',
    default: false
  }
}
```

### Object Parameter

```typescript
{
  options: {
    type: 'object',
    properties: {
      key1: { type: 'string' },
      key2: { type: 'number' }
    }
  }
}
```

### Array Parameter

```typescript
{
  files: {
    type: 'array',
    items: { type: 'string' },
    description: 'List of file paths'
  }
}
```

### Required Fields

```typescript
{
  required: ['action', 'selector']
}
```

## Testing New Tools

### 1. Build and Run

```bash
npm run build
npm start
```

### 2. List Tools

```bash
curl -X POST http://localhost:3300/message \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Verify your tool appears in the list.

### 3. Call the Tool

```bash
curl -X POST http://localhost:3300/message \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"browser_custom",
      "arguments":{
        "action":"do_thing",
        "selector":"#test"
      }
    }
  }'
```

### 4. Debug

Enable debug logging:
```bash
LOG_LEVEL=debug npm start
```

## Example: Adding a Cookie Tool

### 1. Tool Definition

```typescript
{
  name: 'browser_cookies',
  description: 'Manage browser cookies for the current page',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['get', 'set', 'delete', 'clear'],
        description: 'Cookie action to perform'
      },
      name: {
        type: 'string',
        description: 'Cookie name (for get/set/delete)'
      },
      value: {
        type: 'string',
        description: 'Cookie value (for set)'
      },
      domain: {
        type: 'string',
        description: 'Cookie domain (optional for set)'
      },
      instanceId: {
        type: 'string',
        description: 'Browser instance ID'
      }
    },
    required: ['action']
  }
}
```

### 2. Execution Handler

```typescript
async function handleCookiesTool(args: any): Promise<ToolResult> {
  const { action, name, value, domain, instanceId } = args;
  const instance = await getTargetInstance(instanceId);

  switch (action) {
    case 'get':
      const cookies = await instanceManager.queueToolCall(
        instance.id,
        'cookies_get',
        { name }
      );
      return formatResult('Cookies retrieved', cookies);

    case 'set':
      if (!name || !value) {
        throw new Error('Name and value required for set action');
      }
      await instanceManager.queueToolCall(
        instance.id,
        'cookies_set',
        { name, value, domain }
      );
      return formatResult('Cookie set', { name, value });

    case 'delete':
      if (!name) {
        throw new Error('Name required for delete action');
      }
      await instanceManager.queueToolCall(
        instance.id,
        'cookies_delete',
        { name }
      );
      return formatResult('Cookie deleted', { name });

    case 'clear':
      await instanceManager.queueToolCall(
        instance.id,
        'cookies_clear',
        {}
      );
      return formatResult('All cookies cleared', {});

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
```

### 3. Extension Handlers

```typescript
// In chrome-extension background script
async function handleCookiesGet(params) {
  const { name } = params;
  const cookies = await chrome.cookies.getAll({ name });
  return { cookies };
}

async function handleCookiesSet(params) {
  const { name, value, domain } = params;
  await chrome.cookies.set({
    url: getCurrentUrl(),
    name,
    value,
    domain
  });
  return { success: true };
}
```

## Related

- [Project Structure](project-structure.md) - Code organization
- [Extension Development](extension-development.md) - Extension changes
- [Tool Reference](../tools/README.md) - Existing tools
