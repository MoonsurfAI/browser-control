# Architecture Overview

This document explains how the Task Execution System is designed and how its components interact.

## System Architecture

```
                                    ┌─────────────────────────────────────────┐
                                    │           Moonsurf Server               │
                                    │                                         │
┌──────────────┐   HTTP POST /tasks │  ┌───────────────┐                      │
│   REST       │ ──────────────────►│  │  HTTP Server  │                      │
│   Client     │◄────────────────── │  │  (port 3300)  │                      │
└──────────────┘   { taskId, wsUrl }│  └───────┬───────┘                      │
                                    │          │                              │
                                    │          ▼                              │
┌──────────────┐   task_submit      │  ┌───────────────┐    ┌─────────────┐  │
│  WebSocket   │ ──────────────────►│  │  Task WS      │───►│   Task      │  │
│   Client     │◄────────────────── │  │  Server       │◄───│   Manager   │  │
└──────────────┘   task_progress    │  │  (port 3400)  │    └──────┬──────┘  │
                   task_complete    │  └───────────────┘           │         │
                                    │                              │         │
                                    │                    ┌─────────▼───────┐ │
                                    │                    │   MCP Handler   │ │
                                    │                    │  (tools/call)   │ │
                                    │                    └─────────┬───────┘ │
                                    │                              │         │
                                    │                    ┌─────────▼───────┐ │
                                    │                    │    Instance     │ │
                                    │                    │    Manager      │ │
                                    │                    └─────────┬───────┘ │
                                    └──────────────────────────────┼─────────┘
                                                                   │
                                                          WebSocket│
                                                                   ▼
                                                    ┌──────────────────────┐
                                                    │   Browser Instance   │
                                                    │   (Chrome Extension) │
                                                    └──────────────────────┘
```

## Core Components

### 1. Task Manager (`src/task-manager.ts`)

The central coordinator for all task operations.

**Responsibilities:**
- Task creation and validation
- Per-instance task queues (FIFO)
- Sequential command execution
- Progress event emission
- Timeout enforcement
- Error handling and task state management

**Key Design Decisions:**

1. **Per-Instance Queues**: Each browser instance has its own queue to prevent conflicts. Tasks for different instances can run in parallel.

2. **EventEmitter Pattern**: Uses Node.js EventEmitter to broadcast progress updates. Both WebSocket and REST layers can subscribe.

3. **Deferred Execution**: Uses `setImmediate()` to start task processing, allowing callers to subscribe before first progress event.

```javascript
// This ensures clients receive the first "running" event
setImmediate(() => this.processQueue(instanceId));
```

4. **Fail-Fast**: Execution stops on first error; remaining commands are marked as 'skipped'.

### 2. Task WebSocket Server (`src/task-websocket-server.ts`)

Handles real-time communication with clients.

**Responsibilities:**
- WebSocket connection management
- Message routing (submit, list, cancel, etc.)
- Subscription management (task-level and instance-level)
- Progress broadcasting to subscribed clients

**Connection Lifecycle:**
```
Connect → Welcome message
        ↓
Submit task → Auto-subscribe to task
        ↓
Receive progress updates
        ↓
Receive completion → Optionally close
```

**Subscription Model:**
- **Task subscription**: Receive updates for a specific task
- **Instance subscription**: Receive updates for all tasks on an instance

### 3. HTTP Server Extensions (`src/http-server.ts`)

REST API for task management.

**Endpoints:**
- `POST /tasks` - Submit (returns taskId + wsEndpoint for progress)
- `GET /tasks` - List with filters
- `GET /tasks/:id` - Get details
- `POST /tasks/:id/cancel` - Cancel

### 4. Instance Manager Integration (`src/instance-manager.ts`)

Notifies Task Manager when browser instances disconnect.

```javascript
instanceManager.onDisconnect((instanceId) => {
    taskManager.handleInstanceDisconnect(instanceId);
});
```

## Data Flow

### Task Submission Flow

```
1. Client sends task_submit (or POST /tasks)
         │
         ▼
2. Task Manager validates:
   - Browser instance exists and is connected
   - Commands array is not empty
   - Queue is not full
         │
         ▼
3. Task created with:
   - Unique ID: task_{timestamp}_{counter}
   - Status: 'queued'
   - Commands with status: 'pending'
         │
         ▼
4. Task added to instance queue
         │
         ▼
5. Return { taskId, queuePosition }
         │
         ▼
6. setImmediate → processQueue()
```

