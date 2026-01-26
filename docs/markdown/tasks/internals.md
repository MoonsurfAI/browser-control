# Internals

This document covers the internal implementation details of the Task Execution System for developers maintaining or extending the codebase.

## File Structure

```
src/
├── task-manager.ts         # Core task queue and execution logic
├── task-websocket-server.ts # WebSocket server for task operations
├── types.ts                # Type definitions (Task, Command, messages)
├── config.ts               # Configuration loading (tasks section)
├── http-server.ts          # REST endpoints for tasks
├── instance-manager.ts     # Browser instance management (disconnect hooks)
└── index.ts                # Server startup (task server initialization)
```

---

## Task Manager (`src/task-manager.ts`)

The Task Manager is the core of the system. It's a singleton that manages all task operations.

### Class Structure

```typescript
class TaskManager extends EventEmitter {
  private queues = new Map<string, TaskQueue>();  // Per-instance queues
  private tasks = new Map<string, Task>();        // All tasks by ID
  private taskIdCounter = 0;                      // For unique IDs

  // Public API
  submitTask(message: TaskSubmitMessage): { taskId, queuePosition } | { error }
  cancelTask(taskId: string): boolean
  getTask(taskId: string): Task | undefined
  listTasks(instanceId?, status?): Task[]
  handleInstanceDisconnect(instanceId: string): void
  cleanupTasks(maxAge: number): number

  // Private execution
  private processQueue(instanceId: string): Promise<void>
  private executeTask(task: Task): Promise<void>
  private executeCommand(task: Task, command: TaskCommand, index: number): Promise<void>
  private executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T>
  private markRemainingCommandsSkipped(task: Task, fromIndex: number): void
  private emitProgress(task: Task, command: TaskCommand, index: number): void
  private emitTaskComplete(task: Task): void
}

export const taskManager = new TaskManager();
```

### Task Queue Structure

```typescript
interface TaskQueue {
  instanceId: string;
  tasks: Task[];          // FIFO array
  isProcessing: boolean;  // Prevents concurrent processing
}
```

### Task Submission Flow

```
submitTask()
    │
    ├── Validate instance (exists, connected)
    │   └── Return error if invalid
    │
    ├── Validate commands (non-empty)
    │   └── Return error if invalid
    │
    ├── Check queue size
    │   └── Return error if full
    │
    ├── Generate task ID: task_{timestamp}_{counter.toString(36)}
    │
    ├── Create Task object with status 'queued'
    │
    ├── Store in this.tasks Map
    │
    ├── Add to instance queue
    │
    ├── setImmediate(() => processQueue(instanceId))
    │   └── Defers execution to allow subscriber setup
    │
    └── Return { taskId, queuePosition }
```

### Queue Processing

```typescript
private async processQueue(instanceId: string): Promise<void> {
  const queue = this.queues.get(instanceId);

  // Guard: no queue or already processing
  if (!queue || queue.isProcessing) return;

  queue.isProcessing = true;

  while (queue.tasks.length > 0) {
    const task = queue.tasks[0];

    // Skip cancelled tasks
    if (task.status === 'cancelled') {
      queue.tasks.shift();
      continue;
    }

    await this.executeTask(task);
    queue.tasks.shift();
  }

  queue.isProcessing = false;
}
```

**Key Design Points:**

1. **Single processor per instance**: The `isProcessing` flag ensures only one task runs at a time per instance
2. **FIFO order**: Tasks are processed in submission order
3. **Cancelled tasks**: Skipped during queue processing
4. **Continuous draining**: Processes all tasks until queue is empty

### Command Execution

```typescript
private async executeCommand(task: Task, command: TaskCommand, index: number): Promise<void> {
  command.status = 'running';
  command.startedAt = Date.now();

  // Emit progress: running
  this.emitProgress(task, command, index);

  try {
    // Build MCP request
    const mcpRequest = {
      jsonrpc: '2.0',
      id: `${task.id}_${command.id}`,
      method: 'tools/call',
      params: {
        name: command.tool_name,
        arguments: { ...command.args, instanceId: task.instanceId }
      }
    };

    // Execute with timeout
    const result = await this.executeWithTimeout(
      handleMCPRequest(mcpRequest),
      config.tasks.commandTimeout
    );

    // Check for errors
    if (result.error || result.result?.isError) {
      throw new Error(/* error message */);
    }

    command.status = 'success';
    command.result = result.result;

  } catch (error) {
    command.status = 'error';
    command.error = {
      code: 'EXECUTION_ERROR',
      message: error.message
    };
  }

  command.completedAt = Date.now();
  this.emitProgress(task, command, index);
}
```

