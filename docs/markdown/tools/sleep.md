# sleep

Wait for a specified duration before continuing. Useful as a delay between task commands, e.g., waiting for animations, debounced inputs, or rate-limited APIs.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `duration` | number | Yes | Duration to wait in milliseconds |

## Examples

### Wait 2 seconds
```json
{ "name": "sleep", "arguments": { "duration": 2000 } }
```

### Use in a Task

```json
{
  "task_name": "Submit with delay",
  "commands": [
    {
      "tool_name": "browser_interact",
      "intention": "Click submit button",
      "args": { "action": "click", "selector": "#submit" }
    },
    {
      "tool_name": "sleep",
      "intention": "Wait for server processing",
      "args": { "duration": 3000 }
    },
    {
      "tool_name": "browser_content",
      "intention": "Check result",
      "args": { "action": "get", "selector": "#result" }
    }
  ]
}
```

## Response

```json
{
  "content": [{
    "type": "text",
    "text": "{\"slept\":2000}"
  }]
}
```

## Notes

- This is a server-side tool — it does not require a browser instance or extension connection.
- The tool blocks the current execution for the specified duration, then returns.
- No `instanceId` or `tabId` is needed.
