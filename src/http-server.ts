/**
 * HTTP/HTTPS Server with SSE support for MCP protocol
 *
 * Features:
 * - HTTPS/TLS support for secure remote connections
 * - Token-based authentication
 * - CORS configuration for cross-origin requests
 * - Rate limiting for abuse prevention
 * - SSE endpoint for MCP clients
 */

import { createServer as createHttpServer, IncomingMessage, ServerResponse, Server } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync } from 'fs';
import { instanceManager } from './instance-manager.js';
import { startWebSocketServer, getWebSocketServerUrl } from './websocket-server.js';
import { handleMCPRequest } from './mcp-handler.js';
import { getConfig, printConfigSummary, validateConfig, ServerConfig } from './config.js';
import { taskManager } from './task-manager.js';
import { getTaskWebSocketUrl } from './task-websocket-server.js';
import type { RegistrationRequest, TaskSubmitMessage, TaskStatus } from './types.js';

interface SSEClient {
    res: ServerResponse;
    sessionId: string;
    authenticatedAt?: Date;
}

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const sseClients = new Map<string, SSEClient>();
const rateLimitMap = new Map<string, RateLimitEntry>();

// ============================================================================
// Utility Functions
// ============================================================================

function parseBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });
}

function getClientIP(req: IncomingMessage): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        return ips.split(',')[0].trim();
    }
    return req.socket.remoteAddress || 'unknown';
}

function getServerBaseUrl(config: ServerConfig): string {
    // Use PUBLIC_URL if set (for remote deployments)
    if (config.publicUrl) {
        return config.publicUrl.replace(/\/$/, ''); // Remove trailing slash
    }
    const protocol = config.tls.enabled ? 'https' : 'http';
    const host = config.host === '0.0.0.0' ? 'localhost' : config.host;
    return `${protocol}://${host}:${config.port}`;
}

// ============================================================================
// CORS Handling
// ============================================================================

function getCorsHeaders(config: ServerConfig, origin?: string): Record<string, string> {
    const headers: Record<string, string> = {};

    if (!config.cors.enabled) {
        // Default permissive CORS for local mode
        headers['Access-Control-Allow-Origin'] = '*';
        headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
        headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
        return headers;
    }

    // Check if origin is allowed
    const allowedOrigin = config.cors.origins.length === 0
        ? (origin || '*')
        : config.cors.origins.includes(origin || '') ? origin : config.cors.origins[0];

    headers['Access-Control-Allow-Origin'] = allowedOrigin || '*';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';

    if (config.cors.credentials) {
        headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return headers;
}

// ============================================================================
// Authentication
// ============================================================================

function extractToken(req: IncomingMessage, url: URL): string | null {
    // Check Authorization header first
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    // Check query parameter (useful for SSE which can't set headers easily)
    const tokenParam = url.searchParams.get('token');
    if (tokenParam) {
        return tokenParam;
    }

    return null;
}

function isAuthenticated(config: ServerConfig, req: IncomingMessage, url: URL): boolean {
    if (!config.auth.enabled) {
        return true;
    }

    const token = extractToken(req, url);
    if (!token) {
        console.error(`[Auth] No token provided for ${url.pathname}`);
        return false;
    }

    const isValid = config.auth.tokens.includes(token);
    if (!isValid) {
        console.error(`[Auth] Invalid token for ${url.pathname}`);
    }
    return isValid;
}

// ============================================================================
// Rate Limiting
// ============================================================================

function checkRateLimit(config: ServerConfig, clientIP: string): { allowed: boolean; retryAfter?: number } {
    if (!config.rateLimit.enabled) {
        return { allowed: true };
    }

    const now = Date.now();
    const windowMs = 60000; // 1 minute window

    // Get existing entry from map
    let entry = rateLimitMap.get(clientIP);

    // Check if entry needs to be created or reset
    if (!entry || entry.resetAt < now) {
        // Create new entry with count starting at 1 (this request)
        entry = { count: 1, resetAt: now + windowMs };
        rateLimitMap.set(clientIP, entry);
    } else {
        // Increment existing entry
        entry.count++;
    }

    // Check if over limit
    if (entry.count > config.rateLimit.maxCallsPerMinute) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return { allowed: false, retryAfter };
    }

    return { allowed: true };
}

// Clean up expired rate limit entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
        if (entry.resetAt < now) {
            rateLimitMap.delete(ip);
        }
    }
}, 60000);

// ============================================================================
// Response Helpers
// ============================================================================

