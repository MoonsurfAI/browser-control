# Amazon SellerSprite Product Research Task

Search for products on Amazon, analyze market data using SellerSprite extension, sort by sales performance, and export the results to Excel using Moonsurf Browser Control MCP tools.

## Output Format

```
Search({query})-{count}-US-{date}.xlsx
```

**Example:** `Search(multi-collagen-powder)-64-US-20260109.xlsx`

**Output Contents:** Product ASIN, Title, Brand, Category, BSR, Sold Units, Revenue, Variation Sold/Revenue, Price, Rating, FBA status, Gross Margin, Listing Date, and more.

---

## Browser Instance Management

Always reuse existing browser instances. Only create a new instance if none exists.

### Step 0: Check for existing browser instance

```
browser_instance:
  action: list
```

Use the `instanceId` from the response and create a new tab.

```
browser_tab:
  action: new
  instanceId: <existing_instance_id>
  url: https://www.amazon.com
```

Save the returned `tabId` for subsequent operations and cleanup.

---

## Workflow Steps

### Step 1: Search for Products on Amazon

**1.1 Wait for and click search input**
```
browser_navigate:
  action: wait
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: input#twotabsearchtextbox
  timeout: 10000
```
```
browser_interact:
  action: click
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: input#twotabsearchtextbox
```

**1.2 Type search query**
```
browser_interact:
  action: type
  instanceId: <instance_id>
  tabId: <tab_id>
  text: <your search term>
```

**1.3 Submit search**
```
browser_interact:
  action: click
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: input#nav-search-submit-button
```

**1.4 Wait for search results**
```
browser_navigate:
  action: wait
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: div[data-component-type='s-search-result']
  timeout: 10000
```

---

### Step 2: Open SellerSprite Extension

The SellerSprite button appears in the bottom-right corner of Amazon pages.

**2.1 Wait for and click SellerSprite button**
```
browser_navigate:
  action: wait
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: text=SellerSprite
  timeout: 30000
```
```
browser_interact:
  action: click
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: text=SellerSprite
```

**2.2 Wait for product table to load (can take 1-2 minutes)**
```
browser_navigate:
  action: wait
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: span.table-title
  timeout: 120000
```

---

### Step 3: Sort Results by Variation Sold/Revenue

The "Variation Sold/Revenue" column (index 9) shows 30-day sales data. Sort descending to identify top-performing products.

```
browser_execute:
  instanceId: <instance_id>
  tabId: <tab_id>
  expression: |
    (function() {
      var spans = document.querySelectorAll('span.table-title');
      var targetSpan = spans[9];
      if (targetSpan) {
        var grandparent = targetSpan.parentElement.parentElement;
        var descBtn = grandparent.querySelector('.vxe-sort--desc-btn');
        if (descBtn) {
          descBtn.click();
          return 'Sorted by Variation Sold/Revenue descending';
        }
      }
      return 'Sort button not found';
    })()
```

---

### Step 4: Load More Results

SellerSprite loads products in batches. Click Load More to load additional results.

**4.1 Wait for and click Load More**
```
browser_navigate:
  action: wait
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: text=Load more
  timeout: 10000
```
```
browser_interact:
  action: click
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: text=Load more
```

**4.2 Wait for additional data to load**
```
browser_navigate:
  action: wait
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: span.table-title
  timeout: 120000
```

---

### Step 5: Export Data

**5.1 Wait for and click Export button**
```
browser_navigate:
  action: wait
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: button:has-text('Export')
  timeout: 10000
```
```
browser_interact:
  action: click
  instanceId: <instance_id>
  tabId: <tab_id>
  selector: button:has-text('Export')
```

**5.2 Wait for download to complete**
```
browser_debug:
  action: downloads
  instanceId: <instance_id>
  state: all
```

If downloads list is empty, wait and retry - the extension generates the Excel file internally which can take several seconds.

```
sleep:
  duration: 10000
```

