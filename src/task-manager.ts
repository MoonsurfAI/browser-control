/**
 * Task Manager
 *
 * Manages task queues, execution, and progress reporting for browser automation tasks.
 * Each browser instance has its own task queue to prevent conflicts.
 */

import { EventEmitter } from 'events';
import { instanceManager } from './instance-manager.js';
import { handleMCPRequest } from './mcp-handler.js';
import { getConfig } from './config.js';
import type {
    Task,
    TaskCommand,
    TaskStatus,
    CommandStatus,
    TaskSubmitMessage,
    TaskProgressMessage,
    TaskCompleteMessage,
} from './types.js';

interface TaskQueue {
    instanceId: string;
    tasks: Task[];
    isProcessing: boolean;
}

interface MCPRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: Record<string, unknown>;
}

interface MCPResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: {
        content?: Array<{ type: string; text?: string }>;
        isError?: boolean;
    };
    error?: { code: number; message: string };
}

class TaskManager extends EventEmitter {
    private queues = new Map<string, TaskQueue>();
    private tasks = new Map<string, Task>();
    private taskIdCounter = 0;

    /**
     * Submit a new task for execution
     */
    submitTask(message: TaskSubmitMessage): { taskId: string; queuePosition: number } | { error: string } {
        const config = getConfig();

        // Validate instance
        let instanceId = message.instanceId;
        if (!instanceId) {
            const firstInstance = instanceManager.getFirstConnectedInstance();
            if (!firstInstance) {
                return { error: 'No connected browser instances' };
            }
            instanceId = firstInstance.id;
        } else {
            const instance = instanceManager.getInstance(instanceId);
            if (!instance || !instance.ws || instance.ws.readyState !== 1) {
                return { error: `Instance not connected: ${instanceId}` };
            }
        }

        // Validate commands
        if (!message.commands || message.commands.length === 0) {
            return { error: 'No commands provided' };
        }

        // Check queue size
        const queue = this.queues.get(instanceId);
        if (queue && queue.tasks.length >= config.tasks.maxQueueSize) {
            return { error: `Queue full: max ${config.tasks.maxQueueSize} tasks allowed` };
        }

        // Create task
        const taskId = `task_${Date.now()}_${(++this.taskIdCounter).toString(36)}`;
        const commands: TaskCommand[] = message.commands.map((cmd, index) => ({
            id: `${taskId}_cmd_${index}`,
            tool_name: cmd.tool_name,
            intention: cmd.intention,
            args: cmd.args,
            status: 'pending' as CommandStatus,
        }));

        const task: Task = {
            id: taskId,
            instanceId,
            name: message.task_name,
            intention: message.task_intention,
            commands,
            status: 'queued',
            currentCommandIndex: 0,
            createdAt: Date.now(),
            metadata: message.metadata,
        };

        // Store task
        this.tasks.set(taskId, task);

        // Add to queue
        let taskQueue = this.queues.get(instanceId);
        if (!taskQueue) {
            taskQueue = { instanceId, tasks: [], isProcessing: false };
            this.queues.set(instanceId, taskQueue);
        }
        taskQueue.tasks.push(task);
        const queuePosition = taskQueue.tasks.length;

        console.error(`[TaskManager] Task ${taskId} queued for instance ${instanceId} (position: ${queuePosition})`);

        // Start processing on next tick to allow caller to subscribe first
        setImmediate(() => this.processQueue(instanceId));

        return { taskId, queuePosition };
    }

    /**
     * Process tasks in queue for an instance
     */
    private async processQueue(instanceId: string): Promise<void> {
        const queue = this.queues.get(instanceId);
        if (!queue || queue.isProcessing) {
            return;
        }

        queue.isProcessing = true;

        while (queue.tasks.length > 0) {
            const task = queue.tasks[0];

            // Skip if task was cancelled
            if (task.status === 'cancelled') {
                queue.tasks.shift();
                continue;
            }

            await this.executeTask(task);
            queue.tasks.shift();
        }

        queue.isProcessing = false;
    }

