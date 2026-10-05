# Printedjs

Modern, high-performance browser-native paginated document rendering.

Printedjs is a modular TypeScript redesign of legacy Paged.js, engineered for high reliability, deterministic lifecycle control, zero core DOM dependencies, and resilient edge-case handling.

---

## Packages

Printedjs is maintained as a modular pnpm monorepo with clean architectural boundaries:

### Core & Runtime Packages

- [`@printedjs/core`](packages/core/README.md) — Zero DOM/CSSOM pagination runtime, pure contracts, CSS AST facade, and progress-guarded state machines
- [`@printedjs/browser`](packages/browser/README.md) — Browser renderer supporting `root` container and `iframe` surfaces, layout measurement, and page virtualization
- [`@printedjs/plugins`](packages/plugins/README.md) — Standard preset, core layout plugins, and community extensions ([see available plugins](#available-plugins))

### Distribution & Tooling Packages

- [`@printedjs/minimal`](packages/minimal/README.md) — Standalone bundle (`printedjs.min.js`) with complete engine, plugins, auto-init, and legacy Paged.js migration shims
- [`@printedjs/polyfill`](packages/polyfill/README.md) — Compatibility layer for older browsers, providing DOM and observer polyfills
- [`@printedjs/cli`](packages/cli/README.md) — Headless PDF generation CLI (`printedjs render`) with Playwright and Puppeteer drivers
- [`@printedjs/devtools`](packages/devtools/README.md) — Diagnostic trace collector and non-layout visual inspector overlay

### Applications & Demos

- [`apps/playground`](apps/playground) — Interactive developer fixture playground with surface and diagnostics toggles (`pnpm dev`)
- [`apps/minimal-demo`](apps/minimal-demo) — Zero-config standalone demo showcasing static HTML document pagination using `@printedjs/minimal` (`pnpm dev:minimal`)

---

## Available Plugins

All core plugins can be loaded together via [`@printedjs/plugin-preset`](packages/plugins/core/preset/README.md) or installed individually for fine-grained tree-shaking:

### Core Plugins

- [`@printedjs/plugin-page-rules`](packages/plugins/core/page-rules/README.md) — `@page` size, margins, orientation, bleeds, and crop marks
- [`@printedjs/plugin-breaks`](packages/plugins/core/breaks/README.md) — CSS `break-before`, `break-after`, `break-inside`, and avoid rules
- [`@printedjs/plugin-strings`](packages/plugins/core/strings/README.md) — Named strings (`string-set`, `string()`) for running headers and footers
- [`@printedjs/plugin-generated-content`](packages/plugins/core/generated-content/README.md) — 16 W3C margin boxes, track distribution, and running elements
- [`@printedjs/plugin-counters`](packages/plugins/core/counters/README.md) — Page numbering (`counter(page)`, `counter(pages)`), Roman/alpha styles, and `target-counter`
- [`@printedjs/plugin-footnotes`](packages/plugins/core/footnotes/README.md) — W3C GCPM `float: footnote`, `@footnote` area, and continuation slicing
- [`@printedjs/plugin-columns`](packages/plugins/core/columns/README.md) — Multi-column layout (`column-count`, `column-gap`, `column-span: all`, balancing)
- [`@printedjs/plugin-widows-orphans`](packages/plugins/core/widows-orphans/README.md) — Typography constraints at page boundaries (`widows`, `orphans`)
- [`@printedjs/plugin-math`](packages/plugins/core/math/README.md) — Formula break protection for KaTeX, MathJax, and MathML
- [`@printedjs/plugin-hyphenation`](packages/plugins/core/hyphenation/README.md) — Soft hyphen preservation and hyphenation normalization
- [`@printedjs/plugin-bookmarks`](packages/plugins/core/bookmarks/README.md) — Document heading hierarchy extraction and PDF bookmark outline
- [`@printedjs/plugin-lists`](packages/plugins/core/lists/README.md) — Ordered list numbering and sequence continuity across page splits
- [`@printedjs/plugin-running-headers`](packages/plugins/core/running-headers/README.md) — Dynamic running headers and footers utility alias
- [`@printedjs/plugin-views`](packages/plugins/core/views/README.md) — Presentation view modes (single page, spread)
- [`@printedjs/plugin-preset`](packages/plugins/core/preset/README.md) — Standard bundle combining all core layout plugins

### Community Plugins

- [`@printedjs/plugin-page-flip`](packages/plugins/community/page-flip/README.md) — Interactive 3D flipbook page-turning presentation engine
- [`@printedjs/plugin-eta`](packages/plugins/community/eta/README.md) — Dynamic pre-pagination document templating powered by Eta

---

## Quick Start

```bash
pnpm add @printedjs/browser @printedjs/plugins
```

```typescript
import { createRenderer } from "@printedjs/browser";
import { standardPreset } from "@printedjs/plugins";

const target = document.querySelector("#output")!;

const renderer = createRenderer({
	target,
	isolation: "root", // or "iframe" for total style & script sandboxing
	plugins: standardPreset(),
});

const result = await renderer.render({
	content: {
		html: `
      <style>
        @page {
          size: letter;
          margin: 1in;
          @bottom-center {
            content: counter(page);
          }
        }
      </style>
      <h1>Document Title</h1>
      <p>Content flows cleanly across page boundaries.</p>
    `,
	},
});

console.log(`Rendered ${result.pages.length} pages.`);

// Clean up completely with zero DOM residue:
renderer.destroy();
```

### Headless PDF Generation (CLI)

```bash
# Render HTML document to PDF with print bleed and A4 format (Playwright or Puppeteer)
pnpm printedjs render document.html -o document.pdf --format A4 --bleed 3mm --engine playwright
pnpm printedjs render document.html -o document.pdf --format A4 --engine puppeteer

# Live watch mode for iterative document authoring
pnpm printedjs render document.html -o document.pdf --watch
```

---

## Printedjs vs. Paged.js Feature Comparison

| Feature / Capability                                                          | Printedjs | Paged.js |
| :---------------------------------------------------------------------------- | :-------: | :------: |
| **CSS `@page` Rules** (sheet sizes, margins, bleed, crop marks)               |    ✅     |    ✅    |
| **CSS Margin Boxes** (16 standard margin boxes)                               |    ✅     |    ✅    |
| **Page Counters & Styles** (roman, alpha, `counter(pages)`, `target-counter`) |    ✅     |    ✅    |
| **Named Strings** (`string-set`, running headers & footers)                   |    ✅     |    ✅    |
| **Standard Page Breaks** (`break-before`, `break-after`, `avoid`)             |    ✅     |    ✅    |
| **Drop-in `<script>` Polyfill** (auto-render on page load)                    |    ✅     |    ✅    |
| **Cross-Browser Engine Parity** (Chromium, Firefox, WebKit)                   |    ✅     |    ⚠️    |
| **Physical Blank Page Insertion** (`recto` / `verso` spreads)                 |    ✅     |    ⚠️    |
| **Table Header & Footer Repeating** (`<thead>` / `<tfoot>`)                   |    ✅     |    ⚠️    |
| **Multi-Column Formatting** (`column-count`, balancing)                       |    ✅     |    ⚠️    |
| **Footnote Layout** (`float: footnote`, continuations)                        |    ✅     |    ⚠️    |
| **Cross-Page Table Column Width Synchronization**                             |    ✅     |    ❌    |
| **Multi-Page Table `rowspan` Continuation**                                   |    ✅     |    ❌    |
| **Math Formula Break Protection** (KaTeX, MathJax, MathML)                    |    ✅     |    ❌    |
| **Infinite Loop & Freeze Guard** (`LayoutProgressGuard`)                      |    ✅     |    ❌    |
| **DOM Isolation Surfaces** (in-place `root` or sandboxed `iframe`)            |    ✅     |    ❌    |
| **Clean Teardown** (deterministic `destroy()`, zero DOM residue)              |    ✅     |    ❌    |
| **Pure Zero-DOM Core** (headless Node / Worker execution)                     |    ✅     |    ❌    |
| **Page Virtualization** (smooth scrolling on 200+ pages)                      |    ✅     |    ❌    |
| **Incremental Re-Pagination** (`renderIncremental`)                           |    ✅     |    ❌    |
| **100% Strict TypeScript** (strict types & exported contracts)                |    ✅     |    ❌    |
| **Native Headless PDF CLI** (Playwright & Puppeteer drivers)                  |    ✅     |    ❌    |

_Legend: ✅ Full Support &nbsp;\|&nbsp; ⚠️ Partial / Limited &nbsp;\|&nbsp; ❌ Unsupported_

### Bundle Size Comparison

Printedjs delivers a significantly leaner footprint than legacy Paged.js, with tree-shakable modular packages for modern bundlers:

| Distribution / Bundle                                  |   Minified   |    Gzip     |   Brotli    |  vs Paged.js   |
| :----------------------------------------------------- | :----------: | :---------: | :---------: | :------------: |
| **Paged.js Polyfill** (`paged.polyfill.min.js`)        |   504.1 KB   |   99.0 KB   |   83.6 KB   |    Baseline    |
| **Printedjs Standalone Bundle** (`@printedjs/minimal`) | **200.1 KB** | **52.2 KB** | **44.9 KB** |   **-60.3%**   |
| **Printedjs Browser Renderer** (`@printedjs/browser`)  |   105.2 KB   |   19.4 KB   |   16.7 KB   | Modular import |
| **Printedjs Core Engine** (`@printedjs/core`)          |   18.2 KB    |   4.6 KB    |   4.1 KB    | Pure zero-DOM  |

---

## Documentation

- [Documentation Hub](docs/README.md)
- [Architecture & Design Principles](docs/architecture.md)
- [Package Catalog & Overview](docs/packages-overview.md)
- [Migrating from Paged.js](docs/migrating-from-pagedjs.md)
- [Plugin Authoring Guide](docs/plugin-authoring.md)
- [Headless PDF CLI](docs/cli.md)
- [Release Readiness & Packaging](docs/release-readiness.md)
- [Project Roadmap](docs/roadmap.md)

---

## Verification Pipeline

```bash
# Verify code formatting, linting, typechecks, and unit test suite
pnpm verify

# Build all packages and applications
pnpm build

# Run browser tests across engines (Chromium, Firefox, WebKit)
pnpm test:browser

# Validate distribution package exports and bundles
pnpm pack:check
```

---

## Baseline Parity Corpus

Printedjs is rigorously validated against the 122-fixture legacy Paged.js corpus located in `tests/fixtures/`, with verified accepted baselines in `tests/baseline/accepted/`.

---

## Credits & Acknowledgments

Printedjs is inspired by and builds upon the pioneering work of [Paged.js](https://github.com/pagedjs/pagedjs) by the Cabbage Tree Labs community. We are deeply grateful to the Paged.js authors and contributors for championing CSS Paged Media standards in browsers and providing the foundational groundwork that made this project possible.
