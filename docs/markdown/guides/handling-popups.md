# Handling Popups Guide

Deal with alerts, dialogs, authentication prompts, popup windows, and overlays in browser automation.

## Overview

Modern web applications use various types of popups:

1. **JavaScript Alerts** - `alert()`, `confirm()`, `prompt()`
2. **Modal Dialogs** - HTML/CSS overlays
3. **Popup Windows** - New browser windows
4. **Authentication Prompts** - HTTP Basic/NTLM auth
5. **Cookie Consent** - GDPR banners
6. **Notifications** - Browser permission requests

## JavaScript Alerts

### Alert Dialog

```
# Handle simple alert
browser_interact
  action: "dialog"
  dialogAction: "accept"
```

### Confirm Dialog

```
# Accept (click OK)
browser_interact
  action: "dialog"
  dialogAction: "accept"

# Or dismiss (click Cancel)
browser_interact
  action: "dialog"
  dialogAction: "dismiss"
```

### Prompt Dialog

```
# Enter text and accept
browser_interact
  action: "dialog"
  dialogAction: "accept"
  dialogText: "My response"

# Or dismiss without entering text
browser_interact
  action: "dialog"
  dialogAction: "dismiss"
```

### Pre-configure Dialog Handling

```
# Set up handler before triggering action
browser_interact
  action: "dialog"
  dialogAction: "accept"
  dialogText: "auto-response"

# Now click button that shows dialog
browser_interact action="click" selector="#show-prompt"
```

## Modal Dialogs (HTML/CSS)

### Close via X Button

```
browser_interact
  action: "click"
  selector: ".modal .close-button"
```

### Close via Overlay Click

```
browser_interact
  action: "click"
  selector: ".modal-overlay"
```

### Interact with Modal Content

```
# Wait for modal to appear
browser_interact
  action: "type"
  selector: ".modal input[name='email']"
  text: "user@example.com"
  waitForSelector: true

# Fill modal form
browser_interact action="type" selector=".modal #name" text="John Doe"

# Click modal action button
browser_interact action="click" selector=".modal .submit-btn"
```

### Dismiss Modal with Escape

```
browser_interact
  action: "press"
  key: "Escape"
```

### Wait for Modal to Close

```
browser_execute
  action: "evaluate"
  script: |
    await new Promise(resolve => {
      const check = () => {
        const modal = document.querySelector('.modal');
        if (!modal || modal.style.display === 'none') {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
```

## Cookie Consent Banners

### Common Patterns

```
# Accept cookies
browser_execute
  action: "evaluate"
  script: |
    const selectors = [
      '#accept-cookies',
      '.cookie-accept',
      '[data-action="accept-cookies"]',
      'button:contains("Accept")',
      '.consent-accept'
    ];

    for (const sel of selectors) {
      const btn = document.querySelector(sel);
      if (btn) {
        btn.click();
        return true;
      }
    }
    return false;
```

### Specific Consent Managers

**CookieBot:**
```
browser_interact action="click" selector="#CybotCookiebotDialogBodyButtonAccept"
```

**OneTrust:**
```
browser_interact action="click" selector="#onetrust-accept-btn-handler"
```

**TrustArc:**
```
browser_interact action="click" selector=".trustarc-agree-btn"
```

### Dismiss If Present

```
browser_execute
  action: "evaluate"
  script: |
    const banner = document.querySelector('.cookie-banner');
    if (banner) {
      const acceptBtn = banner.querySelector('button');
      if (acceptBtn) acceptBtn.click();
    }
```

## Popup Windows

### Wait for New Window

```
# Click link that opens popup
browser_interact action="click" selector="a[target='_blank']"

# List all tabs/windows
browser_tab action="list"
```

### Switch to Popup Window

```
# Get tab list
browser_tab action="list"
# Returns tabs with IDs

# Switch to new tab
browser_tab action="switch" tabId="<popup-tab-id>"
```

### Interact with Popup

