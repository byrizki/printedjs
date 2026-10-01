# Printedjs Project Roadmap

This document outlines the architectural evolution, completed milestone phases, and future development horizons for **Printedjs**, the modern browser-native paginated document rendering engine.

---

## Architectural Principles

```text
RenderRequest
  │
  ├─► CSS Analysis & AST Facade (css-tree)
  │     @page rules, margin boxes, generated content, selectors
  │
  ├─► Ordered Plugin Pipeline (Topological Sort)
  │     setup → transformStyles → beforeLayout
  │
  ├─► Isolated Surface Setup
  │     Root container or Sandboxed iframe
  │
  ├─► Layout & Pagination Loop
  │     ├─ Range Measurement & Block Partitioning
  │     ├─ Multi-Column Flows & Balancing
  │     ├─ Complex Table Splitting (multi-row thead, tfoot, border collapse)
  │     ├─ Footnote Allocations & Multi-Page Continuations
  │     └─ Bounded Infinite Loop Protection (LayoutProgressGuard)
  │
  ├─► Post-Render Plugin Hooks
  │     afterRender → Total Page Counters, Bookmarks/PDF Outlines, Watermarks
  │
  └─► Immutable RenderResult & Diagnostic Metrics
```

---

## Milestone Status Summary

| Phase        | Milestone Title                                | Primary Packages                           | Status        |
| :----------- | :--------------------------------------------- | :----------------------------------------- | :------------ |
| **Phase 1**  | Legacy Baseline Corpus & Golden Captures       | Test Fixtures                              | **Completed** |
| **Phase 2**  | Core Contracts, Session & Plugin Runtime       | `@printedjs/core`                          | **Completed** |
| **Phase 3**  | Browser Surface Sandboxing (`root` & `iframe`) | `@printedjs/browser`                       | **Completed** |
| **Phase 4**  | Page Budgeting, Margin Boxes & Geometry        | `@printedjs/browser`, `@printedjs/plugins` | **Completed** |
| **Phase 5**  | Break Strategy & Infinite Loop Resiliency      | `@printedjs/browser`                       | **Completed** |
| **Phase 6**  | Standard Plugin Suite & CSS Transforms         | `@printedjs/plugins`                       | **Completed** |
| **Phase 7**  | Devtools Trace & Non-Layout Overlay            | `@printedjs/devtools`                      | **Completed** |
| **Phase 8**  | Browser Parity Suite & Visual Regression       | Test Suite                                 | **Completed** |
| **Phase 9**  | Interactive Playground & Fixture Inspector     | `apps/playground`                          | **Completed** |
| **Phase 10** | Advanced Paged Media & Complex Layout Cases    | `@printedjs/plugins`, `@printedjs/browser` | **Completed** |
| **Phase 11** | Performance, Page Virtualization & Scale       | `@printedjs/browser`                       | **Completed** |
| **Phase 12** | Headless PDF CLI, Dual Drivers & Polyfill      | `@printedjs/cli`, `@printedjs/polyfill`    | **Completed** |
| **Phase 13** | Developer Tooling & Enterprise Fixture Parity  | Monorepo & Playground                      | **Completed** |
| **Phase 14** | Core Layout Engine Conformance & Gap Closure   | `@printedjs/browser`, `@printedjs/core`    | **Completed** |
| **Phase 15** | Baseline Modernization & Native Visual CI      | Test Suite & CI Automation                 | **Completed** |
| **Phase 16** | Playground Test Catalog & Preset Polish        | `apps/playground`                          | **Completed** |

---

## Completed Milestones

### Phase 1 — Legacy Baseline Corpus & Golden Captures

- Extracted and normalized legacy Paged.js test suites across breaks, margins, strings, counters, math, tables, and whitespace.
- Created `tests/fixtures/manifest.ts` cataloging visual tolerance, expected page count, and intentional improvements.
- Built automated baseline capture script (`pnpm capture:legacy-baselines`) for Chromium.

### Phase 2 — Pure Core Contracts & Plugin Architecture

- Built zero-DOM `@printedjs/core` package with immutable data models (`RenderRequest`, `RenderResult`, `PageResult`).
- Designed `PrintedjsPlugin` interface with `setup`, `transformStyles`, `beforeLayout`, and `afterRender` lifecycle hooks.
- Implemented deterministic topological dependency sorting (`orderPlugins`) with cycle detection.

### Phase 3 — Browser Surface Sandboxing

- Developed `@printedjs/browser` supporting dual rendering isolation surfaces:
  - `root`: Fast, zero-overhead in-place rendering into host elements.
  - `iframe`: Total script, style, and font sandboxing for untrusted or complex CSS stylesheets.
- Built non-destructive `destroy()` lifecycle to restore host DOM cleanly without style leakage.

