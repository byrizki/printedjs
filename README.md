# Printedjs

Modern, high-performance browser-native paginated document rendering.

Printedjs is a modular TypeScript redesign of legacy Paged.js, engineered for high reliability, deterministic lifecycle control, zero core DOM dependencies, and resilient edge-case handling.

---

## Workspace Packages

- **`@printedjs/core`** — Zero DOM/CSSOM pagination runtime, pure contracts, CSS AST facade, and progress-guarded paginator state machines.
- **`@printedjs/browser`** — Browser-facing renderer supporting both `root` container and `iframe` isolated surfaces, layout measurement, non-destructive cleanup, and page virtualization (`virtualizePages`).
- **`@printedjs/plugins`** — Standard preset and feature plugins:
  - `@page` rules (size, margins, bleed, marks)
  - Page breaks (`break-before`, `break-after`, `break-inside`, blank page insertion)
  - Running headers & footers (`string-set`, `string()`)
  - Generated content & margin boxes (`@top-left`, `@bottom-right`, sibling `+` and `:nth-of-type` selectors)
  - Counters (`counter(pages)`, `target-counter`)
  - Footnotes (`float: footnote`, `@footnote` area, multi-page slice continuations, `footnote-policy`)
  - Multi-column pagination (`column-count`, `column-gap`, `column-fill`, `column-span: all`)
  - Math & formula break protection (`.katex-display`, `mjx-container`, `<math>`)
  - Hyphenation preservation & boundary control
  - PDF outlines & bookmarks (`bookmarksPlugin`, hierarchical section trees)
  - Widows & orphans constraints
- **`@printedjs/minimal`** — Full bundled Printedjs package compiled to minimal, compact JavaScript (`printedjs.min.js`), including the complete engine, plugins, auto-init, and legacy Paged.js migration shims.
- **`@printedjs/polyfill`** — Compatibility layer for older browsers, providing DOM, observer (`ResizeObserver`, `IntersectionObserver`), and modern JavaScript standard polyfills for legacy browser environments.
- **`@printedjs/cli`** — Headless PDF generation CLI (`printedjs render input.html -o output.pdf`) with dual driver support (`--engine playwright` or `--engine puppeteer`), watch mode, and format overrides.
- **`@printedjs/devtools`** — Diagnostic trace collector and non-layout visual inspector overlay.
- **`apps/playground`** — Interactive developer fixture playground with surface and diagnostics toggles, powered by Vite dev server (`pnpm dev:playground`).

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

## Documentation

- [Documentation Hub](docs/README.md)
- [Feature Catalog & Paged.js Comparison](docs/features.md)
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