    /**
     * Execute a single task
     */
    private async executeTask(task: Task): Promise<void> {
        task.status = 'running';
        task.startedAt = Date.now();

        console.error(`[TaskManager] Starting task ${task.id}: ${task.name}`);

        for (let i = 0; i < task.commands.length; i++) {
            // Check if task was cancelled (can happen from another async context)
            if ((task.status as TaskStatus) === 'cancelled') {
                this.markRemainingCommandsSkipped(task, i);
                break;
            }

            const command = task.commands[i];
            task.currentCommandIndex = i;

            await this.executeCommand(task, command, i);

            // Stop on error
            if (command.status === 'error') {
                task.status = 'failed';
                task.error = {
                    code: command.error?.code || 'COMMAND_FAILED',
                    message: command.error?.message || 'Command execution failed',
                    commandId: command.id,
                };
                this.markRemainingCommandsSkipped(task, i + 1);
                break;
            }
        }

        // Finalize task
        task.completedAt = Date.now();
        if (task.status === 'running') {
            task.status = 'completed';
        }

        // Emit completion event
        this.emitTaskComplete(task);
        console.error(`[TaskManager] Task ${task.id} ${task.status} (${task.completedAt - task.startedAt!}ms)`);
    }

    /**
     * Execute a single command
     */
    private async executeCommand(task: Task, command: TaskCommand, index: number): Promise<void> {
        const config = getConfig();

        command.status = 'running';
        command.startedAt = Date.now();

        // Emit progress: running
        this.emitProgress(task, command, index);

        try {
            // Build MCP request
            const mcpRequest: MCPRequest = {
                jsonrpc: '2.0',
                id: `${task.id}_${command.id}`,
                method: 'tools/call',
                params: {
                    name: command.tool_name,
                    arguments: {
                        ...command.args,
                        instanceId: task.instanceId,
                    },
                },
            };

            // Execute with timeout
            const result = await this.executeWithTimeout(
                handleMCPRequest(mcpRequest) as Promise<MCPResponse>,
                config.tasks.commandTimeout
            );

            // Check for MCP-level errors
            if (result.error) {
                throw new Error(result.error.message);
            }

            // Check for tool-level errors in result content
            if (result.result?.isError) {
                const content = result.result.content;
                if (Array.isArray(content) && content[0]?.text) {
                    try {
                        const parsed = JSON.parse(content[0].text);
                        if (parsed.error) {
                            throw new Error(parsed.error.message || 'Tool returned error');
                        }
                    } catch (parseError) {
                        if (parseError instanceof SyntaxError) {
                            // Not JSON, use raw text
                            throw new Error(content[0].text);
                        }
                        throw parseError;
                    }
                }
                throw new Error('Tool returned error');
            }

            command.status = 'success';
            command.result = result.result;
            command.completedAt = Date.now();

            // Emit progress: success
            this.emitProgress(task, command, index);

        } catch (error) {
            command.status = 'error';
            command.error = {
                code: 'EXECUTION_ERROR',
                message: error instanceof Error ? error.message : String(error),
            };
            command.completedAt = Date.now();

            // Emit progress: error
            this.emitProgress(task, command, index);

            console.error(`[TaskManager] Command ${command.id} failed: ${command.error.message}`);
        }
    }

    /**
     * Execute a promise with timeout
     */
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

    /**
     * Mark remaining commands as skipped
     */
    private markRemainingCommandsSkipped(task: Task, fromIndex: number): void {
        for (let i = fromIndex; i < task.commands.length; i++) {
            task.commands[i].status = 'skipped';
        }
    }

    /**
     * Emit progress event
     */
    private emitProgress(task: Task, command: TaskCommand, index: number): void {
        const progressMessage: TaskProgressMessage = {
            type: 'task_progress',
            taskId: task.id,
            commandId: command.id,
            commandIndex: index,
            totalCommands: task.commands.length,
            status: command.status,
            timestamp: Date.now(),
            tool_name: command.tool_name,
            intention: command.intention,
            result: command.status === 'success' ? command.result : undefined,
            error: command.status === 'error' ? command.error : undefined,
        };

        this.emit('progress', progressMessage);
    }

