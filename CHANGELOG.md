# Changelog

All notable changes to the Printedjs project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-06

Initial public release of **Printedjs**, modern browser-native paginated document rendering engine redesigned from the ground up in TypeScript.

### Added

#### Core Engine (`@printedjs/core`)

- **Zero-DOM Architecture**: Headless core pagination runtime with pure contracts, state machines, and CSS AST facade.
- **Progress-Guarded Layout Loop**: Bounded pagination cycle with layout limit protection against infinite overflow loops.
- **Structured Error Handling**: Strongly typed layout exceptions (`PrintedjsLayoutLimitError`, `PrintedjsConfigError`).
- **Hook & Lifecycle Registry**: Extensible async lifecycle hooks (`beforeParsed`, `afterParsed`, `beforePageLayout`, `afterPageLayout`, `afterRendered`).

#### Browser Adapter (`@printedjs/browser`)

- **Dual Surface Support**: Rendering support for both shadow/root inline DOM containers and isolated `iframe` execution environments.
- **DOM Layout Measurement**: Precision subpixel layout measurement, fragmentation, and element cloning.
- **Page Virtualization**: Dynamic DOM pagination with spread and single-page presentation layout modes.
- **Anchor & ID Preservation**: Deterministic resolution of anchor tags and fragment links across multi-page boundaries.
- **Nested Table Fragmentation**: Cross-page splitting of complex and nested tables with automated `<thead>` and `<tfoot>` replication.

#### Plugins Suite (`@printedjs/plugins` & `@printedjs/plugin-*`)

- **Standard Preset (`@printedjs/plugin-preset`)**: Out-of-the-box bundle combining all standard W3C GCPM / Paged Media plugins.
- **Page Rules (`@printedjs/plugin-page-rules`)**: Declarative `@page` rules supporting page sizing, margins, bleeds, crop marks, and mirrored (`recto`/`verso`) page geometry.
- **Breaks (`@printedjs/plugin-breaks`)**: Complete support for `break-before`, `break-after`, `break-inside`, `avoid`, and page container break propagation.
- **Counters (`@printedjs/plugin-counters`)**: Multi-section page numbering supporting decimal, Roman (`roman`, `upper-roman`, `lower-roman`), alphabetic styles, section restarts, and `target-counter`.
- **Generated Content (`@printedjs/plugin-generated-content`)**: 16 W3C margin boxes layout, running headers, and margin box styling.
- **Named Strings (`@printedjs/plugin-strings`)**: Dynamic header/footer synchronization via `string-set` and `string()`.
- **Footnotes (`@printedjs/plugin-footnotes`)**: Inline footnote marker extraction, bottom `@footnote` container placement, and multi-page note continuation.
- **Columns (`@printedjs/plugin-columns`)**: Multi-column document layout (`column-count`, `column-gap`, `column-span: all`).
- **Widows & Orphans (`@printedjs/plugin-widows-orphans`)**: Boundary paragraph line clamping and orphan prevention.
- **Bookmarks (`@printedjs/plugin-bookmarks`)**: Hierarchical document heading extraction and PDF bookmark navigation outline.
- **Math (`@printedjs/plugin-math`)**: Formula break protection for KaTeX, MathJax, and native MathML.
- **Hyphenation (`@printedjs/plugin-hyphenation`)**: Soft hyphen preservation and linguistic hyphenation integration.
- **Lists (`@printedjs/plugin-lists`)**: Ordered list sequence continuity across multi-page fragmentation boundaries.
- **Views (`@printedjs/plugin-views`)**: Single-page and two-page spread view modes with active page change emission.
- **Community Plugins**:
  - `page-flip`: Interactive 3D flipbook presentation engine.
  - `eta`: Pre-pagination templating engine powered by Eta.

#### Standalone & Tooling Packages

- **Minimal Bundle (`@printedjs/minimal`)**: Zero-dependency all-in-one distribution bundle (`dist/index.js`, `dist/index.min.js`, `dist/index.global.js`) for CDN script tags. Includes auto-initialization and legacy Paged.js migration shims.
- **Polyfill Layer (`@printedjs/polyfill`)**: Older browser fallback shims and `Paged.Previewer` compatibility wrapper.
- **CLI (`@printedjs/cli`)**: Headless command-line PDF renderer (`printedjs render <input>`) supporting Playwright and Puppeteer backends.
- **Devtools (`@printedjs/devtools`)**: Visual inspection overlay, page guide rulers, diagnostic tracing, and render timing metrics.

#### Applications & Demos

- **Interactive Playground (`apps/playground`)**: Real-time multi-fixture editor with Monaco editor, dynamic surface switching, view mode toggles, and PDF preview.
- **Minimal Demo (`apps/minimal-demo`)**: Lightweight standalone example document showing multi-section Roman/Arabic page numbering and table-of-contents navigation.
- **GitHub Pages Pipeline**: Automated multi-app static artifact builder (`scripts/build-pages.ts`) for continuous deployment.
