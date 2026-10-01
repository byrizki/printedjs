# Printedjs Feature Catalog & Capabilities

This document provides a comprehensive, categorized catalog of every feature currently implemented in **Printedjs**, alongside a detailed technical comparison against legacy Paged.js.

---

## 1. Printedjs vs Legacy Paged.js: Comparison Table

The following table summarizes the architectural, functional, and operational differences between Printedjs and legacy Paged.js:

| Capability / Dimension               | Legacy Paged.js                                              | Printedjs                                                                              | Key Advantage                                                           |
| :----------------------------------- | :----------------------------------------------------------- | :------------------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| **Architecture**                     | Monolithic single-bundle script                              | Modular monorepo (`@printedjs/core`, `@printedjs/browser`, `@printedjs/plugins`, etc.) | Tree-shakable, embeddable, headless-friendly                            |
| **DOM Coupling**                     | Hardcoded to global `window`, `document`, and CSSOM          | Pure engine (`@printedjs/core`) with zero DOM dependencies                             | Can run in headless or worker contexts; cleanly separated concerns      |
| **Rendering Surfaces**               | Mutates the host DOM in place with global side effects       | Dual surface isolation: `root` (in-place) and `iframe` (full sandbox)                  | Zero style leakage, secure rendering of untrusted markup                |
| **Teardown & Cleanup**               | Incomplete; leaves orphaned `<style>` tags and wrappers      | Deterministic `renderer.destroy()` leaves zero DOM residue                             | Leak-free embedding in single-page apps (React, Vue, etc.)              |
| **Language & Typing**                | JavaScript with partial ambient types                        | 100% strict TypeScript with exported contract definitions                              | Full autocomplete, compile-time validation, strong contracts            |
| **Infinite Loop Protection**         | High risk of browser freeze on edge-case overflows           | `LayoutProgressGuard` with bounded iteration limits                                    | Never freezes the browser tab; throws typed `PrintedjsLayoutLimitError` |
| **Break Controls (`recto`/`verso`)** | Inconsistent blank page generation on split breaks           | Full `break-before` and `break-after` support (`left`, `right`, `recto`, `verso`)      | Automatic blank page insertion matches physical print standards         |
| **Undisplayed Node Filtering**       | Frequently creates unwanted empty trailing pages             | Deep filtering of `<script>`, `<template>`, `<noscript>`, `display: none`              | Clean trailing page counts with zero empty page artifacts               |
| **Base URL & `@import`**             | Relies entirely on ambient browser page base                 | Explicit `baseUrl` option and `<base href>` extraction for relative resources          | Reliable asset loading in headless and sandboxed environments           |
| **Table Pagination**                 | Basic row splitting; unstable headers on deep breaks         | Multi-row `thead` repetition, `tfoot` repetition, multi-page `rowspan` continuation    | Flawless multi-page financial reports and data tables                   |
| **Table Column Sync**                | Requires manual fixed column widths or colgroups             | Automatic cross-page column width synchronization                                      | Natural table formatting without brittle manual CSS hacks               |
| **Footnotes**                        | Unstable `@footnote` allocation; no multi-page continuation  | Multi-page footnote slicing, continuation notices, and `footnote-policy`               | True publishing-grade academic footnote handling                        |
| **Multi-Column Flows**               | Rudimentary column breaks                                    | `column-count`, `column-gap`, `column-span: all`, `column-fill: balance`               | Complex magazine, newsletter, and multi-column article layouts          |
| **Math Formula Protection**          | Splits formulas across page breaks arbitrarily               | Automated break protection for KaTeX, MathJax, and `<math>` tags                       | Clean formulas without mid-expression page cuts                         |
| **Page Virtualization**              | Mounts all pages into the DOM at once; degrades on >50 pages | Optional `virtualizePages` unmounts offscreen page bodies                              | Smooth 60fps scrolling and tiny memory footprint on 200+ page docs      |
| **Incremental Re-Pagination**        | Must re-paginate the entire document from scratch            | `renderIncremental` re-paginates starting only from edited pages                       | Real-time interactive document editing in playgrounds/apps              |
| **Devtools & Inspection**            | Requires intrusive DOM manipulation or console logs          | `@printedjs/devtools` non-layout overlay and structured trace metrics                  | Visual boundary inspection without changing layout metrics              |
| **Headless PDF CLI**                 | Community wrappers or custom Puppeteer scripts               | Native `@printedjs/cli` with dual drivers (`playwright` & `puppeteer`)                 | Direct CLI rendering, file watch mode, auto Chrome discovery            |
| **Cross-Engine Conformance**         | Primarily developed and verified against older Chromium      | Automated Playwright suite verified against Chromium, Firefox, WebKit                  | Identical layout and pixel-parity across all major browsers             |
| **Drop-in Compatibility**            | N/A                                                          | `@printedjs/polyfill` and `pagedjsCompatible: true` mode                               | Instant migration path for existing Paged.js templates                  |