Then check downloads again:
```
browser_debug:
  action: downloads
  instanceId: <instance_id>
  state: all
```

---

### Step 6: Cleanup

Close the tab (keep browser instance for future tasks).

```
browser_tab:
  action: close
  instanceId: <instance_id>
  tabId: <tab_id>
```

---

## Key Selectors

| Element | Selector | Notes |
|---------|----------|-------|
| Search Input | `input#twotabsearchtextbox` | Amazon search bar |
| Search Button | `input#nav-search-submit-button` | Magnifying glass button |
| Search Results | `div[data-component-type='s-search-result']` | Product cards |
| SellerSprite Button | `text=SellerSprite` | Bottom-right corner |
| Table Headers | `span.table-title` | Column headers (indexed 0-21) |
| Sort Descending | `.vxe-sort--desc-btn` | Down arrow icon |
| Sort Ascending | `.vxe-sort--asc-btn` | Up arrow icon |
| Table Body | `.vxe-table--body-wrapper` | Scrollable table container |
| Export Button | `button:has-text('Export')` | Orange button in toolbar |
| Load More | `text=Load more` | Bottom of results |

---

## Column Header Index Reference

| Index | Column Name |
|-------|-------------|
| 0 | (empty) |
| 1 | # |
| 2 | Product Info |
| 3 | (empty) |
| 4 | Brand |
| 5 | Category |
| 6 | BSR |
| 7 | Sold Units |
| 8 | Revenue |
| 9 | **Variation Sold/Revenue** |
| 10 | Variations |
| 11 | Price |
| 12 | Q&A |
| 13 | Num. of Ratings |
| 14 | New Ratings |
| 15 | Rating |
| 16 | Ratings Rate |
| 17 | FBA |
| 18 | Gross Margin |
| 19 | Listing Date |
| 20 | Sellers |
| 21 | Fulfil. |

---

## SellerSprite Panel Structure

```
SellerSprite Panel
├── Tabs: Product Research | Reverse ASIN | Keyword Mining | Index Checker | Relevance Check | My List
├── Market Statistics Row
│   ├── ASINs, Monthly Units Sold, Monthly Revenue
│   ├── Avg. BSR, Avg. Price, Avg. Rating
│   └── Avg. Ratings, Avg. Listing Age
├── Filter Row
│   ├── Consumer Insight, Attribute Analysis buttons
│   ├── BS filter, Product dropdown
│   └── Remove duplicate ASIN checkbox
├── Product Table
│   ├── Header Row (sortable columns)
│   └── Data Rows
└── Action Bar
    ├── Refresh, Copy all ASINs, Export
    ├── Export Sales, Reverse ASINs, Traffic Compare
    └── Copy, + My List, Delete
```

---

## Troubleshooting

### SellerSprite Panel Not Opening
- Ensure you're on an Amazon search results page
- Wait for the page to fully load
- Check if login modal appears (requires login)
- Refresh the page and try again

### Sort Not Working
- Use JavaScript to click the specific sort arrow button (`.vxe-sort--desc-btn`)
- The sort arrows are small icons next to the column text, not the text itself

### Export Button Not Responding
- Use specific selector: `button:has-text('Export')`
- Wait for any loading to complete
- Check download list to verify if file was downloaded

### Limited Results (50-75 products)
- This is normal behavior based on search query and Amazon data availability
- Scroll the table to ensure all available results are loaded
- Click "Load More Results" if visible

---

## Notes

- **Instance reuse**: Always check for existing instances before creating new ones
- **Tab cleanup**: Close tabs after task completion, but keep the browser instance running
- **Login required**: SellerSprite requires an active subscription
- **Data freshness**: Variation Sold/Revenue represents the past 30 days
- **Export limits**: Typically 50-100 products depending on query popularity
- **Rate limiting**: Avoid rapid successive exports
- **Session persistence**: Login state is maintained within the browser session
