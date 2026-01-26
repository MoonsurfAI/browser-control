# Changelog

This changelog documents major version releases only.

## [2.0.0] - 2026-01-26

### Added

- **Task Execution System**: New feature for batched browser automation commands
  - WebSocket API (`ws://localhost:3400`) for real-time task submission and progress monitoring
  - REST API endpoints (`/tasks`) for task management
  - Sequential command execution with per-command progress reporting
  - Per-instance task queues with FIFO processing
  - Task cancellation support
  - Automatic cleanup of completed tasks

- **Task Configuration**: New environment variables
  - `TASKS_ENABLED` - Enable/disable task system (default: true)
  - `TASKS_WS_PORT` - WebSocket server port (default: 3400)
  - `TASKS_COMMAND_TIMEOUT` - Per-command timeout (default: 60000ms)
  - `TASKS_MAX_QUEUE_SIZE` - Maximum queue size per instance (default: 100)

- **Development Support**: `EXTENSION_PATH` environment variable for local Chrome extension development

- **Documentation**: Comprehensive task system documentation in `docs/tasks/`

### Changed

- Instance Manager now supports disconnect callbacks for external notification

## [1.0.0] - 2024-12-01

### Added

- **MCP Server**: Model Context Protocol server for AI-native browser automation
  - SSE endpoint for MCP client connections
  - Full MCP tools/call support

- **Browser Control Tools**:
  - `browser_instance` - Launch and manage browser instances
  - `browser_navigate` - Navigation, reload, back, forward, wait_for
  - `browser_interact` - Click, type, keyboard, scroll, select, hover
  - `browser_content` - Screenshot, get_text, get_html, get_viewport_dom
  - `browser_execute` - JavaScript evaluation in page context

- **Browser Support**:
  - Chrome and Chromium support
  - Headless and headed modes
  - Persistent user profiles
  - Download monitoring

- **Chrome Extension**: Browser-side extension for command execution
  - Automatic installation from GitHub releases
  - WebSocket communication with server

- **Multi-Instance Support**: Run multiple browser instances simultaneously
  - Dynamic WebSocket port allocation (3301-3399)
  - Independent instance management