### Phase 4 — Page Budgeting & Target Page Assembly

- Built CSS Paged Media geometry engine: sheet sizing (Letter, A4, custom mm/in), orientation, and margin boxes.
- Implemented CSS margin boxes: `@top-left`, `@top-center`, `@top-right`, `@bottom-left`, `@bottom-center`, `@bottom-right`, `@left-middle`, `@right-middle`.
- Added bleed and crop mark rendering support.

### Phase 5 — Break Strategy & Infinite Loop Resiliency

- Built `LayoutProgressGuard` to prevent browser freezes when handling overflowing elements or conflicting CSS rules.
- Implemented `break-before`, `break-after`, and `break-inside` CSS break semantics.
- Added automatic blank page insertion for `break-before: left` and `break-before: right`.

### Phase 6 — Standard Plugin Suite

- **Page Rules (`pageRulesPlugin`)**: `@page` rule extraction, named page rules, margin box declarations.
- **Running Headers & Strings (`stringsPlugin`, `runningHeadersPlugin`)**: CSS `string-set` and `string(...)` margin injection.
- **Page Counters (`countersPlugin`)**: `counter(page)`, `counter(pages)`, and target cross-references.
- **Widows & Orphans (`widowsOrphansPlugin`)**: Enforces minimum text line budgets across page breaks.

### Phase 7 — Devtools & Diagnostics

- Built `@printedjs/devtools` package with diagnostic trace collection.
- Provided non-layout visual inspector overlay showing page boundaries, margins, and layout duration metrics without disrupting print geometry.

### Phase 8 — Browser Parity Test Matrix

- Automated Playwright browser tests comparing Printedjs rendering output against baseline expectations.
- Pixelmatch visual regression tests verifying page geometry and text flow.

### Phase 9 — Interactive Playground

- Built developer playground (`apps/playground`) with live fixture preview, diagnostics toggles, and multi-template switching.

### Phase 10 — Advanced Paged Media & Complex Cases

- **Multi-Page Footnotes (`footnotesPlugin`)**: Slicing long footnotes across multiple pages with continuation notices (`"Continued on next page..."`) and `footnote-policy: auto | line | block`.
- **Multi-Column Pagination (`columnsPlugin`)**: CSS `columns`, `column-count`, `column-gap`, column break awareness, and `column-fill: balance`.
- **Complex Table Splitting**: Multi-row `thead` alignment preservation across split pages, repeated `tfoot` footers, row break avoidance (`tr { break-inside: avoid }`), and collapsed border integrity.
- **Math Formula Break Protection**: Automated break protection for KaTeX, MathJax, and `<math>` block containers.
- **PDF Outlines & Bookmarks (`bookmarksPlugin`)**: Hierarchical heading extraction (`bookmark-level`, `bookmark-label`) for downstream PDF engines.

### Phase 11 — Performance & Page Virtualization

- **Page Virtualization (`virtualizePages`)**: Mounts only visible and adjacent page contents into the DOM for documents with hundreds of pages, keeping scrollbar dimensions stable while minimizing memory usage.
- **Incremental Re-Pagination**: Enables targeted re-pagination from modified pages onward in interactive editing scenarios.

### Phase 12 — Headless PDF CLI, Dual Drivers & Polyfill

- **`@printedjs/cli`**: Headless PDF conversion via `printedjs render input.html -o output.pdf`.
- **Dual Browser Engines**: Support for both Playwright (`--engine playwright`) and Puppeteer (`--engine puppeteer`) drivers, with automatic local Chrome/Chromium discovery.
- **`@printedjs/polyfill`**: Drop-in script-tag compatibility layer providing the legacy `PagedPolyfill` and `Previewer` APIs.
- **Template Preprocessing**: Built-in template preprocessor with Eta, BigInt-safe numeric serialization, and localization helpers (`dayjs`, `numeral`).

### Phase 13 — Tooling & Enterprise Template Parity

- Replaced static test server with instant-reload Vite development server (`pnpm dev`).
- Validated real-world enterprise templates (proposals, multi-page financial reports, benefit summary tables, and illustration layouts).
- Cleaned monorepo packaging, ensuring zero stray dependencies and strict export validation.

### Phase 14 — Core Layout Engine Conformance & Gap Closure

- **Parity Blank Page Insertion**: Implemented `break-after: left / recto / right / verso` support in `DomLayoutAdapter`, automatically calculating sheet parity and inserting blank pages to maintain physical book printing alignment.
- **Undisplayed Node Trailing Page Fix**: Eliminated ghost trailing blank pages caused by non-rendered elements (`<script>`, `<style>`, `<template>`, `<noscript>`) and computed `display: none` subtrees.
- **Base URL & Resource Resolution**: Added `baseUrl` option to `RenderRequest` and extracted `<base href>` in `SourceNormalizer` to ensure relative images, web fonts, and `@import` stylesheets resolve accurately in headless and isolated sandboxes.

