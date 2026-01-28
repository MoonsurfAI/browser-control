/**
 * MCP Request Handler
 *
 * Routes consolidated tool calls to original tool implementations.
 * Supports both the new 9-tool consolidated API and the original 50-tool API.
 */

import { instanceManager } from './instance-manager.js';
import {
    toolDefinitions,
    getOriginalToolName,
    transformArguments,
    actionToToolMap,
} from './tool-definitions.js';
import { browserLauncher } from './browser-launcher.js';
import { downloadWatcher } from './download-watcher.js';
import type { DownloadState } from './types.js';

interface MCPRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: Record<string, unknown>;
}

interface MCPResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: unknown;
    error?: { code: number; message: string };
}

const SERVER_INFO = {
    name: 'moonsurf-mcp',
    version: '2.1.0',
};

const PROTOCOL_VERSION = '2024-11-05';

export function getMCPToolsList() {
    return toolDefinitions;
}

export interface RESTToolResult {
    success: boolean;
    result?: unknown;
    error?: { code: string; message: string };
}

export async function executeToolREST(
    toolName: string,
    args: Record<string, unknown>
): Promise<RESTToolResult> {
    // Validate tool exists
    const validTools = toolDefinitions.map(t => t.name);
    if (!validTools.includes(toolName)) {
        return {
            success: false,
            error: { code: 'TOOL_NOT_FOUND', message: `Unknown tool: ${toolName}` },
        };
    }

    try {
        const { resolvedName, resolvedArgs } = resolveToolCall(toolName, args);
        console.error(`[REST] Tool call: ${toolName}${toolName !== resolvedName ? ` -> ${resolvedName}` : ''}`, resolvedArgs);

        const response = await executeOriginalTool(0, resolvedName, resolvedArgs);

        // Unwrap MCP response
        if (response.error) {
            return {
                success: false,
                error: { code: 'MCP_ERROR', message: response.error.message },
            };
        }

        const result = response.result as { content?: Array<{ type: string; text?: string }>; isError?: boolean } | undefined;
        if (!result?.content?.length) {
            return { success: true, result: null };
        }

        // Parse text content back to object for clean REST output
        const content = result.content[0];
        let parsed: unknown;
        if (content.type === 'text' && content.text) {
            try {
                parsed = JSON.parse(content.text);
            } catch {
                parsed = content.text;
            }
        } else {
            parsed = content;
        }

        if (result.isError) {
            const errorObj = typeof parsed === 'object' && parsed !== null && 'error' in parsed
                ? (parsed as { error: { code?: string; message?: string } }).error
                : { code: 'TOOL_ERROR', message: String(parsed) };
            return {
                success: false,
                error: {
                    code: errorObj.code || 'TOOL_ERROR',
                    message: errorObj.message || String(parsed),
                },
            };
        }

        return { success: true, result: parsed };
    } catch (error) {
        console.error(`[REST] Tool error: ${toolName}`, error);
        return {
            success: false,
            error: {
                code: 'TOOL_ERROR',
                message: error instanceof Error ? error.message : String(error),
            },
        };
    }
}

export async function handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
    const { id, method, params } = request;

    try {
        switch (method) {
            case 'initialize':
                return {
                    jsonrpc: '2.0',
                    id,
                    result: {
                        protocolVersion: PROTOCOL_VERSION,
                        serverInfo: SERVER_INFO,
                        capabilities: {
                            tools: {},
                        },
                    },
                };

            case 'initialized':
                return { jsonrpc: '2.0', id, result: {} };

            case 'tools/list':
                return {
                    jsonrpc: '2.0',
                    id,
                    result: { tools: toolDefinitions },
                };

            case 'tools/call':
                return await handleToolCall(id, params);

            case 'ping':
                return { jsonrpc: '2.0', id, result: {} };

            default:
                return {
                    jsonrpc: '2.0',
                    id,
                    error: { code: -32601, message: `Method not found: ${method}` },
                };
        }
    } catch (error) {
        return {
            jsonrpc: '2.0',
            id,
            error: {
                code: -32603,
                message: error instanceof Error ? error.message : 'Internal error',
            },
        };
    }
}

/**
 * Resolves consolidated tool + action to the original tool name and args.
 */
