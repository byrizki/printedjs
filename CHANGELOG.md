# Changelog

All notable changes to the Printedjs project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3] - 2026-10-19

### Fixed

- fix: Webview2 2MB limit html string with temp file workaround

## [0.2.2] - 2026-10-19

### Fixed

- fix(dotnet): utf8 enforcement input string for non utf8 chars

### Changed

- chore: update versioning script

## [0.2.1] - 2026-10-18

### Added

#### Comprehensive Documentation Site (`docs/`)

- **Bilingual Documentation**: Complete Nuxt Content documentation portal in English (`docs/content/en/`) and Indonesian (`docs/content/id/`) covering Getting Started, How-to Guides, Core Architecture, and GCPM Feature deep-dives.
- **Interactive Live Feature Previews**: Built-in interactive demo component (`FeaturePreview.vue`) with tabbed live preview and editable HTML/CSS source code for all W3C GCPM features.
- **Architecture Diagrams & Visuals**: Native Mermaid diagram component (`MermaidDiagram.vue`) and interactive minimal demo runner (`MinimalDemoPreview.vue`).
- **GitHub Pages Deployment Workflow**: Automated CI/CD pipeline (`.github/workflows/deploy-pages.yml`) for continuous deployment to GitHub Pages.

#### CLI & Automation Drivers (`@printedjs/cli`)

- **Framework-Aware Wait Flags**: Added `--wait-printedjs` and `--wait-pagedjs` flags to automatically wait for document pagination completion without requiring manual JavaScript expressions.
- **Optional Wait Expressions**: Made `--wait-for` optional, allowing instant PDF export upon native DOM settling.

#### Performance Benchmarks Suite

- **End-to-End PDF Export Benchmark**: Added multi-engine PDF generation benchmark runner (`scripts/benchmark-pdf.ts` / `pnpm benchmark:pdf`) measuring execution latency, peak RSS memory, and binary file size across Typst (`v0.14.2`), Printedjs Headless WebView, Printedjs Playwright, Printedjs Puppeteer, and Paged.js.
- **10-Page Standard Fixture**: Added realistic 10-page enterprise financial report test fixtures in HTML and Typst (`benchmarks/fixtures/`).
- **Persisted Metric Baselines**: Persisted verified benchmark results in `benchmarks/benchmark-results.json`.

#### 3D Page Flip Plugin (`@printedjs/plugin-page-flip`)

- **Standalone Global Bundle**: Added browser IIFE bundle target (`dist/page-flip.min.global.js`) for direct CDN script tag usage.
- **Page Density Configuration**: Added `density` option (`"soft" | "hard"`) and `data-density` attribute support.
- **Navigation APIs**: Added `flipNext()` and `flipPrev()` helper methods on `PageFlipController`.

### Fixed

- **CLI Webview Execution Speed**: Resolved an issue where native headless webview rendering delayed up to 15 seconds waiting for an empty wait expression.
- **Table Rowspan Slicing & Header Restamping**: Fixed broken table column alignments across page breaks by properly configuring `class="repeat-header repeat-rowspan" data-repeat="true"` and `data-repeat-content="true"` in demo templates and documentation.
- **3D Flipbook Backgrounds**: Fixed page transparency and margin leakage in `@printedjs/plugin-page-flip` by enforcing opaque background fills and zero margin overrides on book sheets.
- **Native iOS Headless WebView Linker**: Resolved Swift toolchain linker requirements and build friction in React Native iOS applications through library-side encapsulation.

## [0.2.0] - 2026-10-16

### Added

#### Headless WebView for React Native (`@printedjs/headless-webview`)

