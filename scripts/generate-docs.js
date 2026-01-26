#!/usr/bin/env node

/**
 * Documentation Generator
 * Converts markdown files to static HTML for GitHub Pages
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, cpSync } from 'fs';
import { join, dirname, relative, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = join(__dirname, '..');
const MARKDOWN_DIR = join(ROOT_DIR, 'docs', 'markdown');
const OUTPUT_DIR = join(ROOT_DIR, 'docs', 'html');
const ASSETS_DIR = join(ROOT_DIR, 'docs', 'assets');

// Read package.json for version
const packageJson = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'));
const PROJECT_VERSION = packageJson.version;
const GENERATION_DATE = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// Configure marked for syntax highlighting placeholders
marked.setOptions({
  gfm: true,
  breaks: false,
});

// Custom renderer for code blocks with language class
const renderer = new marked.Renderer();
renderer.code = function ({ text, lang }) {
  const language = lang || 'plaintext';
  const escaped = escapeHtml(text);
  return `<pre><code class="language-${language}">${escaped}</code></pre>`;
};

renderer.table = function ({ header, rows }) {
  // Build header row
  let headerHtml = '<tr>';
  for (const cell of header) {
    const cellContent = marked.parseInline(cell.text);
    headerHtml += `<th>${cellContent}</th>`;
  }
  headerHtml += '</tr>';

  // Build body rows
  let bodyHtml = '';
  for (const row of rows) {
    bodyHtml += '<tr>';
    for (const cell of row) {
      const cellContent = marked.parseInline(cell.text);
      bodyHtml += `<td>${cellContent}</td>`;
    }
    bodyHtml += '</tr>';
  }
  return `<div class="table-wrapper"><table><thead>${headerHtml}</thead><tbody>${bodyHtml}</tbody></table></div>`;
};

marked.setOptions({ renderer });

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Recursively get all markdown files
 */
