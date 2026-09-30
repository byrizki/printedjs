# @printedjs/cli

Command-line runner and headless PDF generation utility for Printedjs.

`@printedjs/cli` renders HTML documents into print-ready, high-resolution PDF files with full support for CSS Paged Media specifications, dual browser driver support (Playwright and Puppeteer), and interactive watch mode.

---

## Features

- **High-Fidelity PDF Generation** — Renders documents with exact print margins, crop marks, bleed, running headers, and footnotes.
- **Dual Browser Engines** — Use either **Playwright** (`--engine playwright`) or **Puppeteer** (`--engine puppeteer`).
- **Interactive Watch Mode (`--watch`)** — Monitors source HTML and CSS files, automatically recompiling PDFs on every change.
- **Compatibility Modes** — Toggle legacy Paged.js class names (`--pagedjs-compatible`).
- **Programmatic Node API** — Seamlessly integrate into backend document rendering pipelines via `renderPdf()`.

---

## Installation

Install globally or as a project dev dependency:

```bash
pnpm add -D @printedjs/cli
```

Ensure a browser runtime is installed:

```bash
# If using Playwright:
pnpm dlx playwright install chromium

# Or if using Puppeteer:
pnpm add puppeteer
```

---

## CLI Usage

### Basic Rendering

```bash
# Render an HTML file to PDF
pnpm printedjs render document.html -o output.pdf

# Specify page size format and bleed
pnpm printedjs render document.html -o output.pdf --format A4 --bleed 3mm
```

### Engine Selection

```bash
# Render using Playwright (default)
pnpm printedjs render invoice.html -o invoice.pdf --engine playwright

# Render using Puppeteer
pnpm printedjs render invoice.html -o invoice.pdf --engine puppeteer
```

### Watch Mode

Ideal for developing and styling printable documents:

```bash
pnpm printedjs render invoice.html -o invoice.pdf --watch
```

### Command Options

```text
printedjs render <input> [options]

Arguments:
  <input>                     Path or URL to the source HTML document

Options:
  -o, --output <file>         Output PDF destination path (default: output.pdf)
  -f, --format <format>       Page format override (e.g. A4, Letter, Legal)
  -b, --bleed <dimension>     Bleed dimension (e.g. 3mm, 0.125in)
  -e, --engine <engine>       Browser engine: playwright | puppeteer (default: playwright)
  -w, --watch                 Watch input file and rebuild on change
  --pagedjs-compatible        Emit dual Printedjs and legacy Paged.js classes
  --no-pagedjs-compatible     Emit only modern Printedjs classes (default)
  --timeout <ms>              Render timeout in milliseconds (default: 30000)
  -h, --help                  Display CLI help
  -v, --version               Display version
```

---

## Programmatic API

Generate PDFs within your Node.js backend or microservice:

```typescript
import { renderPdf } from "@printedjs/cli";

const result = await renderPdf({
	input: "path/to/document.html",
	output: "path/to/document.pdf",
	format: "A4",
	bleed: "3mm",
	engine: "playwright",
	timeoutMs: 30000,
});

console.log(
	`Generated ${result.pageCount} pages at ${result.outputPath} in ${result.durationMs}ms`,
);
```

### Custom Puppeteer Integration

Use `printedjsPuppeteerBridge` with an existing Puppeteer `page` instance:

```typescript
import { printedjsPuppeteerBridge } from "@printedjs/cli";
import puppeteer from "puppeteer";

const browser = await puppeteer.launch();
const page = await browser.newPage();

await page.goto("https://my-app.internal/reports/123", { waitUntil: "networkidle0" });

const bridgeResult = await printedjsPuppeteerBridge(page, {
	output: "report.pdf",
	format: "A4",
});

await browser.close();
```

---

## License

MIT