```
# Switch to popup
browser_tab action="switch" tabId="<popup-id>"

# Do work in popup
browser_content action="extract" selector="body"

# Close popup
browser_tab action="close"

# Switch back to main window
browser_tab action="switch" tabId="<main-tab-id>"
```

### Handle window.open Popups

```
# Some sites use window.open
browser_interact action="click" selector="#open-popup"

# Wait for popup to load
browser_execute
  action: "evaluate"
  script: "await new Promise(r => setTimeout(r, 1000))"

# List tabs to find new one
browser_tab action="list"
```

## Authentication Dialogs

### HTTP Basic Auth

Pass credentials in URL:

```
browser_navigate
  action: "goto"
  url: "https://username:password@example.com/protected"
```

### Form-Based Auth Popups

```
# Wait for auth modal
browser_interact
  action: "type"
  selector: "#auth-modal input[name='username']"
  text: "myuser"
  waitForSelector: true

browser_interact action="type" selector="#auth-modal input[name='password']" text="mypass"
browser_interact action="click" selector="#auth-modal button[type='submit']"
```

### OAuth Popup Flow

```
# Click OAuth login button
browser_interact action="click" selector="#login-with-google"

# Wait for popup
browser_execute
  action: "evaluate"
  script: "await new Promise(r => setTimeout(r, 2000))"

# List tabs to find OAuth popup
browser_tab action="list"

# Switch to OAuth popup
browser_tab action="switch" tabId="<oauth-popup-id>"

# Complete OAuth flow in popup
browser_interact action="type" selector="#email" text="user@gmail.com"
browser_interact action="click" selector="#next"
# ... continue OAuth flow

# Popup may close automatically, switch back
browser_tab action="list"
browser_tab action="switch" tabId="<main-tab-id>"
```

## Browser Permission Dialogs

### Notification Permission

```
# Grant notification permission via Chrome flags or context
browser_execute
  action: "evaluate"
  script: |
    // Check current permission
    return Notification.permission;
```

### Geolocation Permission

Permissions are typically handled at browser launch or mocked:

```
browser_emulate
  action: "setGeolocation"
  latitude: 37.7749
  longitude: -122.4194
```

### Camera/Microphone

These require browser-level configuration, not page-level handling.

## Print Dialogs

### Cancel Print Dialog

```
# If print dialog appears, press Escape
browser_interact action="press" key="Escape"
```

### Handle Print Preview

Print preview opens as a new page:

```
# Cancel via keyboard
browser_interact action="press" key="Escape"
```

## Overlay Dismissal

### Loading Overlays

Wait for overlay to disappear:

```
browser_execute
  action: "evaluate"
  script: |
    await new Promise(resolve => {
      const check = () => {
        const overlay = document.querySelector('.loading-overlay');
        if (!overlay || getComputedStyle(overlay).display === 'none') {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
```

### Marketing Overlays

```
# Try common dismiss patterns
browser_execute
  action: "evaluate"
  script: |
    // Try close button
    const closeBtn = document.querySelector('.popup-close, .modal-close, [aria-label="Close"]');
    if (closeBtn) {
      closeBtn.click();
      return 'closed via button';
    }

    // Try clicking outside
    const overlay = document.querySelector('.overlay, .modal-backdrop');
    if (overlay) {
      overlay.click();
      return 'closed via overlay';
    }

    return 'no overlay found';
```

### Newsletter Signup Popups

```
browser_interact action="click" selector=".newsletter-popup .close"
# Or
browser_interact action="press" key="Escape"
```

## Iframe Dialogs

### Dialogs Inside Iframes

Some dialogs appear inside iframes:

```
# List frames
browser_tab action="list"

# If dialog is in iframe, you need to find the frame
browser_execute
  action: "evaluate"
  script: |
    const iframe = document.querySelector('iframe.dialog-frame');
    const doc = iframe?.contentDocument;
    const btn = doc?.querySelector('.close-dialog');
    if (btn) btn.click();
```

## Timing Considerations

### Wait for Dialog to Appear