**Integration with MCP:**

The task system reuses existing MCP infrastructure by calling `handleMCPRequest()`:

```
Task Command
    │
    ▼
Build MCP Request
    │
    ▼
handleMCPRequest()  ← src/mcp-handler.ts
    │
    ▼
InstanceManager     ← src/instance-manager.ts
    │
    ▼
Browser WebSocket
    │
    ▼
Chrome Extension
```

### Timeout Implementation

```typescript
private executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Command timeout after ${timeout}ms`));
    }, timeout);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
```

### Event Emission

The Task Manager extends EventEmitter and emits two types of events:

```typescript
// Progress events (per command)
this.emit('progress', {
  type: 'task_progress',
  taskId, commandId, commandIndex, totalCommands,
  status, timestamp, tool_name, intention,
  result?, error?
});

// Completion events (per task)
this.emit('complete', {
  type: 'task_complete',
  taskId, status, timestamp,
  summary: { totalCommands, successfulCommands, failedCommandIndex?, duration },
  error?, results[]
});
```

Subscribers (WebSocket server) listen to these events and broadcast to clients.

---

## Task WebSocket Server (`src/task-websocket-server.ts`)

Handles WebSocket connections and message routing.

### Architecture

```
Client A ─────┐
              │
Client B ─────┼───► Task WebSocket Server ───► Task Manager
              │          │
Client C ─────┘          │
                         ▼
                   Subscriptions Map
                   (taskId → Set<WebSocket>)
                   (instanceId → Set<WebSocket>)
```

### Connection Handling

```typescript
wss.on('connection', (ws) => {
  const sessionId = uuidv4();

  // Send welcome
  ws.send(JSON.stringify({
    type: 'welcome',
    sessionId,
    message: 'Connected to Moonsurf Task Server'
  }));

  // Handle messages
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    handleMessage(ws, sessionId, msg);
  });

  // Handle disconnect
  ws.on('close', () => {
    cleanupSubscriptions(ws);
  });
});
```

### Message Routing

```typescript
function handleMessage(ws: WebSocket, sessionId: string, msg: any) {
  switch (msg.type) {
    case 'task_submit':
      handleTaskSubmit(ws, msg);
      break;
    case 'task_list':
      handleTaskList(ws, msg);
      break;
    case 'task_status':
      handleTaskStatus(ws, msg);
      break;
    case 'task_cancel':
      handleTaskCancel(ws, msg);
      break;
    case 'subscribe_task':
      subscribeToTask(ws, msg.taskId);
      break;
    case 'subscribe_instance':
      subscribeToInstance(ws, msg.instanceId);
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }));
  }
}
```

### Subscription Management

```typescript
const taskSubscriptions = new Map<string, Set<WebSocket>>();
const instanceSubscriptions = new Map<string, Set<WebSocket>>();

// Subscribe
function subscribeToTask(ws: WebSocket, taskId: string) {
  if (!taskSubscriptions.has(taskId)) {
    taskSubscriptions.set(taskId, new Set());
  }
  taskSubscriptions.get(taskId)!.add(ws);
}