---

## 2. Comprehensive Feature Catalog

### 2.1 Core Contracts & Engine Architecture (`@printedjs/core`)

- **Zero-DOM Pagination Model**: Pure mathematical layout state machine operating on abstract content trees, page budgets, and slice boundaries without invoking browser APIs directly.
- **Immutable Request & Result Types**:
  - `RenderRequest`: Content specification (HTML, DOM, external stylesheets, base URL), viewport settings, pagination rules, and progress limits.
  - `RenderResult`: Detailed result containing generated pages, page counts, flow totals, execution duration, and structured diagnostic logs.
- **Topologically Ordered Plugin System**:
  - Deterministic plugin sorting via `orderPlugins()`, resolving dependencies and detecting circular dependencies at initialization time.
  - Granular lifecycle hooks: `setup`, `transformStyles`, `beforeLayout`, and `afterRender`.
- **CSS AST Facade**:
  - High-performance CSS parsing and stylesheet normalization powered by `css-tree`.
  - Extensible AST walkers for `@page` rules, margin box declarations, named strings, and counter properties.

---

### 2.2 Rendering Surfaces & Lifecycle (`@printedjs/browser`)

- **Dual Isolation Modes**:
  - `root`: Mounts pages directly within a target container in the host document for maximum rendering speed and direct DOM inspection.
  - `iframe`: Sandboxes pagination inside a dynamic, hidden iframe, isolating CSS styles, global fonts, CSS resets, and JavaScript from the host application.
- **Non-Destructive Teardown (`renderer.destroy()`)**:
  - Removes all injected `<style>` elements, temporary clones, page wrappers, and event listeners.
  - Leaves the host container in its original pristine state without DOM residue or memory leaks.
- **Source Normalization & Base URL Support**:
  - Extracts `<base href="...">` and relative resource URLs.
  - Injects target base URLs to resolve relative images, web fonts (`@font-face`), and `@import` stylesheets in headless or sandboxed environments.
- **Performance & Virtualization**:
  - `virtualizePages`: Attaches an `IntersectionObserver` to mount page contents only when scrolled near the viewport, retaining fixed page geometry to prevent scrollbar jumping.
  - `renderIncremental`: Caches unaltered pages and re-evaluates flow only from modified pages onward.

---

### 2.3 CSS Paged Media & Geometry Engine

- **Sheet Sizing & Orientations**:
  - Standard paper sizes: `letter`, `legal`, `A4`, `A3`, `A5`, `B4`, `B5`, and arbitrary dimensional units (`in`, `cm`, `mm`, `pt`, `px`).
  - Orientation keywords: `portrait` and `landscape`.
  - Zero-margin support: Full bleed-to-edge layout when `@page { margin: 0; }` is specified.
- **Margin Box Grid (16 Standard Page Boxes)**:
  - Header margin boxes: `@top-left-corner`, `@top-left`, `@top-center`, `@top-right`, `@top-right-corner`.
  - Footer margin boxes: `@bottom-left-corner`, `@bottom-left`, `@bottom-center`, `@bottom-right`, `@bottom-right-corner`.
  - Side margin boxes: `@left-top`, `@left-middle`, `@left-bottom`, `@right-top`, `@right-middle`, `@right-bottom`.
- **Named Page Rules**:
  - Scoped page rules (`@page cover`, `@page landscape-table`, `@page appendix`) applied via the CSS `page: <name>` property.
- **Bleed & Crop Marks**:
  - Bleed area dimensioning (`bleed: <length>`).
  - Print marks (`marks: crop cross;`) for commercial printing, sheet alignment, and trim lines.

---

### 2.4 Break Management & Blank Page Insertion

- **Standard CSS Page Breaks**:
  - Full support for `break-before`, `break-after`, and `break-inside` on arbitrary block elements, headings, paragraphs, and list items.
  - Break keywords: `auto`, `avoid`, `always`, `page`, `left`, `right`, `recto`, `verso`, `column`.
