# Web Scraping Guide

Extract data from web pages using Moonsurf's browser automation capabilities.

## Overview

Moonsurf provides several approaches for data extraction:

1. **Selector-based extraction** - Extract text/HTML from specific elements
2. **Full page content** - Get entire page HTML or text
3. **JavaScript evaluation** - Run custom extraction scripts
4. **Structured data** - Parse JSON-LD, meta tags, tables

## Basic Text Extraction

### Single Element

```
browser_content
  action: "extract"
  selector: "h1"
```

Returns:
```json
{
  "text": "Page Title",
  "html": "<h1>Page Title</h1>"
}
```

### Multiple Elements

```
browser_content
  action: "extract"
  selector: ".product-name"
  multiple: true
```

Returns:
```json
{
  "elements": [
    { "text": "Product 1", "html": "<span class=\"product-name\">Product 1</span>" },
    { "text": "Product 2", "html": "<span class=\"product-name\">Product 2</span>" }
  ]
}
```

### With Attributes

```
browser_content
  action: "extract"
  selector: "a.product-link"
  multiple: true
  attributes: ["href", "data-id"]
```

Returns:
```json
{
  "elements": [
    { "text": "Product 1", "href": "/products/1", "data-id": "prod-001" },
    { "text": "Product 2", "href": "/products/2", "data-id": "prod-002" }
  ]
}
```

## Full Page Content

### Get Page Text

```
browser_content
  action: "text"
```

Returns all visible text on the page.

### Get Page HTML

```
browser_content
  action: "html"
```

Returns complete page HTML.

### Get Page Title

```
browser_content
  action: "title"
```

## Viewport DOM

Get the DOM structure visible in the current viewport:

```
browser_content
  action: "get_viewport_dom"
```

This returns a simplified DOM representation useful for understanding page structure.

## Screenshots

### Full Page

```
browser_content
  action: "screenshot"
  fullPage: true
```

### Visible Area Only

```
browser_content
  action: "screenshot"
```

### Specific Element

```
browser_content
  action: "screenshot"
  selector: "#product-gallery"
```

### Custom Format

```
browser_content
  action: "screenshot"
  format: "jpeg"
  quality: 80
```

## Structured Data Extraction

### Tables

```
browser_execute
  action: "evaluate"
  script: |
    const table = document.querySelector('table');
    const headers = Array.from(table.querySelectorAll('th'))
      .map(th => th.textContent.trim());
    const rows = Array.from(table.querySelectorAll('tbody tr'))
      .map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return cells.map(cell => cell.textContent.trim());
      });
    return { headers, rows };
```

### JSON-LD

```
browser_execute
  action: "evaluate"
  script: |
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    return Array.from(scripts).map(s => JSON.parse(s.textContent));
```

### Meta Tags

```
browser_execute
  action: "evaluate"
  script: |
    const meta = {};
    document.querySelectorAll('meta').forEach(m => {
      const name = m.getAttribute('name') || m.getAttribute('property');
      if (name) meta[name] = m.getAttribute('content');
    });
    return meta;
```

### Open Graph Data

```
browser_execute
  action: "evaluate"
  script: |
    const og = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(m => {
      const prop = m.getAttribute('property').replace('og:', '');
      og[prop] = m.getAttribute('content');
    });
    return og;
```

## Product Page Scraping

### E-commerce Product

```
# Navigate to product page
browser_navigate
  action: "goto"
  url: "https://shop.example.com/product/123"
  waitUntil: "networkidle"

# Extract product data
browser_execute
  action: "evaluate"
  script: |
    return {
      name: document.querySelector('h1.product-title')?.textContent.trim(),
      price: document.querySelector('.price')?.textContent.trim(),
      description: document.querySelector('.description')?.textContent.trim(),
      images: Array.from(document.querySelectorAll('.gallery img'))
        .map(img => img.src),
      rating: document.querySelector('.rating')?.textContent.trim(),
      reviews: document.querySelector('.review-count')?.textContent.trim(),
      availability: document.querySelector('.stock-status')?.textContent.trim(),
      sku: document.querySelector('[itemprop="sku"]')?.textContent.trim()
    };
```

### Product Listing Page

```
browser_execute
  action: "evaluate"
  script: |
    return Array.from(document.querySelectorAll('.product-card')).map(card => ({
      name: card.querySelector('.product-name')?.textContent.trim(),
      price: card.querySelector('.price')?.textContent.trim(),
      url: card.querySelector('a')?.href,
      image: card.querySelector('img')?.src
    }));
```

