# Development

Documentation for contributing to and extending Moonsurf Browser Control.

## Overview

This section covers development workflows, architecture internals, and how to extend Moonsurf.

## Getting Started

### Prerequisites

- Node.js 18+
- Chrome or Chromium browser
- Git
- TypeScript knowledge

### Quick Start

```bash
# Clone the repository
git clone https://github.com/MoonsurfAI/browser-control
cd browser-control

# Install dependencies
npm install

# Build
npm run build

# Run
npm start
```

## Documentation Sections

### [Project Structure](project-structure.md)
Overview of the codebase organization and key files.

### [Local Setup](local-setup.md)
Complete local development environment setup.

### [Extension Development](extension-development.md)
Developing the Chrome extension alongside the server.

### [Adding Tools](adding-tools.md)
How to add new MCP tools to Moonsurf.

### [Testing](testing.md)
Running tests and writing new test cases.

### [Debugging](debugging.md)
Debug logging, troubleshooting, and diagnostics.

### [Release Process](release-process.md)
Versioning, changelog, and publishing releases.

### [Internals](internals.md)
Deep dive into Moonsurf's internal architecture.

## Development Workflow

### 1. Make Changes

```bash
# Start TypeScript compiler in watch mode
npm run dev

# In another terminal, run the server
npm start
```

### 2. Test Changes

```bash
# Run with debug logging
LOG_LEVEL=debug npm start

# Test with curl
curl http://localhost:3300/health
```

### 3. Build for Production

```bash
npm run build
```

### 4. Run Type Checks

```bash
npm run typecheck
```

## Code Style

- TypeScript strict mode enabled
- ES modules (import/export)
- Functional style where appropriate
- Clear error messages

## Directory Structure

```
browser-control/
├── src/                    # TypeScript source code
│   ├── index.ts           # CLI entry point
│   ├── config.ts          # Configuration management
│   ├── http-server.ts     # HTTP/SSE server
│   └── ...                # Other modules
├── dist/                   # Compiled JavaScript
├── docs/                   # Documentation
├── skills/                 # Claude skill files
└── package.json           # Package configuration
```

## Key Technologies

| Technology | Purpose |
|------------|---------|
| TypeScript | Type-safe JavaScript |
| Node.js | Server runtime |
| WebSocket | Extension communication |
| SSE | MCP client transport |
| Express-style routing | HTTP handling |

## Contributing Guidelines

### Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

### Code Review

- All changes require review
- Tests must pass
- TypeScript must compile cleanly
- Documentation updates required for new features

### Commit Messages

Use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test updates

## Getting Help

- Check existing documentation
- Search GitHub issues
- Open a new issue with details
- Join discussions

## Related

- [Project Structure](project-structure.md) - Start here for code navigation
- [Local Setup](local-setup.md) - Environment setup
- [Concepts](../concepts/README.md) - Architecture overview
