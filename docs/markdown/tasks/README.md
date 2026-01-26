# Task Execution System Documentation

The Task Execution System enables AI agents and developers to submit batched browser automation commands that execute sequentially with real-time progress reporting.

> **Note:** This documentation covers the Task Execution System feature in detail. For general Moonsurf documentation, see the [main documentation hub](../README.md).

## Table of Contents

### For Users

1. [**Getting Started**](./getting-started.md) - Quick introduction and first task
2. [**Architecture Overview**](./architecture.md) - How the system works
3. [**WebSocket API Reference**](./websocket-api.md) - Real-time task submission and monitoring
4. [**REST API Reference**](./rest-api.md) - HTTP endpoints for task management
5. [**Task Format**](./task-format.md) - Task and command structure
6. [**Error Handling**](./error-handling.md) - Error codes, states, and recovery
7. [**Examples**](./examples.md) - Common use cases and patterns

### For Developers

8. [**Configuration**](./configuration.md) - Environment variables and settings
9. [**Internals**](./internals.md) - Code structure and implementation details
10. [**Contributing**](./contributing.md) - Development setup and guidelines

---

## Quick Overview

### What is a Task?

A **Task** is a named sequence of browser automation commands that execute one after another. Each command uses an existing MCP tool (like `browser_navigate`, `browser_interact`, etc.) with specified arguments.

```json
{
  "task_name": "Login Flow",
  "task_intention": "Log into the application",
  "commands": [
    { "tool_name": "browser_navigate", "intention": "Go to login", "args": { "action": "goto", "url": "https://app.example.com/login" } },
    { "tool_name": "browser_interact", "intention": "Enter email", "args": { "action": "type", "selector": "#email", "text": "user@example.com" } },
    { "tool_name": "browser_interact", "intention": "Enter password", "args": { "action": "type", "selector": "#password", "text": "secret" } },
    { "tool_name": "browser_interact", "intention": "Click login", "args": { "action": "click", "selector": "button[type=submit]" } }
  ]
}
```

### Key Features

- **Sequential Execution**: Commands run one after another in order
- **Real-time Progress**: WebSocket updates for each command (running → success/error)
- **Error Handling**: Execution stops on first error, remaining commands are skipped
- **Task Queue**: Multiple tasks are queued per browser instance
- **Cancellation**: Running tasks can be cancelled mid-execution

### Endpoints

| Protocol | Endpoint | Purpose |
|----------|----------|---------|
| WebSocket | `ws://localhost:3400` | Real-time task submission and progress |
| HTTP | `GET /tasks` | List all tasks |
| HTTP | `GET /tasks/:id` | Get task details |
| HTTP | `POST /tasks` | Submit a new task |
| HTTP | `POST /tasks/:id/cancel` | Cancel a task |

### Task Lifecycle

```
                    ┌──────────┐
    Submit Task ───►│  queued  │
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
                    │ running  │◄─── Commands execute sequentially
                    └────┬─────┘
                         │
           ┌─────────────┼─────────────┐
           │             │             │
           ▼             ▼             ▼
      ┌─────────┐  ┌──────────┐  ┌───────────┐
      │completed│  │  failed  │  │ cancelled │
      └─────────┘  └──────────┘  └───────────┘
       All OK      Error in cmd   User cancel
```

---

## Next Steps

- **New to the system?** Start with [Getting Started](./getting-started.md)
- **Building a client?** See [WebSocket API Reference](./websocket-api.md)
- **Need examples?** Check [Examples](./examples.md)
- **Contributing?** Read [Internals](./internals.md) and [Contributing](./contributing.md)

## Related Documentation

- [Main Documentation](../README.md) - Overview of all Moonsurf documentation
- [WebSocket Protocol](../api-reference/websocket-protocol.md) - General WebSocket API reference
- [HTTP Endpoints](../api-reference/http-endpoints.md) - REST API including task endpoints
- [Tools Reference](../tools/README.md) - MCP tools used in task commands
- [Guides](../guides/README.md) - Browser automation patterns and examples
