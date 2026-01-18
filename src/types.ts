import type { WebSocket } from 'ws';

export interface BrowserInstance {
    id: string;
    port: number;
    ws: WebSocket | null;
    userAgent: string;
    windowId: number;
    connectedAt: number;
    lastActivity: number;
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
