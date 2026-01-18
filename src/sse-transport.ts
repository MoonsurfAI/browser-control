import { IncomingMessage, ServerResponse } from 'http';

type MessageHandler = (message: unknown) => void;

export class SSEServerTransport {
    private res: ServerResponse | null = null;
    private messageHandler: MessageHandler | null = null;
    private closeHandler: (() => void) | null = null;
    private sessionId: string;

    constructor() {
        this.sessionId = crypto.randomUUID();
    }

    handleRequest(req: IncomingMessage, res: ServerResponse): boolean {
        const url = new URL(req.url || '/', `http://localhost`);

        if (url.pathname === '/sse' && req.method === 'GET') {
            this.handleSSE(res);
            return true;
        }

        if (url.pathname === '/message' && req.method === 'POST') {
            this.handleMessage(req, res);
            return true;
        }

        return false;
    }

    private handleSSE(res: ServerResponse): void {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
        });

        this.res = res;

        // Send endpoint info
        const endpointMessage = JSON.stringify({
            jsonrpc: '2.0',
            method: 'sse/endpoint',
            params: { endpoint: '/message' }
        });
        res.write(`event: endpoint\ndata: /message?sessionId=${this.sessionId}\n\n`);

        res.on('close', () => {
            this.res = null;
            if (this.closeHandler) {
                this.closeHandler();
            }
        });
    }

    private async handleMessage(req: IncomingMessage, res: ServerResponse): Promise<void> {
        let body = '';
        for await (const chunk of req) {
            body += chunk;
        }

        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        });
        res.end(JSON.stringify({ ok: true }));

        if (this.messageHandler) {
            try {
                const message = JSON.parse(body);
                this.messageHandler(message);
            } catch (e) {
                console.error('[SSE] Failed to parse message:', e);
            }
        }
    }

    async start(): Promise<void> {
        // No-op for SSE, connection is handled via HTTP
    }

    async close(): Promise<void> {
        if (this.res) {
            this.res.end();
            this.res = null;
        }
    }

    send(message: unknown): void {
        if (this.res) {
            const data = JSON.stringify(message);
            this.res.write(`event: message\ndata: ${data}\n\n`);
        }
    }

    onMessage(handler: MessageHandler): void {
        this.messageHandler = handler;
    }

    onClose(handler: () => void): void {
        this.closeHandler = handler;
    }

    get isConnected(): boolean {
        return this.res !== null;
    }
}
