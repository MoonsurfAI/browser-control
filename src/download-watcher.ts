import { watch } from 'fs';
import { readdir, mkdir, stat } from 'fs/promises';
import { EventEmitter } from 'events';
import { join, basename, extname } from 'path';
import { createHash } from 'crypto';
import { homedir } from 'os';
import type { FSWatcher } from 'fs';
import type { TrackedDownload, DownloadState } from './types.js';

const TEMP_EXTENSIONS = ['.crdownload', '.part', '.download', '.tmp'];
const POLL_INTERVAL = 500;

export function getSystemDownloadDir(): string {
    const home = homedir();
    const platform = process.platform;

    if (platform === 'linux' && process.env.XDG_DOWNLOAD_DIR) {
        return process.env.XDG_DOWNLOAD_DIR;
    }

    return join(home, 'Downloads');
}

interface PendingWait {
    resolve: (download: TrackedDownload) => void;
    reject: (error: Error) => void;
    timeoutId: NodeJS.Timeout;
}

interface WatchedDirectory {
    watcher: FSWatcher;
    pollInterval: NodeJS.Timeout;
    scanInterval: NodeJS.Timeout;
    dirPath: string;
    existingFiles: Set<string>;
    instanceId: string;
}

interface PendingCompletion {
    instanceId: string;
    dirPath: string;
    tempFilename: string;
    downloadId: string;
    timeoutId: NodeJS.Timeout;
}

class DownloadWatcher extends EventEmitter {
    private watchers = new Map<string, WatchedDirectory>();
    private downloads = new Map<string, TrackedDownload>();
    private pendingWaits = new Map<string, PendingWait>();
    private pendingCompletions = new Map<string, PendingCompletion>();
    private instanceDownloads = new Map<string, Set<string>>();

    async watchDirectory(instanceId: string, dirPath: string): Promise<void> {
        if (this.watchers.has(instanceId)) {
            console.error(`[DownloadWatcher] Already watching directory for instance ${instanceId}`);
            return;
        }

        await mkdir(dirPath, { recursive: true });

        const existingFiles = new Set<string>();
        try {
            const files = await readdir(dirPath);
            files.forEach(f => existingFiles.add(f));
        } catch {
            // Directory might be empty or not exist yet
        }

        const watcher = watch(dirPath, (eventType, filename) => {
            if (!filename) return;

            if (eventType === 'rename') {
                this.handleFileEvent(instanceId, dirPath, filename, existingFiles);
            }
        });

        const pollInterval = setInterval(() => {
            this.pollProgress(instanceId, dirPath);
        }, POLL_INTERVAL);

        // Scan for new files every 2 seconds (catches files fs.watch might miss)
        const scanInterval = setInterval(() => {
            this.scanForNewFiles(instanceId);
        }, 2000);

        this.watchers.set(instanceId, {
            watcher,
            pollInterval,
            scanInterval,
            dirPath,
            existingFiles,
            instanceId,
        });
        this.instanceDownloads.set(instanceId, new Set());

        console.error(`[DownloadWatcher] Watching directory: ${dirPath} for instance ${instanceId}`);
    }

