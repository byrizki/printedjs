export interface FeatureTemplate {
	title: string;
	description: string;
	css: string;
	html: string;
}

export const FEATURE_TEMPLATES = {
	summary: {
		title: "Paged Media Summary Document",
		description:
			"Multi-page document showcasing page rules, margin boxes, and typography.",
		css: `@page {
  size: 150mm 115mm;
  margin: 16mm 14mm;

  @top-left {
    content: "Printedjs Technical Specification";
    font-family: Inter, sans-serif;
    font-size: 8pt;
    font-weight: 600;
    color: #64748b;
  }

  @top-right {
    content: "Release 2.0";
    font-family: Inter, sans-serif;
    font-size: 8pt;
    color: #64748b;
  }

  @bottom-right {
    content: "Page " counter(page) " of " counter(pages);
    font-family: Inter, sans-serif;
    font-size: 8pt;
    font-weight: 600;
    color: #0284c7;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.5;
  font-size: 9pt;
}

h1 {
  font-size: 14pt;
  color: #0f172a;
  margin-top: 0;
  border-bottom: 2px solid #0284c7;
  padding-bottom: 6px;
}

.kpi-row {
  display: flex;
  gap: 10px;
  margin: 12px 0;
}

.kpi-card {
  flex: 1;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 10px;
}

.kpi-num {
  font-size: 15pt;
  font-weight: 800;
  color: #0284c7;
}

.kpi-label {
  font-size: 7.5pt;
  color: #64748b;
  text-transform: uppercase;
}

.page-break {
  break-before: page;
}`,
		html: `<h1>Printedjs Architectural Brief</h1>
<p>Modern browser-native paginated document layout engine designed for decoupled core architecture, infinite loop resiliency, and full CSS Paged Media standards.</p>

<div class="kpi-row">
  <div class="kpi-card">
    <div class="kpi-num">0 DOM</div>
    <div class="kpi-label">Core Coupling</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-num">16</div>
    <div class="kpi-label">CSS Margin Boxes</div>
  </div>
  <div class="kpi-card">
    <div class="kpi-num">52 KB</div>
    <div class="kpi-label">Gzipped Bundle</div>
  </div>
</div>

<p>Printedjs decomposes monolithic pagination into an orchestrated pipeline of isolated micro-packages: <code>@printedjs/core</code>, <code>@printedjs/browser</code>, and <code>@printedjs/plugins</code>.</p>

<div class="page-break">
  <h1>Engine Capabilities</h1>
  <p>Page 2 showcases deterministic breaking, running headers, and margin boxes rendered without layout oscillation.</p>
  <ul>
    <li>W3C CSS Paged Media Module Level 3 compliance</li>
    <li>ProgressGuard algorithm preventing infinite pagination loops</li>
    <li>Isolated rendering surfaces (DOM Root or sandboxed Iframe)</li>
    <li>Off-screen vector PDF generation for mobile and desktop</li>
  </ul>
</div>`,
	},

	"page-rules": {
		title: "Page Rules & Orientation",
		description: "Controls sheet dimensions, orientations, and custom page sizes.",
		css: `@page {
  size: 150mm 100mm landscape;
  margin: 14mm;

  @top-center {
    content: "Landscape Report Format (150mm × 100mm)";
    font-family: Inter, sans-serif;
    font-size: 8pt;
    color: #64748b;
  }

  @bottom-right {
    content: "Sheet " counter(page);
    font-family: Inter, sans-serif;
    font-size: 8pt;
    font-weight: 600;
    color: #0284c7;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.5;
  font-size: 8.5pt;
}

h2 {
  font-size: 12pt;
  color: #0369a1;
  margin-top: 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 12px;
}

.box {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 8px;
  text-align: center;
  font-weight: 600;
  color: #166534;
}`,
		html: `<h2>Custom Landscape Page Sizing</h2>
<p>Printedjs parses standard <code>@page { size: ...; }</code> descriptors to determine sheet boundaries prior to layout execution.</p>

<div class="grid">
  <div class="box">Standard Sizes<br><small style="font-weight: normal; color: #475569;">A4, Letter, Legal, A5</small></div>
  <div class="box">Explicit Dimensions<br><small style="font-weight: normal; color: #475569;">150mm × 100mm</small></div>
  <div class="box">Orientation Control<br><small style="font-weight: normal; color: #475569;">portrait / landscape</small></div>
</div>`,
	},

	"page-rules-basic": {
		title: "Page Sizing & Orientation",
		description: "Configures page dimensions, orientations, and named page rules.",
		css: `@page {
  size: 145mm 100mm landscape;
  margin: 14mm 12mm;

  @top-left {
    content: "Printedjs Page Sizing Spec";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }

  @bottom-right {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    font-weight: 600;
    color: #0284c7;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.5;
  font-size: 8.5pt;
}

.spec-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 7.5pt;
  font-weight: 700;
  background: #e0f2fe;
  color: #0369a1;
  margin-bottom: 8px;
}

h3 {
  font-size: 11pt;
  margin: 4px 0 8px 0;
  color: #0f172a;
}

.info-cards {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.card {
  flex: 1;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px;
}

.card strong {
  display: block;
  font-size: 8pt;
  color: #0284c7;
}`,
		html: `<div class="spec-badge">W3C CSS Paged Media Level 3</div>
<h3>Declarative Sheet Dimensions</h3>
<p>Printedjs supports all standard page size descriptors with zero runtime layout shift:</p>

<div class="info-cards">
  <div class="card">
    <strong>Standard Sizes</strong>
    <span>A3, A4, A5, Letter, Legal, Ledger, Tabloid</span>
  </div>
  <div class="card">
    <strong>Orientation</strong>
    <span>portrait or landscape keywords</span>
  </div>
  <div class="card">
    <strong>Exact Metric Units</strong>
    <span>Explicit lengths: mm, cm, pt, in, px</span>
  </div>
</div>`,
	},

	"page-rules-margins": {
		title: "16 CSS Margin Box Positions",
		description:
			"Showcases standard margin perimeter boxes, corners, and dynamic alignment.",
		css: `@page {
  size: 145mm 105mm;
  margin: 18mm 16mm;

  @top-left-corner {
    content: "◰ T-L-C";
    font-family: Inter, sans-serif;
    font-size: 6.5pt;
    color: #94a3b8;
  }

  @top-left {
    content: "Top-Left Area";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }

  @top-center {
    content: "16 Margin Boxes";
    font-family: Inter, sans-serif;
    font-size: 8pt;
    font-weight: 700;
    color: #0284c7;
  }

  @top-right {
    content: "Top-Right Area";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
    text-align: right;
  }

  @top-right-corner {
    content: "T-R-C ◳";
    font-family: Inter, sans-serif;
    font-size: 6.5pt;
    color: #94a3b8;
    text-align: right;
  }

  @bottom-left {
    content: "Confidential";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #ef4444;
  }

  @bottom-center {
    content: "Printedjs Perimeter Stamp";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }

  @bottom-right {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    font-weight: 700;
    color: #0284c7;
    text-align: right;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.5;
  font-size: 8.5pt;
}

h3 {
  font-size: 11pt;
  margin-top: 0;
  color: #0f172a;
}

.diagram-box {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  padding: 10px;
  text-align: center;
  color: #475569;
  font-size: 8pt;
}`,
		html: `<h3>Perimeter Margin Grid Architecture</h3>
<p>Unlike standard web pages with only top and bottom margins, W3C Paged Media defines 16 independent perimeter slots surrounding the document body box.</p>

<div class="diagram-box">
  <strong>Document Page Body Area</strong><br>
  <span>All 16 surrounding boxes (@top-left, @bottom-right, corner areas) are rendered as true CSS grid cells.</span>
</div>`,
	},

	"page-breaks": {
		title: "Page Break Avoidance",
		description:
			"Prevents splitting across cards and callouts using break-inside: avoid.",
		css: `@page {
  size: 140mm 110mm;
  margin: 14mm 12mm;

  @top-left {
    content: "Break Strategy Demo";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }

  @bottom-right {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    font-weight: 600;
    color: #0284c7;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.45;
  font-size: 8pt;
}

.card {
  break-inside: avoid;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-left: 3px solid #0284c7;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.card h4 {
  margin: 0 0 4px 0;
  color: #0f172a;
  font-size: 9pt;
}`,
		html: `<p>Blocks marked with <code>break-inside: avoid</code> are pushed intact to the next page when remaining vertical space is insufficient:</p>

<div class="card">
  <h4>Card 1: Microservice Gateway</h4>
  <p>Handles incoming API requests and performs authentication and rate limiting.</p>
</div>

<div class="card">
  <h4>Card 2: Layout Processing Pipeline</h4>
  <p>Paginates document content into standardized print sheets with deterministic measurements.</p>
</div>

<div class="card">
  <h4>Card 3: Vector Export Engine</h4>
  <p>Generates searchable, high-resolution PDF binary artifacts directly from headless webview surfaces.</p>
</div>`,
	},

	"page-breaks-avoid": {
		title: "Card Break Avoidance",
		description:
			"Prevents awkward slicing of cards and callouts with break-inside: avoid.",
		css: `@page {
  size: 140mm 105mm;
  margin: 14mm 12mm;

  @top-left {
    content: "Printedjs Avoidance Demo";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }

  @bottom-right {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    font-weight: 600;
    color: #0284c7;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.45;
  font-size: 8pt;
}

.callout {
  break-inside: avoid;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-left: 4px solid #3b82f6;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 8px;
}

.callout h4 {
  margin: 0 0 4px 0;
  color: #1e40af;
  font-size: 8.5pt;
}`,
		html: `<p>Cards below have <code>break-inside: avoid</code>. If a card exceeds available space, it drops to the next page rather than being bisected.</p>

<div class="callout">
  <h4>1. Non-Fragmented Element</h4>
  <p>Layout calculations measure element height before insertion. If overflow is detected, a clean page break is introduced.</p>
</div>

<div class="callout">
  <h4>2. Guaranteed Visual Integrity</h4>
  <p>Borders, paddings, and background fills remain fully intact across all pages without clipping.</p>
</div>`,
	},

	"page-breaks-recto": {
		title: "Facing Spreads & Recto / Verso Breaks",
		description:
			"Forces right-hand chapter openings with automatic blank verso page insertion.",
		css: `@page {
  size: 130mm 100mm;
  margin: 12mm;

  @top-left {
    content: "Book Chapter Pagination";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }

  @bottom-right {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    font-weight: 600;
    color: #0284c7;
  }
}

@page :left {
  margin-right: 18mm;
  margin-left: 10mm;
}

@page :right {
  margin-left: 18mm;
  margin-right: 10mm;
}

@page :blank {
  @top-left { content: ""; }
  @bottom-right { content: "— Intentional Blank Page —"; font-style: italic; color: #94a3b8; }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.5;
  font-size: 8.5pt;
}

.chapter-recto {
  break-before: recto;
  padding-top: 10px;
}

h2 {
  font-size: 12pt;
  color: #0284c7;
  margin-top: 0;
}`,
		html: `<h2>Chapter 1: Initial Findings</h2>
<p>This chapter concludes on an odd page. The next section demands a right-hand (recto) opening.</p>
<p>Printedjs detects that the following page would be even (verso) and automatically inserts an intentional blank page to preserve physical book parity.</p>

<div class="chapter-recto">
  <h2>Chapter 2: Recto Opening</h2>
  <p>Notice this chapter starts strictly on an odd-numbered (recto / right) page!</p>
</div>`,
	},

	"headers-footers": {
		title: "Dynamic Running Headers",
		description:
			"Updates running header text dynamically using CSS string-set and string().",
		css: `@page {
  size: 145mm 105mm;
  margin: 16mm 14mm;

  @top-right {
    content: string(section-title);
    font-family: Inter, sans-serif;
    font-size: 8pt;
    font-weight: 600;
    color: #0284c7;
  }

  @bottom-right {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 8pt;
    color: #64748b;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.5;
  font-size: 8.5pt;
}

h2 {
  string-set: section-title content();
  color: #0f172a;
  border-bottom: 1.5px solid #e2e8f0;
  padding-bottom: 4px;
  margin-top: 0;
}

.break {
  break-before: page;
}`,
		html: `<h2>1. Engine Architecture</h2>
<p>Notice the top-right margin box displays the section title from the heading above.</p>
<p>Printedjs evaluates <code>string-set: section-title content()</code> as each DOM node is paginated.</p>

<div class="break">
  <h2>2. Memory Optimization</h2>
  <p>On this page, the top-right header automatically switches to "2. Memory Optimization" as specified by the updated heading!</p>
</div>`,
	},

	"headers-strings": {
		title: "Named Strings & Chapter Headers",
		description:
			"Captures heading text with string-set and stamps it into page margins via string().",
		css: `@page {
  size: 140mm 100mm;
  margin: 14mm 12mm;

  @top-left {
    content: "Printedjs Manual";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #94a3b8;
  }

  @top-right {
    content: string(curr-chapter, first);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    font-weight: 600;
    color: #0284c7;
  }

  @bottom-center {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.45;
  font-size: 8pt;
}

h3 {
  string-set: curr-chapter content();
  font-size: 10pt;
  color: #0369a1;
  margin-top: 0;
}

.page {
  break-before: page;
}`,
		html: `<h3>Section A: Introduction</h3>
<p>The top-right header reflects "Section A: Introduction" using CSS named strings.</p>

<div class="page">
  <h3>Section B: Performance Metrics</h3>
  <p>The top-right header dynamically transitions to "Section B: Performance Metrics" for this page.</p>
</div>`,
	},

	"headers-running-element": {
		title: "Rich HTML Running Elements",
		description:
			"Docks full HTML elements (logos, badges, metadata) into page margin boxes.",
		css: `@page {
  size: 145mm 105mm;
  margin: 18mm 14mm;

  @top-center {
    content: element(header-badge);
  }

  @bottom-right {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.5;
  font-size: 8.5pt;
}

.running-header {
  position: running(header-badge);
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-bottom: 4px;
  border-bottom: 1px solid #e2e8f0;
}

.badge {
  background: #0284c7;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 7pt;
  font-weight: 700;
}

.title {
  font-size: 7.5pt;
  font-weight: 600;
  color: #475569;
}`,
		html: `<div class="running-header">
  <span class="badge">OFFICIAL</span>
  <span class="title">Printedjs Architecture Brief</span>
  <span style="font-size: 7pt; color: #94a3b8;">REV 2.0</span>
</div>

<h3>Rich HTML Running Elements</h3>
<p>When headers require images, multi-column badges, or styled buttons, standard text strings are insufficient.</p>
<p>Printedjs removes the element from normal document flow and attaches it into the target margin box using <code>position: running(...)</code> and <code>content: element(...)</code>.</p>`,
	},

	"counters-toc": {
		title: "Dynamic Table of Contents",
		description:
			"Builds dynamic leader-dot TOC with cross-references and target-counter.",
		css: `@page {
  size: 145mm 110mm;
  margin: 14mm 12mm;

  @top-left {
    content: "Table of Contents";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }

  @bottom-right {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    font-weight: 600;
    color: #0284c7;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.5;
  font-size: 8pt;
}

.toc-entry {
  display: flex;
  align-items: baseline;
  margin-bottom: 6px;
}

.toc-title {
  font-weight: 500;
}

.toc-leader {
  flex-grow: 1;
  border-bottom: 1px dotted #94a3b8;
  margin: 0 6px;
}

.toc-page {
  font-weight: 700;
  color: #0284c7;
}

.break {
  break-before: page;
}`,
		html: `<h3 style="margin-top: 0; color: #0284c7;">Contents</h3>

<div class="toc-entry">
  <span class="toc-title">1. Architecture Overview</span>
  <span class="toc-leader"></span>
  <span class="toc-page">1</span>
</div>

<div class="toc-entry">
  <span class="toc-title">2. Decoupled Core Architecture</span>
  <span class="toc-leader"></span>
  <span class="toc-page">2</span>
</div>

<div class="toc-entry">
  <span class="toc-title">3. Layout Resiliency & Guards</span>
  <span class="toc-leader"></span>
  <span class="toc-page">3</span>
</div>

<div class="break">
  <h3>1. Architecture Overview</h3>
  <p>Content for Chapter 1 begins here on page 2.</p>
</div>

<div class="break">
  <h3>2. Decoupled Core Architecture</h3>
  <p>Content for Chapter 2 begins here on page 3.</p>
</div>`,
	},

	"counters-roman": {
		title: "Dual Counters & Roman Numerals",
		description:
			"Demonstrates Roman numeral front-matter transitioning to Arabic main numbering.",
		css: `@page frontmatter {
  @bottom-center {
    content: counter(page, lower-roman);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    font-weight: 600;
    color: #64748b;
  }
}

@page main {
  @bottom-right {
    content: "Page " counter(page) " of " counter(pages);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    font-weight: 700;
    color: #0284c7;
  }
}

@page {
  size: 140mm 100mm;
  margin: 14mm 12mm;
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.45;
  font-size: 8pt;
}

.frontmatter {
  page: frontmatter;
}

.main-body {
  page: main;
  break-before: page;
}`,
		html: `<div class="frontmatter">
  <h3>Preface (Front Matter)</h3>
  <p>Notice the bottom margin counter on this page: it is formatted in lowercase Roman numerals (<code>i</code>).</p>
  <p>Printedjs supports all W3C counter styles including <code>lower-roman</code>, <code>upper-roman</code>, <code>lower-alpha</code>, and decimal numbers.</p>
</div>

<div class="main-body">
  <h3>Chapter 1 (Main Matter)</h3>
  <p>Here the counter style switches to Arabic decimal numbering in the main matter: <code>Page 2 of 2</code>.</p>
</div>`,
	},

	"tables-splits": {
		title: "Repeating Table Headers",
		description:
			"Multi-page enterprise financial ledger with repeating thead and concluding tfoot across page splits.",
		css: `@page {
  size: 145mm 115mm;
  margin: 14mm 12mm;

  @top-right {
    content: "Enterprise Cloud Billing Ledger";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }

  @bottom-right {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    font-weight: 600;
    color: #0284c7;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  font-size: 7.5pt;
  margin: 0;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f1f5f9;
  color: #0f172a;
  font-weight: 700;
  text-align: left;
  padding: 5px 6px;
  border-bottom: 2px solid #cbd5e1;
}

td {
  padding: 4px 6px;
  border-bottom: 1px solid #e2e8f0;
}

tfoot td {
  background: #f8fafc;
  font-weight: 700;
  border-top: 2px solid #94a3b8;
}`,
		html: `<table class="repeat-header" data-repeat="true">
  <thead>
    <tr><th>ID</th><th>Transaction Description</th><th style="text-align: right;">Amount</th></tr>
  </thead>
  <tbody>
    <tr><td>TX-1001</td><td>Cloud Infrastructure Compute</td><td style="text-align: right;">$4,520.00</td></tr>
    <tr><td>TX-1002</td><td>Object Storage Services</td><td style="text-align: right;">$1,630.00</td></tr>
    <tr><td>TX-1003</td><td>Data Transfer & CDN Routing</td><td style="text-align: right;">$2,410.00</td></tr>
    <tr><td>TX-1004</td><td>Container Registries & CI</td><td style="text-align: right;">$980.00</td></tr>
    <tr><td>TX-1005</td><td>Database Cluster Primary</td><td style="text-align: right;">$6,120.00</td></tr>
    <tr><td>TX-1006</td><td>Read Replicas Asia-East</td><td style="text-align: right;">$3,440.00</td></tr>
    <tr><td>TX-1007</td><td>Security Auditing & WAF</td><td style="text-align: right;">$2,800.00</td></tr>
    <tr><td>TX-1008</td><td>Automated Snapshot Backup</td><td style="text-align: right;">$1,150.00</td></tr>
    <tr><td>TX-1009</td><td>Dedicated Load Balancers</td><td style="text-align: right;">$1,850.00</td></tr>
    <tr><td>TX-1010</td><td>VPC Peering & Transit Connect</td><td style="text-align: right;">$1,290.00</td></tr>
    <tr><td>TX-1011</td><td>Observability & Log Ingestion</td><td style="text-align: right;">$2,740.00</td></tr>
    <tr><td>TX-1012</td><td>DDoS Shield Protection</td><td style="text-align: right;">$3,200.00</td></tr>
    <tr><td>TX-1013</td><td>Serverless Function Compute</td><td style="text-align: right;">$890.00</td></tr>
    <tr><td>TX-1014</td><td>TLS Management & HSM</td><td style="text-align: right;">$1,450.00</td></tr>
    <tr><td>TX-1015</td><td>24/7 Dedicated Support</td><td style="text-align: right;">$2,500.00</td></tr>
    <tr><td>TX-1016</td><td>Global Network Egress</td><td style="text-align: right;">$3,820.00</td></tr>
  </tbody>
  <tfoot>
    <tr>
      <td colspan="2">Total Ledger Balance</td>
      <td style="text-align: right;">$40,990.00</td>
    </tr>
  </tfoot>
</table>`,
	},

	"tables-repeating-thead": {
		title: "Repeating thead on Page Breaks",
		description:
			"Enterprise hardware bill of materials spanning multiple sheets with automatic header duplication and footer summary.",
		css: `@page {
  size: 140mm 105mm;
  margin: 14mm 10mm;

  @top-left {
    content: "Enterprise Hardware Bill of Materials";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }

  @bottom-right {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    font-weight: 600;
    color: #0284c7;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  font-size: 7.5pt;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #0284c7;
  color: white;
  padding: 5px 8px;
  text-align: left;
}

td {
  padding: 4px 8px;
  border-bottom: 1px solid #e2e8f0;
}

tfoot td {
  background: #f0f9ff;
  border-top: 2px solid #0284c7;
  font-weight: 700;
  color: #0369a1;
}`,
		html: `<table class="repeat-header" data-repeat="true">
  <thead>
    <tr>
      <th>SKU</th>
      <th>Component Specification</th>
      <th style="text-align: right;">Unit Price</th>
      <th style="text-align: right;">Qty</th>
      <th style="text-align: right;">Total</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>BOM-01</td><td>2U Enterprise Compute Node</td><td style="text-align: right;">$3,400.00</td><td style="text-align: right;">4</td><td style="text-align: right;">$13,600.00</td></tr>
    <tr><td>BOM-02</td><td>128GB DDR5 ECC Reg RAM</td><td style="text-align: right;">$450.00</td><td style="text-align: right;">16</td><td style="text-align: right;">$7,200.00</td></tr>
    <tr><td>BOM-03</td><td>NVMe U.2 Enterprise SSD 7.68TB</td><td style="text-align: right;">$890.00</td><td style="text-align: right;">8</td><td style="text-align: right;">$7,120.00</td></tr>
    <tr><td>BOM-04</td><td>Dual-Port 100GbE QSFP28 NIC</td><td style="text-align: right;">$720.00</td><td style="text-align: right;">4</td><td style="text-align: right;">$2,880.00</td></tr>
    <tr><td>BOM-05</td><td>Redundant 1600W Titanium PSU</td><td style="text-align: right;">$340.00</td><td style="text-align: right;">8</td><td style="text-align: right;">$2,720.00</td></tr>
    <tr><td>BOM-06</td><td>32-Port 100GbE ToR Switch</td><td style="text-align: right;">$8,500.00</td><td style="text-align: right;">2</td><td style="text-align: right;">$17,000.00</td></tr>
    <tr><td>BOM-07</td><td>Optical Transceiver QSFP28 100G</td><td style="text-align: right;">$180.00</td><td style="text-align: right;">16</td><td style="text-align: right;">$2,880.00</td></tr>
    <tr><td>BOM-08</td><td>Cat6A Shielded Patch Cable 2m</td><td style="text-align: right;">$15.00</td><td style="text-align: right;">48</td><td style="text-align: right;">$720.00</td></tr>
    <tr><td>BOM-09</td><td>OM4 Multimode Fiber Trunk 10m</td><td style="text-align: right;">$65.00</td><td style="text-align: right;">16</td><td style="text-align: right;">$1,040.00</td></tr>
    <tr><td>BOM-10</td><td>Server Cabinet 42U Enclosure</td><td style="text-align: right;">$1,950.00</td><td style="text-align: right;">2</td><td style="text-align: right;">$3,900.00</td></tr>
    <tr><td>BOM-11</td><td>Switched PDU 30A Zero-U</td><td style="text-align: right;">$820.00</td><td style="text-align: right;">4</td><td style="text-align: right;">$3,280.00</td></tr>
    <tr><td>BOM-12</td><td>KVM-over-IP 16-Port Switch</td><td style="text-align: right;">$1,650.00</td><td style="text-align: right;">1</td><td style="text-align: right;">$1,650.00</td></tr>
    <tr><td>BOM-13</td><td>In-Row Precision Cooling Unit</td><td style="text-align: right;">$11,200.00</td><td style="text-align: right;">1</td><td style="text-align: right;">$11,200.00</td></tr>
    <tr><td>BOM-14</td><td>Environmental Monitor Probe</td><td style="text-align: right;">$210.00</td><td style="text-align: right;">6</td><td style="text-align: right;">$1,260.00</td></tr>
    <tr><td>BOM-15</td><td>Online UPS System 10kVA 3U</td><td style="text-align: right;">$4,800.00</td><td style="text-align: right;">2</td><td style="text-align: right;">$9,600.00</td></tr>
    <tr><td>BOM-16</td><td>Extended Battery Module 3U</td><td style="text-align: right;">$1,450.00</td><td style="text-align: right;">4</td><td style="text-align: right;">$5,800.00</td></tr>
    <tr><td>BOM-17</td><td>Hardware Security Module PCIe</td><td style="text-align: right;">$7,900.00</td><td style="text-align: right;">1</td><td style="text-align: right;">$7,900.00</td></tr>
    <tr><td>BOM-18</td><td>Out-of-Band Management Gateway</td><td style="text-align: right;">$1,150.00</td><td style="text-align: right;">2</td><td style="text-align: right;">$2,300.00</td></tr>
  </tbody>
  <tfoot>
    <tr>
      <td colspan="4">Total Hardware Procurement</td>
      <td style="text-align: right;">$104,300.00</td>
    </tr>
  </tfoot>
</table>`,
	},

	"tables-rowspan": {
		title: "Table Rowspan Slicing",
		description:
			"Demonstrates complex multi-row cells sliced across a page break boundary with automatic synthetic continuation cells.",
		css: `@page {
  size: 140mm 100mm;
  margin: 12mm 10mm;

  @top-left {
    content: "System Verification & Architecture Matrix";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }

  @bottom-right {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    font-weight: 600;
    color: #0284c7;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  font-size: 7.5pt;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 5px;
  text-align: left;
}

td {
  border: 1px solid #cbd5e1;
  padding: 4px 6px;
}

.category-cell {
  background: #f0f9ff;
  font-weight: 700;
  color: #0369a1;
  vertical-align: top;
}`,
		html: `<table class="repeat-header repeat-rowspan" data-repeat="true">
  <thead>
    <tr>
      <th>Subsystem</th>
      <th>Engine Module</th>
      <th>Verification Target</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td rowspan="4" class="category-cell" data-repeat-content="true">1. Paged Media Core</td>
      <td>Declarative Page Rules</td>
      <td>W3C @page dimensions, margins, bleeds</td>
      <td style="color: #166534; font-weight: 600;">Verified</td>
    </tr>
    <tr>
      <td>16 Margin Boxes</td>
      <td>Perimeter slots, corners &amp; margin tracks</td>
      <td style="color: #166534; font-weight: 600;">Verified</td>
    </tr>
    <tr>
      <td>Loop Progress Guard</td>
      <td>Zero-advancement cycle cutoff &amp; error recovery</td>
      <td style="color: #166534; font-weight: 600;">Verified</td>
    </tr>
    <tr>
      <td>Named Strings &amp; Headers</td>
      <td>string-set and dynamic title evaluation</td>
      <td style="color: #166534; font-weight: 600;">Verified</td>
    </tr>
    <tr>
      <td rowspan="5" class="category-cell" data-repeat-content="true">2. Table Fragmentation</td>
      <td>thead Duplication Pipeline</td>
      <td>Header restamping on subsequent sheets</td>
      <td style="color: #166534; font-weight: 600;">Verified</td>
    </tr>
    <tr>
      <td>Row Integrity Guard</td>
      <td>Guaranteed break-inside avoid atomicity</td>
      <td style="color: #166534; font-weight: 600;">Verified</td>
    </tr>
    <tr>
      <td>Rowspan Continuation</td>
      <td>Automatic synthetic continuation cell synthesis</td>
      <td style="color: #166534; font-weight: 600;">Verified</td>
    </tr>
    <tr>
      <td>Column Width Locking</td>
      <td>Sub-pixel column width synchronization</td>
      <td style="color: #166534; font-weight: 600;">Verified</td>
    </tr>
    <tr>
      <td>tfoot Placement</td>
      <td>Terminal summary row placement</td>
      <td style="color: #166534; font-weight: 600;">Verified</td>
    </tr>
    <tr>
      <td rowspan="4" class="category-cell" data-repeat-content="true">3. Native Drivers</td>
      <td>Native Headless WebView</td>
      <td>Linux Xvfb &amp; macOS WKWebView vector PDF</td>
      <td style="color: #166534; font-weight: 600;">Verified</td>
    </tr>
    <tr>
      <td>Playwright Chromium</td>
      <td>High-throughput batch printToPDF pipeline</td>
      <td style="color: #166534; font-weight: 600;">Verified</td>
    </tr>
    <tr>
      <td>Puppeteer Automation</td>
      <td>CDP communication &amp; memory stream</td>
      <td style="color: #166534; font-weight: 600;">Verified</td>
    </tr>
    <tr>
      <td>Vector Stream Exporter</td>
      <td>Direct %PDF-1.4 binary serialization</td>
      <td style="color: #166534; font-weight: 600;">Verified</td>
    </tr>
  </tbody>
</table>`,
	},

	"footnotes-columns": {
		title: "Multi-Column Layout & Footnotes",
		description:
			"Balances two-column text while docking footnotes automatically at the page bottom.",
		css: `@page {
  size: 150mm 115mm;
  margin: 15mm 14mm;

  @top-left {
    content: "Journal of Applied Layout Systems";
    font-family: Inter, sans-serif;
    font-size: 8pt;
    color: #64748b;
  }

  @bottom-right {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 8pt;
    font-weight: 600;
    color: #0284c7;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.45;
  font-size: 8.5pt;
}

.columns {
  column-count: 2;
  column-gap: 8mm;
  text-align: justify;
}

.footnote {
  float: footnote;
  font-size: 7.5pt;
  color: #64748b;
  line-height: 1.35;
}`,
		html: `<div class="columns">
  <p>Browser-native pagination requires balancing inline elements across balanced columns.<span class="footnote">1. W3C CSS Multi-column Layout Module Level 1 specifies column breaking rules.</span></p>

  <p>When footnotes are declared via <code>float: footnote</code>, Printedjs intercepts the AST node and relocates the annotation to the perimeter footnote area docked at the base of the page box.<span class="footnote">2. Printedjs FootnotePlugin performs automated callout indexing and numbering.</span></p>

  <p>Column height calculation seamlessly accounts for the reserved vertical height of active footnotes.</p>
</div>`,
	},

	"footnotes-basic": {
		title: "CSS Footnotes & Footnote Area",
		description:
			"Relocates inline float: footnote elements into the designated page bottom footnote box.",
		css: `@page {
  size: 140mm 105mm;
  margin: 14mm 12mm;

  @top-left {
    content: "Printedjs Footnote Spec";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }

  @bottom-right {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    font-weight: 600;
    color: #0284c7;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.5;
  font-size: 8.5pt;
}

.footnote {
  float: footnote;
  font-size: 7.5pt;
  color: #64748b;
}`,
		html: `<p>Printedjs supports the W3C GCPM footnote specification. Any element with <code>float: footnote</code> is converted to a footnote marker in text<span class="footnote">Footnote markers increment automatically per page or document.</span>, and its content is rendered inside the page footnote area at the bottom<span class="footnote">The footnote area expands vertically while reserving space from the body.</span>.</p>`,
	},

	"columns-balancing": {
		title: "Balanced Multi-Column Layout",
		description: "Splits content across balanced columns with column-fill: balance.",
		css: `@page {
  size: 140mm 100mm;
  margin: 14mm 12mm;

  @top-left {
    content: "Multi-Column Balance";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }

  @bottom-right {
    content: "Page " counter(page);
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    font-weight: 600;
    color: #0284c7;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.45;
  font-size: 8pt;
}

.balanced-cols {
  column-count: 2;
  column-gap: 6mm;
  column-rule: 1px solid #e2e8f0;
  text-align: justify;
}`,
		html: `<div class="balanced-cols">
  <p>Printedjs balances multi-column layout on each page sheet. Content is distributed evenly between columns to prevent uneven column heights at the bottom of the page box.</p>
  <p>Column rules, break-inside avoid within columns, and column breaks (<code>break-after: column</code>) are fully respected.</p>
</div>`,
	},

	"reader-views": {
		title: "Facing Two-Page Spreads",
		description: "Presents pages as two-page spreads with physical book spine shadow.",
		css: `@page {
  size: 110mm 105mm;
  margin: 12mm 10mm;

  @top-left {
    content: "Printedjs Book Reader";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }

  @bottom-center {
    content: "— " counter(page) " —";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.5;
  font-size: 8pt;
}

.page {
  break-before: page;
}

.cover-title {
  font-size: 12pt;
  font-weight: 800;
  color: #0284c7;
  margin-top: 10px;
}`,
		html: `<div>
  <div class="cover-title">The Principles of Paged Media</div>
  <p>Page 1 (Verso / Left Page).</p>
  <p>Notice the spine gutter binding geometry on the inner edge.</p>
</div>

<div class="page">
  <div class="cover-title">Chapter I: The Spread</div>
  <p>Page 2 (Recto / Right Page).</p>
  <p>In spread reader mode, facing pages are presented side-by-side just like a physical book or document spread.</p>
</div>`,
	},

	"views-spread": {
		title: "Two-Page Facing Spreads",
		description: "Presents pages as two-page spreads with book spine binding geometry.",
		css: `@page {
  size: 110mm 105mm;
  margin: 12mm 10mm;

  @top-left {
    content: "Printedjs Facing Spread View";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }

  @bottom-center {
    content: "— " counter(page) " —";
    font-family: Inter, sans-serif;
    font-size: 7.5pt;
    color: #64748b;
  }
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.5;
  font-size: 8pt;
}

.page {
  break-before: page;
}

.cover-title {
  font-size: 12pt;
  font-weight: 800;
  color: #0284c7;
  margin-top: 10px;
}`,
		html: `<div>
  <div class="cover-title">Volume I: Foundation</div>
  <p>Page 1 (Verso / Left Page).</p>
  <p>In spread reader mode, facing pages are presented side-by-side just like a physical book.</p>
</div>

<div class="page">
  <div class="cover-title">Chapter I: The Architecture</div>
  <p>Page 2 (Recto / Right Page).</p>
  <p>The inner margins provide sufficient gutter clearance for binding and staples.</p>
</div>`,
	},

	"views-flipbook": {
		title: "Interactive 3D Page Flipbook",
		description:
			"Hardware-accelerated realistic page turning physics powered by @printedjs/plugin-page-flip.",
		css: `.flipbook-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.ctrl-btn {
  padding: 6px 14px;
  border-radius: 6px;
  background: #0284c7;
  color: white;
  border: none;
  font-weight: 600;
  font-size: 8pt;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: background 0.15s ease;
}

.ctrl-btn:hover {
  background: #0369a1;
}

.ctrl-hint {
  font-size: 7.5pt;
  color: #64748b;
  font-family: Inter, sans-serif;
}

@page {
  size: 70mm 98mm;
  margin: 8mm;

  @bottom-center {
    content: counter(page);
    font-family: Inter, sans-serif;
    font-size: 7pt;
    color: #94a3b8;
  }
}

:is(.printedjs_page, .pagedjs_page),
:is(.printedjs_sheet, .pagedjs_sheet),
:is(.printedjs_pagebox, .pagedjs_pagebox),
.stf__item {
  background-color: #ffffff !important;
  background: #ffffff !important;
}

body {
  font-family: Inter, system-ui, sans-serif;
  color: #0f172a;
  line-height: 1.4;
  font-size: 7.5pt;
}

.book-cover {
  text-align: center;
  padding-top: 20px;
}

.book-cover h2 {
  font-size: 11pt;
  color: #0284c7;
  margin: 0 0 6px 0;
}

.subtitle {
  font-weight: 600;
  color: #475569;
  font-size: 8pt;
  margin: 0 0 10px 0;
}

.book-page {
  break-before: page;
}

.book-page h3 {
  font-size: 9pt;
  color: #0369a1;
  margin: 0 0 6px 0;
}

.highlight-box {
  background: #f0f9ff;
  border-left: 3px solid #0284c7;
  padding: 6px 8px;
  margin-top: 8px;
  border-radius: 0 4px 4px 0;
  font-size: 7pt;
}`,
		html: `<div class="book-cover">
  <h2>Interactive 3D Flipbook</h2>
  <p class="subtitle">Printedjs Page Flip Engine</p>
  <p>Realistic page bending with canvas shadows and page curl physics.</p>
</div>

<div class="book-page">
  <h3>Decoupled Architecture</h3>
  <p>Pure AST contracts and pagination state machines execute cleanly separated from DOM rendering.</p>
  <div class="highlight-box">
    <strong>Advantage:</strong> Fast, predictable layout calculation.
  </div>
</div>

<div class="book-page">
  <h3>W3C Paged Media</h3>
  <p>Supports all 16 margin boxes, page counters, and table header repeating.</p>
  <div class="highlight-box">
    <strong>CSS Compliance:</strong> W3C Paged Media Level 3.
  </div>
</div>

<div class="book-page">
  <h3>Presentation Views</h3>
  <p>Switch seamlessly between PDF vector export and 3D web flipbook view.</p>
  <div class="highlight-box">
    <strong>Plugin:</strong> @printedjs/plugin-page-flip
  </div>
</div>

<script>
window.addEventListener("printedjs:rendered", function() {
  const container = document.querySelector(".printedjs_pages, .pagedjs_pages");
  if (container && window.PrintedjsPageFlip) {
    try {
      if (!document.getElementById("flip-controls-bar")) {
        const bar = document.createElement("div");
        bar.id = "flip-controls-bar";
        bar.className = "flipbook-controls";
        bar.innerHTML = '<button id="flip-btn-prev" class="ctrl-btn">◀ Previous</button><span class="ctrl-hint">Click buttons or drag corners to flip pages</span><button id="flip-btn-next" class="ctrl-btn">Next ▶</button>';
        document.body.prepend(bar);
      }
      const pageFlip = new window.PrintedjsPageFlip.PageFlipController(container, {
        width: 250,
        height: 350,
        size: "fixed",
        showCover: false,
        usePortrait: false,
        density: "hard",
        drawShadow: true,
        maxShadowOpacity: 0.5,
        showPageCorners: true,
        flippingTime: 600
      });
      window.__flipController = pageFlip;
      document.getElementById("flip-btn-prev")?.addEventListener("click", function() { pageFlip.prev(); });
      document.getElementById("flip-btn-next")?.addEventListener("click", function() { pageFlip.next(); });
    } catch (e) {
      console.warn("Flipbook init:", e);
    }
  }
});
</script>`,
	},
} as const satisfies Record<string, FeatureTemplate>;

export type FeatureKey = keyof typeof FEATURE_TEMPLATES;
