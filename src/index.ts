#!/usr/bin/env node

import { startHttpServer } from './http-server.js';
import { getConfig } from './config.js';

async function main(): Promise<void> {
    const config = getConfig();
    const isRemote = config.host === '0.0.0.0';
    const protocol = config.tls.enabled ? 'https' : 'http';

    console.error('[Moonsurf] Server starting...');
    console.error(`[Server] Mode: ${isRemote ? 'REMOTE' : 'LOCAL'}`);
    console.error(`[Server] SSE endpoint: ${protocol}://${config.host}:${config.port}/sse`);

    startHttpServer();
}

main().catch((error) => {
    console.error('[Server] Fatal error:', error);
    process.exit(1);
});
