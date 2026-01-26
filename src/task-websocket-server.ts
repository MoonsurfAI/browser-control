/**
 * Task WebSocket Server
 *
 * Provides a dedicated WebSocket endpoint for task submission, monitoring,
 * and real-time progress updates.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
import { taskManager } from './task-manager.js';
import { getConfig } from './config.js';
import type {
    Task,
    TaskStatus,
    TaskSubmitMessage,
    TaskListRequestMessage,
    TaskStatusRequestMessage,
    TaskCancelRequestMessage,
    TaskSubscribeMessage,
    TaskSubscribeInstanceMessage,
    TaskProgressMessage,
    TaskCompleteMessage,
    TaskClientMessage,
} from './types.js';

interface TaskClient {
    ws: WebSocket;
    sessionId: string;
    subscribedTasks: Set<string>;
    subscribedInstances: Set<string>;
    authenticatedAt: Date;
}

interface WelcomeMessage {
    type: 'welcome';
    sessionId: string;
    serverVersion: string;
}

interface ErrorMessage {
    type: 'error';
    message: string;
}

const clients = new Map<string, TaskClient>();
let taskWss: WebSocketServer | null = null;

/**
 * Start the task WebSocket server
 */
export function startTaskWebSocketServer(port: number): WebSocketServer {
    if (taskWss) {
        return taskWss;
    }

    const config = getConfig();
    taskWss = new WebSocketServer({
        port,
        host: config.wsHost,
    });

    setupEventHandlers(taskWss);
    setupTaskManagerListeners();

    console.error(`[TaskWS] Server listening on ${config.wsHost}:${port}`);

    return taskWss;
}

function setupEventHandlers(wss: WebSocketServer): void {
    wss.on('connection', (ws: WebSocket) => {
        const sessionId = randomUUID();
        const client: TaskClient = {
            ws,
            sessionId,
            subscribedTasks: new Set(),
            subscribedInstances: new Set(),
            authenticatedAt: new Date(),
        };
        clients.set(sessionId, client);

        console.error(`[TaskWS] Client connected: ${sessionId}`);

        // Send welcome message
        const welcomeMsg: WelcomeMessage = {
            type: 'welcome',
            sessionId,
            serverVersion: '2.0.0',
        };
        sendMessage(ws, welcomeMsg);

        ws.on('message', (data: Buffer) => {
            try {
                const message = JSON.parse(data.toString()) as TaskClientMessage;
                handleMessage(client, message);
            } catch (error) {
                console.error(`[TaskWS] Message parse error:`, error);
                const errorMsg: ErrorMessage = {
                    type: 'error',
                    message: 'Invalid message format',
                };
                sendMessage(ws, errorMsg);
            }
        });

        ws.on('close', () => {
            clients.delete(sessionId);
            console.error(`[TaskWS] Client disconnected: ${sessionId}`);
        });

        ws.on('error', (error) => {
            console.error(`[TaskWS] Error for ${sessionId}:`, error);
        });

        // Ping to keep alive
        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            } else {
                clearInterval(pingInterval);
            }
        }, 30000);

        ws.on('close', () => clearInterval(pingInterval));
    });

    wss.on('error', (error) => {
        console.error(`[TaskWS] Server error:`, error);
    });
}

function handleMessage(client: TaskClient, message: TaskClientMessage): void {
    switch (message.type) {
        case 'task_submit':
            handleTaskSubmit(client, message);
            break;

        case 'task_list':
            handleTaskList(client, message);
            break;

        case 'task_status':
            handleTaskStatus(client, message);
            break;

        case 'task_cancel':
            handleTaskCancel(client, message);
            break;

        case 'subscribe_task':
            handleSubscribeTask(client, message);
            break;

        case 'subscribe_instance':
            handleSubscribeInstance(client, message);
            break;

        default:
            const errorMsg: ErrorMessage = {
                type: 'error',
                message: `Unknown message type: ${(message as { type: string }).type}`,
            };
            sendMessage(client.ws, errorMsg);
    }
}