function sendJson(res: ServerResponse, status: number, data: unknown, config: ServerConfig, origin?: string): void {
    const corsHeaders = getCorsHeaders(config, origin);
    res.writeHead(status, {
        'Content-Type': 'application/json',
        ...corsHeaders,
    });
    res.end(JSON.stringify(data));
}

function sendSSE(res: ServerResponse, event: string, data: unknown): void {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    res.write(`event: ${event}\ndata: ${dataStr}\n\n`);
}

function sendError(res: ServerResponse, status: number, message: string, config: ServerConfig, origin?: string): void {
    sendJson(res, status, { error: message }, config, origin);
}

// ============================================================================
// Audit Logging
// ============================================================================

function auditLog(config: ServerConfig, action: string, details: Record<string, unknown>): void {
    if (!config.logging.auditEnabled) return;

    const entry = {
        timestamp: new Date().toISOString(),
        action,
        ...details,
    };

    console.error(`[AUDIT] ${JSON.stringify(entry)}`);
}

// ============================================================================
// Request Handler
// ============================================================================

function createRequestHandler(config: ServerConfig) {
    const baseUrl = getServerBaseUrl(config);

    return async (req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url || '/', baseUrl);
        const origin = req.headers['origin'];
        const clientIP = getClientIP(req);

        // CORS preflight
        if (req.method === 'OPTIONS') {
            const corsHeaders = getCorsHeaders(config, origin);
            res.writeHead(204, corsHeaders);
            res.end();
            return;
        }

        // Rate limiting check (except for health endpoint)
        if (url.pathname !== '/health') {
            const rateCheck = checkRateLimit(config, clientIP);
            if (!rateCheck.allowed) {
                res.writeHead(429, {
                    'Retry-After': String(rateCheck.retryAfter),
                    ...getCorsHeaders(config, origin),
                });
                res.end(JSON.stringify({ error: 'Too many requests', retryAfter: rateCheck.retryAfter }));
                auditLog(config, 'RATE_LIMITED', { ip: clientIP, path: url.pathname });
                return;
            }
        }

        // Health check - no auth required
        if (url.pathname === '/health' && req.method === 'GET') {
            sendJson(res, 200, {
                status: 'ok',
                version: '2.0.0',
                connectedInstances: instanceManager.getConnectedInstances().length,
                sseClients: sseClients.size,
                auth: config.auth.enabled ? 'enabled' : 'disabled',
                authTokens: config.auth.tokens.length,
                tls: config.tls.enabled ? 'enabled' : 'disabled',
                rateLimit: config.rateLimit.enabled ? 'enabled' : 'disabled',
                rateLimitMax: config.rateLimit.maxCallsPerMinute,
            }, config, origin);
            return;
        }

        // Server info - no auth required
        if (url.pathname === '/info' && req.method === 'GET') {
            sendJson(res, 200, {
                name: 'moonsurf-mcp',
                version: '2.0.0',
                endpoints: {
                    sse: `${baseUrl}/sse`,
                    message: `${baseUrl}/message`,
                    register: `${baseUrl}/register`,
                    health: `${baseUrl}/health`,
                },
                websocket: {
                    protocol: config.tls.enabled ? 'wss' : 'ws',
                    host: config.wsHost === '0.0.0.0' ? (url.hostname || 'localhost') : config.wsHost,
                    portRange: `${config.wsPortStart}-${config.wsPortEnd}`,
                },
                auth: {
                    required: config.auth.enabled,
                    method: config.auth.enabled ? 'Bearer token' : 'none',
                },
            }, config, origin);
            return;
        }

        // Authentication check for protected endpoints
        const protectedPaths = ['/sse', '/message', '/register', '/instances', '/tasks'];
        if (protectedPaths.some(p => url.pathname.startsWith(p))) {
            if (!isAuthenticated(config, req, url)) {
                auditLog(config, 'AUTH_FAILED', { ip: clientIP, path: url.pathname });
                sendError(res, 401, 'Authentication required', config, origin);
                return;
            }
        }

        // SSE endpoint for MCP clients
        if (url.pathname === '/sse' && req.method === 'GET') {
            const sessionId = crypto.randomUUID();

            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                ...getCorsHeaders(config, origin),
            });

            sseClients.set(sessionId, {
                res,
                sessionId,
                authenticatedAt: new Date(),
            });

            auditLog(config, 'SSE_CONNECTED', { sessionId, ip: clientIP });
            console.error(`[SSE] Client connected: ${sessionId}`);

            // Send endpoint info
            const messageUrl = `${baseUrl}/message?sessionId=${sessionId}`;
            sendSSE(res, 'endpoint', messageUrl);

            res.on('close', () => {
                sseClients.delete(sessionId);
                auditLog(config, 'SSE_DISCONNECTED', { sessionId, ip: clientIP });
                console.error(`[SSE] Client disconnected: ${sessionId}`);
            });

            return;
        }

        // Message endpoint for MCP requests
        if (url.pathname === '/message' && req.method === 'POST') {
            const sessionId = url.searchParams.get('sessionId');
            const client = sessionId ? sseClients.get(sessionId) : null;

            try {
                const body = await parseBody(req);
                const request = JSON.parse(body);

                console.error(`[MCP] Request: ${request.method}`);
                auditLog(config, 'MCP_REQUEST', {
                    sessionId,
                    method: request.method,
                    ip: clientIP,
                });

                const response = await handleMCPRequest(request);

                if (client) {
                    sendSSE(client.res, 'message', response);
                }

                sendJson(res, 200, response, config, origin);
            } catch (error) {
                console.error('[MCP] Error:', error);
                sendJson(res, 400, {
                    jsonrpc: '2.0',
                    id: null,
                    error: { code: -32700, message: 'Parse error' }
                }, config, origin);
            }
            return;
        }

        // Extension registration
        if (url.pathname === '/register' && req.method === 'POST') {
            try {
                const body = await parseBody(req);
                const request = JSON.parse(body) as RegistrationRequest;

                const instance = instanceManager.register(request);
                if (!instance) {
                    sendError(res, 503, 'No available ports', config, origin);
                    return;
                }

                startWebSocketServer(instance.port);

                auditLog(config, 'EXTENSION_REGISTERED', {
                    instanceId: instance.id,
                    port: instance.port,
                    ip: clientIP,
                });

                sendJson(res, 200, {
                    instanceId: instance.id,
                    port: instance.port,
                    websocketUrl: getWebSocketServerUrl(instance.port),
                }, config, origin);
            } catch (error) {
                console.error('[HTTP] Registration error:', error);
                sendError(res, 400, 'Invalid request', config, origin);
            }
            return;
        }

        // List instances
        if (url.pathname === '/instances' && req.method === 'GET') {
            const instances = instanceManager.getConnectedInstances();
            sendJson(res, 200, {
                instances: instances.map(inst => ({
                    id: inst.id,
                    port: inst.port,
                    userAgent: inst.userAgent,
                    windowId: inst.windowId,
                    connectedAt: inst.connectedAt,
                    lastActivity: inst.lastActivity,
                })),
            }, config, origin);
            return;
        }

        // ====================================================================
        // Task Execution Endpoints
        // ====================================================================

        // List tasks
        if (url.pathname === '/tasks' && req.method === 'GET') {
            const instanceId = url.searchParams.get('instanceId') || undefined;
            const status = url.searchParams.get('status') as TaskStatus | 'all' | undefined;

            const tasks = taskManager.listTasks(instanceId, status);
            sendJson(res, 200, {
                tasks: tasks.map(t => ({
                    id: t.id,
                    name: t.name,
                    status: t.status,
                    instanceId: t.instanceId,
                    currentCommandIndex: t.currentCommandIndex,
                    totalCommands: t.commands.length,
                    createdAt: t.createdAt,
                    startedAt: t.startedAt,
                    completedAt: t.completedAt,
                })),
                wsEndpoint: getTaskWebSocketUrl(),
            }, config, origin);
            return;
        }

        // Submit task
        if (url.pathname === '/tasks' && req.method === 'POST') {
            try {
                const body = await parseBody(req);
                const request = JSON.parse(body) as TaskSubmitMessage;
                request.type = 'task_submit';

                const result = taskManager.submitTask(request);

                if ('error' in result) {
                    sendJson(res, 400, { error: result.error }, config, origin);
                    return;
                }

                auditLog(config, 'TASK_SUBMITTED', {
                    taskId: result.taskId,
                    queuePosition: result.queuePosition,
                    ip: clientIP,
                });

                sendJson(res, 201, {
                    taskId: result.taskId,
                    queuePosition: result.queuePosition,
                    wsEndpoint: getTaskWebSocketUrl(),
                }, config, origin);
            } catch (error) {
                console.error('[HTTP] Task submit error:', error);
                sendError(res, 400, 'Invalid request', config, origin);
            }
            return;
        }

        // Get task details or cancel task
        if (url.pathname.startsWith('/tasks/') && url.pathname !== '/tasks/') {
            const pathParts = url.pathname.slice(7).split('/'); // Remove '/tasks/'
            const taskId = pathParts[0];
            const action = pathParts[1];

            // Cancel task: POST /tasks/:id/cancel
            if (action === 'cancel' && req.method === 'POST') {
                const success = taskManager.cancelTask(taskId);

                auditLog(config, 'TASK_CANCELLED', {
                    taskId,
                    success,
                    ip: clientIP,
                });

                sendJson(res, 200, {
                    success,
                    message: success ? 'Task cancelled' : 'Task not found or already completed',
                }, config, origin);
                return;
            }

            // Get task details: GET /tasks/:id
            if (!action && req.method === 'GET') {
                const task = taskManager.getTask(taskId);

                if (!task) {
                    sendError(res, 404, 'Task not found', config, origin);
                    return;
                }

                sendJson(res, 200, { task }, config, origin);
                return;
            }
        }

        // OAuth endpoints for compatibility
        if (url.pathname === '/.well-known/oauth-authorization-server' && req.method === 'GET') {
            sendJson(res, 200, {
                issuer: baseUrl,
                authorization_endpoint: `${baseUrl}/oauth/authorize`,
                token_endpoint: `${baseUrl}/oauth/token`,
                response_types_supported: ['code'],
                grant_types_supported: ['authorization_code'],
                code_challenge_methods_supported: ['S256'],
                registration_endpoint: `${baseUrl}/oauth/register`,
            }, config, origin);
            return;
        }

        if (url.pathname === '/oauth/register' && req.method === 'POST') {
            try {
                const body = await parseBody(req);
                const request = JSON.parse(body);
                sendJson(res, 201, {
                    client_id: 'moonsurf-client',
                    client_secret: 'not-secret',
                    redirect_uris: request.redirect_uris || [],
                    client_name: request.client_name || 'Moonsurf Client',
                }, config, origin);
            } catch {
                sendError(res, 400, 'Invalid request', config, origin);
            }
            return;
        }

        if (url.pathname === '/oauth/authorize' && req.method === 'GET') {
            const redirectUri = url.searchParams.get('redirect_uri');
            const state = url.searchParams.get('state');
            const code = 'auto-approved-code';

            if (redirectUri) {
                const redirect = new URL(redirectUri);
                redirect.searchParams.set('code', code);
                if (state) redirect.searchParams.set('state', state);
                res.writeHead(302, { Location: redirect.toString() });
                res.end();
            } else {
                sendError(res, 400, 'Missing redirect_uri', config, origin);
            }
            return;
        }

        if (url.pathname === '/oauth/token' && req.method === 'POST') {
            sendJson(res, 200, {
                access_token: 'local-access-token',
                token_type: 'Bearer',
                expires_in: 86400,
            }, config, origin);
            return;
        }

        sendError(res, 404, 'Not found', config, origin);
    };
}

