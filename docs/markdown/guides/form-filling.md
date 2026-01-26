# Form Filling Guide

Automate form interactions with Moonsurf, from simple text inputs to complex multi-step forms.

## Basic Text Input

### Single Field

```
browser_interact
  action: "type"
  selector: "#email"
  text: "user@example.com"
```

### Clear Before Typing

```
browser_interact
  action: "type"
  selector: "#search"
  text: "new search term"
  clearFirst: true
```

### Type with Delay (Human-like)

```
browser_interact
  action: "type"
  selector: "#message"
  text: "Hello, this types slowly"
  delay: 50
```

## Clicking Elements

### Basic Click

```
browser_interact
  action: "click"
  selector: "#submit-button"
```

### Double Click

```
browser_interact
  action: "click"
  selector: ".item"
  clickCount: 2
```

### Right Click (Context Menu)

```
browser_interact
  action: "click"
  selector: ".file"
  button: "right"
```

### Click at Position

```
browser_interact
  action: "click"
  selector: "#canvas"
  position: { "x": 100, "y": 50 }
```

## Dropdown Selection

### Select by Value

```
browser_interact
  action: "select"
  selector: "#country"
  value: "us"
```

### Select by Label Text

```
browser_interact
  action: "select"
  selector: "#country"
  label: "United States"
```

### Select Multiple Options

For `<select multiple>`:

```
browser_interact
  action: "select"
  selector: "#interests"
  values: ["sports", "music", "travel"]
```

## Checkboxes and Radio Buttons

### Check a Checkbox

```
browser_interact
  action: "check"
  selector: "#agree-terms"
```

### Uncheck a Checkbox

```
browser_interact
  action: "uncheck"
  selector: "#subscribe-newsletter"
```

### Select Radio Button

```
browser_interact
  action: "click"
  selector: "input[name='payment'][value='credit']"
```

### Toggle Checkbox

Check state first, then toggle:

```
# Get current state
browser_execute
  action: "evaluate"
  script: "document.querySelector('#remember-me').checked"

# Toggle based on result
browser_interact
  action: "click"
  selector: "#remember-me"
```

## File Uploads

### Single File

```
browser_interact
  action: "upload"
  selector: "input[type='file']"
  files: ["/path/to/document.pdf"]
```

### Multiple Files

```
browser_interact
  action: "upload"
  selector: "input[type='file'][multiple]"
  files: ["/path/to/file1.pdf", "/path/to/file2.pdf"]
```

### Drag-and-Drop Upload Zone

For dropzone-style uploads:

```
# Some dropzones have hidden file inputs
browser_interact
  action: "upload"
  selector: ".dropzone input[type='file']"
  files: ["/path/to/image.jpg"]
```

## Keyboard Actions

### Press Single Key

```
browser_interact
  action: "press"
  key: "Enter"
```

### Keyboard Shortcuts

```
browser_interact
  action: "press"
  key: "Control+a"
```

Common shortcuts:
- `Control+a` - Select all
- `Control+c` - Copy
- `Control+v` - Paste
- `Escape` - Close dialogs
- `Tab` - Next field
- `Shift+Tab` - Previous field

### Type Special Characters

```
browser_interact
  action: "type"
  selector: "#search"
  text: "query"

browser_interact
  action: "press"
  key: "Enter"
```

## Complete Login Form Example

### Simple Login

```
# 1. Navigate to login page
browser_navigate
  action: "goto"
  url: "https://example.com/login"

# 2. Enter username
browser_interact
  action: "type"
  selector: "#username"
  text: "myuser"

# 3. Enter password
browser_interact
  action: "type"
  selector: "#password"
  text: "mypassword"

# 4. Click login button
browser_interact
  action: "click"
  selector: "#login-button"

# 5. Wait for redirect and verify
browser_navigate
  action: "waitForNavigation"
  timeout: 10000

browser_content
  action: "extract"
  selector: ".welcome-message"
```

### Login with Remember Me

```
# Fill credentials
browser_interact action="type" selector="#email" text="user@example.com"
browser_interact action="type" selector="#password" text="secret123"

# Check remember me
browser_interact action="check" selector="#remember-me"

# Submit
browser_interact action="click" selector="button[type='submit']"
```

## Multi-Step Forms

### Wizard-Style Form

```
# Step 1: Personal Info
browser_interact action="type" selector="#first-name" text="John"
browser_interact action="type" selector="#last-name" text="Doe"
browser_interact action="click" selector="#next-step-1"

# Wait for step 2 to load
browser_interact action="click" selector="#step-2-field" waitForSelector=true

# Step 2: Address
browser_interact action="type" selector="#address" text="123 Main St"
browser_interact action="type" selector="#city" text="New York"
browser_interact action="select" selector="#state" value="NY"
browser_interact action="type" selector="#zip" text="10001"
browser_interact action="click" selector="#next-step-2"

# Step 3: Review and Submit
browser_interact action="click" selector="#confirm-checkbox"
browser_interact action="click" selector="#submit-form"
```

### Tab-Based Form

```
# Click on tab
browser_interact action="click" selector="[data-tab='billing']"

# Wait for tab content
browser_interact
  action: "click"
  selector: "#billing-address"
  waitForSelector: true

# Fill billing info
browser_interact action="type" selector="#billing-address" text="456 Oak Ave"
```

## Dynamic Forms

### Forms with AJAX Validation