- **Physical Print Parity Blank Pages**:
  - Automatically calculates whether the current page is recto (odd) or verso (even).
  - Inserts a blank page when `break-before` or `break-after` specifies `left` or `right` and the subsequent content requires opposite alignment.
- **Container Break Propagation**:
  - Automatically propagates break directives declared on child elements through parent wrapper containers without losing break intent.
- **Undisplayed Node Suppression**:
  - Strips non-rendered elements (`<script>`, `<style>`, `<template>`, `<noscript>`) and computed `display: none` subtrees.
  - Prevents extraneous trailing blank pages from being created by invisible metadata or scripts at the end of a document.

---

### 2.5 Table Pagination & Continuation Engine

- **Multi-Page Table Slicing**:
  - Divides tall tables across page breaks with respect for row boundaries.
  - Prevents mid-row text splitting using `tr { break-inside: avoid }`.
- **Repeated Headers & Footers**:
  - Automatically clones and re-stamps `<thead>` on every subsequent page where the table continues.
  - Supports multi-row header groups (`<thead><tr>...</tr><tr>...</tr></thead>`).
  - Automatically re-stamps `<tfoot>` on split pages when configured.
- **Multi-Page Rowspan Continuation**:
  - Automatically splits cells with `rowspan > 1` across page boundaries by inserting continuation cells on subsequent pages.
  - Configurable cell content repetition using `data-repeat-content="true"`.
- **Automatic Column Width Synchronization**:
  - Measures rendered cell column widths on page 1 and automatically locks identical column widths on continued tables across subsequent pages, avoiding visual width jumps.
- **Border Collapse Preservation**:
  - Preserves collapsed border styling (`border-collapse: collapse`) across table splits without border dropouts or overlapping artifacts.

---

### 2.6 Dynamic Content, Strings & Page Counters

- **Named Strings (`string-set`)**:
  - Extracts dynamic textual content from document headings or elements (`string-set: chapter-title content()`).
  - Injects strings into margin boxes via `content: string(chapter-title)`.
  - Supports scope keywords: `first`, `start`, `last`, `first-except`.
- **Page Counters**:
  - `counter(page)`: Current page number.
  - `counter(pages)`: Total page count, automatically updated on all pages in a post-render pass.
  - `counter-reset` and `counter-increment` for custom page numbering sections.
- **Cross-Reference Counters (`target-counter`)**:
  - Resolves target page numbers for internal hyperlinks (`content: target-counter(attr(href), page)`), powering automated Tables of Contents and index pages.
- **Selector Precision in Margin Boxes**:
  - Supports `:first`, `:last`, `:nth-of-type()`, and adjacent sibling (`+`) CSS selectors within generated content rules.

---

### 2.7 Footnotes & Note Placement (`footnotesPlugin`)

- **Footnote Out-of-Flow Float**:
  - Moves marked elements (`float: footnote`) from the inline body flow into the dedicated `@footnote` page area.
- **Inline Call Markers**:
  - Automatically generates superscript numerical call markers in the text body matching footnote numbers.
- **Multi-Page Slicing & Continuation Notices**:
  - Slices long footnotes that exceed available page budget across consecutive pages.
  - Renders configurable continuation markers (e.g. _"Continued on next page..."_).
- **Footnote Policies**:
  - Implements `footnote-policy: auto | line | block` to control when footnotes are deferred to subsequent pages.

---

### 2.8 Advanced Layout & Math Protection

- **Multi-Column Formatting (`columnsPlugin`)**:
  - Renders multi-column text flows using `columns`, `column-count`, and `column-gap`.
  - Supports spanning headlines across all columns via `column-span: all`.
  - Implements column balancing (`column-fill: balance`).
- **Math Formula Break Protection**:
  - Automatically protects display formulas and mathematical blocks from splitting mid-expression.
  - Out-of-the-box support for KaTeX (`.katex-display`), MathJax (`mjx-container`), and native MathML (`<math>`).
- **Widows & Orphans Control (`widowsOrphansPlugin`)**:
  - Enforces minimum line budgets at the start and end of paragraphs crossing page breaks (`orphans: 2; widows: 2;`).
- **PDF Outlines & Bookmarks (`bookmarksPlugin`)**:
  - Extracts document heading hierarchies (`<h1>` through `<h6>`) and `bookmark-level` / `bookmark-label` CSS properties into a structured outline tree for PDF book navigation.

---

### 2.9 Infinite Loop & Browser Freeze Resiliency

