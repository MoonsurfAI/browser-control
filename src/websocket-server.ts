/**
 * WebSocket Server for Chrome Extension Communication
 *
 * Always runs on localhost - the extension connects locally even when
 * the MCP server accepts remote HTTP/SSE connections from AI clients.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { instanceManager } from './instance-manager.js';
import { getConfig } from './config.js';
import type { ExtensionMessage, HelloMessage } from './types.js';

const servers = new Map<number, WebSocketServer>();

/**
 * Get the WebSocket URL for a given port (always localhost)
 */
export function getWebSocketServerUrl(port: number): string {
    return `ws://localhost:${port}`;
}

/**
 * Start a WebSocket server on the specified port
 */
export function startWebSocketServer(port: number): WebSocketServer {
    if (servers.has(port)) {
        return servers.get(port)!;
    }

    const config = getConfig();
    const wss = new WebSocketServer({
        port,
        host: config.wsHost, // Always localhost
    });

    setupWebSocketHandlers(wss, port);
    servers.set(port, wss);

    return wss;
}

function setupWebSocketHandlers(wss: WebSocketServer, port: number): void {
    wss.on('connection', (ws: WebSocket) => {
        console.error(`[WebSocket:${port}] New connection`);

        let instanceId: string | null = null;

        ws.on('message', (data: Buffer) => {
            try {
                const raw = JSON.parse(data.toString()) as { type: string };

                // Handle application-level keepalive before casting to ExtensionMessage
                if (raw.type === 'ping') {
                    if (instanceId) {
                        lastPongTime = Date.now();
                        instanceManager.updateLastPong(instanceId);
                    }
                    return;
                }

                const message = raw as ExtensionMessage;

                if (message.type === 'hello') {
                    const hello = message as HelloMessage;
                    instanceId = hello.instanceId;

                    if (instanceManager.setWebSocket(instanceId, ws)) {
                        console.error(`[WebSocket:${port}] Instance ${instanceId} connected`);
                        ws.send(JSON.stringify({
                            type: 'welcome',
                            instanceId,
                            serverVersion: '2.0.0',
                        }));
                    } else {
                        console.error(`[WebSocket:${port}] Unknown instance ${instanceId}`);
                        ws.close(4001, 'Unknown instance');
                    }
                } else if (instanceId) {
                    instanceManager.handleMessage(instanceId, message);
                }
            } catch (error) {
                console.error(`[WebSocket:${port}] Message parse error:`, error);
            }
        });

        ws.on('close', () => {
            console.error(`[WebSocket:${port}] Connection closed`);
            if (instanceId) {
                instanceManager.unregister(instanceId);
            }
        });

        ws.on('error', (error) => {
            console.error(`[WebSocket:${port}] Error:`, error);
            if (instanceId) {
                instanceManager.unregister(instanceId);
            }
        });

        // Keep connection alive with pings and detect dead connections via pong tracking.
        // If no pong is received within 2 ping cycles, the connection is considered dead.
        let lastPongTime = Date.now();
        const PING_INTERVAL = 20000;
        const PONG_TIMEOUT = 45000;

        ws.on('pong', () => {
            lastPongTime = Date.now();
            if (instanceId) {
                instanceManager.updateLastPong(instanceId);
            }
        });

        const pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                if (Date.now() - lastPongTime > PONG_TIMEOUT) {
                    console.error(`[WebSocket:${port}] Pong timeout, closing dead connection`);
                    clearInterval(pingInterval);
                    ws.terminate();
                } else {
                    ws.ping();
                }
            } else {
                clearInterval(pingInterval);
            }
        }, PING_INTERVAL);

        ws.on('close', () => clearInterval(pingInterval));
    });

    wss.on('listening', () => {
        console.error(`[WebSocket] Server listening on port ${port}`);
    });
}

export function stopWebSocketServer(port: number): void {
    const wss = servers.get(port);
    if (wss) {
        wss.close();
        servers.delete(port);
    }
}

export function stopAllWebSocketServers(): void {
    for (const [port, wss] of servers) {
        wss.close();
        servers.delete(port);
    }
}
