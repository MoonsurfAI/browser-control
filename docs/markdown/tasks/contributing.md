# Contributing

This guide covers development setup, code conventions, and contribution guidelines for the Task Execution System.

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Chrome/Chromium browser
- (Optional) Local Chrome extension for development

### Clone and Install

```bash
git clone https://github.com/MoonsurfAI/browser-control.git
cd browser-control
npm install
```

### Build

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Run in Development

```bash
# Standard run
npm start

# With local Chrome extension
EXTENSION_PATH=../chrome-extension/dist npm start

# With custom configuration
TASKS_WS_PORT=4000 TASKS_COMMAND_TIMEOUT=120000 npm start
```

### Watch Mode

For active development:

```bash
npm run build -- --watch
```

In another terminal:

```bash
npm start
```

---

## Code Organization

### Task System Files

| File | Purpose |
|------|---------|
| `src/task-manager.ts` | Core task queue and execution engine |
| `src/task-websocket-server.ts` | WebSocket API for task operations |
| `src/types.ts` | TypeScript type definitions |
| `src/config.ts` | Configuration loading |
| `src/http-server.ts` | REST endpoints |
| `src/instance-manager.ts` | Browser instance management |

### Documentation Files

| File | Purpose |
|------|---------|
| `docs/tasks/README.md` | Documentation index |
| `docs/tasks/getting-started.md` | Quick start guide |
| `docs/tasks/architecture.md` | System architecture |
| `docs/tasks/websocket-api.md` | WebSocket API reference |
| `docs/tasks/rest-api.md` | REST API reference |
| `docs/tasks/task-format.md` | Task and command structure |
| `docs/tasks/error-handling.md` | Error codes and handling |
| `docs/tasks/examples.md` | Usage examples |
| `docs/tasks/configuration.md` | Configuration options |
| `docs/tasks/internals.md` | Implementation details |
| `docs/tasks/contributing.md` | This file |

---

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over type aliases for objects
- Export types explicitly
- Use descriptive variable names

```typescript
// Good
interface TaskCommand {
  id: string;
  tool_name: string;
  // ...
}

// Avoid
type TC = { id: string; tn: string };
```

### Async/Await

- Always use async/await over raw promises
- Handle errors with try/catch
- Use Promise.all for parallel operations

```typescript
// Good
async function executeCommands(commands: TaskCommand[]) {
  for (const cmd of commands) {
    await executeCommand(cmd);
  }
}

// Avoid
function executeCommands(commands: TaskCommand[]) {
  return commands.reduce((p, cmd) =>
    p.then(() => executeCommand(cmd)),
    Promise.resolve()
  );
}
```

### Error Handling

- Always provide error codes
- Include actionable error messages
- Log errors with context

```typescript
// Good
command.error = {
  code: 'ELEMENT_NOT_FOUND',
  message: `Element not found: ${selector}`
};
console.error(`[TaskManager] Command ${command.id} failed: ${command.error.message}`);

// Avoid
command.error = { message: 'failed' };
```

### Naming Conventions

- Classes: PascalCase (`TaskManager`)
- Functions/Methods: camelCase (`submitTask`)
- Constants: UPPER_SNAKE_CASE (`TASKS_WS_PORT`)
- Types/Interfaces: PascalCase (`TaskStatus`)

---

## Testing

### Manual Testing

1. Start the server:
   ```bash
   EXTENSION_PATH=../chrome-extension/dist npm start
   ```

2. Launch a browser instance via MCP.

3. Connect to task WebSocket:
   ```bash
   # Using wscat
   npx wscat -c ws://localhost:3400
   ```

4. Submit a test task:
   ```json
   {"type":"task_submit","task_name":"Test","task_intention":"Testing","commands":[{"tool_name":"browser_navigate","intention":"Navigate","args":{"action":"goto","url":"https://example.com"}}]}
   ```

### Test Cases to Cover

1. **Happy Path**: Task completes successfully
2. **Error Handling**: Command fails, task marked failed
3. **Cancellation**: Task cancelled mid-execution
4. **Queue**: Multiple tasks execute in order
5. **Timeout**: Command exceeds timeout
6. **Disconnection**: Browser disconnects during task
7. **Validation**: Invalid task rejected
8. **Subscription**: Progress events received correctly

### Automated Testing

(Future improvement - not yet implemented)

