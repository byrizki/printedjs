# Printedjs Implementation Plan: Enhanced Counters, Built-in Page Views & Future Horizons

This document specifies the technical architecture, execution roadmap, and verification criteria for **Phase 17** (Enhanced Page Counters & Custom Pagination), **Phase 18** (Built-in Page View Plugins: Single, Spread & Flip Book), and **Future Horizons** (Phase 19+).

---

## 1. Feature 1: Enhanced Page Counter & Custom Numbering Pagination

### 1.1 Objective & Scope

Upgrade the Printedjs counter subsystem to support publishing-grade pagination controls:

- **Custom Numbering Styles**: Native and converted support for Roman numerals (`lower-roman`, `upper-roman`), Latin alphabetic (`lower-alpha`, `upper-alpha`), and padded decimals (`decimal-leading-zero`).
- **Page Numbering Restarts**: Ability to reset page numbering (e.g. frontmatter in Roman numerals `i, ii, iii...`, mainmatter restarting at page `1`).
- **Cross-Reference Style Preservation**: Enhanced `target-counter()` evaluation that formats internal links (e.g. Table of Contents, Index) according to the destination page's numbering format.
- **Physical vs. Logical Decoupling**: Separation between physical sheet indices (`data-physical-page-number`) and logical pagination (`data-page-number`, `data-page-formatted`).
- **Section-Scoped Page Totals**: Support for section-level totals (e.g. "Page 1 of 12" in Section A, alongside document-wide total pages).

---

### 1.2 Subsystem Architecture

```text
Document Source (CSS / HTML)
  │
  ├─► Declarative Reset / Format Directives:
  │     • CSS: @page frontmatter { @bottom-center { content: counter(page, lower-roman); } }
  │     • CSS: .chapter-start { break-before: page; counter-reset: page 1; }
  │     • HTML: <section data-page-counter-reset="1" data-page-counter-style="lower-roman">
  │
  ├─► Layout Engine (DomLayoutAdapter & Page Shell):
  │     • Detects counter resets at page boundary transitions
  │     • Computes { physicalPage, logicalPage, formatStyle, sectionIndex }
  │     • Emits DOM attributes & CSS Custom Properties on .printedjs_page:
  │         - data-physical-page-number="4"
  │         - data-page-number="1"
  │         - data-page-style="lower-roman"
  │         - data-page-formatted="i"
  │         - style="--printedjs-page-number: 1; --printedjs-section-page-count: 24;"
  │
  ├─► CSS Transform & Margin Box Evaluation:
  │     • Margin boxes evaluate counter(page, lower-roman) or attr(data-page-formatted)
  │     • target-counter(attr(href), page, lower-roman) extracts requested format
  │
  └─► Post-Render Plugin Pass (countersPlugin):
        • Calculates section-level page totals
        • Resolves target-counter and target-text cross-references with format fidelity
```

---

### 1.3 Technical Specifications

#### A. Numbering Formatter Utility (`packages/plugins/src/counters/formatters.ts`)

Zero-dependency formatting utilities converting positive integers (`1..3999`):

- `formatPageNumber(value: number, style: PageCounterStyle): string`
- Supported styles:
  - `decimal`: `1, 2, 3...`
  - `lower-roman`: `i, ii, iii, iv, v, vi, vii, viii, ix, x...`
  - `upper-roman`: `I, II, III, IV, V, VI, VII, VIII, IX, X...`
  - `lower-alpha` / `lower-latin`: `a, b, c... z, aa, ab...`
  - `upper-alpha` / `upper-latin`: `A, B, C... Z, AA, AB...`
  - `decimal-leading-zero`: `01, 02, 03... 10...`

#### B. Reset Detection in Layout Engine (`DomLayoutAdapter`)

- Inspect top-level nodes scheduled for the next page in `remainingWork`.
- If a node or its ancestor declares `counter-reset: page <value>` or `data-page-counter-reset="<value>"`, record the reset offset for subsequent pages.
- Track current logical page number and section index throughout pagination passes.

#### C. Page Shell DOM Contract (`packages/browser/src/dom/page-shell.ts`)

Each `.printedjs_page` element will output:

- `data-physical-page-number`: The 1-based sequential sheet index (1, 2, 3, 4...).
- `data-page-number`: The logical page number in the current section (1, 2, 3...).
- `data-page-style`: Active style format (`decimal`, `lower-roman`, etc.).
- `data-page-formatted`: The rendered string representation (`"iv"`, `"1"`, `"A"`).
- Inline CSS custom property `--printedjs-page-number: <n>`.

#### D. Enhanced `target-counter` in `countersPlugin`