function resolveToolCall(
    toolName: string,
    args: Record<string, unknown>
): { resolvedName: string; resolvedArgs: Record<string, unknown> } {
    // Check if this is a consolidated tool
    if (actionToToolMap[toolName]) {
        const action = args.action as string | undefined;
        const originalTool = getOriginalToolName(toolName, action);

        if (!originalTool) {
            throw new Error(`Invalid action "${action}" for tool "${toolName}"`);
        }

        const resolvedArgs = transformArguments(toolName, action || '_default', args);
        return { resolvedName: originalTool, resolvedArgs };
    }

    // Not a consolidated tool, pass through as-is
    return { resolvedName: toolName, resolvedArgs: args };
}

async function handleToolCall(
    id: string | number,
    params?: Record<string, unknown>
): Promise<MCPResponse> {
    const name = params?.name as string;
    const args = (params?.arguments || {}) as Record<string, unknown>;

    if (!name) {
        return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Missing tool name' },
        };
    }

    try {
        // Resolve consolidated tools to original tool names
        const { resolvedName, resolvedArgs } = resolveToolCall(name, args);
        console.error(`[MCP] Tool call: ${name}${name !== resolvedName ? ` -> ${resolvedName}` : ''}`, resolvedArgs);

        // Route to appropriate handler
        return await executeOriginalTool(id, resolvedName, resolvedArgs);
    } catch (error) {
        console.error(`[MCP] Tool error: ${name}`, error);
        return {
            jsonrpc: '2.0',
            id,
            result: {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: {
                            code: 'TOOL_ERROR',
                            message: error instanceof Error ? error.message : String(error),
                        },
                    }),
                }],
                isError: true,
            },
        };
    }
}

/**
 * Executes original tool implementations.
 * Handles server-side tools locally, routes others to browser extension.
 */
async function executeOriginalTool(
    id: string | number,
    name: string,
    args: Record<string, unknown>
): Promise<MCPResponse> {
    // Server-side tools (handled locally)
    switch (name) {
        case 'browser_instance_list':
            return handleInstanceList(id);

        case 'browser_instance_new':
            return handleInstanceNew(id, args);

        case 'browser_instance_close':
            return handleInstanceClose(id, args);

        case 'browser_profile_list':
            return handleProfileList(id);

        case 'browser_download_list':
            return handleDownloadList(id, args);

        case 'browser_download_wait':
            return handleDownloadWait(id, args);

        case 'sleep': {
            const duration = (args.duration as number) || 0;
            await new Promise(resolve => setTimeout(resolve, duration));
            return {
                jsonrpc: '2.0' as const,
                id,
                result: {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({ slept: duration }),
                    }],
                },
            };
        }
    }

    // Extension-side tools (routed to browser)
    const instanceId = args.instanceId as string | undefined;
    delete args.instanceId;

    const result = await instanceManager.callTool(instanceId, name, args);

    // Check if result is already in MCP format
    if (typeof result === 'object' && result !== null && 'content' in result) {
        return { jsonrpc: '2.0', id, result };
    }

    return {
        jsonrpc: '2.0',
        id,
        result: {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2),
            }],
        },
    };
}

// ============================================================================
// Server-side Tool Handlers
// ============================================================================

function handleInstanceList(id: string | number): MCPResponse {
    const instances = instanceManager.getConnectedInstances();
    return {
        jsonrpc: '2.0',
        id,
        result: {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    instances: instances.map(inst => {
                        const launchInfo = browserLauncher.getInstanceInfo(inst.id);
                        return {
                            id: inst.id,
                            browserType: launchInfo?.browserType || 'Unknown',
                            profile: launchInfo?.profile || '(temporary)',
                            port: inst.port,
                            userAgent: inst.userAgent,
                            windowId: inst.windowId,
                            connectedAt: inst.connectedAt,
                            lastActivity: inst.lastActivity,
                        };
                    }),
                }, null, 2),
            }],
        },
    };
}

