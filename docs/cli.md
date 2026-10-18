# Headless PDF Generation CLI (`@printedjs/cli`)

`@printedjs/cli` compiles HTML and CSS Paged Media documents into high-resolution, vector-accurate PDF documents. It supports off-screen native WebViews (default) as well as headless browser drivers (Playwright and Puppeteer).

---

## 1. Installation

Install globally or as a project dev dependency:

```bash
pnpm add -D @printedjs/cli
# or npm install -D @printedjs/cli
```

### Optional Browser Engines

The default `webview` engine uses the bundled native `headless-webview` binary and requires no external browser downloads.

If you prefer browser automation drivers, install either:

```bash
# Optional Playwright driver
pnpm add -D playwright
pnpm dlx playwright install chromium

# Optional Puppeteer driver
pnpm add -D puppeteer
```

---

## 2. Command Line Usage

### Basic PDF Compilation

```bash
# Compile an HTML file to PDF using the default webview engine
pnpm printedjs render document.html -o document.pdf

# Set page format, landscape orientation, and bleed
pnpm printedjs render invoice.html -o invoice.pdf --format A4 --bleed 3mm
```

### Engine Selection

```bash
# Default native headless webview engine (lightweight, zero browser downloads)
pnpm printedjs render doc.html -o doc.pdf --engine webview

# Playwright engine
pnpm printedjs render doc.html -o doc.pdf --engine playwright

# Puppeteer engine
pnpm printedjs render doc.html -o doc.pdf --engine puppeteer
```

### Headless Linux & Docker

The native `webview` engine uses WebKitGTK and GTK 3 on Linux, which requires an active display connection. In headless environments (such as Docker, CI runners, or cloud VMs), run via `xvfb-run`:

```bash
xvfb-run -a pnpm printedjs render doc.html -o doc.pdf
```

### Options Reference

```text
Usage: printedjs render <input> [options]

Arguments:
  <input>                     Path or URL to the source HTML document

Options:
  -o, --output <file>         Destination path for the rendered PDF (default: output.pdf)
  -f, --format <format>       Page size format (A4, Letter, Legal, A3, etc.)
  -b, --bleed <dimension>     Bleed dimension (e.g. 3mm, 0.125in)
  -e, --engine <engine>       Rendering engine: webview | playwright | puppeteer (default: webview)
  -w, --watch                 Watch mode: automatically recompile on file changes
  --pagedjs-compatible        Emit dual Printedjs and legacy Paged.js CSS classes
  --no-pagedjs-compatible     Emit modern Printedjs CSS classes only (default)
  --timeout <ms>              Render and pagination timeout in milliseconds (default: 30000)
  -h, --help                  Display help information
  -v, --version               Display version
```

---

## 3. Programmatic API

You can call the rendering pipeline directly from Node.js applications or microservices:

```typescript
import { renderPdf } from "@printedjs/cli";

const result = await renderPdf({
	input: "./reports/quarterly.html",
	output: "./dist/quarterly.pdf",
	format: "A4",
	bleed: "3mm",
	engine: "webview",
	timeoutMs: 30000,
});

console.log(`Rendered ${result.pageCount} pages in ${result.durationMs.toFixed(1)}ms`);
console.log(`Saved output to: ${result.outputPath}`);
```

---

## 4. Standalone Desktop Binary (`headless-webview`)

The CLI bundles prebuilt native binaries for Windows (`headless-webview.exe`), macOS, and Linux powered by Wry. You can also run the binary directly:

```bash
headless-webview input.html -o output.pdf --wait-for "window.isReady === true" --format A4
```