```typescript
// Example test structure
describe('TaskManager', () => {
  describe('submitTask', () => {
    it('should accept valid tasks');
    it('should reject tasks without commands');
    it('should reject tasks for disconnected instances');
  });

  describe('executeTask', () => {
    it('should execute commands sequentially');
    it('should stop on first error');
    it('should respect timeout');
  });
});
```

---

## Adding New Features

### Adding a New Message Type

1. **Define types** in `src/types.ts`:
   ```typescript
   export interface TaskPauseMessage {
     type: 'task_pause';
     taskId: string;
   }

   export interface TaskPauseResponse {
     type: 'task_pause_response';
     success: boolean;
     taskId: string;
   }
   ```

2. **Add handler** in `src/task-websocket-server.ts`:
   ```typescript
   case 'task_pause':
     handleTaskPause(ws, msg);
     break;

   function handleTaskPause(ws: WebSocket, msg: TaskPauseMessage) {
     const success = taskManager.pauseTask(msg.taskId);
     ws.send(JSON.stringify({
       type: 'task_pause_response',
       success,
       taskId: msg.taskId
     }));
   }
   ```

3. **Implement logic** in `src/task-manager.ts`:
   ```typescript
   pauseTask(taskId: string): boolean {
     const task = this.tasks.get(taskId);
     if (!task || task.status !== 'running') return false;
     task.status = 'paused';
     return true;
   }
   ```

4. **Update documentation**.

### Adding New Configuration

1. **Add to config** in `src/config.ts`:
   ```typescript
   tasks: {
     // existing...
     retryCount: parseNumber(process.env.TASKS_RETRY_COUNT, 0),
   }
   ```

2. **Use in code**:
   ```typescript
   const config = getConfig();
   for (let attempt = 0; attempt <= config.tasks.retryCount; attempt++) {
     // ...
   }
   ```

3. **Document** in `docs/tasks/configuration.md`.

### Adding REST Endpoint

1. **Add route** in `src/http-server.ts`:
   ```typescript
   app.post('/tasks/:id/retry', (req, res) => {
     const task = taskManager.getTask(req.params.id);
     if (!task) {
       return res.status(404).json({ error: 'Task not found' });
     }
     const newTask = taskManager.retryTask(task.id);
     res.json({ taskId: newTask.id });
   });
   ```

2. **Document** in `docs/tasks/rest-api.md`.

---

## Pull Request Process

### Before Submitting

1. **Build passes**: `npm run build`
2. **Manual testing**: Test your changes with real browser
3. **Documentation**: Update relevant docs
4. **Commit messages**: Use descriptive messages

### PR Description Template

```markdown
## Summary
Brief description of changes.

## Changes
- Added X feature
- Fixed Y bug
- Updated Z documentation

## Testing
Describe how you tested:
- [ ] Manual testing with browser
- [ ] Tested error cases
- [ ] Tested edge cases

## Documentation
- [ ] Updated relevant docs
- [ ] Added examples if applicable
```

### Review Checklist

- [ ] Code follows project style
- [ ] Error handling is appropriate
- [ ] No console.log (use console.error for server logs)
- [ ] Types are properly defined
- [ ] Documentation is updated

---

## Common Tasks

### Debugging Task Execution

1. Add logging:
   ```typescript
   console.error(`[TaskManager] Debug: ${JSON.stringify(task)}`);
   ```

2. Check server output for `[TaskManager]` logs.

3. Use WebSocket client to observe events.

### Fixing Type Errors

If TypeScript complains about type compatibility:

1. Check if types are properly exported from `types.ts`
2. Use type assertions when necessary:
   ```typescript
   if ((task.status as TaskStatus) === 'cancelled') {
     // TypeScript knows status is 'cancelled' here
   }
   ```

### Updating Dependencies

```bash
npm update
npm run build
# Test manually
```

---

## Architecture Decisions

### Why Per-Instance Queues?

Each browser instance has its own queue to:
- Prevent command conflicts
- Allow parallel execution across instances
- Simplify state management

### Why EventEmitter?

EventEmitter pattern allows:
- Decoupling between execution and notification
- Multiple subscribers (WebSocket, REST, future integrations)
- Easy testing (mock listeners)

### Why setImmediate for Execution?

Using `setImmediate()` to start queue processing allows:
- Callers to subscribe before first event
- Prevents race condition where first "running" event is missed
- Maintains responsive submission API

---

## Getting Help

- **Issues**: Open GitHub issues for bugs or feature requests
- **Documentation**: Check `docs/` for guides
- **Code**: Read `src/` for implementation details

---

## License

This project is licensed under the MIT License. See LICENSE file for details.
