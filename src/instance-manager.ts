import type { WebSocket } from 'ws';
import type { BrowserInstance, RegistrationRequest, PendingCall, ToolCallMessage, ExtensionMessage } from './types.js';
import { config } from './types.js';

class InstanceManager {
    private instances = new Map<string, BrowserInstance>();
    private portToInstance = new Map<number, string>();
    private pendingCalls = new Map<string, PendingCall>();
    private connectionCallbacks = new Map<string, {
        resolve: () => void;
        reject: (error: Error) => void;
    }>();
    private callIdCounter = 0;

    getNextAvailablePort(): number | null {
        for (let port = config.instancePortStart; port <= config.instancePortEnd; port++) {
            if (!this.portToInstance.has(port)) {
                return port;
            }
        }
        return null;
    }

    register(request: RegistrationRequest): BrowserInstance | null {
        const port = this.getNextAvailablePort();
        if (port === null) {
            return null;
        }

        const instanceId = `inst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const instance: BrowserInstance = {
            id: instanceId,
            port,
            ws: null,
            userAgent: request.userAgent,
            windowId: request.windowId,
            connectedAt: Date.now(),
            lastActivity: Date.now(),
        };

        this.instances.set(instanceId, instance);
        this.portToInstance.set(port, instanceId);

        console.log(`[InstanceManager] Registered instance ${instanceId} on port ${port}`);
        return instance;
    }

    setWebSocket(instanceId: string, ws: WebSocket): boolean {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            return false;
        }

        instance.ws = ws;
        instance.lastActivity = Date.now();
        console.log(`[InstanceManager] WebSocket connected for instance ${instanceId}`);

        // Trigger waiting callback if any
        const callback = this.connectionCallbacks.get(instanceId);
        if (callback) {
            callback.resolve();
        }

        return true;
    }

    waitForConnection(instanceId: string, timeout: number = 30000): Promise<void> {
        return new Promise((resolve, reject) => {
            const instance = this.instances.get(instanceId);

            // Already connected
            if (instance?.ws && instance.ws.readyState === 1) {
                resolve();
                return;
            }

            // Set up timeout
            const timer = setTimeout(() => {
                this.connectionCallbacks.delete(instanceId);
                reject(new Error(`Connection timeout for instance ${instanceId}`));
            }, timeout);

            // Store callback
            this.connectionCallbacks.set(instanceId, {
                resolve: () => {
                    clearTimeout(timer);
                    this.connectionCallbacks.delete(instanceId);
                    resolve();
                },
                reject: (error: Error) => {
                    clearTimeout(timer);
                    this.connectionCallbacks.delete(instanceId);
                    reject(error);
                },
            });
        });
    }

    unregister(instanceId: string): void {
        // Reject any waiting connection callback
        const callback = this.connectionCallbacks.get(instanceId);
        if (callback) {
            callback.reject(new Error('Instance unregistered'));
        }

        const instance = this.instances.get(instanceId);
        if (instance) {
            this.portToInstance.delete(instance.port);
            this.instances.delete(instanceId);
            console.log(`[InstanceManager] Unregistered instance ${instanceId}`);
        }
    }

    unregisterByPort(port: number): void {
        const instanceId = this.portToInstance.get(port);
        if (instanceId) {
            this.unregister(instanceId);
        }
    }

    getInstance(instanceId: string): BrowserInstance | undefined {
        return this.instances.get(instanceId);
    }

    getInstanceByPort(port: number): BrowserInstance | undefined {
        const instanceId = this.portToInstance.get(port);
        return instanceId ? this.instances.get(instanceId) : undefined;
    }

    getFirstConnectedInstance(): BrowserInstance | undefined {
        for (const instance of this.instances.values()) {
            if (instance.ws && instance.ws.readyState === 1) {
                return instance;
            }
        }
        return undefined;
    }

    getAllInstances(): BrowserInstance[] {
        return Array.from(this.instances.values());
    }

    getConnectedInstances(): BrowserInstance[] {
        return Array.from(this.instances.values()).filter(
            inst => inst.ws && inst.ws.readyState === 1
        );
    }

    async callTool(
        instanceId: string | undefined,
        toolName: string,
        args: Record<string, unknown>
    ): Promise<unknown> {
        let instance: BrowserInstance | undefined;

        if (instanceId) {
            instance = this.instances.get(instanceId);
            if (!instance) {
                throw new Error(`Instance not found: ${instanceId}`);
            }
        } else {
            instance = this.getFirstConnectedInstance();
            if (!instance) {
                throw new Error('No connected browser instances');
            }
        }

        if (!instance.ws || instance.ws.readyState !== 1) {
            throw new Error(`Instance ${instance.id} is not connected`);
        }

        const callId = `call_${++this.callIdCounter}`;
        const message: ToolCallMessage = {
            type: 'tool_call',
            id: callId,
            name: toolName,
            args,
        };

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingCalls.delete(callId);
                reject(new Error(`Tool call timeout: ${toolName}`));
            }, config.callTimeout);

            this.pendingCalls.set(callId, { resolve, reject, timeout });
            instance!.ws!.send(JSON.stringify(message));
            instance!.lastActivity = Date.now();
        });
    }

    handleMessage(instanceId: string, message: ExtensionMessage): void {
        const instance = this.instances.get(instanceId);
        if (instance) {
            instance.lastActivity = Date.now();
        }

        if (message.type === 'tool_result' || message.type === 'tool_error') {
            const pending = this.pendingCalls.get(message.id);
            if (pending) {
                clearTimeout(pending.timeout);
                this.pendingCalls.delete(message.id);

                if (message.type === 'tool_result') {
                    pending.resolve(message.result);
                } else {
                    pending.reject(new Error(message.error.message));
                }
            }
        }
    }
}

export const instanceManager = new InstanceManager();
