#!/usr/bin/env node

import { startHttpServer } from './http-server.js';
import { getConfig } from './config.js';
import { installSkill, uninstallSkill, showSkillStatus } from './skill-installer.js';
import { startTaskWebSocketServer } from './task-websocket-server.js';

function showHelp(): void {
    console.error(`
Moonsurf Browser Control - AI-native browser automation

Usage: moonsurf [options]

Options:
  --help, -h              Show this help message
  --version, -v           Show version number
  --install-skill         Install the Claude skill for browser automation
  --uninstall-skill       Remove the Claude skill
  --skill-status          Check if the Claude skill is installed

Environment Variables:
  PORT                    HTTP server port (default: 3300)
  HOST                    Server bind address (default: localhost)
  PUBLIC_URL              Public URL for remote clients (e.g., http://1.2.3.4:3300)
  REMOTE_MODE             Enable remote mode with 0.0.0.0 binding
  BROWSER_DEFAULT_MODE    Default browser: chromium | chrome | testing
  HEADLESS_DEFAULT        Run browsers in headless mode
  AUTH_ENABLED            Enable token authentication
  AUTH_TOKENS             Comma-separated list of valid tokens
  LOG_LEVEL               Logging level: debug | info | warn | error

Examples:
  moonsurf                          Start the MCP server
  moonsurf --install-skill          Install Claude skill
  PORT=3400 moonsurf                Start on port 3400

Documentation: https://github.com/MoonsurfAI/browser-control
`);
}

function showVersion(): void {
    // Version is read from package.json at build time
    console.error('Moonsurf Browser Control v1.0.3');
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);

    // Handle CLI flags
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        process.exit(0);
    }

    if (args.includes('--version') || args.includes('-v')) {
        showVersion();
        process.exit(0);
    }

    if (args.includes('--install-skill')) {
        installSkill();
        process.exit(0);
    }

    if (args.includes('--uninstall-skill')) {
        uninstallSkill();
        process.exit(0);
    }

    if (args.includes('--skill-status')) {
        showSkillStatus();
        process.exit(0);
    }

    // Default: start the server
    const config = getConfig();
    const isRemote = config.host === '0.0.0.0';
    const protocol = config.tls.enabled ? 'https' : 'http';

    // Determine SSE endpoint URL (use PUBLIC_URL if set)
    const sseEndpoint = config.publicUrl
        ? `${config.publicUrl.replace(/\/$/, '')}/sse`
        : `${protocol}://${config.host}:${config.port}/sse`;

    console.error('[Moonsurf] Server starting...');
    console.error(`[Server] Mode: ${isRemote ? 'REMOTE' : 'LOCAL'}`);
    console.error(`[Server] SSE endpoint: ${sseEndpoint}`);

    startHttpServer();

    // Start task WebSocket server if enabled
    if (config.tasks.enabled) {
        startTaskWebSocketServer(config.tasks.wsPort);
        console.error(`[Server] Task WebSocket: ws://localhost:${config.tasks.wsPort}`);
    }
}

main().catch((error) => {
    console.error('[Server] Fatal error:', error);
    process.exit(1);
});