    private async handleFileEvent(
        instanceId: string,
        dirPath: string,
        filename: string,
        existingFiles: Set<string>
    ): Promise<void> {
        const filepath = join(dirPath, filename);

        try {
            const stats = await stat(filepath).catch(() => null);

            if (stats) {
                // File exists (created or modified)
                if (!existingFiles.has(filename)) {
                    existingFiles.add(filename);

                    if (this.isTempFile(filename)) {
                        this.trackNewDownload(instanceId, dirPath, filename);
                    } else {
                        // New non-temp file appeared
                        const tempFilename = this.findTempFilename(filename, existingFiles);
                        if (tempFilename) {
                            this.completeDownload(instanceId, dirPath, tempFilename, filename);
                            existingFiles.delete(tempFilename);
                        } else if (!this.matchPendingCompletion(instanceId, dirPath, filename)) {
                            // No temp file or pending completion - track as instant download
                            this.trackInstantDownload(instanceId, dirPath, filename);
                        }
                    }
                }
            } else {
                // File was deleted
                if (existingFiles.has(filename)) {
                    existingFiles.delete(filename);

                    if (this.isTempFile(filename)) {
                        const newFilename = this.getFinalFilename(filename);
                        if (!existingFiles.has(newFilename)) {
                            // Don't immediately error - add to pending completions
                            this.addPendingCompletion(instanceId, dirPath, filename);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`[DownloadWatcher] Error handling file event for ${filename}:`, error);
        }
    }

    private addPendingCompletion(instanceId: string, dirPath: string, tempFilename: string): void {
        const tempPath = join(dirPath, tempFilename);
        const id = this.generateId(tempPath);
        const download = this.downloads.get(id);

        if (!download || download.state !== 'in_progress') {
            return;
        }

        // Set timeout to mark as error if no match found
        const timeoutId = setTimeout(() => {
            if (this.pendingCompletions.has(id)) {
                this.pendingCompletions.delete(id);
                this.errorDownload(instanceId, dirPath, tempFilename, 'Download interrupted');
            }
        }, 3000);

        this.pendingCompletions.set(id, {
            instanceId,
            dirPath,
            tempFilename,
            downloadId: id,
            timeoutId,
        });

        console.error(`[DownloadWatcher] Added pending completion for ${tempFilename}, waiting for final file...`);
    }

    private matchPendingCompletion(instanceId: string, dirPath: string, filename: string): boolean {
        // Find a pending completion for this instance
        for (const [id, pending] of this.pendingCompletions) {
            if (pending.instanceId === instanceId) {
                clearTimeout(pending.timeoutId);
                this.pendingCompletions.delete(id);
                this.completeDownloadById(id, dirPath, filename);
                console.error(`[DownloadWatcher] Matched pending completion to ${filename}`);
                return true;
            }
        }
        return false;
    }

    private async trackInstantDownload(instanceId: string, dirPath: string, filename: string): Promise<void> {
        const filepath = join(dirPath, filename);
        const id = this.generateId(filepath + Date.now());

        try {
            const stats = await stat(filepath);
            const download: TrackedDownload = {
                id,
                instanceId,
                filename,
                filepath,
                state: 'complete',
                bytesReceived: stats.size,
                totalBytes: stats.size,
                progress: 100,
                startTime: Date.now(),
                endTime: Date.now(),
            };

            this.downloads.set(id, download);
            this.instanceDownloads.get(instanceId)?.add(id);

            console.error(`[DownloadWatcher] Instant download detected: ${filename} (${stats.size} bytes)`);
            this.emit('download:complete', download);
        } catch (error) {
            console.error(`[DownloadWatcher] Failed to track instant download ${filename}:`, error);
        }
    }

    private async completeDownloadById(
        downloadId: string,
        dirPath: string,
        finalFilename: string
    ): Promise<void> {
        const download = this.downloads.get(downloadId);
        if (!download) return;

        const finalPath = join(dirPath, finalFilename);
        try {
            const stats = await stat(finalPath);
            download.state = 'complete';
            download.filename = finalFilename;
            download.filepath = finalPath;
            download.bytesReceived = stats.size;
            download.totalBytes = stats.size;
            download.progress = 100;
            download.endTime = Date.now();
            delete download.tempFilename;
        } catch {
            download.state = 'complete';
            download.endTime = Date.now();
        }

        console.error(`[DownloadWatcher] Download complete: ${finalFilename}`);
        this.emit('download:complete', download);

        // Resolve any pending waits
        const pending = this.pendingWaits.get(downloadId);
        if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingWaits.delete(downloadId);
            pending.resolve(download);
        }
    }

    private trackNewDownload(instanceId: string, dirPath: string, tempFilename: string): void {
        const filepath = join(dirPath, tempFilename);
        const id = this.generateId(filepath);
        const finalFilename = this.getFinalFilename(tempFilename);

        const download: TrackedDownload = {
            id,
            instanceId,
            filename: finalFilename,
            tempFilename,
            filepath: join(dirPath, finalFilename),
            state: 'in_progress',
            bytesReceived: 0,
            totalBytes: -1,
            progress: -1,
            startTime: Date.now(),
        };

        this.downloads.set(id, download);
        this.instanceDownloads.get(instanceId)?.add(id);

        console.error(`[DownloadWatcher] New download detected: ${finalFilename} (id: ${id})`);
        this.emit('download:started', download);
    }

    private async completeDownload(
        instanceId: string,
        dirPath: string,
        tempFilename: string,
        finalFilename: string
    ): Promise<void> {
        const tempPath = join(dirPath, tempFilename);
        const id = this.generateId(tempPath);

        let download = this.downloads.get(id);

        if (!download) {
            const finalPath = join(dirPath, finalFilename);
            const newId = this.generateId(finalPath + Date.now());

            try {
                const stats = await stat(finalPath);
                download = {
                    id: newId,
                    instanceId,
                    filename: finalFilename,
                    filepath: finalPath,
                    state: 'complete',
                    bytesReceived: stats.size,
                    totalBytes: stats.size,
                    progress: 100,
                    startTime: Date.now(),
                    endTime: Date.now(),
                };
                this.downloads.set(newId, download);
                this.instanceDownloads.get(instanceId)?.add(newId);
            } catch {
                return;
            }
        } else {
            const finalPath = join(dirPath, finalFilename);
            try {
                const stats = await stat(finalPath);
                download.state = 'complete';
                download.filename = finalFilename;
                download.filepath = finalPath;
                download.bytesReceived = stats.size;
                download.totalBytes = stats.size;
                download.progress = 100;
                download.endTime = Date.now();
                delete download.tempFilename;
            } catch {
                download.state = 'complete';
                download.endTime = Date.now();
            }
        }

        console.error(`[DownloadWatcher] Download complete: ${finalFilename}`);
        this.emit('download:complete', download);

        const pending = this.pendingWaits.get(download.id);
        if (pending) {
            clearTimeout(pending.timeoutId);
            this.pendingWaits.delete(download.id);
            pending.resolve(download);
        }
    }

    private errorDownload(
        instanceId: string,
        dirPath: string,
        tempFilename: string,
        errorMessage: string
    ): void {
        const tempPath = join(dirPath, tempFilename);
        const id = this.generateId(tempPath);

        const download = this.downloads.get(id);
        if (download) {
            download.state = 'error';
            download.error = errorMessage;
            download.endTime = Date.now();

            console.error(`[DownloadWatcher] Download error: ${download.filename} - ${errorMessage}`);
            this.emit('download:error', download);

            const pending = this.pendingWaits.get(id);
            if (pending) {
                clearTimeout(pending.timeoutId);
                this.pendingWaits.delete(id);
                pending.reject(new Error(errorMessage));
            }
        }
    }

    private async pollProgress(instanceId: string, dirPath: string): Promise<void> {
        const downloadIds = this.instanceDownloads.get(instanceId);
        if (!downloadIds) return;

        for (const id of downloadIds) {
            const download = this.downloads.get(id);
            if (!download || download.state !== 'in_progress' || !download.tempFilename) {
                continue;
            }

            const tempPath = join(dirPath, download.tempFilename);
            try {
                const stats = await stat(tempPath);
                const newSize = stats.size;

                if (newSize !== download.bytesReceived) {
                    download.bytesReceived = newSize;
                    if (download.totalBytes > 0) {
                        download.progress = Math.round((newSize / download.totalBytes) * 100);
                    }
                    this.emit('download:progress', download);
                }
            } catch {
                // File might have been renamed or deleted
            }
        }
    }

    private async scanForNewFiles(instanceId: string): Promise<void> {
        const watched = this.watchers.get(instanceId);
        if (!watched) return;

        const { dirPath, existingFiles } = watched;

        try {
            const currentFiles = await readdir(dirPath);

            for (const filename of currentFiles) {
                if (!existingFiles.has(filename) && !this.isTempFile(filename)) {
                    // New file detected that fs.watch might have missed
                    existingFiles.add(filename);

                    // Check if this file matches a pending completion
                    if (!this.matchPendingCompletion(instanceId, dirPath, filename)) {
                        // Track as instant download
                        await this.trackInstantDownload(instanceId, dirPath, filename);
                    }
                }
            }
        } catch {
            // Directory might not exist or be inaccessible
        }
    }

    private isTempFile(filename: string): boolean {
        const ext = extname(filename).toLowerCase();
        return TEMP_EXTENSIONS.includes(ext);
    }

    private getFinalFilename(tempFilename: string): string {
        for (const ext of TEMP_EXTENSIONS) {
            if (tempFilename.toLowerCase().endsWith(ext)) {
                return tempFilename.slice(0, -ext.length);
            }
        }
        return tempFilename;
    }

    private findTempFilename(finalFilename: string, existingFiles: Set<string>): string | null {
        for (const ext of TEMP_EXTENSIONS) {
            const tempName = finalFilename + ext;
            if (existingFiles.has(tempName)) {
                return tempName;
            }
        }
        return null;
    }

    private generateId(filepath: string): string {
        return createHash('md5').update(filepath).digest('hex').slice(0, 12);
    }

    stopWatching(instanceId: string): void {
        const watched = this.watchers.get(instanceId);
        if (watched) {
            watched.watcher.close();
            clearInterval(watched.pollInterval);
            clearInterval(watched.scanInterval);
            this.watchers.delete(instanceId);
        }

        // Clean up pending completions for this instance
        for (const [id, pending] of this.pendingCompletions) {
            if (pending.instanceId === instanceId) {
                clearTimeout(pending.timeoutId);
                this.pendingCompletions.delete(id);
            }
        }

        const downloadIds = this.instanceDownloads.get(instanceId);
        if (downloadIds) {
            for (const id of downloadIds) {
                this.downloads.delete(id);
                const pending = this.pendingWaits.get(id);
                if (pending) {
                    clearTimeout(pending.timeoutId);
                    pending.reject(new Error('Browser instance closed'));
                    this.pendingWaits.delete(id);
                }
            }
            this.instanceDownloads.delete(instanceId);
        }

        console.error(`[DownloadWatcher] Stopped watching for instance ${instanceId}`);
    }

    getDownloads(instanceId?: string): TrackedDownload[] {
        if (instanceId) {
            const downloadIds = this.instanceDownloads.get(instanceId);
            if (!downloadIds) return [];

            return Array.from(downloadIds)
                .map(id => this.downloads.get(id))
                .filter((d): d is TrackedDownload => d !== undefined)
                .sort((a, b) => b.startTime - a.startTime);
        }

        return Array.from(this.downloads.values())
            .sort((a, b) => b.startTime - a.startTime);
    }

    getDownload(downloadId: string): TrackedDownload | undefined {
        return this.downloads.get(downloadId);
    }

    waitForDownload(downloadId: string, timeout: number = 300000): Promise<TrackedDownload> {
        return new Promise((resolve, reject) => {
            const download = this.downloads.get(downloadId);

            if (!download) {
                reject(new Error(`Download not found: ${downloadId}`));
                return;
            }

            if (download.state === 'complete') {
                resolve(download);
                return;
            }

            if (download.state === 'error') {
                reject(new Error(download.error || 'Download failed'));
                return;
            }

            const timeoutId = setTimeout(() => {
                this.pendingWaits.delete(downloadId);
                reject(new Error(`Download timeout after ${timeout}ms`));
            }, timeout);

            this.pendingWaits.set(downloadId, { resolve, reject, timeoutId });
        });
    }

    updateDownloadMetadata(
        instanceId: string,
        url: string,
        totalBytes: number,
        suggestedFilename?: string
    ): void {
        const downloadIds = this.instanceDownloads.get(instanceId);
        if (!downloadIds) return;

        for (const id of downloadIds) {
            const download = this.downloads.get(id);
            if (download && download.state === 'in_progress' && !download.url) {
                download.url = url;
                if (totalBytes > 0) {
                    download.totalBytes = totalBytes;
                    if (download.bytesReceived > 0) {
                        download.progress = Math.round((download.bytesReceived / totalBytes) * 100);
                    }
                }
                console.error(`[DownloadWatcher] Updated metadata for ${download.filename}: url=${url}, totalBytes=${totalBytes}`);
                break;
            }
        }
    }

    getDownloadDirectory(instanceId: string): string | undefined {
        const watched = this.watchers.get(instanceId);
        if (!watched) return undefined;

        const downloadIds = this.instanceDownloads.get(instanceId);
        if (!downloadIds || downloadIds.size === 0) return undefined;

        const firstId = Array.from(downloadIds)[0];
        const download = this.downloads.get(firstId);
        if (download) {
            return join(download.filepath, '..');
        }
        return undefined;
    }
}

export const downloadWatcher = new DownloadWatcher();