## Article/Blog Scraping

### Article Content

```
browser_execute
  action: "evaluate"
  script: |
    return {
      title: document.querySelector('h1')?.textContent.trim(),
      author: document.querySelector('.author')?.textContent.trim(),
      date: document.querySelector('time')?.getAttribute('datetime'),
      content: document.querySelector('article')?.textContent.trim(),
      tags: Array.from(document.querySelectorAll('.tag'))
        .map(t => t.textContent.trim())
    };
```

### News Article

```
browser_execute
  action: "evaluate"
  script: |
    // Try common article selectors
    const selectors = {
      title: ['h1', 'article h1', '.headline'],
      content: ['article', '.article-body', '.post-content'],
      date: ['time', '.published-date', '.date'],
      author: ['.author', '.byline', '[rel="author"]']
    };

    const find = (sels) => {
      for (const sel of sels) {
        const el = document.querySelector(sel);
        if (el) return el.textContent.trim();
      }
      return null;
    };

    return {
      title: find(selectors.title),
      content: find(selectors.content),
      date: find(selectors.date),
      author: find(selectors.author)
    };
```

## Pagination Handling

### Next Button Pagination

```
const allProducts = [];

while (true) {
  // Extract products from current page
  const products = browser_execute
    action: "evaluate"
    script: |
      return Array.from(document.querySelectorAll('.product'))
        .map(p => ({
          name: p.querySelector('.name')?.textContent,
          price: p.querySelector('.price')?.textContent
        }));

  allProducts.push(...products);

  // Check for next button
  const hasNext = browser_execute
    action: "evaluate"
    script: |
      const next = document.querySelector('.pagination .next');
      return next && !next.disabled;

  if (!hasNext) break;

  // Click next and wait for load
  browser_interact action="click" selector=".pagination .next"
  browser_navigate action="waitForNavigation"
}
```

### URL-Based Pagination

```
const baseUrl = "https://example.com/products?page=";
let page = 1;
const allProducts = [];

while (page <= 10) {
  browser_navigate
    action: "goto"
    url: `${baseUrl}${page}`
    waitUntil: "networkidle"

  const products = browser_execute
    action: "evaluate"
    script: |
      return Array.from(document.querySelectorAll('.product'))
        .map(p => p.textContent);

  if (products.length === 0) break;

  allProducts.push(...products);
  page++;
}
```

### Infinite Scroll

```
browser_execute
  action: "evaluate"
  script: |
    const items = [];
    let lastHeight = 0;

    while (true) {
      // Scroll to bottom
      window.scrollTo(0, document.body.scrollHeight);

      // Wait for content to load
      await new Promise(r => setTimeout(r, 2000));

      // Check if we've reached the end
      const newHeight = document.body.scrollHeight;
      if (newHeight === lastHeight) break;
      lastHeight = newHeight;

      // Don't scroll forever
      if (items.length > 1000) break;
    }

    // Extract all loaded items
    return Array.from(document.querySelectorAll('.item'))
      .map(el => el.textContent);
```

## Handling Dynamic Content

### Wait for Content to Load

```
# Wait for specific element
browser_interact
  action: "click"
  selector: ".load-more"

browser_execute
  action: "evaluate"
  script: |
    await new Promise(resolve => {
      const check = () => {
        const items = document.querySelectorAll('.product');
        if (items.length > 10) resolve();
        else setTimeout(check, 100);
      };
      check();
    });
```

### React/Vue/Angular Apps

```
# Wait for hydration
browser_execute
  action: "evaluate"
  script: |
    // Wait for React to hydrate
    await new Promise(resolve => {
      const check = () => {
        if (document.querySelector('[data-reactroot]')) resolve();
        else setTimeout(check, 100);
      };
      check();
    });
```

### Lazy-Loaded Images

```
browser_execute
  action: "evaluate"
  script: |
    // Scroll through page to trigger lazy loading
    const totalHeight = document.body.scrollHeight;
    const viewportHeight = window.innerHeight;

    for (let pos = 0; pos < totalHeight; pos += viewportHeight) {
      window.scrollTo(0, pos);
      await new Promise(r => setTimeout(r, 500));
    }

    // Now extract image sources
    return Array.from(document.querySelectorAll('img'))
      .map(img => img.src || img.dataset.src);
```

## Search Results Scraping

### Google Search Results