- **Dual Architecture Support**: Complete support for both React Native New Architecture (TurboModules via `RNHeadlessWebViewSpec`) and Legacy Architecture (Bridge).
- **Native Android Implementation**: High-performance headless runtime in Kotlin (`HeadlessWebViewModule`) leveraging Android's built-in `android.webkit.WebView` and `android.print.PdfPrintHelper` with package-private `PrintDocumentAdapter` print callbacks.
- **Native iOS Implementation**: Full Swift implementation (`HeadlessWebviewModule`) leveraging `WebKit.WKWebView`.
  - Native vector PDF rendering via `WKWebView.createPDF` on iOS 14+.
  - Fully headless legacy fallback on iOS < 14 (iOS 12+) via UIKit `UIPrintPageRenderer`, `webView.viewPrintFormatter()`, and `UIGraphicsBeginPDFContextToData`.
- **Packaging & Package Managers**: Dual iOS distribution support with CocoaPods (`react-native-headless-webview.podspec` with `install_modules_dependencies`) and SwiftPM (`Package.swift`).
- **React Hook**: `useHeadlessWebView` lifecycle hook for headless instance creation, HTML loading, script evaluation, and PDF export.
- **Example & Test Application (`packages/headless-webview/example`)**: Comprehensive dual-architecture testbed with automated verification script (`scripts/test-both-arch.ts`) testing Android legacy/new architecture compilation, CocoaPods spec parsing, SwiftPM manifests, and clean tarball packaging.

#### Headless WebView for .NET (`PrintedJs.HeadlessWebView`)

- **Cross-Platform NuGet Library**: Native headless webview and vector PDF rendering for .NET (`netstandard2.1`, .NET 8 / 9 / 10).
- **Multi-OS Runtime Resolution**: Dynamic `LibraryLoader` automatically resolving platform-specific prebuilt runtimes (`win-x64`, `win-arm64`, `osx-x64`, `osx-arm64`, `linux-x64`, `linux-arm64`) from `runtimes/{rid}/native/`.
- **Asynchronous API**: `HeadlessWebView.CreateAsync()`, `LoadHtmlAsync()`, `LoadUrlAsync()`, `EvaluateJavascriptAsync()`, `PrintToPdfAsync()`, and `PrintToPdfFileAsync()`.

#### Headless WebView Core Rust Engine (`headless-webview-core`)

- **Wry Headless Integration**: Native desktop headless webview core utilizing vendored `wry-headless` engine.
- **C-ABI & UniFFI Scaffolding**: Exported C FFI interfaces and UniFFI interface definitions (`headless_webview.udl`) powering .NET P/Invoke and standalone desktop CLI prebuilts.

#### CLI & Tooling Updates (`@printedjs/cli`)

- **Native Webview Default**: Made native OS webview the default rendering engine for `printedjs render`, with fallback support for Playwright and Puppeteer.
- **Prebuilt Desktop Bundler**: Added `scripts/bundle-cli-prebuilts.sh` to package native desktop binaries directly into published `@printedjs/cli` tarballs.
- **Version Management**: Enhanced `scripts/bump-version.ts` to synchronize versions across workspace npm packages, .NET NuGet `.csproj`, and Rust `Cargo.toml`.

#### CI/CD & Release Pipeline

- **Automated Dual-Architecture Verification**: Added automated React Native packaging and dual-architecture validation (`pnpm test:rn:example`) to CI and Release workflows.
- **NuGet Prebuilt Content Verifier**: Added `scripts/verify-nupkg.ts` (`pnpm verify:nupkg`) to inspect `.nupkg` packages, ensuring prebuilt native runtimes (`linux-x64`, `osx-arm64`, `osx-x64`, `win-x64`) are bundled with verified binary sizes and format magic bytes (ELF, Mach-O, PE).
- **Multi-Platform Desktop Runtime Bundling**: Automated compilation, cross-compilation, and artifact distribution of .NET desktop native runtimes across Linux, macOS (Apple Silicon + Intel), and Windows in GitHub Actions release pipeline.
- **Automated NuGet Publishing**: Added .NET SDK setup, `dotnet pack`, and automated publishing to NuGet.org in release workflow.

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