    /**
     * Emit task complete event
     */
    private emitTaskComplete(task: Task): void {
        const successCount = task.commands.filter(c => c.status === 'success').length;
        const failedIndex = task.commands.findIndex(c => c.status === 'error');

        const completeMessage: TaskCompleteMessage = {
            type: 'task_complete',
            taskId: task.id,
            status: task.status as 'completed' | 'failed' | 'cancelled',
            timestamp: Date.now(),
            summary: {
                totalCommands: task.commands.length,
                successfulCommands: successCount,
                failedCommandIndex: failedIndex >= 0 ? failedIndex : undefined,
                duration: task.completedAt! - task.startedAt!,
            },
            error: task.error,
            results: task.commands.map(c => ({
                commandId: c.id,
                status: c.status,
                result: c.result,
                error: c.error,
            })),
        };

        this.emit('complete', completeMessage);
    }

    /**
     * Cancel a task
     */
    cancelTask(taskId: string): boolean {
        const task = this.tasks.get(taskId);
        if (!task) {
            return false;
        }

        if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
            return false;
        }

        task.status = 'cancelled';
        task.completedAt = Date.now();
        task.error = {
            code: 'CANCELLED',
            message: 'Task cancelled by user',
        };

        // Mark any running or pending commands as skipped
        for (const command of task.commands) {
            if (command.status === 'running' || command.status === 'pending') {
                command.status = 'skipped';
                if (!command.completedAt) {
                    command.completedAt = Date.now();
                }
            }
        }

        console.error(`[TaskManager] Task ${taskId} cancelled`);
        return true;
    }

    /**
     * Get task by ID
     */
    getTask(taskId: string): Task | undefined {
        return this.tasks.get(taskId);
    }

    /**
     * Get instance for a task
     */
    getInstance(instanceId: string) {
        return instanceManager.getInstance(instanceId);
    }

    /**
     * List tasks for an instance
     */
    listTasks(instanceId?: string, status?: TaskStatus | 'all'): Task[] {
        let tasks = Array.from(this.tasks.values());

        if (instanceId) {
            tasks = tasks.filter(t => t.instanceId === instanceId);
        }

        if (status && status !== 'all') {
            tasks = tasks.filter(t => t.status === status);
        }

        return tasks.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Clean up completed/failed tasks older than specified age
     */
    cleanupTasks(maxAge: number = 3600000): number {
        const cutoff = Date.now() - maxAge;
        let cleaned = 0;

        for (const [taskId, task] of this.tasks) {
            if (
                (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') &&
                task.completedAt &&
                task.completedAt < cutoff
            ) {
                this.tasks.delete(taskId);
                cleaned++;
            }
        }

        return cleaned;
    }

    /**
     * Handle instance disconnection - fail running/queued tasks
     */
    handleInstanceDisconnect(instanceId: string): void {
        const queue = this.queues.get(instanceId);
        if (queue) {
            for (const task of queue.tasks) {
                if (task.status === 'queued' || task.status === 'running') {
                    task.status = 'failed';
                    task.error = {
                        code: 'INSTANCE_DISCONNECTED',
                        message: 'Browser instance disconnected',
                    };
                    task.completedAt = Date.now();
                    this.emitTaskComplete(task);
                }
            }
            queue.tasks = [];
            queue.isProcessing = false;
        }

        // Also fail any running tasks for this instance that might not be in queue
        for (const task of this.tasks.values()) {
            if (task.instanceId === instanceId && task.status === 'running') {
                task.status = 'failed';
                task.error = {
                    code: 'INSTANCE_DISCONNECTED',
                    message: 'Browser instance disconnected',
                };
                task.completedAt = Date.now();
                this.emitTaskComplete(task);
            }
        }
    }
}

export const taskManager = new TaskManager();

// Register disconnect callback with instance manager
instanceManager.onDisconnect((instanceId: string) => {
    taskManager.handleInstanceDisconnect(instanceId);
});

// Cleanup old tasks every hour
setInterval(() => {
    const cleaned = taskManager.cleanupTasks();
    if (cleaned > 0) {
        console.error(`[TaskManager] Cleaned up ${cleaned} old tasks`);
    }
}, 3600000);