```
browser_navigate
  action: "goto"
  url: "https://www.google.com/search?q=moonsurf+browser"

browser_execute
  action: "evaluate"
  script: |
    return Array.from(document.querySelectorAll('.g')).map(result => ({
      title: result.querySelector('h3')?.textContent,
      url: result.querySelector('a')?.href,
      snippet: result.querySelector('.VwiC3b')?.textContent
    })).filter(r => r.title);
```

### Site Search

```
# Enter search term
browser_interact action="type" selector="input[type='search']" text="query"
browser_interact action="press" key="Enter"

# Wait for results
browser_execute
  action: "evaluate"
  script: |
    await new Promise(r => setTimeout(r, 2000));
    return Array.from(document.querySelectorAll('.search-result'))
      .map(r => r.textContent);
```

## Data Cleaning

### Clean Extracted Text

```
browser_execute
  action: "evaluate"
  script: |
    const raw = document.querySelector('.content')?.textContent || '';
    return raw
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/^\s+|\s+$/g, '')      // Trim
      .replace(/[^\x20-\x7E]/g, '');  // Remove non-printable
```

### Extract Numbers

```
browser_execute
  action: "evaluate"
  script: |
    const priceText = document.querySelector('.price')?.textContent || '';
    const match = priceText.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(',', '')) : null;
```

### Parse Dates

```
browser_execute
  action: "evaluate"
  script: |
    const dateEl = document.querySelector('time');
    const datetime = dateEl?.getAttribute('datetime');
    if (datetime) return new Date(datetime).toISOString();

    // Fallback to text parsing
    const text = dateEl?.textContent;
    return text ? new Date(text).toISOString() : null;
```

## Error Handling

### Check Element Exists

```
browser_execute
  action: "evaluate"
  script: |
    const el = document.querySelector('.product-title');
    if (!el) throw new Error('Product title not found');
    return el.textContent;
```

### Handle Missing Data

```
browser_execute
  action: "evaluate"
  script: |
    return {
      name: document.querySelector('.name')?.textContent?.trim() || 'Unknown',
      price: document.querySelector('.price')?.textContent?.trim() || 'N/A',
      inStock: document.querySelector('.in-stock') !== null
    };
```

### Retry on Failure

```
let attempts = 0;
let data = null;

while (attempts < 3 && !data) {
  try {
    data = browser_execute
      action: "evaluate"
      script: |
        const el = document.querySelector('.data');
        if (!el) throw new Error('Not loaded');
        return el.textContent;
  } catch (e) {
    attempts++;
    browser_execute
      action: "evaluate"
      script: "await new Promise(r => setTimeout(r, 1000))"
  }
}
```

## Best Practices

### 1. Respect Rate Limits

Add delays between requests:

```
browser_navigate action="goto" url="https://example.com/page1"
# ... extract data ...

browser_execute
  action: "evaluate"
  script: "await new Promise(r => setTimeout(r, 2000))"

browser_navigate action="goto" url="https://example.com/page2"
```

### 2. Use Stable Selectors

Prefer:
- `[data-testid="product"]`
- `[itemprop="name"]`
- Semantic elements like `article`, `main`, `nav`

Avoid:
- Dynamically generated class names
- Position-based selectors
- Overly complex selectors

### 3. Handle Consent Dialogs

```
# Try to dismiss cookie consent
browser_execute
  action: "evaluate"
  script: |
    const acceptBtn = document.querySelector(
      '[class*="accept"], [class*="consent"], #cookie-accept'
    );
    if (acceptBtn) acceptBtn.click();
```

### 4. Verify Data Quality

```
browser_execute
  action: "evaluate"
  script: |
    const data = { /* extracted data */ };

    // Validate required fields
    const required = ['name', 'price', 'url'];
    for (const field of required) {
      if (!data[field]) {
        console.error(`Missing required field: ${field}`);
      }
    }

    return data;
```

### 5. Take Screenshots for Debugging

```
# Before extraction
browser_content action="screenshot" fullPage=true

# If extraction fails, you have a record of what the page looked like
```

## Legal Considerations

When scraping websites:

1. **Check robots.txt** - Respect crawl rules
2. **Review Terms of Service** - Some sites prohibit scraping
3. **Rate limit requests** - Don't overload servers
4. **Don't scrape personal data** - GDPR and privacy laws apply
5. **Cache responses** - Minimize repeat requests
6. **Identify your bot** - Use appropriate user-agent

## Related

- [browser_content](../tools/browser-content.md) - Content extraction tool
- [browser_execute](../tools/browser-execute.md) - JavaScript execution
- [Network Interception](network-interception.md) - Monitor API responses