// Broadcast progress
taskManager.on('progress', (msg) => {
  // Send to task subscribers
  const taskSubs = taskSubscriptions.get(msg.taskId);
  taskSubs?.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  });

  // Send to instance subscribers
  const task = taskManager.getTask(msg.taskId);
  if (task) {
    const instanceSubs = instanceSubscriptions.get(task.instanceId);
    instanceSubs?.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    });
  }
});
```

### Auto-Subscribe on Submit

When a client submits a task, they are automatically subscribed:

```typescript
function handleTaskSubmit(ws: WebSocket, msg: TaskSubmitMessage) {
  const result = taskManager.submitTask(msg);

  if ('error' in result) {
    ws.send(JSON.stringify({
      type: 'task_submit_response',
      success: false,
      error: result.error
    }));
    return;
  }

  // Auto-subscribe to task updates
  subscribeToTask(ws, result.taskId);

  ws.send(JSON.stringify({
    type: 'task_submit_response',
    success: true,
    taskId: result.taskId,
    queuePosition: result.queuePosition
  }));
}
```

---

## HTTP Server Extensions (`src/http-server.ts`)

REST endpoints are added to the existing HTTP server.

### Endpoint Implementation

```typescript
// POST /tasks - Submit task
app.post('/tasks', (req, res) => {
  const result = taskManager.submitTask(req.body);

  if ('error' in result) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    taskId: result.taskId,
    queuePosition: result.queuePosition,
    wsEndpoint: `ws://localhost:${config.tasks.wsPort}`
  });
});

// GET /tasks - List tasks
app.get('/tasks', (req, res) => {
  const { instanceId, status } = req.query;
  const tasks = taskManager.listTasks(instanceId, status);
  res.json({ tasks: tasks.map(formatTaskSummary) });
});

// GET /tasks/:id - Get task details
app.get('/tasks/:id', (req, res) => {
  const task = taskManager.getTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json({ task });
});

