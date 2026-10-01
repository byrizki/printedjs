import type { PlaygroundFixture } from "../types/playground.js";

export const PHASE_17_COUNTERS_FIXTURE: PlaygroundFixture = {
	id: "custom-counters-multi-section",
	title: "Multi-Section Pagination & Custom Roman Counters",
	category: "paged-media",
	description:
		"Demonstrates Phase 17 enhanced pagination: frontmatter with lower-roman numerals (i, ii, iii), main body with counter restart (1, 2, 3...), and appendix with alpha numbering (A, B, C) and running headers.",
	html: `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>Multi-Section Technical Report</title>
	<style>
		@page {
			size: A4 portrait;
			margin: 25mm 20mm;
			@top-left {
				content: string(chapter-title);
				font-family: Inter, system-ui, sans-serif;
				font-size: 8.5pt;
				color: #64748b;
				text-transform: uppercase;
				letter-spacing: 0.05em;
			}
			@top-right {
				content: "Printed.js Platform Architecture";
				font-family: Inter, system-ui, sans-serif;
				font-size: 8.5pt;
				color: #94a3b8;
			}
			@bottom-right {
				content: counter(page);
				font-family: Inter, system-ui, sans-serif;
				font-size: 9pt;
				font-weight: 600;
				color: #334155;
			}
		}

		@page :first {
			@top-left { content: none; }
			@top-right { content: none; }
			@bottom-right { content: none; }
		}

		@page frontmatter {
			@bottom-right {
				content: counter(page, lower-roman);
				font-family: Inter, system-ui, sans-serif;
				font-size: 9pt;
				font-weight: 600;
				color: #6366f1;
			}
		}

		@page body-page {
			@bottom-right {
				content: "Page " counter(page, decimal);
				font-family: Inter, system-ui, sans-serif;
				font-size: 9pt;
				font-weight: 600;
				color: #0ea5e9;
			}
		}

		@page appendix-page {
			@bottom-right {
				content: "Appendix " counter(page, upper-alpha);
				font-family: Inter, system-ui, sans-serif;
				font-size: 9pt;
				font-weight: 600;
				color: #10b981;
			}
		}

		body {
			font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			font-size: 10pt;
			line-height: 1.6;
			color: #1e293b;
			margin: 0;
			padding: 0;
		}

		.cover-page {
			height: 100%;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: flex-start;
			padding: 60px 40px;
			box-sizing: border-box;
			page-break-after: always;
			break-after: page;
		}

		.cover-badge {
			display: inline-block;
			background: #e0e7ff;
			color: #4338ca;
			padding: 6px 14px;
			border-radius: 9999px;
			font-size: 9pt;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.08em;
			margin-bottom: 24px;
		}

		.cover-title {
			font-size: 32pt;
			font-weight: 900;
			color: #0f172a;
			line-height: 1.15;
			margin: 0 0 16px 0;
		}

		.cover-subtitle {
			font-size: 14pt;
			color: #64748b;
			margin: 0 0 48px 0;
			max-width: 500px;
		}

		.cover-meta {
			border-top: 2px solid #e2e8f0;
			padding-top: 24px;
			width: 100%;
			display: flex;
			justify-content: space-between;
			font-size: 9.5pt;
			color: #64748b;
		}

		.frontmatter-section {
			page: frontmatter;
			page-break-before: always;
			break-before: page;
			padding-top: 20px;
		}

		.frontmatter-title {
			font-size: 18pt;
			font-weight: 800;
			color: #312e81;
			margin-bottom: 16px;
			border-bottom: 2px solid #e0e7ff;
			padding-bottom: 8px;
		}

		.toc-list {
			list-style: none;
			padding: 0;
			margin: 24px 0;
		}

		.toc-item {
			display: flex;
			justify-content: space-between;
			align-items: baseline;
			padding: 8px 0;
			border-bottom: 1px dashed #cbd5e1;
		}

		.toc-title {
			font-weight: 600;
			color: #1e293b;
		}

		.toc-page {
			font-family: monospace;
			font-weight: bold;
			color: #6366f1;
		}

		.body-section {
			page: body-page;
			counter-reset: page 1;
			page-break-before: always;
			break-before: page;
			padding-top: 20px;
		}

		h1.chapter-heading {
			string-set: chapter-title content();
			font-size: 20pt;
			font-weight: 800;
			color: #0369a1;
			margin: 0 0 16px 0;
			border-bottom: 2px solid #bae6fd;
			padding-bottom: 8px;
			page-break-before: always;
			break-before: page;
		}

		h1.chapter-heading:first-of-type {
			page-break-before: avoid;
			break-before: avoid;
		}

		.lead-paragraph {
			font-size: 11pt;
			font-weight: 500;
			color: #334155;
			line-height: 1.7;
			margin-bottom: 20px;
		}

		.feature-card {
			background: #f8fafc;
			border: 1px solid #e2e8f0;
			border-left: 4px solid #0284c7;
			border-radius: 6px;
			padding: 16px 20px;
			margin: 20px 0;
		}

		.feature-card h3 {
			margin: 0 0 8px 0;
			color: #0f172a;
			font-size: 11pt;
		}

		.appendix-section {
			page: appendix-page;
			counter-reset: page 1;
			page-break-before: always;
			break-before: page;
			padding-top: 20px;
		}

		h1.appendix-heading {
			string-set: chapter-title content();
			font-size: 20pt;
			font-weight: 800;
			color: #047857;
			margin: 0 0 16px 0;
			border-bottom: 2px solid #a7f3d0;
			padding-bottom: 8px;
		}
	</style>
</head>
<body>

	<!-- Page 1: Cover (No header, no footer) -->
	<div class="cover-page">
		<span class="cover-badge">Enterprise Edition</span>
		<h1 class="cover-title">Distributed Print Engine Architecture</h1>
		<p class="cover-subtitle">Standardized Paged Media Layout, Counter Management, and Multi-Section Document Pipeline</p>
		<div class="cover-meta">
			<span>Author: Printed.js Core Team</span>
			<span>Document Version 2.4</span>
		</div>
	</div>

	<!-- Page 2: Frontmatter: Table of Contents (Page i) -->
	<div class="frontmatter-section">
		<h2 class="frontmatter-title">Table of Contents</h2>
		<p>This document demonstrates Phase 17 custom page counter styles, section counter resets, and running headers.</p>
		<ul class="toc-list">
			<li class="toc-item"><span class="toc-title">Executive Summary</span><span class="toc-page">ii</span></li>
			<li class="toc-item"><span class="toc-title">Chapter 1: Pagination Lifecycle &amp; AST Analysis</span><span class="toc-page">1</span></li>
			<li class="toc-item"><span class="toc-title">Chapter 2: Fragmentation &amp; Table Synchronizer</span><span class="toc-page">2</span></li>
			<li class="toc-item"><span class="toc-title">Appendix A: Diagnostic Schema Reference</span><span class="toc-page">A</span></li>
			<li class="toc-item"><span class="toc-title">Appendix B: Event Lifecycle Matrix</span><span class="toc-page">B</span></li>
		</ul>
	</div>

	<!-- Page 3: Frontmatter: Executive Summary (Page ii) -->
	<div class="frontmatter-section">
		<h2 class="frontmatter-title">Executive Summary</h2>
		<p class="lead-paragraph">
			Modern web browsers provide basic print rendering capabilities, but lack declarative control over page numbers, running headers, and multi-part numbering systems required by business reporting standards.
		</p>
		<p>
			Phase 17 addresses this fundamental limitation by introducing first-class CSS counter formatting functions including <code>lower-roman</code>, <code>upper-roman</code>, <code>lower-alpha</code>, and <code>upper-alpha</code>, coupled with seamless AST-driven <code>counter-reset</code> interception at layout boundaries.
		</p>
		<div class="feature-card">
			<h3>Key Architectural Milestone</h3>
			<p>
				Page numbers are resolved dynamically across document sections without requiring manual script calculation or post-processing DOM mutators.
			</p>
		</div>
	</div>

	<!-- Page 4: Main Body Chapter 1 (Resets to Page 1) -->
	<div class="body-section">
		<h1 class="chapter-heading">Chapter 1: Pagination Lifecycle</h1>
		<p class="lead-paragraph">
			When rendering structured documents, the engine executes a deterministic layout pipeline that partitions the DOM tree into discrete page shells.
		</p>
		<p>
			Each page shell maintains both its <strong>physical page index</strong> (reflecting the exact sequence of sheets for printer hardware) and its <strong>logical page counter</strong> (reflecting author-defined numbering with resets).
		</p>
		<div class="feature-card">
			<h3>Section Counter Reset</h3>
			<p>
				Notice that the page counter at the bottom-right has cleanly reset from roman numerals (<em>ii</em>) back to <strong>Page 1</strong>. The running header above displays the active chapter title.
			</p>
		</div>
	</div>

	<!-- Page 5: Main Body Chapter 2 (Page 2) -->
	<div class="body-section">
		<h1 class="chapter-heading">Chapter 2: Table Synchronizer</h1>
		<p class="lead-paragraph">
			Large matrices and financial ledger tables require automated header repetition and column synchronization across arbitrary page splits.
		</p>
		<p>
			By inspecting table geometry and cloning the <code>&lt;thead&gt;</code> structure onto subsequent continuation pages, readers can scan multi-page datasets without losing header context.
		</p>
		<div class="feature-card">
			<h3>Automatic Column Locking</h3>
			<p>
				Column widths measured on the initial page chunk are automatically propagated to continuation fragments, eliminating width popping across page transitions.
			</p>
		</div>
	</div>

	<!-- Page 6: Appendix A (Resets to Appendix A) -->
	<div class="appendix-section">
		<h1 class="appendix-heading">Appendix A: Schema Reference</h1>
		<p class="lead-paragraph">
			This section demonstrates alphabetical page counter formatting using <code>counter(page, upper-alpha)</code>.
		</p>
		<p>
			The counter resets to 1 at the start of the appendix section, which the formatter evaluates to <strong>Appendix A</strong> in the bottom right corner.
		</p>
		<div class="feature-card">
			<h3>Supported Counter Formats</h3>
			<ul>
				<li><strong>decimal</strong>: 1, 2, 3...</li>
				<li><strong>lower-roman</strong>: i, ii, iii, iv...</li>
				<li><strong>upper-roman</strong>: I, II, III, IV...</li>
				<li><strong>upper-alpha</strong>: A, B, C...</li>
				<li><strong>decimal-leading-zero</strong>: 01, 02, 03...</li>
			</ul>
		</div>
	</div>

	<!-- Page 7: Appendix B (Appendix B) -->
	<div class="appendix-section">
		<h1 class="appendix-heading">Appendix B: Lifecycle Events</h1>
		<p class="lead-paragraph">
			The table below outlines the execution sequence for plugin hooks and layout phases:
		</p>
		<table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 9pt;">
			<thead>
				<tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
					<th style="padding: 8px;">Phase</th>
					<th style="padding: 8px;">Hook Name</th>
					<th style="padding: 8px;">Purpose</th>
				</tr>
			</thead>
			<tbody>
				<tr style="border-bottom: 1px solid #e2e8f0;">
					<td style="padding: 8px; font-weight: bold;">1</td>
					<td style="padding: 8px;">beforeParsed</td>
					<td style="padding: 8px;">Pre-process source HTML and extract @page rules</td>
				</tr>
				<tr style="border-bottom: 1px solid #e2e8f0;">
					<td style="padding: 8px; font-weight: bold;">2</td>
					<td style="padding: 8px;">transformStyles</td>
					<td style="padding: 8px;">Inject responsive view mode styles &amp; counter rules</td>
				</tr>
				<tr style="border-bottom: 1px solid #e2e8f0;">
					<td style="padding: 8px; font-weight: bold;">3</td>
					<td style="padding: 8px;">afterPageLayout</td>
					<td style="padding: 8px;">Assign physical and logical page numbers to shells</td>
				</tr>
				<tr>
					<td style="padding: 8px; font-weight: bold;">4</td>
					<td style="padding: 8px;">afterRender</td>
					<td style="padding: 8px;">Mount interactive view controllers (Book, Spread)</td>
				</tr>
			</tbody>
		</table>
	</div>

</body>
</html>
`,
};