- **`LayoutProgressGuard`**:
  - Tracks layout progress (character offsets, block nodes, page budgets) on every pagination step.
  - Detects stagnant iterations where non-fitting content fails to advance or conflicting CSS break rules create oscillations.
  - Terminate gracefully with a typed `PrintedjsLayoutLimitError` instead of freezing the browser thread.
  - Provides detailed diagnostic metadata: culprit element selector, computed styles, last measured page, and iteration count.

---

### 2.10 Devtools & Visual Inspector (`@printedjs/devtools`)

- **Non-Layout Inspector Overlay**:
  - Renders a lightweight, non-invasive visual overlay directly on top of the document without altering page geometry, scroll coordinates, or print sizing.
  - Highlights page boundaries, sheet margins, bleed areas, and margin boxes.
- **Diagnostic Trace Metrics**:
  - Captures fine-grained performance timings: stylesheet load time, CSS parsing duration, pagination layout time, and plugin hook executions.
  - Exports structured `TraceReport` objects for automated profiling and CI verification.

---

### 2.11 Headless PDF CLI & Dual Drivers (`@printedjs/cli`)

- **Command-Line Interface**:
  - Standalone CLI command: `printedjs render input.html -o output.pdf`.
  - Custom format overrides (`--format A4`, `--format Letter`, `--landscape`, `--bleed 3mm`).
- **Dual Engine Architecture**:
  - `--engine playwright`: High-speed headless rendering via Playwright.
  - `--engine puppeteer`: Lightweight rendering via Puppeteer.
  - Automatic discovery of local Google Chrome / Chromium installations.
- **Developer Watch Mode**:
  - `--watch` flag automatically re-renders the output PDF upon file modification.

---

### 2.12 Drop-in Polyfill & Paged.js Compatibility (`@printedjs/polyfill`, `@printedjs/minimal`)

- **Drop-in Script Replacement**:
  - Single minified bundle (`printedjs.min.js`) providing automatic document pagination upon `DOMContentLoaded`.
  - Global `window.PagedPolyfill` and `window.Paged.Previewer` shims matching the exact API surface of legacy Paged.js.
- **Backward-Compatible CSS Mode (`pagedjsCompatible: true`)**:
  - Automatically emits dual CSS classes on all page elements (e.g. `class="printedjs_page pagedjs_page"`).
  - Mirrors all CSS custom properties (e.g. `--printedjs-width` and `--pagedjs-width`).
  - Enables seamless migration of existing legacy Paged.js templates without changing a single line of CSS.

---

### 2.13 Interactive Developer Playground (`apps/playground`)

- **Instant Live Preview**:
  - Real-time pagination powered by Vite development server (`pnpm dev`).
  - Monaco editor with syntax highlighting, EJS/Eta data binding, and live re-render.
- **Curated Production Templates**:
  - **Invoice**: Clean corporate invoice with items table, tax breakdown, and header/footer branding.
  - **Certificate of Completion**: Zero-margin landscape certificate with double borders and verified credential seals.
  - **Policy Agreement**: Multi-page contract with numbered clauses, signatures, and running headers.
  - **Financial Report**: Complex corporate report with multi-page data tables, KPI cards, and charts.
  - **Complex Matrix**: Multi-page data matrix demonstrating table header repeating and column width sync.
- **Grouped Visual Test Fixtures**:
  - Live `<optgroup label="Test Fixtures">` selector containing all 30 visual parity fixtures for interactive visual inspection and debugging.
- **Interactive Controls**:
  - Isolation mode toggle (`root` vs `iframe`).
  - View layout modes: Single page, Spread (two-page book preview), Fit-to-screen.
  - Visual overlay and diagnostic trace panel toggles.

---

### 2.14 Multi-Browser Engine Parity & CI

- **Cross-Engine Conformance**:
  - Verified across all three major web rendering engines: **Chromium**, **Firefox**, and **WebKit** (Safari).
- **Test Automation Suite**:
  - 111 unit tests (`vitest run`).
  - 75 DOM parity integration tests across all 3 browsers.
  - 90 visual pixel-parity tests across all 3 browsers (30 fixtures × 3 engines).
  - 100% green test suite (178/178 browser tests passing).
- **CI Workflow with Diagnostic Artifacts**:
  - Matrix testing on Node 24 and Ubuntu.
  - Automated failure artifact upload (`actions/upload-artifact@v4`) capturing traces and diff images on regression.
