# Printedjs Minimal Standalone Demo

A standalone static HTML application demonstrating zero-config drop-in document pagination using `@printedjs/minimal`.

---

## Features Demonstrated

- **Zero-Config Script Tag Pagination** — Simply include `@printedjs/minimal` to automatically paginate HTML documents containing CSS `@page` declarations.
- **CSS Paged Media Standards**:
  - Paper sizing (`size: A4`) and margins (`margin: 25mm 20mm`).
  - Running headers (`string-set: section-title content()`, `@top-right { content: string(section-title); }`).
  - Dynamic page numbering (`content: "Page " counter(page) " of " counter(pages);`).
  - Cover page formatting (`@page :first` with blank margin boxes).
  - Repeated table headers across page splits (`<thead>`).
  - Out-of-flow footnotes (`float: footnote`).
  - Explicit section breaks (`break-before: page`).
- **Print & PDF Export** — Integrated print toolbar with instant PDF rendering via `window.print()`.

---

## Running Locally

```bash
# Start the minimal demo dev server
pnpm dev:minimal

# Or via workspace filter directly
pnpm --filter minimal-demo dev
```

Visit `http://localhost:5174` in your browser.
