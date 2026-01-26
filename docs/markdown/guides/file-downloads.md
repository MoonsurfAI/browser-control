# File Downloads Guide

Manage and track file downloads with Moonsurf's download monitoring capabilities.

## Overview

Moonsurf tracks file downloads using a file system watcher on the browser's download directory. This allows you to:

- Monitor download progress
- Get completed download paths
- Verify download success
- Handle different file types

## Checking Downloads

### List All Downloads

```
browser_navigate
  action: "downloads"
```

Returns:
```json
{
  "downloads": [
    {
      "filename": "report.pdf",
      "path": "/Users/me/Downloads/report.pdf",
      "size": 245678,
      "startedAt": "2024-01-15T10:30:00.000Z",
      "completedAt": "2024-01-15T10:30:05.000Z",
      "status": "completed"
    }
  ]
}
```

### Wait for Download

```
browser_navigate
  action: "downloads"
  waitForDownload: true
  timeout: 30000
```

This waits up to 30 seconds for a download to complete.

## Triggering Downloads

### Click Download Link

```
# Click a download link
browser_interact
  action: "click"
  selector: "a[download]"

# Wait for download to complete
browser_navigate
  action: "downloads"
  waitForDownload: true
```

### Click Download Button

```
# Many sites use buttons that trigger downloads
browser_interact
  action: "click"
  selector: "#export-button"

browser_navigate
  action: "downloads"
  waitForDownload: true
  timeout: 60000
```

### Download via Form Submission

```
# Fill export options
browser_interact action="select" selector="#format" value="csv"
browser_interact action="check" selector="#include-headers"

# Submit to trigger download
browser_interact action="click" selector="#download-report"

# Wait for file
browser_navigate
  action: "downloads"
  waitForDownload: true
```

## Download Types

### PDF Documents

```
# Click PDF download link
browser_interact action="click" selector="a.pdf-download"

# Wait for PDF
browser_navigate
  action: "downloads"
  waitForDownload: true
  timeout: 30000
```

### Excel/CSV Exports

```
# Trigger export
browser_interact action="click" selector="#export-to-excel"

# Wait for file
browser_navigate
  action: "downloads"
  waitForDownload: true
```

### Images

```
# Right-click and download (or use direct link)
browser_interact
  action: "click"
  selector: "a[href$='.jpg']"

browser_navigate
  action: "downloads"
  waitForDownload: true
```

### Large Files

For large files, use longer timeouts:

```
browser_interact action="click" selector="#download-backup"

browser_navigate
  action: "downloads"
  waitForDownload: true
  timeout: 300000  # 5 minutes
```

## Verifying Downloads

### Check File Exists

```
# Get download info
const downloads = browser_navigate
  action: "downloads"

# Verify the file
browser_execute
  action: "evaluate"
  script: |
    // File info is returned in the downloads response
    return true;
```

### Verify File Size

```
browser_navigate action="downloads"

# Check that file size is reasonable
# The downloads response includes size information
```

### Check File Type

```
const downloads = browser_navigate action="downloads"

# Verify filename extension matches expected type
# downloads[0].filename should end with expected extension
```

## Multiple Downloads

### Sequential Downloads

```
# Download first file
browser_interact action="click" selector="#file-1"
browser_navigate action="downloads" waitForDownload=true

# Download second file
browser_interact action="click" selector="#file-2"
browser_navigate action="downloads" waitForDownload=true

# Download third file
browser_interact action="click" selector="#file-3"
browser_navigate action="downloads" waitForDownload=true
```

### Batch Download

```
# Click "Download All" or similar
browser_interact action="click" selector="#download-all"

# May trigger multiple downloads
# Wait and check downloads list
browser_execute
  action: "evaluate"
  script: "await new Promise(r => setTimeout(r, 10000))"

browser_navigate action="downloads"
```

## Download Progress

Downloads include status information:

```json
{
  "downloads": [
    {
      "filename": "large-file.zip",
      "status": "in_progress",
      "size": null,
      "startedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

Possible statuses:
- `in_progress` - Download is ongoing
- `completed` - Download finished successfully
- `failed` - Download failed

## Handling Download Dialogs

### Automatic Downloads

Most downloads proceed automatically. For sites that show a confirmation dialog:

```
# Click download
browser_interact action="click" selector="#download"

# Handle any confirmation dialog
browser_interact action="click" selector=".confirm-download"