### Phase 15 — Baseline Modernization & Native Visual CI

- **Native Baseline Capture Pipeline**: Built `pnpm baseline:capture:printedjs` (`scripts/capture-printedjs-baselines.ts`) establishing an authoritative Printedjs golden visual baseline with geometry metrics, sha256 hashes, and structured capture manifests.
- **Cross-Engine Visual Parity Suite**: Expanded Playwright visual test matrix to 30 diverse fixtures (90 test cases) across Chromium, Firefox, and WebKit with 100% pass rates.
- **CI Test Automation & Artifacts**: Updated `.github/workflows/ci.yml` to install and test Chromium, Firefox, and WebKit on every PR, with automated failure artifact uploads (`actions/upload-artifact@v4`) for rapid triage.

### Phase 16 — Playground Test Catalog & Preset Polish

- **Visual Fixture Playground Catalog**: Integrated all 30 visual test fixtures into the interactive Playground dropdown under `<optgroup label="Test Fixtures">` for real-time visual inspection and debugging.
- **Zero-Margin Certificate Preset**: Refactored Certificate of Completion preset to use `@page { margin: 0; }` with full pagebox geometry anchoring, eliminating layout overflow and asymmetrical bottom margins.

### Phase 17 — Enhanced Page Counter & Custom Numbering Pagination

- **Multi-System Page Number Formatting**: Added zero-DOM `formatPageNumber(value, style)` in `@printedjs/core` and `@printedjs/plugins` supporting `lower-roman`, `upper-roman`, `lower-alpha`, `upper-alpha`, `decimal-leading-zero`, and standard `decimal`.
- **Custom Pagination Reset & Style Attributes**: Extended `createPageShell` and `DomLayoutAdapter` to support `counter-reset: page <N>` and `counter-style`, emitting `data-counter-style`, `data-counter-formatted`, and custom properties (`--printedjs-logical-page-number`, `--printedjs-page-counter-style`).
- **Format-Preserving Target Counters**: Enhanced `countersPlugin` to support `target-counter(attr(href), page, <style>)` CSS patterns, automatically injecting formatted target page attributes (`data-target-page-lower-roman`, etc.) and computing per-section page counts (`--printedjs-section-page-count`).

### Phase 18 — Built-in Page View Plugins & Reader Modes

- **Modular Page View Engine**: Moved viewing plugins from `apps/playground` directly into `@printedjs/plugins` (`singlePageViewPlugin`, `spreadPageViewPlugin`, `flipBookViewPlugin`, `pageViewsPlugin`).
- **Spread View Mode**: CSS-driven two-page facing spreads with cover page offset and spine fold shadow.
- **Realistic 3D Flip-Book Engine**: Zero-asset interactive 3D page flip animation with mouse/touch/arrow navigation and synthetic paper rustle sound via Web Audio API (`playPageTurnSound`).
- **Unified Page Views Controller**: `pageViewsPlugin` provides seamless dynamic switching between `"single"`, `"spread"`, and `"flipbook"` modes via `DomPageViewsController`.

### Phase 19 — Mirrored Margins, Interactive TOC Drawer & Client-Side PDF Export

- **Mirrored Margins & Gutter Binding**: Added support for `@page` margin declarations `margin-inside`, `margin-outside`, and `gutter` in `pageRulesPlugin`, automatically computing facing-page offsets (`:right` spine on left, `:left` spine on right) with gutter binding math.
- **Interactive TOC Bookmark Navigation Drawer**: Implemented `createBookmarksDrawer` in `@printedjs/plugins` featuring collapsible tree nodes, heading search filter, active section highlighting, keyboard navigation, and zero print leakage (`@media print` isolation).
- **Client-Side Direct Print & PDF Export**: Added `printDocument`, `preparePrint`, and `exportToPdf` to `@printedjs/browser`, standardizing in-browser direct PDF printing with chrome isolation and automated document title management.

---

## Future Horizons

The following areas represent potential explorations for future releases:

### 1. Streaming & Worker-Assisted Pagination

- Offload non-DOM parsing and CSS AST analysis to Web Workers or background threads.
- Stream pages progressively over WebSockets or Chunked Transfer for high-volume enterprise document generation.

### 2. Native PDF Structure Generation

- Direct emission of PDF/A-compliant metadata, tagged PDF accessibility trees (WCAG 2.1), and interactive hyperlinked tables of contents during headless rendering.

### 3. Canvas & WebGPU Accelerated Page Preview

- Render pre-calculated page layouts via HTML5 Canvas or WebGPU for ultra-high-performance 60fps pan/zoom in reader applications.
