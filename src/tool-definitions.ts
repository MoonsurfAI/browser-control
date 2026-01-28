/**
 * Consolidated MCP Tool Definitions
 *
 * Reduces 50 individual tools to 9 unified tools with action parameters.
 * This significantly reduces context window usage for AI agents.
 */

export const toolDefinitions = [
    {
        name: 'browser_instance',
        description: 'Manage browser instances. Actions: list (show connected instances), new (launch browser), close (terminate instance), profiles (list Chrome profiles)',
        inputSchema: {
            type: 'object' as const,
            properties: {
                action: {
                    type: 'string',
                    enum: ['list', 'new', 'close', 'profiles'],
                    description: 'Action: list | new | close | profiles',
                },
                instanceId: {
                    type: 'string',
                    description: 'Instance ID (required for close)',
                },
                url: {
                    type: 'string',
                    description: 'URL to open on launch',
                },
                mode: {
                    type: 'string',
                    enum: ['chrome', 'testing', 'chromium'],
                    description: 'Browser mode: chrome (daily use), testing (temporary), chromium (automation)',
                },
                headless: {
                    type: 'boolean',
                    description: 'Headless mode (chromium only)',
                },
                profile: {
                    type: 'string',
                    description: 'Chrome profile name (chrome mode only)',
                },
                extensions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Additional extension paths',
                },
                closeOtherTabs: {
                    type: 'boolean',
                    description: 'Close other tabs after launch',
                },
            },
            required: ['action'],
        },
    },
    {
        name: 'browser_tab',
        description: 'Manage browser tabs. Actions: list, new, close, close_others, activate',
        inputSchema: {
            type: 'object' as const,
            properties: {
                action: {
                    type: 'string',
                    enum: ['list', 'new', 'close', 'close_others', 'activate'],
                    description: 'Action: list | new | close | close_others | activate',
                },
                instanceId: {
                    type: 'string',
                    description: 'Target browser instance ID',
                },
                tabId: {
                    type: 'number',
                    description: 'Tab ID (required for close/activate)',
                },
                keepTabId: {
                    type: 'number',
                    description: 'Tab to keep (for close_others)',
                },
                url: {
                    type: 'string',
                    description: 'URL for new tab',
                },
            },
            required: ['action'],
        },
    },
    {
        name: 'browser_navigate',
        description: 'Navigate pages and history. Actions: goto (URL), reload, back, forward, wait (for selector/condition)',
        inputSchema: {
            type: 'object' as const,
            properties: {
                action: {
                    type: 'string',
                    enum: ['goto', 'reload', 'back', 'forward', 'wait'],
                    description: 'Action: goto | reload | back | forward | wait',
                },
                instanceId: {
                    type: 'string',
                    description: 'Target browser instance ID',
                },
                tabId: {
                    type: 'number',
                    description: 'Target tab ID',
                },
                url: {
                    type: 'string',
                    description: 'URL to navigate to (for goto)',
                },
                waitUntil: {
                    type: 'string',
                    enum: ['load', 'domcontentloaded'],
                    description: 'Wait condition for navigation',
                },
                ignoreCache: {
                    type: 'boolean',
                    description: 'Bypass cache (for reload)',
                },
                selector: {
                    type: 'string',
                    description: 'CSS selector to wait for',
                },
                expression: {
                    type: 'string',
                    description: 'JS expression to wait for (truthy)',
                },
                timeout: {
                    type: 'number',
                    description: 'Wait timeout in ms',
                },
            },
            required: ['action'],
        },
    },
    {
        name: 'browser_content',
        description: 'Get page content. Actions: screenshot, pdf, get (page content), query (find elements), attribute (get element attribute), get_viewport_dom (visible elements with layout)',
        inputSchema: {
            type: 'object' as const,
            properties: {
                action: {
                    type: 'string',
                    enum: ['screenshot', 'pdf', 'get', 'query', 'attribute', 'get_viewport_dom'],
                    description: 'Action: screenshot | pdf | get | query | attribute | get_viewport_dom',
                },
                instanceId: {
                    type: 'string',
                    description: 'Target browser instance ID',
                },
                tabId: {
                    type: 'number',
                    description: 'Target tab ID',
                },
                selector: {
                    type: 'string',
                    description: 'CSS selector (for get/query/attribute)',
                },
                attribute: {
                    type: 'string',
                    description: 'Attribute name (for attribute action)',
                },
                format: {
                    type: 'string',
                    description: 'Output format: png/jpeg/webp (screenshot) or html/text (get)',
                },
                quality: {
                    type: 'number',
                    description: 'Image quality 0-100 (jpeg/webp)',
                },
                fullPage: {
                    type: 'boolean',
                    description: 'Capture full scrollable page',
                },
                landscape: {
                    type: 'boolean',
                    description: 'Landscape orientation (pdf)',
                },
                printBackground: {
                    type: 'boolean',
                    description: 'Print background graphics (pdf)',
                },
                scale: {
                    type: 'number',
                    description: 'Page scale 0.1-2 (pdf)',
                },
                paperWidth: {
                    type: 'number',
                    description: 'Paper width in inches (pdf)',
                },
                paperHeight: {
                    type: 'number',
                    description: 'Paper height in inches (pdf)',
                },
                maxElements: {
                    type: 'number',
                    description: 'Maximum elements to return (for get_viewport_dom, default: 500)',
                },
                domDepth: {
                    type: 'number',
                    description: 'Max depth of nested children in DOM output (for get_viewport_dom, default: 2)',
                },
                includeHidden: {
                    type: 'boolean',
                    description: 'Include hidden elements (for get_viewport_dom)',
                },
                minSize: {
                    type: 'number',
                    description: 'Minimum width/height in pixels to filter elements (for get_viewport_dom)',
                },
            },
            required: ['action'],
        },
    },
    {
        name: 'browser_interact',
        description: 'Simulate user input. Actions: click, move (mouse), type, press (key), scroll, hover, select (dropdown), upload (files). Type action uses human-like typing with 100-200 WPM speed by default.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                action: {
                    type: 'string',
                    enum: ['click', 'move', 'type', 'press', 'scroll', 'hover', 'select', 'upload'],
                    description: 'Action: click | move | type | press | scroll | hover | select | upload',
                },
                instanceId: {
                    type: 'string',
                    description: 'Target browser instance ID',
                },
                tabId: {
                    type: 'number',
                    description: 'Target tab ID',
                },
                selector: {
                    type: 'string',
                    description: 'CSS selector, text=X, or element:has-text(X)',
                },
                x: {
                    type: 'number',
                    description: 'X coordinate',
                },
                y: {
                    type: 'number',
                    description: 'Y coordinate',
                },
                text: {
                    type: 'string',
                    description: 'Text to type',
                },
                key: {
                    type: 'string',
                    description: 'Key to press (Enter, Tab, Escape, etc.)',
                },
                ctrl: {
                    type: 'boolean',
                    description: 'Hold Ctrl key',
                },
                alt: {
                    type: 'boolean',
                    description: 'Hold Alt key',
                },
                shift: {
                    type: 'boolean',
                    description: 'Hold Shift key',
                },
                meta: {
                    type: 'boolean',
                    description: 'Hold Meta/Cmd key',
                },
                delay: {
                    type: 'number',
                    description: 'Custom delay between keystrokes in ms. If not provided, uses human-like typing with 100-200 WPM speed, randomized delays, natural pauses after punctuation, and occasional thinking delays. Set to 0 for instant typing.',
                },
                deltaX: {
                    type: 'number',
                    description: 'Horizontal scroll amount',
                },
                deltaY: {
                    type: 'number',
                    description: 'Vertical scroll amount',
                },
                value: {
                    type: 'string',
                    description: 'Option value (select)',
                },
                label: {
                    type: 'string',
                    description: 'Option label (select)',
                },
                index: {
                    type: 'number',
                    description: 'Option index (select)',
                },
                files: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'File paths (upload)',
                },
            },
            required: ['action'],
        },
    },
    {
        name: 'browser_execute',
        description: 'Execute JavaScript in page context',
        inputSchema: {
            type: 'object' as const,
            properties: {
                instanceId: {
                    type: 'string',
                    description: 'Target browser instance ID',
                },
                tabId: {
                    type: 'number',
                    description: 'Target tab ID',
                },
                expression: {
                    type: 'string',
                    description: 'JavaScript code to execute',
                },
                awaitPromise: {
                    type: 'boolean',
                    description: 'Wait for promise resolution',
                },
            },
            required: ['expression'],
        },
    },
    {
        name: 'browser_network',
        description: 'Control network/storage. Actions: get_cookies, set_cookie, clear_cookies, set_headers, intercept, get_storage, set_storage, clear_storage',
        inputSchema: {
            type: 'object' as const,
            properties: {
                action: {
                    type: 'string',
                    enum: ['get_cookies', 'set_cookie', 'clear_cookies', 'set_headers', 'intercept', 'get_storage', 'set_storage', 'clear_storage'],
                    description: 'Action type',
                },
                instanceId: {
                    type: 'string',
                    description: 'Target browser instance ID',
                },
                tabId: {
                    type: 'number',
                    description: 'Target tab ID',
                },
                name: {
                    type: 'string',
                    description: 'Cookie name',
                },
                value: {
                    type: 'string',
                    description: 'Cookie/storage value',
                },
                key: {
                    type: 'string',
                    description: 'Storage key',
                },
                url: {
                    type: 'string',
                    description: 'Cookie URL',
                },
                urls: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'URLs for get_cookies',
                },
                domain: {
                    type: 'string',
                    description: 'Cookie domain',
                },
                path: {
                    type: 'string',
                    description: 'Cookie path',
                },
                secure: {
                    type: 'boolean',
                    description: 'Secure cookie',
                },
                httpOnly: {
                    type: 'boolean',
                    description: 'HTTP-only cookie',
                },
                sameSite: {
                    type: 'string',
                    enum: ['Strict', 'Lax', 'None'],
                    description: 'SameSite attribute',
                },
                expires: {
                    type: 'number',
                    description: 'Cookie expiration (Unix timestamp)',
                },
                headers: {
                    type: 'object',
                    additionalProperties: { type: 'string' },
                    description: 'HTTP headers to set',
                },
                enabled: {
                    type: 'boolean',
                    description: 'Enable/disable interception',
                },
                patterns: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            urlPattern: { type: 'string' },
                            resourceType: { type: 'string' },
                        },
                    },
                    description: 'Interception patterns',
                },
                storageType: {
                    type: 'string',
                    enum: ['localStorage', 'sessionStorage', 'all'],
                    description: 'Storage type to clear',
                },
            },
            required: ['action'],
        },
    },
    {
        name: 'browser_emulate',
        description: 'Device/network emulation. Actions: viewport, user_agent, geolocation, timezone, device (preset), offline, throttle',
        inputSchema: {
            type: 'object' as const,
            properties: {
                action: {
                    type: 'string',
                    enum: ['viewport', 'user_agent', 'geolocation', 'timezone', 'device', 'offline', 'throttle'],
                    description: 'Action type',
                },
                instanceId: {
                    type: 'string',
                    description: 'Target browser instance ID',
                },
                tabId: {
                    type: 'number',
                    description: 'Target tab ID',
                },
                width: {
                    type: 'number',
                    description: 'Viewport width',
                },
                height: {
                    type: 'number',
                    description: 'Viewport height',
                },
                deviceScaleFactor: {
                    type: 'number',
                    description: 'Device pixel ratio',
                },
                mobile: {
                    type: 'boolean',
                    description: 'Mobile device mode',
                },
                userAgent: {
                    type: 'string',
                    description: 'User agent string',
                },
                platform: {
                    type: 'string',
                    description: 'Platform (Win32, MacIntel, Linux)',
                },
                latitude: {
                    type: 'number',
                    description: 'Latitude coordinate',
                },
                longitude: {
                    type: 'number',
                    description: 'Longitude coordinate',
                },
                accuracy: {
                    type: 'number',
                    description: 'Geolocation accuracy (meters)',
                },
                timezoneId: {
                    type: 'string',
                    description: 'Timezone ID (e.g., America/New_York)',
                },
                device: {
                    type: 'string',
                    description: 'Device preset (iPhone 14, Pixel 7, iPad Pro)',
                },
                offline: {
                    type: 'boolean',
                    description: 'Enable offline mode',
                },
                preset: {
                    type: 'string',
                    enum: ['slow-3g', 'fast-3g', '4g', 'wifi', 'offline', 'none'],
                    description: 'Network throttle preset',
                },
                downloadThroughput: {
                    type: 'number',
                    description: 'Download speed (bytes/s)',
                },
                uploadThroughput: {
                    type: 'number',
                    description: 'Upload speed (bytes/s)',
                },
                latency: {
                    type: 'number',
                    description: 'Network latency (ms)',
                },
            },
            required: ['action'],
        },
    },
    {
        name: 'browser_debug',
        description: 'Debugging tools. Actions: dialog (handle alerts), console (logs), performance (metrics), trace_start, trace_stop, downloads (list), download_wait',
        inputSchema: {
            type: 'object' as const,
            properties: {
                action: {
                    type: 'string',
                    enum: ['dialog', 'console', 'performance', 'trace_start', 'trace_stop', 'downloads', 'download_wait'],
                    description: 'Action type',
                },
                instanceId: {
                    type: 'string',
                    description: 'Target browser instance ID',
                },
                tabId: {
                    type: 'number',
                    description: 'Target tab ID',
                },
                dialogAction: {
                    type: 'string',
                    enum: ['accept', 'dismiss'],
                    description: 'Dialog action',
                },
                promptText: {
                    type: 'string',
                    description: 'Text for prompt dialogs',
                },
                level: {
                    type: 'string',
                    enum: ['log', 'info', 'warning', 'error', 'all'],
                    description: 'Console log level filter',
                },
                clear: {
                    type: 'boolean',
                    description: 'Clear logs after retrieval',
                },
                categories: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Trace categories',
                },
                state: {
                    type: 'string',
                    enum: ['in_progress', 'complete', 'error', 'all'],
                    description: 'Download state filter',
                },
                downloadId: {
                    type: 'string',
                    description: 'Download ID to wait for',
                },
                timeout: {
                    type: 'number',
                    description: 'Wait timeout (ms)',
                },
            },
            required: ['action'],
        },
    },
    {
        name: 'sleep',
        description: 'Wait for a specified duration before continuing. Useful as a delay between task commands.',
        inputSchema: {
            type: 'object' as const,
            properties: {
                duration: {
                    type: 'number',
                    description: 'Duration to wait in milliseconds',
                },
            },
            required: ['duration'],
        },
    },
];