- Update stylesheet transformer regular expression:
  ```regexp
  target-counter\s*\(\s*attr\s*\(\s*href(?:\s+url)?\s*\)\s*,\s*page(?:\s*,\s*([a-zA-Z0-9_-]+))?\s*\)
  ```
- Store the target format identifier in `data-target-page-style`.
- In `afterRender`, retrieve the target element's containing page, evaluate the logical page number, and format it matching either the link's explicit style or the page's default style.

---

## 2. Feature 2: Built-in Page View Plugins (`@printedjs/plugins`)

### 2.1 Objective & Scope

Move view modes out of ad-hoc playground CSS into modular, reusable plugins in `@printedjs/plugins`:

- **`singlePageViewPlugin()`**: Centered single-sheet scroll/card view with elevation shadows and active page tracking.
- **`spreadPageViewPlugin()`**: 2-page facing book layout with recto/verso pairing, cover offset, and spine shadow.
- **`flipBookViewPlugin()`**: Interactive 3D page turning with drag/curl physics, keyboard controls, and synthetic paper rustle sound.
- **`pageViewsPlugin({ mode, options })`**: Unified manager for dynamic view switching.
- **Strict Print Isolation**: All view presentation rules are scoped to `@media screen`; printing (`window.print()` or headless CLI) remains 100% unaltered standard paged media.
- **Playground Modernization**: Refactor `apps/playground` to consume the built-in plugins directly.

---

### 2.2 Directory & Module Structure

```text
packages/plugins/src/views/
├── single-page/
│   ├── plugin.ts            # singlePageViewPlugin() implementation
│   ├── styles.ts            # Screen-only styling for single-page presentation
│   └── types.ts             # SinglePageViewOptions
├── spread-page/
│   ├── plugin.ts            # spreadPageViewPlugin() implementation
│   ├── layout.ts            # Recto/verso pairing, cover offset & spine shadow
│   └── types.ts             # SpreadPageViewOptions
├── flip-book/
│   ├── plugin.ts            # flipBookViewPlugin() implementation
│   ├── controller.ts        # 3D turn animation, gesture handling & state machine
│   ├── sound.ts             # Web Audio synthetic paper rustle (zero asset footprint)
│   └── types.ts             # FlipBookViewOptions, FlipBookController
├── manager.ts               # pageViewsPlugin({ mode }) controller
└── index.ts                 # Public exports
```

---

### 2.3 Detailed View Specifications

#### A. Single Page View (`singlePageViewPlugin`)

- **Visual Presentation**: Pages stacked vertically in a centered layout with elevation shadow (`box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4)`).
- **Navigation**: Supports scroll-based navigation and programmatic jump-to-page.
- **Configuration**:
  ```typescript
  export interface SinglePageViewOptions {
  	readonly gap?: number | string; // default: "32px"
  	readonly shadow?: boolean; // default: true
  	readonly autoCenter?: boolean; // default: true
  }
  ```

#### B. Spread Page View (`spreadPageViewPlugin`)

- **Visual Presentation**: 2-page facing spread matching physical book layout.
- **Cover Page Geometry**:
  - Page 1 acts as a standalone **recto** (right-hand) cover page, positioned on the right half of the spread grid with a leading spacer.
  - Pages 2 & 3, 4 & 5 form facing pairs (verso on left, recto on right).
  - Last odd page (if applicable) aligns as a standalone back cover.
- **Physical Book Details**:
  - Center gutter / spine fold shadow (`box-shadow: inset 10px 0 20px -10px rgba(0, 0, 0, 0.15)`).
- **Configuration**:
  ```typescript
  export interface SpreadPageViewOptions {
  	readonly coverPage?: boolean; // default: true (page 1 is solo right page)
  	readonly spineShadow?: boolean; // default: true (realistic book fold)
  	readonly gutter?: number | string; // default: "0px"
  }
  ```

#### C. Flip Book Page View (`flipBookViewPlugin`)

- **Visual Presentation**: Realistic 3D animated book container.
- **3D Transform Pipeline**:
  - CSS perspective viewport (`perspective: 2000px`, `transform-style: preserve-3d`).
  - Active spread displays current verso and recto pages.
  - Turning page animates along the Y-axis spine pivot (`transform-origin: left center` or `right center`) with dynamic shading gradient that peaks at 90° and flattens out.
- **Interaction Controls**:
  - **Click-to-flip**: Clicking the outer edge or corner turns the page.
  - **Drag-to-turn**: Pointer drag or mobile touch swipe curls and flips proportional to gesture.
  - **Keyboard**: `ArrowLeft` / `ArrowRight` and `PageUp` / `PageDown`.
