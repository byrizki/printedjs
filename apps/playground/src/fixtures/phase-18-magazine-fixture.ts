import type { PlaygroundFixture } from "../types/playground.js";

export const PHASE_18_MAGAZINE_FIXTURE: PlaygroundFixture = {
	id: "digital-magazine-spread",
	title: "Digital Magazine & Editorial Layout (Grid Spread)",
	category: "paged-media",
	description:
		"Demonstrates Phase 18 built-in page views: multi-column editorial features, full-spread visual accents, pull quotes, and responsive grid layouts.",
	html: `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<title>CHRONICLE // Digital Design & Engineering</title>
	<style>
		@page {
			size: A4 portrait;
			margin: 20mm 18mm;
			@top-left {
				content: "CHRONICLE MAGAZINE";
				font-family: Inter, sans-serif;
				font-size: 8pt;
				font-weight: 800;
				letter-spacing: 0.15em;
				color: #94a3b8;
			}
			@top-right {
				content: "ISSUE NO. 42 // AUTUMN 2026";
				font-family: Inter, sans-serif;
				font-size: 8pt;
				color: #94a3b8;
			}
			@bottom-left {
				content: "PRINTED.JS PLATFORM ARCHITECTURE";
				font-family: Inter, sans-serif;
				font-size: 7.5pt;
				color: #cbd5e1;
			}
			@bottom-right {
				content: counter(page);
				font-family: Inter, sans-serif;
				font-size: 9pt;
				font-weight: 700;
				color: #0f172a;
			}
		}

		@page :first {
			margin: 0;
			@top-left { content: none; }
			@top-right { content: none; }
			@bottom-left { content: none; }
			@bottom-right { content: none; }
		}

		body {
			font-family: "Charter", Georgia, "Times New Roman", serif;
			font-size: 10.5pt;
			line-height: 1.6;
			color: #1e293b;
			margin: 0;
			padding: 0;
		}

		/* Cover Spread */
		.magazine-cover {
			height: 100%;
			min-height: 297mm;
			background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%);
			color: #ffffff;
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			padding: 60px 48px;
			box-sizing: border-box;
			page-break-after: always;
			break-after: page;
		}

		.cover-masthead {
			border-bottom: 2px solid rgba(255, 255, 255, 0.2);
			padding-bottom: 20px;
		}

		.masthead-title {
			font-family: Inter, -apple-system, sans-serif;
			font-size: 42pt;
			font-weight: 900;
			letter-spacing: 0.12em;
			text-transform: uppercase;
			margin: 0;
			color: #f8fafc;
		}

		.masthead-tagline {
			font-family: Inter, sans-serif;
			font-size: 10pt;
			color: #93c5fd;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			margin-top: 6px;
		}

		.cover-main-story {
			margin: 60px 0;
		}

		.cover-story-tag {
			font-family: Inter, sans-serif;
			background: #38bdf8;
			color: #0f172a;
			font-size: 9pt;
			font-weight: 800;
			padding: 4px 10px;
			border-radius: 4px;
			display: inline-block;
			margin-bottom: 16px;
		}

		.cover-headline {
			font-family: Inter, sans-serif;
			font-size: 28pt;
			font-weight: 800;
			line-height: 1.15;
			color: #ffffff;
			margin: 0 0 16px 0;
		}

		.cover-dek {
			font-size: 13pt;
			color: #cbd5e1;
			line-height: 1.5;
			max-width: 520px;
		}

		.cover-footer {
			display: flex;
			justify-content: space-between;
			align-items: flex-end;
			border-top: 1px solid rgba(255, 255, 255, 0.2);
			padding-top: 20px;
			font-family: Inter, sans-serif;
			font-size: 9pt;
			color: #94a3b8;
		}

		/* Inside Articles */
		.editorial-section {
			page-break-before: always;
			break-before: page;
			padding-top: 12px;
		}

		.article-header {
			margin-bottom: 24px;
			border-bottom: 1px solid #e2e8f0;
			padding-bottom: 16px;
		}

		.article-kicker {
			font-family: Inter, sans-serif;
			font-size: 9pt;
			font-weight: 800;
			color: #2563eb;
			text-transform: uppercase;
			letter-spacing: 0.1em;
			margin-bottom: 6px;
		}

		.article-headline {
			font-family: Inter, sans-serif;
			font-size: 24pt;
			font-weight: 800;
			color: #0f172a;
			line-height: 1.2;
			margin: 0 0 10px 0;
		}

		.article-byline {
			font-family: Inter, sans-serif;
			font-size: 9pt;
			color: #64748b;
			margin: 0;
		}

		/* Multi-column editorial text */
		.columns-2 {
			column-count: 2;
			column-gap: 28px;
			column-rule: 1px solid #f1f5f9;
			text-align: justify;
		}

		.dropcap::first-letter {
			font-family: Inter, sans-serif;
			font-size: 42pt;
			line-height: 0.8;
			font-weight: 900;
			float: left;
			margin-right: 8px;
			margin-bottom: -4px;
			color: #1e1b4b;
		}

		.pullquote {
			break-inside: avoid;
			page-break-inside: avoid;
			margin: 24px 0;
			padding: 16px 20px;
			background: #f8fafc;
			border-left: 4px solid #3b82f6;
			border-radius: 4px;
			font-size: 13pt;
			font-style: italic;
			color: #1e293b;
			line-height: 1.5;
		}

		.pullquote-attribution {
			font-family: Inter, sans-serif;
			font-size: 8.5pt;
			font-style: normal;
			font-weight: 700;
			color: #64748b;
			margin-top: 8px;
			display: block;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}

		.stat-box {
			background: #eff6ff;
			border: 1px solid #bfdbfe;
			border-radius: 6px;
			padding: 16px;
			margin: 20px 0;
			break-inside: avoid;
			page-break-inside: avoid;
		}

		.stat-number {
			font-family: Inter, sans-serif;
			font-size: 28pt;
			font-weight: 900;
			color: #1d4ed8;
			line-height: 1;
		}

		.stat-label {
			font-family: Inter, sans-serif;
			font-size: 8.5pt;
			font-weight: 600;
			color: #475569;
			margin-top: 4px;
		}
	</style>
</head>
<body>

	<!-- Page 1: Magazine Cover -->
	<div class="magazine-cover">
		<div class="cover-masthead">
			<h1 class="masthead-title">Chronicle</h1>
			<div class="masthead-tagline">Quarterly Journal of Software Architecture &amp; Paged Media</div>
		</div>

		<div class="cover-main-story">
			<span class="cover-story-tag">Special Feature</span>
			<h2 class="cover-headline">The Renaissance of Document Typography on the Web</h2>
			<p class="cover-dek">
				How modern standards, W3C Paged Media specifications, and declarative engine pipelines are reshaping high-precision technical publishing.
			</p>
		</div>

		<div class="cover-footer">
			<span>Printed.js Engineering Digest</span>
			<span>Volume IV &bull; Issue 42</span>
			<span>USD $14.00</span>
		</div>
	</div>

	<!-- Page 2: Editorial Op-Ed (Left Facing Spread) -->
	<div class="editorial-section">
		<div class="article-header">
			<div class="article-kicker">Editor's Perspective</div>
			<h2 class="article-headline">The Art of the Printed Page in a Screen-First World</h2>
			<p class="article-byline">By Sarah Jenkins &bull; 6 min read</p>
		</div>

		<div class="columns-2">
			<p class="dropcap">
				For over three decades, the web has prioritized fluidity above all else. Responsive viewports flex, squash, and expand to accommodate screen sizes from smartwatches to ultra-wide displays. Yet in boardrooms, regulatory audits, legal contracts, and financial summaries, the fixed-geometry printed page remains the indisputable gold standard.
			</p>
			<p>
				A paginated document conveys rhythm, structure, and permanence. Unlike a limitless vertical scroll that encourages skimming, pagination imposes intentional editorial pacing. Every break marks a threshold; every recto/verso spread invites the eye to linger.
			</p>
			<div class="pullquote">
				&ldquo;Pagination is not a relic of physical paper—it is a cognitive framework for structural comprehension.&rdquo;
				<span class="pullquote-attribution">&mdash; Chief Architect, Printed.js</span>
			</div>
			<p>
				Historically, web developers attempting to bridge this divide were forced to choose between complex server-side headless browsers running brittle CSS overrides, or proprietary document engines requiring esoteric markup languages.
			</p>
			<p>
				With modern browser APIs and pure CSS paged media standards, that compromise is officially over. High-precision rendering now happens natively where your data lives.
			</p>
		</div>
	</div>

	<!-- Page 3: In-Depth Technical Article (Right Facing Spread) -->
	<div class="editorial-section">
		<div class="article-header">
			<div class="article-kicker">Architecture Deep Dive</div>
			<h2 class="article-headline">Deconstructing Layout Fragmentation Engines</h2>
			<p class="article-byline">By Marcus Vance &bull; 8 min read</p>
		</div>

		<div class="columns-2">
			<p class="dropcap">
				The core challenge of automated pagination lies in DOM node fragmentation. When a paragraph, table row, or list item exceeds the boundary of an active printable area, the engine must make a surgical decision: split, overflow, or break avoid.
			</p>
			<div class="stat-box">
				<div class="stat-number">60 FPS</div>
				<div class="stat-label">Virtualizer frame rate for 100+ page documents</div>
			</div>
			<p>
				Consider table rowspans. If a cell spans four rows and a page boundary falls on row two, standard CSS browsers will truncate or distort the table layout. A specialized pagination adapter must split the cell, replicate borders, and insert continuation tags without destroying parent semantics.
			</p>
			<p>
				Furthermore, column synchronization ensures that data tables maintain identical column ratios across sequential pages, eliminating visual jarring during flip transitions.
			</p>
			<div class="pullquote">
				&ldquo;When layout engines honor pagination rules as first-class primitives, documents transform into publications.&rdquo;
			</div>
			<p>
				By integrating Phase 18 view modes—Single continuous, Grid spread, and 3D digital book—users can inspect document layouts with total clarity before sending jobs to production presses or PDF exporters.
			</p>
		</div>
	</div>

	<!-- Page 4: Photo Essay / Visual Feature -->
	<div class="editorial-section">
		<div class="article-header">
			<div class="article-kicker">Visual Essay</div>
			<h2 class="article-headline">Harmonic Typography &amp; Grid Symmetries</h2>
			<p class="article-byline">Chronicle Design Staff</p>
		</div>

		<div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
			<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
				<div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px;">
					<h3 style="margin-top: 0; font-family: Inter, sans-serif; font-size: 11pt; color: #1e293b;">Proportional Scaling</h3>
					<p style="font-size: 9.5pt; color: #64748b; line-height: 1.5; margin-bottom: 0;">
						Using fluid modular type scales derived from typographic ratios ensures visual harmony across headlines, subheads, captions, and body copy.
					</p>
				</div>
				<div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 16px;">
					<h3 style="margin-top: 0; font-family: Inter, sans-serif; font-size: 11pt; color: #1e293b;">Mirrored Gutter Margins</h3>
					<p style="font-size: 9.5pt; color: #64748b; line-height: 1.5; margin-bottom: 0;">
						Inside margins allocate binding space along the book spine, while generous outside margins provide comfortable finger space for readers.
					</p>
				</div>
			</div>
		</div>

		<div class="columns-2">
			<p>
				Grid systems establish an invisible scaffold that guides the reader's attention across complex multi-element compositions. By locking vertical baselines to consistent increments, disparate elements like charts, sidebars, and captions remain visually anchored.
			</p>
			<p>
				In digital magazine publishing, the intersection of CSS Grid and Paged Media enables sophisticated editorial layouts that were previously achievable only in desktop publishing suites like InDesign.
			</p>
		</div>
	</div>

</body>
</html>
`,
};
