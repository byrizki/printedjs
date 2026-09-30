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