```
# Type email - triggers validation
browser_interact action="type" selector="#email" text="user@example.com"

# Tab out to trigger blur validation
browser_interact action="press" key="Tab"

# Wait for validation response
browser_execute
  action: "evaluate"
  script: "await new Promise(r => setTimeout(r, 1000))"

# Check for validation error
browser_content
  action: "extract"
  selector: "#email-error"
```

### Auto-Complete Fields

```
# Type partial text
browser_interact action="type" selector="#city-autocomplete" text="New Y"

# Wait for suggestions
browser_interact
  action: "click"
  selector: ".autocomplete-suggestion:first-child"
  waitForSelector: true
  timeout: 5000
```

### Dependent Dropdowns

```
# Select country - triggers state/province dropdown load
browser_interact action="select" selector="#country" value="US"

# Wait for states to load
browser_execute
  action: "evaluate"
  script: |
    await new Promise(resolve => {
      const check = () => {
        const options = document.querySelectorAll('#state option');
        if (options.length > 1) resolve();
        else setTimeout(check, 100);
      };
      check();
    });

# Now select state
browser_interact action="select" selector="#state" value="CA"
```

## Form Validation

### Check for Errors

```
# Try to submit
browser_interact action="click" selector="#submit"

# Check for validation errors
browser_content
  action: "extract"
  selector: ".error-message"
  multiple: true
```

### Verify Required Fields

```
browser_execute
  action: "evaluate"
  script: |
    const required = document.querySelectorAll('[required]');
    return Array.from(required).map(el => ({
      name: el.name,
      filled: el.value.length > 0
    }));
```

## Handling Special Input Types

### Date Pickers

```
# Native date input
browser_interact
  action: "type"
  selector: "input[type='date']"
  text: "2024-03-15"

# Or via JavaScript for complex date pickers
browser_execute
  action: "evaluate"
  script: |
    const picker = document.querySelector('.date-picker');
    picker.value = '2024-03-15';
    picker.dispatchEvent(new Event('change', { bubbles: true }));
```

### Range Sliders

```
browser_execute
  action: "evaluate"
  script: |
    const slider = document.querySelector('input[type="range"]');
    slider.value = 75;
    slider.dispatchEvent(new Event('input', { bubbles: true }));
```

### Color Pickers

```
browser_execute
  action: "evaluate"
  script: |
    const colorInput = document.querySelector('input[type="color"]');
    colorInput.value = '#ff5500';
    colorInput.dispatchEvent(new Event('change', { bubbles: true }));
```

### Content Editable

```
browser_interact
  action: "click"
  selector: "[contenteditable='true']"

browser_interact
  action: "type"
  selector: "[contenteditable='true']"
  text: "Rich text content"
```

## Rich Text Editors

### TinyMCE

```
browser_execute
  action: "evaluate"
  script: |
    tinymce.activeEditor.setContent('<p>My content here</p>');
```

### CKEditor

```
browser_execute
  action: "evaluate"
  script: |
    CKEDITOR.instances[Object.keys(CKEDITOR.instances)[0]]
      .setData('<p>My content</p>');
```

### Quill

```
browser_execute
  action: "evaluate"
  script: |
    const quill = Quill.find(document.querySelector('.ql-editor'));
    quill.setText('My content');
```

### Generic iFrame Editor

```
# Switch to editor iframe
browser_tab action="list"  # Find iframe
browser_execute
  action: "evaluate"
  script: |
    const iframe = document.querySelector('.editor-iframe');
    iframe.contentDocument.body.innerHTML = '<p>Content</p>';
```

## Form Data Extraction

### Get All Form Values

```
browser_execute
  action: "evaluate"
  script: |
    const form = document.querySelector('#my-form');
    const formData = new FormData(form);
    return Object.fromEntries(formData);
```

### Get Specific Field Value

```
browser_execute
  action: "evaluate"
  script: "document.querySelector('#email').value"
```

## Best Practices

### 1. Wait for Elements

Always ensure elements are ready:

```
browser_interact
  action: "type"
  selector: "#dynamic-field"
  text: "value"
  waitForSelector: true
  timeout: 10000
```

### 2. Clear Fields First

For edit forms with existing data:

```
browser_interact
  action: "type"
  selector: "#name"
  text: "New Name"
  clearFirst: true
```

### 3. Verify Submission

Always check that forms submitted successfully:

```
# Submit
browser_interact action="click" selector="#submit"

# Verify success
browser_content
  action: "extract"
  selector: ".success-message"

# Or check URL changed
browser_tab action="list"  # Check current URL
```

### 4. Handle Loading States

```
# Click submit
browser_interact action="click" selector="#submit"

# Wait for loading to complete
browser_execute
  action: "evaluate"
  script: |
    await new Promise(resolve => {
      const check = () => {
        const loading = document.querySelector('.loading');
        if (!loading) resolve();
        else setTimeout(check, 100);
      };
      check();
    });
```

## Troubleshooting

### Element Not Found

1. Check selector is correct
2. Wait for element to appear
3. Check if element is in iframe
4. Verify page has loaded

### Cannot Type in Field

1. Check field is not disabled
2. Check field is not readonly
3. Try clicking field first
4. Check for overlapping elements

### Form Not Submitting

1. Check all required fields are filled
2. Look for JavaScript validation errors
3. Check network tab for failed requests
4. Try clicking submit button instead of pressing Enter

## Related

- [browser_interact](../tools/browser-interact.md) - Full interaction tool reference
- [browser_execute](../tools/browser-execute.md) - JavaScript execution
- [Handling Popups](handling-popups.md) - Deal with form dialogs