async function handleInstanceNew(
    id: string | number,
    args: Record<string, unknown>
): Promise<MCPResponse> {
    const url = args.url as string | undefined;
    const mode = args.mode as 'chrome' | 'testing' | 'chromium' | undefined;
    const headless = args.headless as boolean | undefined;
    const profile = args.profile as string | undefined;
    const extensions = args.extensions as string[] | undefined;
    const closeOtherTabs = args.closeOtherTabs as boolean | undefined;

    const result = await browserLauncher.launch({ url, mode, headless, profile, extensions });

    // Profile selection required
    if (result.type === 'profile_selection_required') {
        return {
            jsonrpc: '2.0',
            id,
            result: {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        action: 'profile_selection_required',
                        profiles: result.profiles.map(p => ({
                            id: p.directory,
                            name: p.name,
                        })),
                        message: result.message,
                        hint: 'Use browser_instance with action:"new" and profile parameter, or mode:"testing"/"chromium"',
                    }, null, 2),
                }],
            },
        };
    }

    // Close other tabs if requested
    if (closeOtherTabs) {
        try {
            await instanceManager.callTool(result.id, 'browser_tab_close_others', {});
            console.error(`[MCP] Closed other tabs for instance ${result.id}`);
        } catch (error) {
            console.error(`[MCP] Failed to close other tabs:`, error);
        }
    }

    // Success response
    const autoLoaded = result.browserType === 'Chrome for Testing' || result.browserType === 'Chromium';
    const response: Record<string, unknown> = {
        instanceId: result.id,
        browserType: result.browserType,
        profile: result.profile || (result.browserType === 'Chromium' ? '(persistent)' : '(temporary)'),
        downloadDirectory: browserLauncher.getDownloadDirectory(),
        extensionAutoLoaded: autoLoaded,
        message: autoLoaded
            ? 'Browser launched with extension auto-loaded.'
            : 'Browser launched. Install extension via chrome://extensions.',
    };

    if (result.warning) response.warning = result.warning;
    if (closeOtherTabs) response.closedOtherTabs = true;

    return {
        jsonrpc: '2.0',
        id,
        result: {
            content: [{
                type: 'text',
                text: JSON.stringify(response, null, 2),
            }],
        },
    };
}

async function handleInstanceClose(
    id: string | number,
    args: Record<string, unknown>
): Promise<MCPResponse> {
    const instanceId = args.instanceId as string;

    if (!instanceId) {
        return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Missing instanceId' },
        };
    }

    const success = await browserLauncher.close(instanceId);

    return {
        jsonrpc: '2.0',
        id,
        result: {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success,
                    message: success ? 'Browser instance closed' : 'Instance not found',
                }, null, 2),
            }],
        },
    };
}

function handleProfileList(id: string | number): MCPResponse {
    const profiles = browserLauncher.listProfiles();

    return {
        jsonrpc: '2.0',
        id,
        result: {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    profiles: profiles.map(p => ({
                        directory: p.directory,
                        name: p.name,
                    })),
                }, null, 2),
            }],
        },
    };
}

function handleDownloadList(
    id: string | number,
    args: Record<string, unknown>
): MCPResponse {
    const instanceId = args.instanceId as string | undefined;
    const state = args.state as DownloadState | 'all' | undefined;

    let targetInstanceId = instanceId;
    if (!targetInstanceId) {
        const firstInstance = instanceManager.getFirstConnectedInstance();
        targetInstanceId = firstInstance?.id;
    }

    if (!targetInstanceId) {
        return {
            jsonrpc: '2.0',
            id,
            result: {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: { code: 'NO_INSTANCE', message: 'No connected browser instances' },
                    }),
                }],
                isError: true,
            },
        };
    }

    let downloads = downloadWatcher.getDownloads(targetInstanceId);
    if (state && state !== 'all') {
        downloads = downloads.filter(d => d.state === state);
    }

    return {
        jsonrpc: '2.0',
        id,
        result: {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    downloads,
                    downloadDirectory: browserLauncher.getDownloadDirectory(),
                    count: downloads.length,
                }, null, 2),
            }],
        },
    };
}

async function handleDownloadWait(
    id: string | number,
    args: Record<string, unknown>
): Promise<MCPResponse> {
    const downloadId = args.downloadId as string;
    const timeout = (args.timeout as number) || 300000;

    if (!downloadId) {
        return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Missing downloadId' },
        };
    }

    try {
        const download = await downloadWatcher.waitForDownload(downloadId, timeout);
        return {
            jsonrpc: '2.0',
            id,
            result: {
                content: [{
                    type: 'text',
                    text: JSON.stringify(download, null, 2),
                }],
            },
        };
    } catch (error) {
        return {
            jsonrpc: '2.0',
            id,
            result: {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: {
                            code: 'DOWNLOAD_ERROR',
                            message: error instanceof Error ? error.message : String(error),
                        },
                    }),
                }],
                isError: true,
            },
        };
    }
}