/**
 * Maps consolidated tool actions to original tool names.
 * Used by the MCP handler to route requests.
 */
export const actionToToolMap: Record<string, Record<string, string>> = {
    browser_instance: {
        list: 'browser_instance_list',
        new: 'browser_instance_new',
        close: 'browser_instance_close',
        profiles: 'browser_profile_list',
    },
    browser_tab: {
        list: 'browser_tab_list',
        new: 'browser_tab_new',
        close: 'browser_tab_close',
        close_others: 'browser_tab_close_others',
        activate: 'browser_tab_activate',
    },
    browser_navigate: {
        goto: 'browser_navigate',
        reload: 'browser_reload',
        back: 'browser_go_back',
        forward: 'browser_go_forward',
        wait: 'browser_wait_for',
    },
    browser_content: {
        screenshot: 'browser_screenshot',
        pdf: 'browser_pdf',
        get: 'browser_get_content',
        query: 'browser_query_selector',
        attribute: 'browser_get_attribute',
        get_viewport_dom: 'browser_get_viewport_dom',
    },
    browser_interact: {
        click: 'browser_mouse_click',
        move: 'browser_mouse_move',
        type: 'browser_type',
        press: 'browser_keyboard_press',
        scroll: 'browser_mouse_scroll',
        hover: 'browser_hover',
        select: 'browser_select',
        upload: 'browser_upload_file',
    },
    browser_execute: {
        _default: 'browser_evaluate',
    },
    browser_network: {
        get_cookies: 'browser_get_cookies',
        set_cookie: 'browser_set_cookie',
        clear_cookies: 'browser_clear_cookies',
        set_headers: 'browser_set_headers',
        intercept: 'browser_intercept_requests',
        get_storage: 'browser_get_local_storage',
        set_storage: 'browser_set_local_storage',
        clear_storage: 'browser_clear_storage',
    },
    browser_emulate: {
        viewport: 'browser_set_viewport',
        user_agent: 'browser_set_user_agent',
        geolocation: 'browser_set_geolocation',
        timezone: 'browser_set_timezone',
        device: 'browser_emulate_device',
        offline: 'browser_set_offline',
        throttle: 'browser_throttle_network',
    },
    browser_debug: {
        dialog: 'browser_handle_dialog',
        console: 'browser_get_console_logs',
        performance: 'browser_get_performance_metrics',
        trace_start: 'browser_start_tracing',
        trace_stop: 'browser_stop_tracing',
        downloads: 'browser_download_list',
        download_wait: 'browser_download_wait',
    },
};

/**
 * Gets the original tool name from a consolidated tool call.
 */
export function getOriginalToolName(consolidatedTool: string, action?: string): string | null {
    const mapping = actionToToolMap[consolidatedTool];
    if (!mapping) return null;

    if (mapping._default) {
        return mapping._default;
    }

    if (!action) return null;
    return mapping[action] || null;
}

/**
 * Transforms arguments from consolidated format to original tool format.
 * Removes the 'action' field and renames fields as needed.
 */
export function transformArguments(
    consolidatedTool: string,
    action: string,
    args: Record<string, unknown>
): Record<string, unknown> {
    const transformed = { ...args };
    delete transformed.action;

    // Handle special field mappings
    if (consolidatedTool === 'browser_network') {
        if (action === 'clear_storage' && transformed.storageType) {
            transformed.type = transformed.storageType;
            delete transformed.storageType;
        }
    }

    if (consolidatedTool === 'browser_debug') {
        if (action === 'dialog' && transformed.dialogAction) {
            transformed.action = transformed.dialogAction;
            delete transformed.dialogAction;
        }
    }

    if (consolidatedTool === 'browser_navigate') {
        if (action === 'goto' && transformed.url) {
            // url stays as url, no transformation needed
        }
    }

    return transformed;
}
