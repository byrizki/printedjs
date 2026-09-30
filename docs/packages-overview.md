# Printedjs Package Catalog

Printedjs is maintained as a clean, modular pnpm monorepo. Each package has an isolated scope, clearly defined boundaries, and strict dependency rules.

---

## Package Overview

| Package                                                 | Zero-DOM?        | Primary Outputs                    | Entry Point | Purpose                                                           |
| :------------------------------------------------------ | :--------------- | :--------------------------------- | :---------- | :---------------------------------------------------------------- |
| [`@printedjs/core`](../packages/core/README.md)         | **Yes**          | ESM + Types                        | `index.ts`  | Paginator contracts, state machine, CSS AST facade, loop guards   |
| [`@printedjs/browser`](../packages/browser/README.md)   | No               | ESM + IIFE + Types                 | `index.ts`  | Browser renderer, Range measurement, DOM layout adapter, surfaces |
| [`@printedjs/plugins`](../packages/plugins/README.md)   | **Yes** (Facade) | ESM + IIFE + Types                 | `index.ts`  | Standard paged media plugins, margin boxes, running headers       |
| [`@printedjs/devtools`](../packages/devtools/README.md) | No               | ESM + Types                        | `index.ts`  | Lifecycle diagnostic tracing, metrics, non-layout overlay widget  |
| [`@printedjs/polyfill`](../packages/polyfill/README.md) | No               | ESM + IIFE + Types                 | `index.ts`  | Browser polyfills for legacy DOM and observer environments        |
| [`@printedjs/minimal`](../packages/minimal/README.md)   | No               | Minified IIFE (`printedjs.min.js`) | `index.ts`  | All-in-one drop-in script with auto-init for browser pages        |
| [`@printedjs/cli`](../packages/cli/README.md)           | No               | Node ESM + Binary                  | `cli.ts`    | Headless PDF generation CLI with Playwright & Puppeteer engines   |
| `apps/playground`                                       | No               | Web Application                    | `main.ts`   | Interactive browser studio with Monaco editor & live previews     |

---

## Detailed Package Specifications

### 1. `@printedjs/core`

- **Location:** `packages/core`
- **Dependencies:** `css-tree`
- **Zero-DOM Boundary:** Must NOT import browser globals (`window`, `document`, `HTMLElement`). Runs in any JavaScript runtime including Node, Deno, Bun, and browser workers.
- **Key Exports:**
  - Contracts: `RenderSession`, `RenderRequest`, `PageResult`, `PluginContext`
  - Error Classes: `PrintedjsError`, `PrintedjsInputError`, `PrintedjsStylesheetError`, `PrintedjsAbortError`, `PrintedjsPluginError`, `PrintedjsLayoutLimitError`
  - CSS Parser: `parseCss`, `generateCss`, `stripPageRules`, AST node types
  - Paginator: `Paginator`, `LayoutProgressGuard`, `orderPlugins`

### 2. `@printedjs/browser`

- **Location:** `packages/browser`
- **Dependencies:** `@printedjs/core`
- **Key Exports:**
  - `BrowserRenderer`: Main renderer implementation managing the pagination lifecycle
  - `createRenderer`: Factory function for instantiating renderers
  - Surfaces: `RootSurface` (container-based), `IframeSurface` (shadow browsing context)
  - DOM Adapter: `DomLayoutAdapter` (Range-based layout measurement and DOM node slicing)
  - Page Shell: `createPageShell`, `PAGE_SHELL_CSS` (structural CSS for page containers)
  - Virtualizer: `virtualizePages` (virtualized DOM windowing for large documents)

### 3. `@printedjs/plugins`

- **Location:** `packages/plugins`
- **Dependencies:** `@printedjs/core`
- **Key Exports:**
  - `standardPreset()`: Combines all standard Paged Media plugins in sorted order
  - Plugins:
    - `pageRulesPlugin`: `@page` parsing, margin boxes, paper sizes, orientations, bleed, marks
    - `breaksPlugin`: Page and column break rules (`break-before`, `break-after`, `break-inside`)
    - `stringsPlugin`: Dynamic string extraction (`string-set`, `string()`)
    - `runningHeadersPlugin`: Running header stamping (`position: running(...)`, `element(...)`)
    - `generatedContentPlugin`: 16 CSS margin boxes and margin track distribution
    - `countersPlugin`: `counter(pages)` and `target-counter` cross-references
    - `footnotesPlugin`: Footnote extraction and bottom-of-page placement
    - `columnsPlugin`: Multi-column flow and balancing
    - `mathPlugin`: Overflow protection for KaTeX, MathJax, and MathML
    - `bookmarksPlugin`: Hierarchical document outline trees
    - `hyphenationPlugin`: Word boundary and hyphenation preservation
    - `widowsOrphansPlugin`: Widow and orphan constraints

### 4. `@printedjs/devtools`

- **Location:** `packages/devtools`
- **Dependencies:** `@printedjs/core`
- **Key Exports:**
  - `devtoolsPlugin`: Lifecycle observer recording layout duration, memory, and warnings
  - `TraceCollector`: In-memory aggregator for lifecycle trace events
  - `createDevtoolsOverlay`: Floating DOM overlay visualizing pages, metrics, and warnings

### 5. `@printedjs/polyfill`

- **Location:** `packages/polyfill`
- **Dependencies:** `@printedjs/core`, `@printedjs/browser`, `@printedjs/plugins`
- **Key Exports:**
  - Polyfill loader checking for missing browser primitives
  - Exposes `window.Paged`, `window.PagedPolyfill`, and `window.Printedjs` for legacy script compatibility

### 6. `@printedjs/minimal`

- **Location:** `packages/minimal`
- **Dependencies:** Bundles core, browser, plugins, and polyfills
- **Key Exports:**
  - Standalone single-file bundle (`printedjs.min.js`)
  - Auto-initializes on `DOMContentLoaded` when loaded via `<script>` tag
  - Dispatches `printedjs:rendered` custom event upon completion

### 7. `@printedjs/cli`

- **Location:** `packages/cli`
- **Dependencies:** `@printedjs/core`, `@printedjs/browser`, `@printedjs/plugins`
- **Key Exports:**
  - Binary executable: `printedjs`
  - Commands: `render <input>` to compile HTML documents to production PDF files
  - Bridges: `printedjsPuppeteerBridge`, `renderPdf` for programmatic Node.js workflows

### 8. `apps/playground`

- **Location:** `apps/playground`
- **Framework:** Vite + TypeScript + Monaco Editor
- **Features:**
  - Instant live rendering and dual-page spread preview modes
  - Dynamic template editing powered directly by `eta` with BigInt conversion
  - Real-world paged media templates: certificates, invoices, multi-page financial reports
  - Surface isolation toggles (`root` vs `iframe`) and devtools overlays