function getMarkdownFiles(dir, files = []) {
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      getMarkdownFiles(fullPath, files);
    } else if (extname(item) === '.md') {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Build navigation structure from markdown files
 */
function buildNavigation(files) {
  const nav = {};

  for (const file of files) {
    const rel = relative(MARKDOWN_DIR, file);
    const parts = rel.split('/');

    if (parts.length === 1) {
      // Root level file
      nav['_root'] = nav['_root'] || [];
      nav['_root'].push({
        name: getTitle(file),
        path: rel.replace('.md', '.html'),
        file: rel,
      });
    } else {
      // Nested file
      const section = parts[0];
      nav[section] = nav[section] || [];
      nav[section].push({
        name: getTitle(file),
        path: rel.replace('.md', '.html'),
        file: rel,
        isIndex: parts[1] === 'README.md',
      });
    }
  }

  // Sort sections and files
  for (const section of Object.keys(nav)) {
    nav[section].sort((a, b) => {
      // README/index files first
      if (a.isIndex) return -1;
      if (b.isIndex) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  return nav;
}

/**
 * Extract title from markdown file
 */
function getTitle(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1];
  }
  return basename(filePath, '.md');
}

/**
 * Format section name for display
 */
function formatSectionName(name) {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get Lucide icon name for a section
 */
function getSectionIcon(section) {
  const icons = {
    'getting-started': 'rocket',
    'concepts': 'lightbulb',
    'tools': 'wrench',
    'configuration': 'settings',
    'guides': 'book-open',
    'integration': 'plug',
    'api-reference': 'code',
    'tasks': 'list-checks',
    'development': 'terminal',
  };
  return icons[section] || 'file-text';
}

/**
 * Generate sidebar HTML
 */
function generateSidebar(nav, currentPath) {
  // Calculate prefix based on current path depth
  const depth = currentPath.split('/').length - 1;
  const prefix = depth > 0 ? '../'.repeat(depth) : '';

  let html = '<nav class="sidebar">\n';
  html += '  <div class="sidebar-header">\n';
  html += `    <a href="${prefix}index.html" class="logo">Moonsurf</a>\n`;
  html += '  </div>\n';
  html += '  <ul class="nav-list">\n';

  // Root files first (just README -> index.html)
  if (nav['_root']) {
    for (const item of nav['_root']) {
      const href = item.path === 'README.html' ? `${prefix}index.html` : `${prefix}${item.path}`;
      const isActive = currentPath === item.path || (currentPath === 'index.html' && item.path === 'README.html');
      html += `    <li><a href="${href}"${isActive ? ' class="active"' : ''}>${item.name}</a></li>\n`;
    }
  }

  // Section order
  const sectionOrder = [
    'getting-started',
    'concepts',
    'tools',
    'configuration',
    'guides',
    'integration',
    'api-reference',
    'tasks',
    'development',
  ];

  const sections = sectionOrder.filter(s => nav[s]);

  for (const section of sections) {
    const items = nav[section];
    const sectionName = formatSectionName(section);
    const sectionIcon = getSectionIcon(section);
    const isCurrentSection = currentPath.startsWith(section + '/');

    html += `    <li class="nav-section${isCurrentSection ? ' open' : ''}">\n`;
    html += `      <span class="section-title"><i data-lucide="${sectionIcon}"></i>${sectionName}</span>\n`;
    html += `      <ul class="section-items">\n`;

    for (const item of items) {
      const isActive = currentPath === item.path;
      const displayName = item.isIndex ? 'Overview' : item.name;
      html += `        <li><a href="${prefix}${item.path}"${isActive ? ' class="active"' : ''}>${displayName}</a></li>\n`;
    }

    html += `      </ul>\n`;
    html += `    </li>\n`;
  }

  html += '  </ul>\n';
  html += '  <div class="sidebar-footer">\n';
  html += `    <div class="version">v${PROJECT_VERSION}</div>\n`;
  html += `    <div class="generated">Generated ${GENERATION_DATE}</div>\n`;
  html += '  </div>\n';
  html += '</nav>\n';

  return html;
}

/**
 * Generate HTML page from markdown
 */
function generatePage(markdownPath, nav) {
  const relativePath = relative(MARKDOWN_DIR, markdownPath);
  const outputPath = relativePath.replace('.md', '.html');
  const content = readFileSync(markdownPath, 'utf-8');

  // Convert markdown to HTML
  const htmlContent = marked.parse(content);

  // Fix internal links (.md -> .html)
  const fixedContent = htmlContent
    .replace(/href="([^"]+)\.md"/g, 'href="$1.html"')
    .replace(/href="\.\.\/README\.html"/g, 'href="../index.html"')
    .replace(/href="README\.html"/g, 'href="index.html"');

  // Generate sidebar
  const sidebar = generateSidebar(nav, outputPath);

  // Get title
  const title = getTitle(markdownPath);

  // Calculate depth for asset paths
  const depth = relativePath.split('/').length - 1;
  const assetPrefix = depth > 0 ? '../'.repeat(depth) : './';

  // Generate full HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Moonsurf Documentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Poltawski+Nowy:wght@400;500;600;700&display=block" as="style">
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=block" as="style">
  <link rel="stylesheet" href="${assetPrefix}assets/styles.css">
</head>
<body>
  ${sidebar}
  <main class="content">
    <article>
      ${fixedContent}
    </article>
  </main>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script>
    // Initialize Lucide icons
    lucide.createIcons();

    // Initialize syntax highlighting
    hljs.highlightAll();

    // Toggle sections
    document.querySelectorAll('.section-title').forEach(title => {
      title.addEventListener('click', () => {
        title.parentElement.classList.toggle('open');
      });
    });
  </script>
</body>
</html>`;

  return { outputPath, html };
}

/**
 * Main build function
 */
function build() {
  console.log('Building documentation...\n');

  // Get all markdown files
  const files = getMarkdownFiles(MARKDOWN_DIR);
  console.log(`Found ${files.length} markdown files`);

  // Build navigation
  const nav = buildNavigation(files);

  // Create output directory
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Copy assets
  if (existsSync(ASSETS_DIR)) {
    const assetsOutput = join(OUTPUT_DIR, 'assets');
    mkdirSync(assetsOutput, { recursive: true });
    cpSync(ASSETS_DIR, assetsOutput, { recursive: true });
    console.log('Copied assets');
  }

  // Generate HTML for each file
  let generated = 0;
  for (const file of files) {
    const { outputPath, html } = generatePage(file, nav);

    // Handle README.md -> index.html for root
    let finalPath = outputPath;
    if (outputPath === 'README.html') {
      finalPath = 'index.html';
    }

    const fullOutputPath = join(OUTPUT_DIR, finalPath);
    mkdirSync(dirname(fullOutputPath), { recursive: true });
    writeFileSync(fullOutputPath, html);
    generated++;
  }

  console.log(`Generated ${generated} HTML files`);

  // Create .nojekyll for GitHub Pages
  writeFileSync(join(OUTPUT_DIR, '.nojekyll'), '');
  console.log('Created .nojekyll for GitHub Pages');

  console.log(`\nOutput: ${OUTPUT_DIR}`);
}

// Run
build();
