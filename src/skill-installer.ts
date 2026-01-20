/**
 * Skill Installer
 *
 * Copies the bundled Moonsurf browser skill to the user's Claude skills directory.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function installSkill(): void {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
        console.error('[Skill Installer] Error: Could not determine home directory');
        process.exit(1);
    }

    const targetDir = path.join(homeDir, '.claude', 'skills', 'moonsurf-browser');

    // Source is relative to the compiled dist directory
    // In npm package: dist/skill-installer.js -> skills/moonsurf-browser/
    const sourceDir = path.resolve(__dirname, '..', 'skills', 'moonsurf-browser');

    console.error('[Skill Installer] Installing Moonsurf browser skill...');
    console.error(`[Skill Installer] Source: ${sourceDir}`);
    console.error(`[Skill Installer] Target: ${targetDir}`);

    // Check if source exists
    if (!fs.existsSync(sourceDir)) {
        console.error('[Skill Installer] Error: Skill files not found in package');
        console.error('[Skill Installer] Expected location:', sourceDir);
        process.exit(1);
    }

    // Create target directory
    try {
        fs.mkdirSync(targetDir, { recursive: true });
    } catch (error) {
        console.error('[Skill Installer] Error creating target directory:', error);
        process.exit(1);
    }

    // Copy skill files
    const files = ['SKILL.md', 'REFERENCE.md'];
    let copied = 0;

    for (const file of files) {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);

        if (fs.existsSync(sourcePath)) {
            try {
                fs.copyFileSync(sourcePath, targetPath);
                console.error(`[Skill Installer] Copied: ${file}`);
                copied++;
            } catch (error) {
                console.error(`[Skill Installer] Error copying ${file}:`, error);
            }
        } else {
            console.error(`[Skill Installer] Warning: ${file} not found in source`);
        }
    }

    if (copied > 0) {
        console.error('');
        console.error('[Skill Installer] Installation complete!');
        console.error('');
        console.error('The Moonsurf browser skill is now available in Claude Code.');
        console.error('Claude will automatically use it when you ask to automate browsers.');
        console.error('');
        console.error(`Installed to: ${targetDir}`);
    } else {
        console.error('[Skill Installer] Error: No files were copied');
        process.exit(1);
    }
}

export function uninstallSkill(): void {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
        console.error('[Skill Installer] Error: Could not determine home directory');
        process.exit(1);
    }

    const targetDir = path.join(homeDir, '.claude', 'skills', 'moonsurf-browser');

    if (!fs.existsSync(targetDir)) {
        console.error('[Skill Installer] Skill not installed');
        return;
    }

    try {
        fs.rmSync(targetDir, { recursive: true });
        console.error('[Skill Installer] Moonsurf browser skill uninstalled');
        console.error(`[Skill Installer] Removed: ${targetDir}`);
    } catch (error) {
        console.error('[Skill Installer] Error uninstalling skill:', error);
        process.exit(1);
    }
}

export function showSkillStatus(): void {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (!homeDir) {
        console.error('[Skill Installer] Error: Could not determine home directory');
        process.exit(1);
    }

    const targetDir = path.join(homeDir, '.claude', 'skills', 'moonsurf-browser');
    const skillFile = path.join(targetDir, 'SKILL.md');

    if (fs.existsSync(skillFile)) {
        console.error('[Skill Status] Moonsurf browser skill is installed');
        console.error(`[Skill Status] Location: ${targetDir}`);

        // Show file info
        const files = fs.readdirSync(targetDir);
        console.error(`[Skill Status] Files: ${files.join(', ')}`);
    } else {
        console.error('[Skill Status] Moonsurf browser skill is NOT installed');
        console.error('');
        console.error('To install, run:');
        console.error('  npx @moonsurf/browser-control --install-skill');
    }
}