browser_navigate action="downloads" waitForDownload=true
```

### Save As Dialog

Browser save dialogs are typically not needed as downloads go to the default location automatically.

## Download Directory

By default, downloads go to the browser's default download location:

- **macOS**: `~/Downloads`
- **Linux**: `~/Downloads`
- **Windows**: `%USERPROFILE%\Downloads`

The exact path is returned in the download info.

## Common Download Scenarios

### Export Report from Web App

```
# Navigate to reports section
browser_navigate action="goto" url="https://app.example.com/reports"

# Configure report
browser_interact action="select" selector="#date-range" value="last-month"
browser_interact action="select" selector="#format" value="pdf"

# Generate report (may take time)
browser_interact action="click" selector="#generate-report"

# Wait for generation
browser_execute
  action: "evaluate"
  script: |
    await new Promise(resolve => {
      const check = () => {
        const btn = document.querySelector('#download-report:not([disabled])');
        if (btn) resolve();
        else setTimeout(check, 1000);
      };
      check();
    });

# Download the generated report
browser_interact action="click" selector="#download-report"

browser_navigate action="downloads" waitForDownload=true timeout=60000
```

### Download from Email/Document Service

```
# Navigate to shared file
browser_navigate
  action: "goto"
  url: "https://drive.example.com/file/abc123"

# Click download
browser_interact action="click" selector="[aria-label='Download']"

# Wait for file
browser_navigate action="downloads" waitForDownload=true
```

### Download Bank Statement

```
# Navigate to statements
browser_navigate action="goto" url="https://bank.example.com/statements"

# Select month
browser_interact action="click" selector="[data-month='2024-01']"

# Click download
browser_interact action="click" selector="#download-statement"

# Wait (bank sites can be slow)
browser_navigate action="downloads" waitForDownload=true timeout=60000
```

## Error Handling

### Download Failed

```
const result = browser_navigate action="downloads" waitForDownload=true

# Check status
# If result shows failed status, take screenshot and report error
if (result.downloads[0]?.status === 'failed') {
  browser_content action="screenshot" fullPage=true
  // Report error
}
```

### Download Timeout

```
try {
  browser_navigate action="downloads" waitForDownload=true timeout=30000
} catch (error) {
  // Download didn't complete in time
  // Check current download status
  browser_navigate action="downloads"

  // Screenshot for debugging
  browser_content action="screenshot"
}
```

### Network Error During Download

If download fails due to network issues:

```
# Retry the download
browser_interact action="click" selector="#download-link"
browser_navigate action="downloads" waitForDownload=true
```

## Best Practices

### 1. Always Wait for Downloads

Don't assume downloads complete instantly:

```
browser_interact action="click" selector="#download"
browser_navigate action="downloads" waitForDownload=true
```

### 2. Use Appropriate Timeouts

Small files:
```
browser_navigate action="downloads" waitForDownload=true timeout=10000
```

Large files:
```
browser_navigate action="downloads" waitForDownload=true timeout=300000
```

### 3. Verify Download Success

```
const downloads = browser_navigate action="downloads"
const latest = downloads.downloads[0]

if (latest.status !== 'completed') {
  // Handle failure
}
```

### 4. Handle Slow Sites

```
# Wait for download button to be ready
browser_execute
  action: "evaluate"
  script: |
    await new Promise(resolve => {
      const check = () => {
        const btn = document.querySelector('#download');
        if (btn && !btn.disabled) resolve();
        else setTimeout(check, 500);
      };
      check();
    });

# Then click
browser_interact action="click" selector="#download"
```

### 5. Clean Up Downloads

Be aware of accumulated downloads if running many automations.

## Troubleshooting

### Download Doesn't Start

1. Check if there's a popup blocker
2. Look for confirmation dialogs
3. Verify the download link is correct
4. Check network tab for errors

### Download Appears Empty

1. Wait longer - file may still be downloading
2. Check file size in downloads response
3. Verify the server is sending content

### Wrong File Downloaded

1. Verify you clicked the correct element
2. Check for multiple download links
3. Look at the filename in downloads response

### Download Location Unknown

The downloads response includes the full path:

```json
{
  "downloads": [{
    "path": "/Users/me/Downloads/report.pdf"
  }]
}
```

## Related

- [browser_navigate](../tools/browser-navigate.md) - Navigation and downloads tool
- [browser_interact](../tools/browser-interact.md) - Clicking download links
- [Network Interception](network-interception.md) - Monitor download requests
