/**
 * Server Configuration
 *
 * Supports both environment variables and programmatic configuration.
 * Environment variables take precedence for deployment flexibility.
 */

export interface ServerConfig {
    // Server binding
    host: string;
    port: number;

    // WebSocket configuration
    wsHost: string;
    wsPortStart: number;
    wsPortEnd: number;

    // Security
    auth: {
        enabled: boolean;
        tokens: string[];
    };

    // TLS/HTTPS
    tls: {
        enabled: boolean;
        cert?: string;
        key?: string;
    };

    // CORS
    cors: {
        enabled: boolean;
        origins: string[];
        credentials: boolean;
    };

    // Rate limiting
    rateLimit: {
        enabled: boolean;
        maxConnectionsPerIP: number;
        maxCallsPerMinute: number;
    };

    // Browser defaults
    browser: {
        headlessDefault: boolean;
        defaultMode: 'chrome' | 'testing' | 'chromium';
    };

    // Logging
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error';
        auditEnabled: boolean;
    };
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
}

function parseNumber(value: string | undefined, defaultValue: number): number {
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
}

function parseStringArray(value: string | undefined, defaultValue: string[]): string[] {
    if (value === undefined || value.trim() === '') return defaultValue;
    return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

export function loadConfig(): ServerConfig {
    const isRemote = parseBoolean(process.env.REMOTE_MODE, false);

    return {
        // Server binding - use 0.0.0.0 for remote mode to accept external connections
        host: process.env.HOST || (isRemote ? '0.0.0.0' : 'localhost'),
        port: parseNumber(process.env.PORT, 3300),

        // WebSocket configuration (always localhost - extension connects locally)
        wsHost: 'localhost',
        wsPortStart: parseNumber(process.env.WS_PORT_START, 3301),
        wsPortEnd: parseNumber(process.env.WS_PORT_END, 3399),

        // Security - enabled by default in remote mode
        auth: {
            enabled: parseBoolean(process.env.AUTH_ENABLED, isRemote),
            tokens: parseStringArray(process.env.AUTH_TOKENS, []),
        },

        // TLS/HTTPS
        tls: {
            enabled: parseBoolean(process.env.TLS_ENABLED, false),
            cert: process.env.TLS_CERT_PATH,
            key: process.env.TLS_KEY_PATH,
        },

        // CORS - more permissive in remote mode
        cors: {
            enabled: parseBoolean(process.env.CORS_ENABLED, isRemote),
            origins: parseStringArray(process.env.CORS_ORIGINS, isRemote ? [] : ['*']),
            credentials: parseBoolean(process.env.CORS_CREDENTIALS, true),
        },

        // Rate limiting - enabled by default in remote mode
        rateLimit: {
            enabled: parseBoolean(process.env.RATE_LIMIT_ENABLED, isRemote),
            maxConnectionsPerIP: parseNumber(process.env.RATE_LIMIT_MAX_CONNECTIONS, 10),
            maxCallsPerMinute: parseNumber(process.env.RATE_LIMIT_MAX_CALLS, 100),
        },

        // Browser defaults
        browser: {
            headlessDefault: parseBoolean(process.env.HEADLESS_DEFAULT, isRemote),
            defaultMode: (process.env.BROWSER_DEFAULT_MODE as 'chrome' | 'testing' | 'chromium') || 'chromium',
        },

        // Logging
        logging: {
            level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
            auditEnabled: parseBoolean(process.env.AUDIT_LOG_ENABLED, isRemote),
        },
    };
}

// Singleton config instance
let configInstance: ServerConfig | null = null;

export function getConfig(): ServerConfig {
    if (!configInstance) {
        configInstance = loadConfig();
    }
    return configInstance;
}

export function resetConfig(): void {
    configInstance = null;
}

/**
 * Validates configuration and returns warnings/errors
 */
export function validateConfig(config: ServerConfig): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check TLS configuration
    if (config.tls.enabled) {
        if (!config.tls.cert || !config.tls.key) {
            errors.push('TLS enabled but cert/key paths not provided (TLS_CERT_PATH, TLS_KEY_PATH)');
        }
    }

    // Warn about security in remote mode
    if (config.host === '0.0.0.0' || config.wsHost === '0.0.0.0') {
        if (!config.auth.enabled) {
            warnings.push('Server accepting external connections but authentication is disabled');
        }
        if (!config.tls.enabled) {
            warnings.push('Server accepting external connections over unencrypted HTTP/WS');
        }
        if (config.auth.enabled && config.auth.tokens.length === 0) {
            errors.push('Authentication enabled but no tokens configured (AUTH_TOKENS)');
        }
    }

    // Warn about empty CORS origins in remote mode
    if (config.cors.enabled && config.cors.origins.length === 0) {
        warnings.push('CORS enabled but no origins specified - all origins will be allowed');
    }

    return {
        valid: errors.length === 0,
        warnings,
        errors,
    };
}

/**
 * Prints configuration summary to console
 */
export function printConfigSummary(config: ServerConfig): void {
    const isRemote = config.host === '0.0.0.0' || config.wsHost === '0.0.0.0';

    console.error('[Config] Server Configuration:');
    console.error(`[Config]   Mode: ${isRemote ? 'REMOTE' : 'LOCAL'}`);
    console.error(`[Config]   HTTP: ${config.tls.enabled ? 'https' : 'http'}://${config.host}:${config.port}`);
    console.error(`[Config]   WebSocket: ${config.tls.enabled ? 'wss' : 'ws'}://${config.wsHost}:${config.wsPortStart}-${config.wsPortEnd}`);
    console.error(`[Config]   Auth: ${config.auth.enabled ? 'ENABLED' : 'disabled'} (tokens: ${config.auth.tokens.length})`);
    console.error(`[Config]   TLS: ${config.tls.enabled ? 'ENABLED' : 'disabled'}`);
    console.error(`[Config]   CORS: ${config.cors.enabled ? 'ENABLED' : 'disabled'}`);
    console.error(`[Config]   Rate Limit: ${config.rateLimit.enabled ? 'ENABLED' : 'disabled'} (max: ${config.rateLimit.maxCallsPerMinute}/min)`);
    console.error(`[Config]   Headless Default: ${config.browser.headlessDefault}`);

    const validation = validateConfig(config);
    if (validation.warnings.length > 0) {
        validation.warnings.forEach(w => console.error(`[Config] ⚠️  WARNING: ${w}`));
    }
    if (validation.errors.length > 0) {
        validation.errors.forEach(e => console.error(`[Config] ❌ ERROR: ${e}`));
    }
}
