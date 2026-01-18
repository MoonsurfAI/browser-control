import { spawn, ChildProcess } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { dirname, resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { instanceManager } from './instance-manager.js';
import { downloadWatcher, getSystemDownloadDir } from './download-watcher.js';
import type { BrowserInstance } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type BrowserMode = 'chrome' | 'testing' | 'chromium';

interface LaunchOptions {
    url?: string;
    headless?: boolean;
    profile?: string;
    mode?: BrowserMode;
    extensions?: string[];
}

interface ProfileInfo {
    directory: string;
    name: string;
}

type BrowserType = 'Chrome' | 'Chrome Canary' | 'Chromium' | 'Chrome for Testing';

interface LaunchedInstance {
    id: string;
    port: number;
    process: ChildProcess;
    userDataDir: string;
    browserType: BrowserType;
    profile?: string;
}

// Launch result can be either a successful launch or a profile selection request
interface LaunchSuccess {
    type: 'launched';
    id: string;
    port: number;
    warning?: string;
    browserType: BrowserType;
    profile?: string;
}

interface ProfileSelectionRequired {
    type: 'profile_selection_required';
    profiles: ProfileInfo[];
    message: string;
}

type LaunchResult = LaunchSuccess | ProfileSelectionRequired;

class BrowserLauncher {
    private instances = new Map<string, LaunchedInstance>();
    private extensionPath: string;

    constructor() {
        // Extension path relative to mcp-server directory
        this.extensionPath = resolve(__dirname, '../../chrome-extension/dist');
    }

    private findChromeForTesting(): string | null {
        const platform = process.platform;
        const possiblePaths: string[] = [];

        if (platform === 'darwin') {
            const tmpDir = '/tmp/chrome-for-testing/chrome';
            if (existsSync(tmpDir)) {
                const versions = readdirSync(tmpDir).filter(f => f.startsWith('mac'));
                for (const version of versions) {
                    possiblePaths.push(join(tmpDir, version, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'));
                    possiblePaths.push(join(tmpDir, version, 'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'));
                }
            }
            const homeDir = homedir();
            const puppeteerCache = join(homeDir, '.cache', 'puppeteer', 'chrome');
            if (existsSync(puppeteerCache)) {
                const versions = readdirSync(puppeteerCache).filter(f => f.startsWith('mac'));
                for (const version of versions) {
                    possiblePaths.push(join(puppeteerCache, version, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'));
                    possiblePaths.push(join(puppeteerCache, version, 'chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'));
                }
            }
            possiblePaths.push('/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
        } else if (platform === 'linux') {
            possiblePaths.push('/opt/chrome-for-testing/chrome');
            const homeDir = homedir();
            const puppeteerCache = join(homeDir, '.cache', 'puppeteer', 'chrome');
            if (existsSync(puppeteerCache)) {
                const versions = readdirSync(puppeteerCache).filter(f => f.startsWith('linux'));
                for (const version of versions) {
                    possiblePaths.push(join(puppeteerCache, version, 'chrome-linux64/chrome'));
                }
            }
        } else if (platform === 'win32') {
            possiblePaths.push('C:\\Program Files\\Google\\Chrome for Testing\\Application\\chrome.exe');
        }

        for (const path of possiblePaths) {
            if (existsSync(path)) {
                return path;
            }
        }
        return null;
    }

    private findRegularChrome(): { path: string; type: BrowserType } | null {
        const platform = process.platform;

        const chromePaths: { path: string; type: BrowserType }[] = [];

        if (platform === 'darwin') {
            chromePaths.push(
                { path: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', type: 'Chrome' },
                { path: '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary', type: 'Chrome Canary' },
                { path: '/Applications/Chromium.app/Contents/MacOS/Chromium', type: 'Chromium' },
            );
        } else if (platform === 'linux') {
            chromePaths.push(
                { path: '/usr/bin/google-chrome', type: 'Chrome' },
                { path: '/usr/bin/google-chrome-stable', type: 'Chrome' },
                { path: '/usr/bin/chromium', type: 'Chromium' },
                { path: '/usr/bin/chromium-browser', type: 'Chromium' },
            );
        } else if (platform === 'win32') {
            chromePaths.push(
                { path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', type: 'Chrome' },
                { path: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', type: 'Chrome' },
            );
        }

        for (const { path, type } of chromePaths) {
            if (existsSync(path)) {
                return { path, type };
            }
        }
        return null;
    }

    private findChromium(): string | null {
        const platform = process.platform;
        const possiblePaths: string[] = [];

        if (platform === 'darwin') {
            possiblePaths.push('/Applications/Chromium.app/Contents/MacOS/Chromium');
        } else if (platform === 'linux') {
            possiblePaths.push(
                '/usr/bin/chromium',
                '/usr/bin/chromium-browser',
                '/snap/bin/chromium',
            );
        } else if (platform === 'win32') {
            possiblePaths.push(
                'C:\\Program Files\\Chromium\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe',
            );
        }

        for (const path of possiblePaths) {
            if (existsSync(path)) {
                return path;
            }
        }
        return null;
    }

    private getChromiumUserDataDir(): string {
        return join(homedir(), '.moonsurf');
    }

    private getChromeUserDataDir(): string {
        const platform = process.platform;
        const home = homedir();

        const userDataDirs: Record<string, string> = {
            darwin: join(home, 'Library', 'Application Support', 'Google', 'Chrome'),
            linux: join(home, '.config', 'google-chrome'),
            win32: join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data'),
        };

        const dir = userDataDirs[platform];
        if (!dir || !existsSync(dir)) {
            throw new Error(`Chrome user data directory not found for platform: ${platform}`);
        }

        return dir;
    }

    listProfiles(): ProfileInfo[] {
        try {
            const userDataDir = this.getChromeUserDataDir();
            const localStatePath = join(userDataDir, 'Local State');

            if (!existsSync(localStatePath)) {
                return [];
            }

            const localState = JSON.parse(readFileSync(localStatePath, 'utf-8'));
            const profileInfoCache = localState.profile?.info_cache || {};

            const profiles: ProfileInfo[] = [];
            for (const [directory, info] of Object.entries(profileInfoCache)) {
                const profileInfo = info as { name?: string };
                profiles.push({
                    directory,
                    name: profileInfo.name || directory,
                });
            }

            return profiles;
        } catch (error) {
            console.error('[BrowserLauncher] Error reading Chrome profiles:', error);
            return [];
        }
    }

    // Resolve profile by name or directory
    private resolveProfile(profileInput: string): ProfileInfo | null {
        const profiles = this.listProfiles();
        return profiles.find(p =>
            p.directory === profileInput ||
            p.name.toLowerCase() === profileInput.toLowerCase()
        ) || null;
    }

    async launch(options: LaunchOptions = {}): Promise<LaunchResult> {
        // Validate options
        if (options.profile && options.mode && options.mode !== 'chrome') {
            throw new Error('Profile option is only valid with chrome mode.');
        }
        if (options.headless && options.mode !== 'chromium') {
            throw new Error('Headless option is only valid with chromium mode.');
        }
        if (options.extensions && options.extensions.length > 0 && options.mode === 'chrome') {
            throw new Error('Extensions option is only valid with testing or chromium mode.');
        }

        // Determine effective mode
        let mode: BrowserMode = options.mode || 'chrome';

        // If profile specified, force chrome mode
        if (options.profile) {
            mode = 'chrome';
        }

        // If no mode specified and no profile, check available profiles for chrome mode
        if (!options.mode && !options.profile && mode === 'chrome') {
            const profiles = this.listProfiles();
            if (profiles.length > 1) {
                return {
                    type: 'profile_selection_required',
                    profiles,
                    message: 'Multiple Chrome profiles found. Please specify which profile to use, or use mode: "testing" or "chromium".',
                };
            } else if (profiles.length === 0) {
                // No profiles available, default to testing mode
                mode = 'testing';
            }
        }

        let chromePath: string;
        let browserType: BrowserType;
        let userDataDir: string;
        let resolvedProfile: ProfileInfo | undefined;
        let warning: string | undefined;
        let autoLoadExtension = false;

        switch (mode) {
            case 'chrome': {
                // Use Chrome with existing profile
                const result = this.findRegularChrome();
                if (!result) {
                    throw new Error('Chrome not found. Please install Google Chrome.');
                }
                chromePath = result.path;
                browserType = result.type;

                // Resolve profile
                if (options.profile) {
                    const matched = this.resolveProfile(options.profile);
                    if (!matched) {
                        const profiles = this.listProfiles();
                        throw new Error(`Profile "${options.profile}" not found. Available profiles: ${profiles.map(p => p.name).join(', ')}`);
                    }
                    resolvedProfile = matched;
                } else {
                    // Auto-select single profile
                    const profiles = this.listProfiles();
                    if (profiles.length === 1) {
                        resolvedProfile = profiles[0];
                        console.error(`[BrowserLauncher] Auto-selected single profile: ${resolvedProfile.name}`);
                    }
                }

                if (resolvedProfile) {
                    userDataDir = this.getChromeUserDataDir();
                    warning = `Using profile "${resolvedProfile.name}". Ensure extension is manually installed via chrome://extensions.`;
                } else {
                    throw new Error('No Chrome profile available. Use mode: "testing" or "chromium" instead.');
                }
                break;
            }

            case 'testing': {
                // Use Chrome for Testing with temporary profile
                const testingPath = this.findChromeForTesting();
                if (!testingPath) {
                    throw new Error('Chrome for Testing not found. Install with: npx @puppeteer/browsers install chrome@stable --path /tmp/chrome-for-testing');
                }
                chromePath = testingPath;
                browserType = 'Chrome for Testing';
                userDataDir = `/tmp/moonsurf-${Date.now()}`;
                autoLoadExtension = true;
                break;
            }

            case 'chromium': {
                // Use Chromium with persistent profile
                const chromiumPath = this.findChromium();
                if (!chromiumPath) {
                    throw new Error('Chromium not found. Please install Chromium.');
                }
                chromePath = chromiumPath;
                browserType = 'Chromium';
                userDataDir = this.getChromiumUserDataDir();
                autoLoadExtension = true;
                break;
            }
        }

        // Use system download directory
        const downloadDir = getSystemDownloadDir();

        // Capture existing instance IDs before launch
        const existingInstanceIds = new Set(
            instanceManager.getConnectedInstances().map(i => i.id)
        );

        const args: string[] = [];

        // Set user data directory
        args.push(`--user-data-dir=${userDataDir}`);

        // Set profile directory for Chrome mode
        if (resolvedProfile) {
            args.push(`--profile-directory=${resolvedProfile.directory}`);
        }

        // Auto-load extension for testing and chromium modes
        if (autoLoadExtension) {
            const additionalExtensions = (options.extensions || []).filter(ext => existsSync(ext));
            const allExtensions = [this.extensionPath, ...additionalExtensions];
            args.push(`--load-extension=${allExtensions.join(',')}`);
            args.push(`--disable-extensions-except=${allExtensions.join(',')}`);

            if (additionalExtensions.length > 0) {
                console.error(`[BrowserLauncher] Loading ${additionalExtensions.length} additional extension(s)`);
            }
        }

        args.push(
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-default-apps',
            '--disable-popup-blocking',
            '--disable-translate',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-device-discovery-notifications',
        );

        // Add Linux-specific flags for containerized environments
        if (process.platform === 'linux') {
            args.push(
                '--no-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
            );
        }

        // Headless only for chromium mode
        if (options.headless && mode === 'chromium') {
            args.push('--headless=new');
        }

        // Default to Google if no URL specified
        args.push(options.url || 'https://www.google.com');

        console.error(`[BrowserLauncher] Mode: ${mode}`);
        console.error(`[BrowserLauncher] Launching: ${chromePath}`);
        console.error(`[BrowserLauncher] Browser type: ${browserType}`);
        console.error(`[BrowserLauncher] Profile: ${resolvedProfile?.name || (mode === 'chromium' ? '(persistent)' : '(temporary)')}`);
        console.error(`[BrowserLauncher] User data dir: ${userDataDir}`);
        console.error(`[BrowserLauncher] Download dir: ${downloadDir}`);
        console.error(`[BrowserLauncher] Extension auto-load: ${autoLoadExtension ? 'Yes' : 'No (manual install required)'}`);
        console.error(`[BrowserLauncher] Headless: ${options.headless ? 'Yes' : 'No'}`);

        const chromeProcess = spawn(chromePath, args, {
            detached: false,
            stdio: 'ignore',
        });

        // Wait for a NEW connected instance (not in existingInstanceIds)
        console.error(`[BrowserLauncher] Waiting for extension to connect...`);

        let newInstance: BrowserInstance | null = null;
        const startTime = Date.now();
        const timeout = 30000;

        while (Date.now() - startTime < timeout) {
            // Check if process died
            if (chromeProcess.killed || chromeProcess.exitCode !== null) {
                throw new Error('Browser process exited before extension connected');
            }

            const connected = instanceManager.getConnectedInstances();
            for (const inst of connected) {
                if (!existingInstanceIds.has(inst.id)) {
                    newInstance = inst;
                    break;
                }
            }
            if (newInstance) break;
            await new Promise(r => setTimeout(r, 100)); // Poll every 100ms
        }

        if (!newInstance) {
            chromeProcess.kill('SIGTERM');
            throw new Error('Browser launched but extension failed to connect within 30 seconds');
        }

        console.error(`[BrowserLauncher] Extension connected: ${newInstance.id}, Port: ${newInstance.port}`);

        // Set up process event handlers with actual instance ID
        chromeProcess.on('error', (error) => {
            console.error(`[BrowserLauncher] Process error for ${newInstance!.id}:`, error);
            this.cleanup(newInstance!.id);
        });

        chromeProcess.on('exit', (code) => {
            console.error(`[BrowserLauncher] Process exited for ${newInstance!.id} with code ${code}`);
            this.cleanup(newInstance!.id);
        });

        // Start download directory watcher
        await downloadWatcher.watchDirectory(newInstance.id, downloadDir);

        // Store instance with actual ID from extension
        this.instances.set(newInstance.id, {
            id: newInstance.id,
            port: newInstance.port,
            process: chromeProcess,
            userDataDir,
            browserType,
            profile: resolvedProfile?.name,
        });

        return {
            type: 'launched',
            id: newInstance.id,
            port: newInstance.port,
            warning,
            browserType,
            profile: resolvedProfile?.name,
        };
    }

    async close(instanceId: string): Promise<boolean> {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            instanceManager.unregister(instanceId);
            return false;
        }

        console.error(`[BrowserLauncher] Closing instance: ${instanceId}`);

        if (instance.process && !instance.process.killed) {
            instance.process.kill('SIGTERM');

            setTimeout(() => {
                if (instance.process && !instance.process.killed) {
                    instance.process.kill('SIGKILL');
                }
            }, 5000);
        }

        this.cleanup(instanceId);
        return true;
    }

    private cleanup(instanceId: string): void {
        downloadWatcher.stopWatching(instanceId);
        this.instances.delete(instanceId);
        instanceManager.unregister(instanceId);
    }

    getInstances(): LaunchedInstance[] {
        return Array.from(this.instances.values());
    }

    getInstanceInfo(instanceId: string): { profile?: string; browserType: BrowserType } | null {
        const instance = this.instances.get(instanceId);
        if (!instance) {
            return null;
        }
        return {
            profile: instance.profile,
            browserType: instance.browserType,
        };
    }

    getDownloadDirectory(): string {
        return getSystemDownloadDir();
    }
}

export const browserLauncher = new BrowserLauncher();