- **Synthetic Paper Sound**:
  - Synthesized via Web Audio API (white noise source filtered through an exponential bandpass and gain envelope) for a subtle paper rustle without external audio assets.
- **Public Controller API**:
  Exposed via `context.metadata["flipBook"]`:
  ```typescript
  export interface FlipBookController {
  	readonly currentPage: number;
  	readonly totalSpreads: number;
  	next(): Promise<void>;
  	prev(): Promise<void>;
  	flipTo(pageNumber: number): Promise<void>;
  	destroy(): void;
  }
  ```

#### D. Print Invariant Guarantee

- Injected stylesheets are wrapped within `@media screen`.
- Print media rules ensure `grid-template-columns: none`, `transform: none`, and standard `page-break-after: always` remain active for headless PDF generation and browser print dialogs.

#### E. Playground Integration

- Clean up custom CSS in [`apps/playground/src/styles/viewport.css`](file:///mnt/development/pagemill/apps/playground/src/styles/viewport.css) and [`apps/playground/src/services/render-service.ts`](file:///mnt/development/pagemill/apps/playground/src/services/render-service.ts).
- Add the "Flip Book" view button to the floating preview toolbar.
- The playground dynamically passes the active view plugin into `createRenderer({ plugins: [...] })`.

---

## 3. Feature 3: Strategic Improvement Plan (Phase 19 & Beyond)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PRINTEDJS FUTURE HORIZONS                             │
├───────────────────────┬─────────────────────────────┬───────────────────────┤
│ Advanced Typography   │ Modern Viewer Ecosystem     │ Export & Distribution │
├───────────────────────┼─────────────────────────────┼───────────────────────┤
│ • Mirrored Gutters    │ • Interactive TOC Sidebar   │ • Client-side Web PDF │
│ • Hanging Punctuation │ • Zoom / Pan Canvas Engine  │ • Tagged PDF/UA-1     │
│ • Float Top / Bottom  │ • Document Annotation Layer │ • EPUB Fixed-Layout   │
└───────────────────────┴─────────────────────────────┴───────────────────────┘
```

### 3.1 Advanced Paged Media CSS & Typography

1. **Mirrored Margins & Gutter Binding (`margin-inside` / `margin-outside`)**:
   - Support binding gutters for physical book printing:
     ```css
     @page :left {
     	margin-left: 20mm;
     	margin-right: 30mm;
     } /* outside / inside */
     @page :right {
     	margin-left: 30mm;
     	margin-right: 20mm;
     } /* inside / outside */
     ```
   - Automatically inject `--printedjs-margin-inside` and `--printedjs-margin-outside` tokens.
2. **Optical Margin Alignment (Hanging Punctuation)**:
   - Polyfill `hanging-punctuation: first last;` to allow quotation marks, bullet points, and hyphens to visually overhang page margins for Swiss-style typographic polish.
3. **Page-Level Floats (`float: top | bottom | page`)**:
   - Support CSS Page Floats Level 3, allowing figures and callout boxes to float to the top or bottom of the current or next page without interrupting inline text flow.

### 3.2 Interactive Modern Viewer Ecosystem

1. **Interactive Bookmark / TOC Sidebar Component**:
   - Utilize existing `bookmarksPlugin` output to generate an optional interactive collapsible navigation drawer in the viewer and playground.
2. **Smooth Pan & Zoom Navigation Engine**:
   - Introduce an inertia-based pinch-to-zoom and pan viewport for both desktop trackpads and touch devices, with zoom presets (`Fit Width`, `Fit Page`, `100%`, `200%`).
3. **Non-Layout Annotation Layer**:
   - Provide a plugin hook for visual annotations (sticky comments, redactions, signatures) anchored to page coordinates without altering pagination flow.

### 3.3 Client-Side Direct PDF Export & Accessibility

1. **Client-Side Direct PDF Export (Zero-Server / Zero-CLI)**:
   - Enable users in pure web apps (without Node.js, Playwright, or Puppeteer) to export publication-grade PDFs directly using modern in-browser canvas slicing or lightweight WASM PDF engines (such as `@pdf-lib`).
2. **Tagged PDF & Accessibility (WCAG 2.1 & PDF/UA-1)**:
   - Emit structured heading hierarchy, alternative text for images, and reading order tags directly into headless PDF generation.

### 3.4 Developer Experience & Framework Ecosystem

1. **Official Framework Bindings**:
   - `@printedjs/react` and `@printedjs/vue`: Ergonomic wrappers providing `<PrintedDocument template="..." viewMode="flipbook" onPageChange={...} />`.
2. **VS Code Extension for Live Print Preview**:
   - Extension providing instant split-screen paginated preview while editing `.html` or `.css` documents.

---

## 4. Step-by-Step Implementation Roadmap

```text
Phase 17: Enhanced Counters & Custom Numbering
├── Step 1: Numbering Formatter Utility (Roman, Alpha, Leading Zero)
├── Step 2: AST & Attribute Extraction for counter-reset
├── Step 3: Page Shell Logical Counter Assignment
├── Step 4: Enhanced target-counter Cross-Reference Resolution
└── Step 5: Unit & Browser Tests

Phase 18: Built-in Page View Plugins
├── Step 1: Single Page View Plugin (singlePageViewPlugin)
├── Step 2: Spread Page View Plugin (spreadPageViewPlugin)
├── Step 3: Flip Book 3D View Plugin (flipBookViewPlugin)
├── Step 4: Playground Refactor & Multi-View Toolbar
└── Step 5: Print Isolation & Regression Tests

Phase 19: High-Impact Future Horizons
├── Step 1: Mirrored Margins & Gutter Binding
├── Step 2: Interactive TOC Bookmark Navigation Drawer
└── Step 3: Client-Side Direct PDF Generation
```

### Milestone 1: Phase 17 — Enhanced Page Counter & Custom Numbering

| Step     | Action                                                                                                                                                         | Verifiable Success Criteria                                                           |
| :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| **17.1** | Create `packages/plugins/src/counters/formatters.ts` supporting `decimal`, `lower-roman`, `upper-roman`, `lower-alpha`, `upper-alpha`, `decimal-leading-zero`. | Unit tests verify conversion from integers `1..3999` to roman/alpha and back.         |
| **17.2** | Update `DomLayoutAdapter` to detect `counter-reset: page <n>` from CSS AST and `data-page-counter-reset` on break boundaries.                                  | Break to a new section correctly resets logical page number counter to target value.  |
| **17.3** | Update `createPageShell` and `page-shell.ts` to attach `data-page-number`, `data-physical-page-number`, and `data-page-formatted`.                             | DOM attributes accurately reflect both physical index and formatted logical number.   |
| **17.4** | Upgrade `countersPlugin` in `plugin.ts` to support format parameter in `target-counter(attr(href), page, lower-roman)`.                                        | TOC links display `ii`, `iii`, etc. matching the destination page's numbering format. |
| **17.5** | Add section-scoped page counts (`--printedjs-section-page-count`).                                                                                             | Margin boxes can render `"Page " counter(page) " of " counter(chapter-pages)`.        |

### Milestone 2: Phase 18 — Built-in Page View Plugins Suite

| Step     | Action                                                                                                                                       | Verifiable Success Criteria                                                                                              |
| :------- | :------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| **18.1** | Implement `singlePageViewPlugin()` in `packages/plugins/src/views/single-page/`.                                                             | Pages render centered vertically with clean shadows; `@media print` is untouched.                                        |
| **18.2** | Implement `spreadPageViewPlugin()` in `packages/plugins/src/views/spread-page/`.                                                             | Page 1 renders as solo recto; subsequent pages pair as verso/recto with spine fold.                                      |
| **18.3** | Implement `flipBookViewPlugin()` in `packages/plugins/src/views/flip-book/` with 3D turn animations, arrow key navigation, and audio rustle. | Interactive clicking or dragging flips pages with 3D perspective; controller API exposes `next()`, `prev()`, `flipTo()`. |
| **18.4** | Export all plugins from `@printedjs/plugins` and update `packages/plugins/README.md`.                                                        | Re-exported via `@printedjs/plugins` index and available to browser/headless runtimes.                                   |
| **18.5** | Refactor `apps/playground`: replace ad-hoc CSS with the new built-in view plugins; add "Flip Book" button to toolbar.                        | Playground toggles between Single, Spread, and Flip Book seamlessly.                                                     |

---

## 5. Architectural Tradeoffs & Alignment

1. **Native CSS Counters vs. Post-Render DOM Resolution**:
   - _Decision_: Hybrid approach. For standard unsegmented documents, browser-native CSS `counter(page, lower-roman)` functions automatically. When counter resets occur mid-document, the layout adapter passes logical page numbers as CSS custom properties and DOM attributes to guarantee deterministic rendering across all browsers.
2. **View Modes as Plugins vs. Browser Core Feature**:
   - _Decision_: Implement as **Plugins** in `@printedjs/plugins`. This keeps `@printedjs/core` and `@printedjs/browser` lightweight and purely focused on pagination math and layout rendering, while keeping view presentations modular and tree-shakable.
3. **Audio Effect in Flip Book**:
   - _Decision_: Pure Web Audio API synthesis instead of bundled sound files. This guarantees zero byte overhead, no external HTTP requests, and works offline in any environment.
