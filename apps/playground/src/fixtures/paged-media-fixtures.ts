import type { PlaygroundFixture } from "../types/playground.js";

export const PAGED_MEDIA_FIXTURES: readonly PlaygroundFixture[] = [
	{
		id: "default-flow",
		title: "Continuous Flow (Multi-Page Letter)",
		category: "paged-media",
		description:
			"Standard multi-page narrative layout with US Letter dimensions, running margin headers, and page counters.",
		data: {
			docTitle: "Architectural Principles of Modern Paged Media",
			author: "Printedjs Core Engineering Group",
			date: "2026-09-29",
		},
		html: `
<style>
	@page {
		size: letter;
		margin: 25mm 20mm;
		@top-left {
			content: "Printedjs Architectural Principles";
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		@top-right {
			content: "Technical Monograph";
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
		@bottom-left {
			content: "Sample Document — Internal Engineering Distribution";
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
		@bottom-right {
			content: "Page " counter(page) " of " counter(pages);
			font-size: 8pt;
			color: #64748b;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			font-weight: 600;
		}
	}

	body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
		color: #1e293b;
		line-height: 1.65;
		font-size: 14px;
		margin: 0;
	}

	h1 {
		font-family: Georgia, Cambria, serif;
		color: #0f172a;
		font-size: 26px;
		font-weight: 700;
		margin-top: 0;
		margin-bottom: 8px;
		letter-spacing: -0.5px;
	}

	.meta-line {
		color: #64748b;
		font-size: 12px;
		margin-bottom: 24px;
		padding-bottom: 12px;
		border-bottom: 1px solid #e2e8f0;
	}

	h2 {
		font-family: Georgia, Cambria, serif;
		color: #1e3a8a;
		font-size: 18px;
		margin-top: 24px;
		margin-bottom: 10px;
		border-bottom: 1px solid #cbd5e1;
		padding-bottom: 4px;
	}

	p {
		margin-top: 0;
		margin-bottom: 14px;
		text-align: justify;
	}

	.lead-paragraph {
		font-size: 15px;
		color: #334155;
		font-weight: 500;
		line-height: 1.7;
	}

	.callout-box {
		background: #f8fafc;
		border-left: 4px solid #0284c7;
		padding: 14px 16px;
		margin: 18px 0;
		border-radius: 0 4px 4px 0;
		break-inside: avoid;
	}

	.callout-title {
		font-weight: 700;
		color: #0369a1;
		margin-bottom: 4px;
		font-size: 13px;
	}
</style>

<h1><%= docTitle %></h1>
<div class="meta-line">Author: <%= author %> &bull; Published: <%= date %></div>

<p class="lead-paragraph">
	Generating documents intended for physical printing or PDF distribution requires a fundamentally different mental model than responsive screen-oriented web design. Whereas viewport-based layouts expand infinitely along the vertical scroll axis, paged media introduces rigid dimensional constraints governed by physical paper dimensions.
</p>

<h2>1. The Geometry of the Page Box</h2>
<p>
	Under the W3C CSS Paged Media Module Level 3 specification, the printable canvas is structured as a hierarchical page box comprising the margin boxes, page boundary trim, bleed zone, and printable content area. In conventional browsers, CSS print rendering relies on opaque native print dialogues that lack programmatic control over layout continuation, footnote partitioning, and dynamic running headers.
</p>
<p>
	Printedjs bridges this capability divide by providing an in-browser deterministic layout virtualization engine. By decomposing document DOM trees into measurable work nodes and testing layout boundaries in real-time within an isolated iframe or root surface, Printedjs guarantees pixel-perfect parity across interactive previews and headless Chromium PDF exports.
</p>

<div class="callout-box">
	<div class="callout-title">Core Invariant: Deterministic Layout Isolation</div>
	Printedjs enforces total CSS encapsulation between the host application shell and the paginated document context. Computed styles, font metrics, and print media emulation are hermetically isolated to prevent unintended cascade contamination.
</div>

<h2>2. Fragmentation and Content Partitioning</h2>
<p>
	When an element exceeds the remaining vertical capacity of the current page, the pagination engine must determine an optimal fragmentation point. Elements configured with <code>break-inside: avoid</code> are preserved atomically and deferred to the top of the subsequent page, provided the empty page possesses sufficient clearance.
</p>
<p>
	Textual elements without explicit fragmentation bans undergo binary search line splitting. Text runs are bisected cleanly along whitespace boundaries, preserving typographic hierarchy, baseline alignment, and indent rules without dropping orphan or widow constraints.
</p>
<p>
	Furthermore, multi-page data tables require header and footer repetition to maintain human readability across extensive inventories or transaction ledgers. Printedjs preserves column group definitions (<code>&lt;colgroup&gt;</code>) and table header structures (<code>&lt;thead&gt;</code> and <code>&lt;tfoot&gt;</code>) automatically across every split fragment.
</p>

<h2>3. Conclusion and Future Directions</h2>
<p>
	By adhering strictly to open web standards while offering a high-performance, drop-in replacement for legacy Node/Puppeteer print bridges, Printedjs enables engineering teams to build, preview, and generate enterprise-grade reports, invoices, and books directly within modern client and server runtimes.
</p>
`.trim(),
	},
	{
		id: "book-spread",
		title: "Book Spread & Facing Pages (:left, :right, :blank)",
		category: "paged-media",
		description:
			"Facing book spread with asymmetric gutter margins for binding, alternating running headers, suppressed first-page headers, and blank verso page styling.",
		data: {
			bookTitle: "Principles of Computational Typography",
			author: "A. W. Pendelton",
		},
		html: `
<style>
	@page {
		size: 6in 9in;
	}

	@page :first {
		margin-top: 35mm;
		margin-right: 20mm;
		margin-bottom: 20mm;
		margin-left: 20mm;
		@top-left { content: none; }
		@top-right { content: none; }
		@bottom-center { content: none; }
	}

	@page :left {
		margin-top: 20mm;
		margin-right: 25mm;
		margin-bottom: 20mm;
		margin-left: 15mm;
		@top-left {
			content: counter(page);
			font-size: 8pt;
			color: #64748b;
			font-family: Georgia, serif;
		}
		@top-right {
			content: "PRINCIPLES OF COMPUTATIONAL TYPOGRAPHY";
			font-size: 7.5pt;
			color: #94a3b8;
			letter-spacing: 1px;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
		@bottom-center {
			content: none;
		}
	}

	@page :right {
		margin-top: 20mm;
		margin-right: 15mm;
		margin-bottom: 20mm;
		margin-left: 25mm;
		@top-left {
			content: string(chapter);
			font-size: 7.5pt;
			color: #94a3b8;
			letter-spacing: 1px;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			text-transform: uppercase;
		}
		@top-right {
			content: counter(page);
			font-size: 8pt;
			color: #64748b;
			font-family: Georgia, serif;
		}
		@bottom-center {
			content: none;
		}
	}

	@page :blank {
		@top-left { content: none; }
		@top-right { content: none; }
		@top-center {
			content: "— This page intentionally left blank —";
			font-family: Georgia, serif;
			font-style: italic;
			font-size: 9pt;
			color: #cbd5e1;
		}
	}

	body {
		font-family: Georgia, "Times New Roman", serif;
		color: #1e293b;
		line-height: 1.75;
		font-size: 13.5px;
		margin: 0;
	}

	.chapter-title {
		string-set: chapter content(text);
		font-size: 24px;
		font-weight: 700;
		color: #0f172a;
		text-align: center;
		margin-top: 20px;
		margin-bottom: 24px;
		letter-spacing: -0.3px;
	}

	.chapter-number {
		text-align: center;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 2px;
		color: #64748b;
		margin-bottom: 6px;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	}

	p {
		text-indent: 1.5em;
		margin-top: 0;
		margin-bottom: 0;
		text-align: justify;
	}

	p.no-indent {
		text-indent: 0;
	}

	.drop-cap::first-letter {
		font-size: 3.2em;
		float: left;
		line-height: 0.8;
		margin-right: 6px;
		color: #0f172a;
		font-weight: 700;
	}

	.recto-break {
		break-before: right;
	}
</style>

<div class="chapter-number">Chapter One</div>
<h1 class="chapter-title">The Architecture of the Printed Leaf</h1>

<p class="no-indent drop-cap">
	The physical codex is an artifact of deliberate geometry. For centuries before the inception of raster displays and flexible fluid layout grids, scribes and master printers established the canon of page proportions. The inside gutter margin must invariably accommodate the curvature of the bound spine, while the outer margin provides breathing room for the reader's fingers.
</p>

<p>
	When rendering facing pages in a modern digital typesetting system, alternating between verso (left) and recto (right) rules is indispensable. Notice how the inner binding edge maintains an expanded 25mm allowance, whereas the outer edge requires only 15mm.
</p>

<p>
	Furthermore, academic and narrative traditions mandate that major chapter openings always commence upon a recto page. If a preceding chapter concludes on a recto leaf, the typesetter must insert a blank verso page to preserve the structural cadence of the codex.
</p>

<div class="recto-break">
	<div class="chapter-number">Chapter Two</div>
	<h1 class="chapter-title">Typographic Rhythm and Leadings</h1>

	<p class="no-indent drop-cap">
		By forcing this second chapter to break to the right recto page via CSS <code>break-before: right</code>, Printedjs automatically evaluated the page parity and generated an elegant, styled blank page whenever necessary.
	</p>
	<p>
		The top running header on this recto page now displays the dynamic chapter title &ldquo;Typographic Rhythm and Leadings&rdquo; extracted automatically through CSS <code>string-set</code>.
	</p>
</div>
`.trim(),
	},
	{
		id: "named-pages-mixed",
		title: "Mixed Orientations & Named Pages (Portrait + Landscape)",
		category: "paged-media",
		description:
			"Document switching from A4 Portrait narrative to an A4 Landscape wide infrastructure timeline, then returning to Portrait for conclusion.",
		data: {
			projectName: "Project Titan: Cloud Infrastructure Overhaul",
			year: "2026",
		},
		html: `
<style>
	@page {
		size: A4 portrait;
		margin: 20mm;
		@top-right {
			content: "Titan Overhaul Report • Page " counter(page);
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
		@bottom-left {
			content: "Technical Engineering Planning Document";
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
	}

	@page landscape-sheet {
		size: A4 landscape;
		margin: 15mm;
		@top-right {
			content: "Appendix A: Global Rollout Schedule (Landscape) • Page " counter(page);
			font-size: 8pt;
			color: #0284c7;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			font-weight: 600;
		}
		@bottom-left {
			content: "Wide Format Telemetry Matrix — Printedjs Named Page Support";
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
	}

	body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		color: #1e293b;
		line-height: 1.5;
		margin: 0;
	}

	h1 {
		color: #0f172a;
		font-size: 22px;
		margin-top: 0;
		margin-bottom: 12px;
	}

	h2 {
		color: #0284c7;
		font-size: 16px;
		margin-top: 0;
		margin-bottom: 12px;
	}

	p {
		font-size: 13.5px;
		color: #334155;
		margin-bottom: 14px;
	}

	.landscape-section {
		page: landscape-sheet;
		break-before: page;
	}

	.portrait-return {
		page: auto;
		break-before: page;
	}

	table.wide-schedule {
		width: 100%;
		border-collapse: collapse;
		font-size: 10.5px;
		margin-top: 10px;
	}

	table.wide-schedule th,
	table.wide-schedule td {
		border: 1px solid #cbd5e1;
		padding: 6px 8px;
		text-align: left;
	}

	table.wide-schedule th {
		background: #f1f5f9;
		color: #0f172a;
		font-weight: 700;
	}

	.badge-on-track {
		background: #dcfce7;
		color: #15803d;
		padding: 2px 6px;
		border-radius: 4px;
		font-weight: 600;
		font-size: 10px;
		display: inline-block;
		white-space: nowrap;
	}

	.badge-review {
		background: #fef9c3;
		color: #a16207;
		padding: 2px 6px;
		border-radius: 4px;
		font-weight: 600;
		font-size: 10px;
		display: inline-block;
		white-space: nowrap;
	}
</style>

<div>
	<h1><%= projectName %>: Executive Briefing</h1>
	<p>
		Engineering reports frequently require combining standard vertical text pages with ultra-wide multi-column matrices, system dependency charts, or comprehensive financial ledgers. Attempting to compress a 10-column table into portrait mode degrades legibility.
	</p>
	<p>
		Using CSS Paged Media named pages (e.g. <code>page: landscape-sheet</code>), Printedjs allows individual sections to dynamically alter page dimensions and sheet orientations on the fly without breaking page counter continuity.
	</p>
</div>

<div class="landscape-section">
	<h2>Appendix A: Multi-Region Migration Schedule (Landscape)</h2>
	<p>
		The following schedule illustrates the migration roadmap across all eight sovereign cloud availability regions:
	</p>
	<table class="wide-schedule">
		<thead>
			<tr>
				<th>Phase</th>
				<th>Region</th>
				<th>Data Center Facility</th>
				<th>Compute Cores</th>
				<th>Storage (PB)</th>
				<th>Migration Window</th>
				<th>Validation Owner</th>
				<th>Status</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td><strong>01-A</strong></td>
				<td>US-East</td>
				<td>Equinix DC-12 Ashburn</td>
				<td>16,384</td>
				<td>12.4 PB</td>
				<td>2026-10-04</td>
				<td>Infrastructure Team</td>
				<td><span class="badge-on-track">Ready</span></td>
			</tr>
			<tr>
				<td><strong>01-B</strong></td>
				<td>US-West</td>
				<td>CoreSite SV-4 San Jose</td>
				<td>12,288</td>
				<td>8.2 PB</td>
				<td>2026-10-18</td>
				<td>Platform SRE</td>
				<td><span class="badge-on-track">Ready</span></td>
			</tr>
			<tr>
				<td><strong>02-A</strong></td>
				<td>EU-Central</td>
				<td>Interxion FRA-3 Frankfurt</td>
				<td>24,576</td>
				<td>18.0 PB</td>
				<td>2026-11-08</td>
				<td>Security Compliance</td>
				<td><span class="badge-review">Pending Audit</span></td>
			</tr>
			<tr>
				<td><strong>02-B</strong></td>
				<td>AP-South</td>
				<td>NTT Global Sin-2 Singapore</td>
				<td>18,432</td>
				<td>14.1 PB</td>
				<td>2026-11-22</td>
				<td>Network Ops</td>
				<td><span class="badge-on-track">Ready</span></td>
			</tr>
			<tr>
				<td><strong>03-A</strong></td>
				<td>AP-East</td>
				<td>KDDI Telehouse Tokyo</td>
				<td>20,480</td>
				<td>16.5 PB</td>
				<td>2026-12-06</td>
				<td>Regional SRE</td>
				<td><span class="badge-on-track">Ready</span></td>
			</tr>
		</tbody>
	</table>
</div>

<div class="portrait-return">
	<h1>Executive Sign-Off &amp; Approvals (Portrait)</h1>
	<p>
		This concluding chapter returns to standard A4 Portrait layout using <code>page: auto</code>. Notice that the page number continues sequentially, and the top-right header seamlessly switches back to portrait orientation.
	</p>
	<div style="margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 16px; display: flex; justify-content: space-between;">
		<div>
			<div style="font-size: 11px; color: #64748b; text-transform: uppercase;">Chief Technology Officer</div>
			<div style="font-weight: 700; margin-top: 24px; border-top: 1px dashed #94a3b8; width: 180px; padding-top: 4px;">Marcus Vance, PhD</div>
		</div>
		<div>
			<div style="font-size: 11px; color: #64748b; text-transform: uppercase;">VP of Platform Engineering</div>
			<div style="font-weight: 700; margin-top: 24px; border-top: 1px dashed #94a3b8; width: 180px; padding-top: 4px;">Helena Cho</div>
		</div>
	</div>
</div>
`.trim(),
	},
	{
		id: "tables-repetition",
		title: "Table Continuation: Repeating thead & tfoot",
		category: "paged-media",
		description:
			"Long data table spanning multiple pages with repeated column headers (thead) and repeating running footers (tfoot).",
		data: {
			items: Array.from({ length: 36 }, (_, i) => ({
				id: `SKU-${String(100 + i + 1)}`,
				name: `Precision Optical Transceiver Module Type-${(i % 4) + 1}`,
				category: ["Optics", "Routing", "Power", "Cooling"][i % 4],
				unitPrice: 145 + ((i * 15) % 180),
				quantity: ((i * 7) % 25) + 5,
			})),
		},
		html: `
<style>
	@page {
		size: letter;
		margin: 20mm;
		@top-center {
			content: "Global Logistics & Inventory Continuation Manifest";
			font-size: 8pt;
			color: #64748b;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		@bottom-right {
			content: "Page " counter(page) " of " counter(pages);
			font-size: 8pt;
			color: #64748b;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			font-weight: 600;
		}
		@bottom-left {
			content: "Both thead & tfoot repeat on each page continuation fragment";
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
	}

	body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		color: #1e293b;
		margin: 0;
	}

	h2 {
		color: #0f172a;
		margin-top: 0;
		margin-bottom: 12px;
		font-size: 18px;
	}

	p {
		font-size: 13px;
		color: #475569;
		margin-bottom: 16px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 11.5px;
	}

	tr {
		break-inside: avoid;
	}

	th, td {
		border: 1px solid #cbd5e1;
		padding: 7px 10px;
		text-align: left;
	}

	th {
		background: #f1f5f9;
		color: #0f172a;
		font-weight: 700;
		border-bottom: 2px solid #0284c7;
	}

	tfoot td {
		background: #f8fafc;
		color: #0369a1;
		font-weight: 600;
		font-size: 11px;
		border-top: 2px solid #0284c7;
	}

	tbody tr:nth-child(even) td {
		background: #fafafa;
	}
</style>

<h2>Hardware Procurement &amp; Inventory Manifest</h2>
<p>
	This table contains 36 line items that span multiple pages. Observe that both the <code>&lt;thead&gt;</code> header columns and the <code>&lt;tfoot&gt;</code> summary footer repeat automatically across every page fragment.
</p>

<table class="repeat">
	<thead>
		<tr>
			<th style="width: 80px;">Item SKU</th>
			<th>Description &amp; Specifications</th>
			<th style="width: 80px;">Category</th>
			<th style="width: 80px; text-align: right;">Unit Price</th>
			<th style="width: 60px; text-align: right;">Qty</th>
			<th style="width: 90px; text-align: right;">Ext. Total</th>
		</tr>
	</thead>
	<tfoot>
		<tr>
			<td colspan="4">&bull; Continued on Subsequent Page &bull; Subtotal Verified</td>
			<td colspan="2" style="text-align: right;">Printedjs &lt;tfoot&gt;</td>
		</tr>
	</tfoot>
	<tbody>
		<% items.forEach(function(item) { %>
		<tr>
			<td><strong><%= item.id %></strong></td>
			<td><%= item.name %></td>
			<td><%= item.category %></td>
			<td style="text-align: right;">$<%= item.unitPrice %></td>
			<td style="text-align: right;"><%= item.quantity %></td>
			<td style="text-align: right;"><strong>$<%= item.unitPrice * item.quantity %></strong></td>
		</tr>
		<% }); %>
	</tbody>
</table>
`.trim(),
	},
	{
		id: "footnotes",
		title: "Footnotes with Bottom Area (@footnote)",
		category: "paged-media",
		description:
			"Scholarly document demonstrating CSS float: footnote, superscript in-text callouts, and dynamic @footnote bottom area allocation.",
		html: `
<style>
	@page {
		size: 6in 9in;
		margin: 22mm 18mm;
		@footnote {
			border-top: 1px solid #94a3b8;
			padding-top: 8px;
			margin-top: 12px;
		}
		@top-center {
			content: "CSS Paged Media Technical Review";
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			letter-spacing: 0.5px;
		}
		@bottom-right {
			content: "Page " counter(page);
			font-size: 8pt;
			color: #64748b;
			font-family: Georgia, serif;
		}
	}

	body {
		font-family: Georgia, Cambria, "Times New Roman", serif;
		color: #1e293b;
		line-height: 1.75;
		font-size: 14px;
		margin: 0;
	}

	h1 {
		font-size: 22px;
		color: #0f172a;
		margin-top: 0;
		margin-bottom: 12px;
		line-height: 1.3;
	}

	p {
		text-align: justify;
		margin-bottom: 14px;
	}

	span.footnote {
		float: footnote;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		font-size: 11px;
		color: #475569;
		line-height: 1.45;
	}
</style>

<h1>Decoupled Layout Pagination in Modern Client Runtimes</h1>

<p>
	Traditional web applications rely on continuous vertical scrolling to present lengthy academic treatises and legal instruments. However, high-fidelity publication demands strict adherence to the CSS Paged Media Module Level 3 specification<span class="footnote">Refer to W3C Working Draft &ldquo;CSS Paged Media Module Level 3&rdquo;, specifically section 3 detailing footnote-policy and margin box partition semantics.</span> for document printing and archiving.
</p>

<p>
	When an element declares <code>float: footnote</code>, the layout engine extracts the inline content and creates a corresponding numeric callout in superscript. The footnote body is relocated into the dedicated bottom footnote area<span class="footnote">Printedjs dynamically calculates the container frame (including top border and padding) to eliminate any vertical truncation or clipped descenders.</span> while adjusting the available content height on the page.
</p>

<p>
	Notice how multiple footnotes on the same page are indexed sequentially, formatted with bold call numbers, and separated from the main narrative flow by a crisp horizontal rule.
</p>
`.trim(),
	},
	{
		id: "multi-column",
		title: "Multi-Column Text Flow (2-Column Magazine)",
		category: "paged-media",
		description:
			"Academic or magazine article with full-width headline and abstract followed by 2-column continuous text flow with column rule and pull quotes.",
		html: `
<style>
	@page {
		size: A4;
		margin: 22mm 20mm;
		@top-left {
			content: "Journal of Browser Architecture • Vol. 14";
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
		@bottom-center {
			content: "— " counter(page) " —";
			font-size: 8pt;
			color: #64748b;
			font-family: Georgia, serif;
		}
	}

	body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		color: #1e293b;
		margin: 0;
	}

	.article-title {
		font-family: Georgia, serif;
		font-size: 26px;
		font-weight: 800;
		color: #0f172a;
		line-height: 1.25;
		margin-top: 0;
		margin-bottom: 8px;
		letter-spacing: -0.5px;
	}

	.article-abstract {
		background: #f8fafc;
		border-left: 3px solid #0284c7;
		padding: 12px 16px;
		font-size: 13px;
		color: #334155;
		font-style: italic;
		margin-bottom: 20px;
		line-height: 1.6;
	}

	.two-columns {
		column-count: 2;
		column-gap: 24px;
		column-rule: 1px solid #e2e8f0;
		text-align: justify;
		font-size: 13px;
		line-height: 1.65;
	}

	.two-columns h2 {
		font-family: Georgia, serif;
		font-size: 16px;
		color: #0369a1;
		margin-top: 0;
		margin-bottom: 8px;
		break-after: avoid;
	}

	.two-columns p {
		margin-top: 0;
		margin-bottom: 12px;
	}

	.pull-quote {
		break-inside: avoid;
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		border-radius: 6px;
		padding: 12px 14px;
		margin: 16px 0;
		font-size: 12.5px;
		color: #166534;
		font-weight: 500;
	}
</style>

<h1 class="article-title">High-Throughput In-Memory Document Synthesis at Cloud Scale</h1>
<div class="article-abstract">
	Abstract &mdash; Generating tens of thousands of customer invoices and compliance statements per hour exposes severe resource bottlenecks in legacy server-side headless browser architectures. In this monograph, we evaluate the performance characteristics of lightweight CSS Paged Media pagination engines operating entirely within isolated memory contexts.
</div>

<div class="two-columns">
	<h2>1. Introduction</h2>
	<p>
		The transition toward automated financial reporting has outpaced the capabilities of server-side browser pools. Running complete Chromium instances for every PDF generation task incurs unacceptable CPU overhead, memory leaks, and serialization latencies.
	</p>
	<p>
		By shifting layout calculations into an optimized in-browser engine that computes exact page box constraints, enterprises achieve up to a ten-fold reduction in rendering infrastructure costs.
	</p>

	<div class="pull-quote">
		&ldquo;Decoupled document synthesis enables interactive client previews and batch server exports to share identical layout fidelity.&rdquo;
	</div>

	<h2>2. Column Fragmentation</h2>
	<p>
		Multi-column formatting requires balancing text flows between columns while preventing orphan lines and awkward heading breaks. Notice how the vertical column rule gracefully separates the text streams.
	</p>
	<p>
		When content overflows the available column height on a given sheet, Printedjs creates a subsequent page box and resumes column distribution seamlessly.
	</p>
</div>
`.trim(),
	},
	{
		id: "toc-target-counter",
		title: "Table of Contents & Cross-References (target-counter)",
		category: "paged-media",
		description:
			"Generates an automated Table of Contents with dot leaders and target-counter() resolving actual destination page numbers dynamically.",
		html: `
<style>
	@page {
		size: letter;
		margin: 25mm 20mm;
		@top-right {
			content: "System Specification • Page " counter(page);
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
	}

	body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		color: #1e293b;
		line-height: 1.6;
		margin: 0;
	}

	h1.doc-title {
		font-family: Georgia, serif;
		font-size: 26px;
		color: #0f172a;
		margin-top: 0;
		margin-bottom: 20px;
	}

	h2.section-header {
		font-family: Georgia, serif;
		font-size: 18px;
		color: #0284c7;
		margin-top: 0;
		margin-bottom: 10px;
		border-bottom: 1px solid #e2e8f0;
		padding-bottom: 4px;
	}

	.page-break {
		break-before: page;
	}

	.toc {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
		padding: 20px 24px;
		margin-bottom: 30px;
	}

	.toc-title {
		font-size: 14px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: #475569;
		margin-bottom: 14px;
	}

	.toc-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.toc-item {
		margin-bottom: 10px;
		font-size: 13.5px;
	}

	.toc-item a {
		text-decoration: none;
		color: #0f172a;
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.toc-item a::after {
		content: target-counter(attr(href), page);
		font-weight: 700;
		color: #0284c7;
		margin-left: 8px;
	}
</style>

<h1 class="doc-title">Distributed Systems Specification</h1>

<div class="toc">
	<div class="toc-title">Table of Contents</div>
	<ul class="toc-list">
		<li class="toc-item"><a href="#sec-overview">1. Architectural Overview and System Goals</a></li>
		<li class="toc-item"><a href="#sec-consensus">2. Raft Consensus and State Machine Replication</a></li>
		<li class="toc-item"><a href="#sec-storage">3. Distributed Storage Engine and LSM-Tree Compaction</a></li>
	</ul>
</div>

<div id="sec-overview">
	<h2 class="section-header">1. Architectural Overview and System Goals</h2>
	<p>
		This specification outlines the fault tolerance guarantees, network partitions handling, and consensus topology for the distributed document storage cluster.
	</p>
	<p>
		Notice how the Table of Contents dynamically computes and fills in the actual destination page number using <code>target-counter(attr(href), page)</code>.
	</p>
</div>

<div id="sec-consensus" class="page-break">
	<h2 class="section-header">2. Raft Consensus and State Machine Replication</h2>
	<p>
		Nodes within the cluster coordinate configuration updates via an election-based Raft consensus quorum. Heartbeats are exchanged every 50 milliseconds across high-speed private interconnects.
	</p>
	<p>
		Because this section begins with <code>break-before: page</code>, it reliably lands on page 2. The Table of Contents entry on page 1 reflects this exact target counter value automatically.
	</p>
</div>

<div id="sec-storage" class="page-break">
	<h2 class="section-header">3. Distributed Storage Engine and LSM-Tree Compaction</h2>
	<p>
		Persistent entries are written sequentially to an append-only write-ahead log (WAL) prior to being committed to memory-mapped MemTables. Periodic background compaction merges sorted string tables (SSTables) to minimize read amplification.
	</p>
	<p>
		This demonstrates Printedjs's full resolution of cross-references and internal anchor links.
	</p>
</div>
`.trim(),
	},
	{
		id: "widows-orphans",
		title: "Widows & Orphans Protection (orphans: 3, widows: 3)",
		category: "paged-media",
		description:
			"Enforces orphans: 3 and widows: 3 typography rules to eliminate lonely dangling lines across page splits, paired with atomic card protection.",
		html: `
<style>
	@page {
		size: letter;
		margin: 1in;
		@top-center {
			content: "Typographic Flow Standards • Widows & Orphans Protection";
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
		@bottom-right {
			content: "Page " counter(page);
			font-size: 8pt;
			color: #64748b;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			font-weight: 600;
		}
	}

	body {
		font-family: Georgia, serif;
		color: #1e293b;
		line-height: 1.7;
		font-size: 14px;
		margin: 0;
	}

	h1 {
		color: #0f172a;
		font-size: 22px;
		margin-top: 0;
		margin-bottom: 12px;
	}

	p {
		text-align: justify;
		margin-bottom: 16px;
		orphans: 3;
		widows: 3;
	}

	.metric-card {
		break-inside: avoid;
		background: #f8fafc;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		padding: 16px;
		margin: 20px 0;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	}

	.metric-value {
		font-size: 24px;
		font-weight: 800;
		color: #0284c7;
	}

	.metric-label {
		font-size: 12px;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
</style>

<h1>Publishing Standards: Avoiding Typographic Fragmentation</h1>

<p>
	In professional publication typography, an orphan is the first line of a paragraph appearing alone at the bottom of a page, while a widow is the final line of a paragraph appearing isolated at the top of a new page. Both phenomena disrupt reading flow and create visually unbalanced page margins.
</p>

<p>
	By configuring <code>orphans: 3</code> and <code>widows: 3</code>, Printedjs guarantees that a paragraph will not split unless at least three lines remain on the preceding page and at least three lines advance to the subsequent page. If this constraint cannot be satisfied, the entire paragraph is preserved together.
</p>

<div class="metric-card">
	<div class="metric-value">99.998%</div>
	<div class="metric-label">Clean Page Break Compliance Metric</div>
	<p style="font-size: 12px; margin-top: 8px; margin-bottom: 0; font-family: sans-serif; color: #475569;">
		This summary card is declared with <code>break-inside: avoid</code> to prevent it from ever splitting across a page boundary.
	</p>
</div>

<p>
	Clean pagination ensures that legal contracts, financial agreements, and premium editorial publications project an immediate sense of craftsmanship and authority.
</p>
`.trim(),
	},
	{
		id: "bleed-and-marks",
		title: "Print Bleed & Crop Marks (A4)",
		category: "paged-media",
		description:
			"Page formatting with 6mm bleed, crop marks, and registration cross marks with a full-bleed colored header extending to the sheet edge.",
		html: `
<style>
	@page {
		size: A4;
		margin: 25mm 20mm;
		bleed: 6mm;
		marks: crop cross;
		@bottom-center {
			content: "Printed with 6mm Bleed & Registration Marks • Page " counter(page);
			font-size: 8pt;
			color: #64748b;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
	}

	body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		color: #1e293b;
		line-height: 1.6;
		margin: 0;
	}

	.bleed-hero-banner {
		margin: -25mm -20mm 20px -20mm;
		padding: 30mm 20mm 20mm 20mm;
		background: linear-gradient(135deg, #064e3b, #047857);
		color: #ffffff;
	}

	.hero-title {
		font-size: 26px;
		font-weight: 800;
		margin: 0 0 6px 0;
		letter-spacing: -0.5px;
	}

	.hero-sub {
		font-size: 13px;
		color: #a7f3d0;
		margin: 0;
	}

	h2 {
		color: #047857;
		font-size: 17px;
		margin-top: 24px;
		margin-bottom: 8px;
	}

	p {
		font-size: 13.5px;
		color: #334155;
		margin-bottom: 12px;
	}
</style>

<div class="bleed-hero-banner">
	<h1 class="hero-title">High-Precision Print Publishing</h1>
	<p class="hero-sub">Commercial Bleed Areas &amp; Alignment Registration Crosses</p>
</div>

<h2>Understanding Bleed in Commercial Printing</h2>
<p>
	When printing physical collateral, large industrial Guillotine cutters slice through hundreds of sheets at once. Tiny mechanical paper shifts of a fraction of a millimeter can leave an unsightly white edge if colored graphics terminate exactly at the trim line.
</p>
<p>
	To eliminate this hazard, commercial printers require artwork to extend beyond the trim edge into the <strong>bleed zone</strong> (typically 3mm to 6mm).
</p>
<p>
	Observe the corner crop marks (indicating where the mechanical blade will strike) and the registration crosshairs (used by press operators to verify ink plate calibration).
</p>
`.trim(),
	},
	{
		id: "strings-headers",
		title: "Running Headers via string-set",
		category: "paged-media",
		description:
			"Dynamic margin box header driven by heading string-set declarations updating automatically across section boundaries.",
		data: {
			firstSection: "Section 1: Distributed Storage Topology",
			secondSection: "Section 2: High-Availability Failover Protocols",
		},
		html: `
<style>
	@page {
		size: 6in 9in;
		margin: 20mm;
		@top-left {
			content: "Technical Architecture Guide";
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		@top-right {
			content: string(heading);
			color: #0284c7;
			font-size: 8pt;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			font-weight: 600;
		}
		@bottom-center {
			content: "— " counter(page) " —";
			color: #64748b;
			font-size: 8pt;
			font-family: Georgia, serif;
		}
	}

	body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		color: #1e293b;
		margin: 0;
	}

	h1 {
		string-set: heading content(text);
		font-family: Georgia, serif;
		color: #0f172a;
		font-size: 20px;
		margin-top: 10px;
		margin-bottom: 12px;
		border-bottom: 2px solid #0284c7;
		padding-bottom: 6px;
	}

	p {
		font-size: 13.5px;
		line-height: 1.65;
		color: #334155;
		margin-bottom: 14px;
	}

	.page-break {
		break-before: page;
	}
</style>

<h1><%= firstSection %></h1>
<p>
	The top-right margin box extracts the heading text of this first section using <code>string-set: heading content(text)</code> and displays it in the header.
</p>
<p>
	In distributed storage clusters, objects are replicated across independent failure domains to guarantee resilience against rack or data center outages.
</p>

<div class="page-break">
	<h1><%= secondSection %></h1>
	<p>
		Upon crossing this page break, the top-right running header automatically updates to reflect the new heading &ldquo;<%= secondSection %>&rdquo;.
	</p>
	<p>
		Heartbeat mechanisms continuously evaluate node health, triggering automated quorum re-elections whenever a leader ceases communication for more than two heartbeat periods.
	</p>
</div>
`.trim(),
	},
	{
		id: "page-breaks",
		title: "Page Break Rules & Blank Pages",
		category: "paged-media",
		description:
			"Demonstrates break-before: page, break-before: right, and automated blank page insertion.",
		html: `
<style>
	@page {
		size: letter;
		margin: 20mm;
		@top-left {
			content: "Printedjs Pagination Control";
			font-size: 8pt;
			color: #94a3b8;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		}
		@bottom-right {
			content: "Page " counter(page);
			font-size: 8pt;
			color: #64748b;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			font-weight: 600;
		}
	}

	@page :blank {
		@top-center {
			content: "— Intentionally Left Blank —";
			font-style: italic;
			color: #cbd5e1;
			font-size: 9pt;
		}
	}

	body {
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
		color: #1e293b;
		line-height: 1.6;
		margin: 0;
	}

	h1 {
		color: #0f172a;
		font-size: 22px;
		margin-bottom: 12px;
	}

	p {
		color: #475569;
		font-size: 14px;
	}

	.page-break {
		break-before: page;
	}

	.recto-break {
		break-before: right;
	}
</style>

<div>
	<h1>Section 1: Initial Recto Page</h1>
	<p>This content begins on Page 1 (a recto page).</p>
</div>

<div class="page-break">
	<h1>Section 2: Forced Page Break</h1>
	<p>This section is forced onto the subsequent page via <code>break-before: page</code>, advancing to Page 2 (a verso page).</p>
</div>

<div class="recto-break">
	<h1>Section 3: Forced Right (Recto) Page</h1>
	<p>This section declares <code>break-before: right</code>. Since Page 2 was a verso page, Section 3 lands cleanly on Page 3 (recto) without requiring a blank page insertion.</p>
</div>
`.trim(),
	},
];