function handleTaskSubmit(client: TaskClient, message: TaskSubmitMessage): void {
    const result = taskManager.submitTask(message);

    if ('error' in result) {
        sendMessage(client.ws, {
            type: 'task_submit_response',
            taskId: '',
            status: 'rejected',
            error: result.error,
        });
        return;
    }

    // Auto-subscribe to the submitted task
    client.subscribedTasks.add(result.taskId);

    sendMessage(client.ws, {
        type: 'task_submit_response',
        taskId: result.taskId,
        status: 'accepted',
        queuePosition: result.queuePosition,
    });
}

function handleTaskList(client: TaskClient, message: TaskListRequestMessage): void {
    const tasks = taskManager.listTasks(message.instanceId, message.status);

    sendMessage(client.ws, {
        type: 'task_list_response',
        tasks: tasks.map(t => ({
            id: t.id,
            name: t.name,
            status: t.status,
            instanceId: t.instanceId,
            currentCommandIndex: t.currentCommandIndex,
            totalCommands: t.commands.length,
            createdAt: t.createdAt,
            startedAt: t.startedAt,
        })),
    });
}

function handleTaskStatus(client: TaskClient, message: TaskStatusRequestMessage): void {
    const task = taskManager.getTask(message.taskId);

    sendMessage(client.ws, {
        type: 'task_status_response',
        task: task || null,
        error: task ? undefined : 'Task not found',
    });
}

function handleTaskCancel(client: TaskClient, message: TaskCancelRequestMessage): void {
    const success = taskManager.cancelTask(message.taskId);

    sendMessage(client.ws, {
        type: 'task_cancel_response',
        taskId: message.taskId,
        success,
        error: success ? undefined : 'Task not found or already completed',
    });
}

function handleSubscribeTask(client: TaskClient, message: TaskSubscribeMessage): void {
    client.subscribedTasks.add(message.taskId);
    sendMessage(client.ws, {
        type: 'subscribe_ack',
        taskId: message.taskId,
    });
}

function handleSubscribeInstance(client: TaskClient, message: TaskSubscribeInstanceMessage): void {
    client.subscribedInstances.add(message.instanceId);
    sendMessage(client.ws, {
        type: 'subscribe_ack',
        instanceId: message.instanceId,
    });
}

function setupTaskManagerListeners(): void {
    taskManager.on('progress', (progress: TaskProgressMessage) => {
        broadcastToSubscribers(progress.taskId, progress);
    });

    taskManager.on('complete', (complete: TaskCompleteMessage) => {
        broadcastToSubscribers(complete.taskId, complete);
    });
}

function broadcastToSubscribers(taskId: string, message: unknown): void {
    const task = taskManager.getTask(taskId);

    for (const client of clients.values()) {
        // Check if client is subscribed to this task or its instance
        const subscribedToTask = client.subscribedTasks.has(taskId);
        const subscribedToInstance = task && client.subscribedInstances.has(task.instanceId);

        if (subscribedToTask || subscribedToInstance) {
            if (client.ws.readyState === WebSocket.OPEN) {
                sendMessage(client.ws, message);
            }
        }
    }
}

function sendMessage(ws: WebSocket, message: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

/**
 * Stop the task WebSocket server
 */
export function stopTaskWebSocketServer(): void {
    if (taskWss) {
        // Close all client connections
        for (const client of clients.values()) {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.close();
            }
        }
        clients.clear();

        taskWss.close();
        taskWss = null;
        console.error('[TaskWS] Server stopped');
    }
}

/**
 * Get the task WebSocket URL
 */
export function getTaskWebSocketUrl(): string {
    const config = getConfig();
    return `ws://${config.wsHost}:${config.tasks.wsPort}`;
}

/**
 * Get connected client count
 */
export function getConnectedClientCount(): number {
    return clients.size;
}