```
browser_execute
  action: "evaluate"
  script: |
    await new Promise(resolve => {
      const check = () => {
        const dialog = document.querySelector('.dialog');
        if (dialog && getComputedStyle(dialog).display !== 'none') {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
```

### Wait for Dialog Animation

```
# Many dialogs have CSS transitions
browser_execute
  action: "evaluate"
  script: "await new Promise(r => setTimeout(r, 300))"

# Then interact
browser_interact action="click" selector=".dialog button"
```

## Common Popup Patterns

### Exit Intent Popups

These appear when cursor moves toward browser chrome:

```
# Wait for popup
browser_execute
  action: "evaluate"
  script: |
    // Simulate mouse leaving viewport to trigger
    document.dispatchEvent(new MouseEvent('mouseout', {
      clientY: -1,
      relatedTarget: null
    }));
    await new Promise(r => setTimeout(r, 500));

# Close the popup
browser_interact action="click" selector=".exit-popup .close"
```

### Timed Popups

Popups that appear after N seconds:

```
# Just wait and dismiss
browser_execute
  action: "evaluate"
  script: "await new Promise(r => setTimeout(r, 10000))"

browser_interact action="click" selector=".timed-popup .close"
```

### Scroll-Triggered Popups

```
# Scroll to trigger
browser_execute
  action: "evaluate"
  script: |
    window.scrollTo(0, document.body.scrollHeight * 0.5);
    await new Promise(r => setTimeout(r, 500));

# Dismiss
browser_interact action="click" selector=".scroll-popup .close"
```

## Error Handling

### Popup Not Found

```
browser_execute
  action: "evaluate"
  script: |
    const popup = document.querySelector('.popup');
    if (!popup) {
      console.log('No popup present - continuing');
      return false;
    }
    popup.querySelector('.close')?.click();
    return true;
```

### Multiple Popups

```
browser_execute
  action: "evaluate"
  script: |
    // Close all visible popups
    const popups = document.querySelectorAll('.popup, .modal');
    popups.forEach(popup => {
      const close = popup.querySelector('.close, [aria-label="Close"]');
      if (close) close.click();
    });
    return popups.length;
```

## Best Practices

### 1. Handle Popups Early

Check for and dismiss popups at the start:

```
# At page load, dismiss any popups
browser_execute
  action: "evaluate"
  script: |
    const dismissPopups = () => {
      document.querySelectorAll('.popup .close').forEach(btn => btn.click());
    };
    dismissPopups();
```

### 2. Use Robust Selectors

```
# Multiple fallback selectors
browser_execute
  action: "evaluate"
  script: |
    const selectors = ['.close', '.dismiss', '[aria-label="Close"]', '.x-btn'];
    for (const sel of selectors) {
      const btn = document.querySelector(`.modal ${sel}`);
      if (btn) {
        btn.click();
        return true;
      }
    }
    return false;
```

### 3. Don't Assume Popup Exists

```
# Conditional handling
browser_execute
  action: "evaluate"
  script: |
    const popup = document.querySelector('.cookie-banner');
    if (popup) {
      popup.querySelector('button')?.click();
    }
```

### 4. Wait for Animations

```
# After dismissing, wait for animation
browser_interact action="click" selector=".modal .close"
browser_execute
  action: "evaluate"
  script: "await new Promise(r => setTimeout(r, 300))"
```

## Troubleshooting

### Popup Won't Close

1. Check selector is correct
2. Look for multiple nested modals
3. Check if close requires JavaScript
4. Try Escape key
5. Check for overlapping elements

### Can't Interact with Popup Content

1. Wait for popup animation to complete
2. Check if content is in iframe
3. Verify popup is actually visible
4. Check z-index issues

### Dialog Keeps Reappearing

1. Check for localStorage/cookie persistence
2. Look for session-based triggering
3. May need to accept/complete rather than dismiss

## Related

- [browser_interact](../tools/browser-interact.md) - Dialog handling
- [browser_tab](../tools/browser-tab.md) - Managing popup windows
- [Form Filling](form-filling.md) - Interacting with modal forms