// POST /tasks/:id/cancel - Cancel task
app.post('/tasks/:id/cancel', (req, res) => {
  const task = taskManager.getTask(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const success = taskManager.cancelTask(req.params.id);
  res.json({ success, taskId: req.params.id });
});
```

---

## Instance Manager Integration (`src/instance-manager.ts`)

The Instance Manager notifies the Task Manager when browsers disconnect.

### Callback Registration

```typescript
class InstanceManager {
  private disconnectCallbacks: Array<(instanceId: string) => void> = [];

  onDisconnect(callback: (instanceId: string) => void): void {
    this.disconnectCallbacks.push(callback);
  }

  // Called when browser disconnects
  private handleDisconnect(instanceId: string): void {
    this.disconnectCallbacks.forEach(cb => cb(instanceId));
  }
}
```

### Registration at Module Load

```typescript
// At end of task-manager.ts
instanceManager.onDisconnect((instanceId: string) => {
  taskManager.handleInstanceDisconnect(instanceId);
});
```

### Disconnect Handling

```typescript
handleInstanceDisconnect(instanceId: string): void {
  const queue = this.queues.get(instanceId);

  if (queue) {
    // Fail all queued/running tasks
    for (const task of queue.tasks) {
      if (task.status === 'queued' || task.status === 'running') {
        task.status = 'failed';
        task.error = {
          code: 'INSTANCE_DISCONNECTED',
          message: 'Browser instance disconnected'
        };
        task.completedAt = Date.now();
        this.emitTaskComplete(task);
      }
    }

    queue.tasks = [];
    queue.isProcessing = false;
  }
}
```

---

## Type Definitions (`src/types.ts`)

### Core Types

```typescript
export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type CommandStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped';

export interface TaskCommand {
  id: string;
  tool_name: string;
  intention: string;
  args: Record<string, unknown>;
  status: CommandStatus;
  startedAt?: number;
  completedAt?: number;
  result?: unknown;
  error?: { code: string; message: string };
}

export interface Task {
  id: string;
  instanceId: string;
  name: string;
  intention: string;
  commands: TaskCommand[];
  status: TaskStatus;
  currentCommandIndex: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: { code: string; message: string; commandId?: string };
  metadata?: Record<string, unknown>;
}
```

### Message Types

```typescript
export interface TaskSubmitMessage {
  type: 'task_submit';
  task_name: string;
  task_intention: string;
  instanceId?: string;
  commands: Array<{
    tool_name: string;
    intention: string;
    args: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
}

export interface TaskProgressMessage {
  type: 'task_progress';
  taskId: string;
  commandId: string;
  commandIndex: number;
  totalCommands: number;
  status: CommandStatus;
  timestamp: number;
  tool_name: string;
  intention: string;
  result?: unknown;
  error?: { code: string; message: string };
}

export interface TaskCompleteMessage {
  type: 'task_complete';
  taskId: string;
  status: 'completed' | 'failed' | 'cancelled';
  timestamp: number;
  summary: {
    totalCommands: number;
    successfulCommands: number;
    failedCommandIndex?: number;
    duration: number;
  };
  error?: { code: string; message: string; commandId?: string };
  results: Array<{
    commandId: string;
    status: CommandStatus;
    result?: unknown;
    error?: { code: string; message: string };
  }>;
}
```

---

## Memory Management

### Task Cleanup

Old tasks are automatically cleaned up:

```typescript
// At module load (task-manager.ts)
setInterval(() => {
  const cleaned = taskManager.cleanupTasks();
  if (cleaned > 0) {
    console.error(`[TaskManager] Cleaned up ${cleaned} old tasks`);
  }
}, 3600000); // Every hour

cleanupTasks(maxAge: number = 3600000): number {
  const cutoff = Date.now() - maxAge;
  let cleaned = 0;

  for (const [taskId, task] of this.tasks) {
    if (
      ['completed', 'failed', 'cancelled'].includes(task.status) &&
      task.completedAt &&
      task.completedAt < cutoff
    ) {
      this.tasks.delete(taskId);
      cleaned++;
    }
  }

  return cleaned;
}
```

### WebSocket Cleanup

When WebSocket connections close:

```typescript
ws.on('close', () => {
  // Remove from all subscriptions
  for (const [taskId, subs] of taskSubscriptions) {
    subs.delete(ws);
    if (subs.size === 0) {
      taskSubscriptions.delete(taskId);
    }
  }

  for (const [instanceId, subs] of instanceSubscriptions) {
    subs.delete(ws);
    if (subs.size === 0) {
      instanceSubscriptions.delete(instanceId);
    }
  }
});
```

---

## Testing Strategies

### Unit Testing Task Manager

```typescript
describe('TaskManager', () => {
  let taskManager: TaskManager;

  beforeEach(() => {
    taskManager = new TaskManager();
    // Mock instanceManager
  });

  it('should queue tasks correctly', () => {
    const result = taskManager.submitTask({
      task_name: 'Test',
      task_intention: 'Testing',
      commands: [{ tool_name: 'browser_navigate', intention: 'Test', args: {} }]
    });

    expect(result).toHaveProperty('taskId');
    expect(result).toHaveProperty('queuePosition', 1);
  });

  it('should emit progress events', (done) => {
    taskManager.on('progress', (msg) => {
      expect(msg.type).toBe('task_progress');
      done();
    });

    taskManager.submitTask(/* ... */);
  });
});
```

### Integration Testing

```typescript
describe('Task System Integration', () => {
  it('should execute task end-to-end', async () => {
    // Start server
    const server = await startServer();

    // Submit task via WebSocket
    const ws = new WebSocket('ws://localhost:3400');
    const result = await submitTask(ws, {
      task_name: 'Integration Test',
      commands: [/* ... */]
    });

    expect(result.status).toBe('completed');
  });
});
```

---

## Debugging Tips

### Enable Detailed Logging

Add console.error statements in key places:

```typescript
// In executeCommand
console.error(`[TaskManager] Executing: ${command.tool_name} ${JSON.stringify(command.args)}`);

// In processQueue
console.error(`[TaskManager] Queue state: ${queue.tasks.length} tasks, processing: ${queue.isProcessing}`);
```

### Inspect Internal State

```typescript
// Expose debug methods (development only)
if (process.env.NODE_ENV === 'development') {
  taskManager.debugState = () => ({
    tasks: Array.from(this.tasks.entries()),
    queues: Array.from(this.queues.entries()).map(([id, q]) => ({
      id,
      taskCount: q.tasks.length,
      isProcessing: q.isProcessing
    }))
  });
}
```

### WebSocket Message Tracing

```typescript
// In task-websocket-server.ts
ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.error(`[TaskWS] Received: ${msg.type}`);
  handleMessage(ws, sessionId, msg);
});
```