### Command Execution Flow

```
1. Pick task from queue (FIFO)
   Set status: 'running'
         │
         ▼
2. For each command:
   │
   ├─► Set command status: 'running'
   │   Emit progress event
   │         │
   │         ▼
   │   Build MCP request:
   │   {
   │     method: 'tools/call',
   │     params: { name: tool_name, arguments: args }
   │   }
   │         │
   │         ▼
   │   Execute via handleMCPRequest()
   │   (with timeout)
   │         │
   │   ┌─────┴─────┐
   │   │           │
   │   ▼           ▼
   │ Success    Error
   │   │           │
   │   ▼           ▼
   │ Set status  Set status
   │ 'success'   'error'
   │   │           │
   │   ▼           ▼
   │ Emit        Emit
   │ progress    progress
   │   │           │
   │   │           ▼
   │   │         Mark remaining
   │   │         commands 'skipped'
   │   │           │
   │   │           ▼
   │   │         Set task 'failed'
   │   │           │
   └───┴───────────┤
                   │
         ▼         ▼
3. All done or error occurred
   Set status: 'completed' or 'failed'
   Emit task_complete
```

## Error Handling Strategy

### Error Propagation

```
Browser Error
     ↓
Instance Manager (catches, formats)
     ↓
MCP Handler (returns error response)
     ↓
Task Manager (marks command failed, stops task)
     ↓
WebSocket Server (broadcasts to subscribers)
     ↓
Client (receives task_progress with error)
```

### Timeout Handling

Each command has a configurable timeout (default: 60s).

```javascript
const result = await this.executeWithTimeout(
    handleMCPRequest(mcpRequest),
    config.tasks.commandTimeout
);
```

If timeout occurs:
1. Command marked as 'error' with code 'COMMAND_TIMEOUT'
2. Task marked as 'failed'
3. Remaining commands marked as 'skipped'

## Queue Management

### Per-Instance Queues

```
Instance A Queue:          Instance B Queue:
┌─────────────────┐       ┌─────────────────┐
│ Task 1 (running)│       │ Task 4 (running)│
│ Task 2 (queued) │       │ Task 5 (queued) │
│ Task 3 (queued) │       └─────────────────┘
└─────────────────┘
        ▲                         ▲
        │                         │
    Processed                 Processed
   sequentially              sequentially
```

### Queue Processing

- Only one task runs per instance at a time
- `isProcessing` flag prevents concurrent processing
- Tasks processed in FIFO order
- Cancelled tasks are skipped during processing

## Memory Management

### Task Cleanup

Old completed/failed/cancelled tasks are cleaned up hourly:

```javascript
setInterval(() => {
    taskManager.cleanupTasks(3600000); // Remove tasks older than 1 hour
}, 3600000);
```

### Disconnection Handling

When a browser disconnects:
1. All queued tasks for that instance are marked 'failed'
2. Running task (if any) is marked 'failed'
3. Queue is cleared
4. `task_complete` events are emitted for each affected task

## Concurrency Model

### Thread Safety Considerations

Node.js is single-threaded, so no mutex/locks are needed. However:

1. **Async gaps**: During `await` calls, other events can be processed
2. **Race condition prevention**: Task status is checked before each command execution
3. **Cancellation**: Checked both in queue processing and command execution

```javascript
// Check before each command
if ((task.status as TaskStatus) === 'cancelled') {
    this.markRemainingCommandsSkipped(task, i);
    break;
}
```

## Extensibility Points

### Adding New Message Types

1. Define type in `src/types.ts`
2. Add handler in `task-websocket-server.ts` switch statement
3. Implement logic in Task Manager if needed

### Custom Progress Data

Commands can return arbitrary data in their `result` field, which is included in progress events:

```json
{
  "type": "task_progress",
  "status": "success",
  "result": {
    "content": [{ "type": "text", "text": "{\"screenshot\": \"base64...\"}" }]
  }
}
```

### Hooks for External Systems

Task Manager extends EventEmitter, so external systems can subscribe:

```javascript
taskManager.on('progress', (msg) => {
    // Send to external monitoring system
});

taskManager.on('complete', (msg) => {
    // Trigger webhook
});
```