// ============================================================================
// Server Startup
// ============================================================================

export function startHttpServer(): void {
    const config = getConfig();

    // Validate configuration
    const validation = validateConfig(config);
    if (!validation.valid) {
        console.error('[Server] Configuration errors:');
        validation.errors.forEach(e => console.error(`  ❌ ${e}`));
        process.exit(1);
    }

    printConfigSummary(config);

    const handler = createRequestHandler(config);
    let server: Server;

    if (config.tls.enabled && config.tls.cert && config.tls.key) {
        // HTTPS server
        const httpsOptions = {
            cert: readFileSync(config.tls.cert),
            key: readFileSync(config.tls.key),
        };
        server = createHttpsServer(httpsOptions, handler);
        console.error('[Server] TLS enabled - using HTTPS');
    } else {
        // HTTP server
        server = createHttpServer(handler);
    }

    server.listen(config.port, config.host, () => {
        const baseUrl = getServerBaseUrl(config);

        console.error(`[HTTP] Server listening on ${config.host}:${config.port}`);
        console.error(`[HTTP] MCP SSE endpoint: ${baseUrl}/sse`);
        console.error(`[HTTP] Extension registration: ${baseUrl}/register`);
        console.error(`[HTTP] Health check: ${baseUrl}/health`);

        if (config.auth.enabled) {
            console.error(`[HTTP] Authentication: REQUIRED (use Bearer token or ?token= parameter)`);
        }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.error('[Server] Shutting down...');
        server.close(() => {
            console.error('[Server] Closed');
            process.exit(0);
        });
    });
}
