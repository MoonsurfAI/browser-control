import type { WebSocket } from 'ws';

export interface BrowserInstance {
    id: string;
    port: number;
    ws: WebSocket | null;
    userAgent: string;
    windowId: number;
    connectedAt: number;
    lastActivity: number;
    lastPong: number;
}

export interface RegistrationRequest {
    userAgent: string;
    windowId: number;
}

export interface RegistrationResponse {
    instanceId: string;
    port: number;
}

export interface ToolCallMessage {
    type: 'tool_call';
    id: string;
    name: string;
    args: Record<string, unknown>;
}

export interface ToolResultMessage {
    type: 'tool_result';
    id: string;
    result: unknown;
}

export interface ToolErrorMessage {
    type: 'tool_error';
    id: string;
    error: {
        code: string;
        message: string;
    };
}

export interface HelloMessage {
    type: 'hello';
    instanceId: string;
}

export type ExtensionMessage = ToolResultMessage | ToolErrorMessage | HelloMessage;
export type ServerMessage = ToolCallMessage;

export interface PendingCall {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
}

export type DownloadState = 'in_progress' | 'complete' | 'error';

export interface TrackedDownload {
    id: string;
    instanceId: string;
    filename: string;
    tempFilename?: string;
    filepath: string;
    state: DownloadState;
    bytesReceived: number;
    totalBytes: number;
    progress: number;
    startTime: number;
    endTime?: number;
    url?: string;
    error?: string;
}

export const config = {
    httpPort: 3300,
    instancePortStart: 3301,
    instancePortEnd: 3399,
    maxInstances: 99,
    callTimeout: 30000,
};

// ============================================================================
// Task Execution Types
// ============================================================================

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
    error?: {
        code: string;
        message: string;
    };
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
    error?: {
        code: string;
        message: string;
        commandId?: string;
    };
    metadata?: Record<string, unknown>;
}

// ============================================================================
// Task WebSocket Protocol Messages
// ============================================================================

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

export interface TaskSubmitResponseMessage {
    type: 'task_submit_response';
    taskId: string;
    status: 'accepted' | 'rejected';
    error?: string;
    queuePosition?: number;
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
    error?: {
        code: string;
        message: string;
    };
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
    error?: {
        code: string;
        message: string;
        commandId?: string;
    };
    results: Array<{
        commandId: string;
        status: CommandStatus;
        result?: unknown;
        error?: {
            code: string;
            message: string;
        };
    }>;
}

export interface TaskListRequestMessage {
    type: 'task_list';
    instanceId?: string;
    status?: TaskStatus | 'all';
}

export interface TaskListResponseMessage {
    type: 'task_list_response';
    tasks: Array<{
        id: string;
        name: string;
        status: TaskStatus;
        instanceId: string;
        currentCommandIndex: number;
        totalCommands: number;
        createdAt: number;
        startedAt?: number;
    }>;
}

export interface TaskStatusRequestMessage {
    type: 'task_status';
    taskId: string;
}

export interface TaskStatusResponseMessage {
    type: 'task_status_response';
    task: Task | null;
    error?: string;
}

export interface TaskCancelRequestMessage {
    type: 'task_cancel';
    taskId: string;
}

export interface TaskCancelResponseMessage {
    type: 'task_cancel_response';
    taskId: string;
    success: boolean;
    error?: string;
}

export interface TaskSubscribeMessage {
    type: 'subscribe_task';
    taskId: string;
}

export interface TaskSubscribeInstanceMessage {
    type: 'subscribe_instance';
    instanceId: string;
}

export interface TaskSubscribeAckMessage {
    type: 'subscribe_ack';
    taskId?: string;
    instanceId?: string;
}

export type TaskClientMessage =
    | TaskSubmitMessage
    | TaskListRequestMessage
    | TaskStatusRequestMessage
    | TaskCancelRequestMessage
    | TaskSubscribeMessage
    | TaskSubscribeInstanceMessage;

export type TaskServerMessage =
    | TaskSubmitResponseMessage
    | TaskProgressMessage
    | TaskCompleteMessage
    | TaskListResponseMessage
    | TaskStatusResponseMessage
    | TaskCancelResponseMessage
    | TaskSubscribeAckMessage;
