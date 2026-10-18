import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

interface BenchmarkTarget {
	name: string;
	runtime: string;
	useCase: string;
	isAvailable: () => boolean;
	buildCmd: (inputDoc: string, outPdf: string) => string;
}

interface BenchmarkResult {
	name: string;
	runtime: string;
	useCase: string;
	durationMs: number;
	runsMs: number[];
	peakRssMb: number;
	fileSizeBytes: number;
	fileSizeKb: number;
	pageCount: number;
	verified: boolean;
}

const workspaceRoot = resolve(import.meta.dirname, "..");

const benchDir = join(workspaceRoot, "benchmarks");

const fixturesDir = join(benchDir, "fixtures");

const artifactsDir = join(benchDir, "artifacts");

mkdirSync(fixturesDir, { recursive: true });

mkdirSync(artifactsDir, { recursive: true });

function resolveTypstBinary(): string | undefined {
	const candidates = [
		process.env.TYPST_BIN,
		join(process.env.HOME ?? "", ".cargo/bin/typst"),
		"/usr/local/bin/typst",
		"/usr/bin/typst",
	];

	for (const candidate of candidates) {
		if (candidate && existsSync(candidate)) {
			return candidate;
		}
	}

	try {
		const found = execSync("which typst", { encoding: "utf-8" }).trim();

		if (found && existsSync(found)) {
			return found;
		}
	} catch {
		// Typst not in PATH
	}

	return undefined;
}

const typstBin = resolveTypstBinary();

const cliBin = join(workspaceRoot, "packages/cli/dist/cli.js");

// 1. Generate canonical 10-page HTML benchmark document
const htmlFixturePath = join(fixturesDir, "benchmark-document-10p.html");

let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Enterprise Annual Performance Report</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
      @top-center {
        content: "Enterprise Annual Performance Report";
        font-family: sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: sans-serif;
        font-size: 8pt;
        color: #0284c7;
      }
    }
    body {
      font-family: sans-serif;
      color: #0f172a;
      line-height: 1.6;
      margin: 0;
    }
    h1 {
      color: #0284c7;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 4px;
      font-size: 15pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      font-size: 9pt;
    }
    th {
      background: #f8fafc;
      text-align: left;
    }
    section:not(:last-child) {
      break-after: page;
    }
  </style>
</head>
<body>
`;

for (let i = 1; i <= 10; i++) {
	htmlContent += `  <section>
    <h1>Section ${i}: Performance Analytics & Operational Metrics</h1>
    <p>This section benchmarks system latency, throughput, and distributed memory allocation across heterogeneous compute environments. Enterprise applications require deterministic execution profiles with minimal tail latencies.</p>
    <table>
      <thead>
        <tr><th>Metric Identifier</th><th>Baseline Q1</th><th>Target Q2</th><th>Observed Q3</th><th>Variance (%)</th></tr>
      </thead>
      <tbody>
        <tr><td>Throughput (req/s)</td><td>12,450</td><td>15,000</td><td>16,230</td><td>+8.2%</td></tr>
        <tr><td>Median Latency (p50)</td><td>4.2 ms</td><td>3.5 ms</td><td>3.1 ms</td><td>-11.4%</td></tr>
        <tr><td>Tail Latency (p99)</td><td>24.8 ms</td><td>18.0 ms</td><td>16.5 ms</td><td>-8.3%</td></tr>
        <tr><td>Memory RSS Footprint</td><td>142 MB</td><td>128 MB</td><td>119 MB</td><td>-7.0%</td></tr>
      </tbody>
    </table>
    <p>Comprehensive telemetry reveals sustained resource stability under burst workloads. Micro-benchmarks demonstrate linear scaling across cluster workers without thread starvation or memory leaks.</p>
  </section>
`;
}

htmlContent += `</body>\n</html>\n`;

writeFileSync(htmlFixturePath, htmlContent, "utf-8");

// 2. Generate canonical 10-page Typst benchmark document
const typstFixturePath = join(fixturesDir, "benchmark-document-10p.typ");

let typstContent = `
#set page(
  paper: "a4",
  margin: (x: 20mm, y: 20mm),
  header: align(center)[#text(size: 8pt, fill: rgb("#64748b"))[Enterprise Annual Performance Report]],
  footer: align(right)[#text(size: 8pt, fill: rgb("#0284c7"))[#context [Page #counter(page).display() of #counter(page).final().first()]]]
)
#set text(font: "Liberation Sans", size: 10pt, fill: rgb("#0f172a"))

`;

for (let i = 1; i <= 10; i++) {
	typstContent += `#heading(level: 1)[Section ${i}: Performance Analytics & Operational Metrics]
This section benchmarks system latency, throughput, and distributed memory allocation across heterogeneous compute environments. Enterprise applications require deterministic execution profiles with minimal tail latencies.

#table(
  columns: (1fr, 1fr, 1fr, 1fr, 1fr),
  fill: (col, row) => if row == 0 { rgb("#f8fafc") } else { none },
  stroke: 0.5pt + rgb("#cbd5e1"),
  table.header([*Metric Identifier*], [*Baseline Q1*], [*Target Q2*], [*Observed Q3*], [*Variance (%)*]),
  [Throughput (req/s)], [12,450], [15,000], [16,230], [+8.2%],
  [Median Latency (p50)], [4.2 ms], [3.5 ms], [3.1 ms], [-11.4%],
  [Tail Latency (p99)], [24.8 ms], [18.0 ms], [16.5 ms], [-8.3%],
  [Memory RSS Footprint], [142 MB], [128 MB], [119 MB], [-7.0%],
)

Comprehensive telemetry reveals sustained resource stability under burst workloads. Micro-benchmarks demonstrate linear scaling across cluster workers without thread starvation or memory leaks.

`;

	if (i < 10) {
		typstContent += `#pagebreak()\n\n`;
	}
}

writeFileSync(typstFixturePath, typstContent, "utf-8");

function getPdfPageCount(filePath: string): number {
	try {
		const out = execSync(`pdfinfo "${filePath}"`, { encoding: "utf-8" });
		const match = out.match(/Pages:\s+(\d+)/);

		if (match) {
			return Number.parseInt(match[1], 10);
		}
	} catch {
		// Fallback to byte analysis
		try {
			const buf = readFileSync(filePath);
			const matches = buf.toString("latin1").match(/\/Type\s*\/Page\b/g);

			if (matches) {
				return matches.length;
			}
		} catch {
			// ignore
		}
	}

	return 0;
}

const targets: BenchmarkTarget[] = [
	{
		name: "Typst",
		runtime: "Native Rust Binary",
		useCase: "Pure markup-to-PDF compilation (non-HTML/CSS)",
		isAvailable: () => Boolean(typstBin),
		buildCmd: (_input, out) => `${typstBin} compile "${typstFixturePath}" "${out}"`,
	},
	{
		name: "Printedjs (Playwright)",
		runtime: "Node.js + Chromium",
		useCase: "Server batch compilation, CI/CD, leanest PDF output",
		isAvailable: () => existsSync(cliBin),
		buildCmd: (input, out) =>
			`node "${cliBin}" render "${input}" -o "${out}" --engine playwright --wait-printedjs`,
	},
	{
		name: "Printedjs (Puppeteer)",
		runtime: "Node.js + Chromium CDP",
		useCase: "Cloud microservices, Docker workers, serverless",
		isAvailable: () => existsSync(cliBin),
		buildCmd: (input, out) =>
			`node "${cliBin}" render "${input}" -o "${out}" --engine puppeteer --wait-printedjs`,
	},
	{
		name: "Paged.js Polyfill",
		runtime: "Puppeteer + DOM Reflow",
		useCase: "Legacy in-browser polyfill with full DOM reflow",
		isAvailable: () => existsSync(cliBin),
		buildCmd: (input, out) =>
			`node "${cliBin}" render "${input}" -o "${out}" --engine puppeteer --pagedjs-compatible --wait-pagedjs`,
	},
	{
		name: "Printedjs Headless WebView",
		runtime: "Native On-Device Engine",
		useCase: "Mobile & Desktop on-device export with zero cloud latency",
		isAvailable: () => existsSync(cliBin),
		buildCmd: (input, out) =>
			`node "${cliBin}" render "${input}" -o "${out}" --engine webview`,
	},
];

console.log(
	"================================================================================",
);

console.log("  Printedjs End-to-End PDF Benchmark Suite (Canonical 10-Page Document)");

console.log(
	"================================================================================",
);

console.log(
	`Document Fixtures:\n  HTML:  ${htmlFixturePath}\n  Typst: ${typstFixturePath}\n`,
);

const results: BenchmarkResult[] = [];

for (const target of targets) {
	if (!target.isAvailable()) {
		console.log(`[SKIP] ${target.name}: runtime binary unavailable.`);
		continue;
	}

	const safeId = target.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
	const outPdfPath = join(artifactsDir, `benchmark-${safeId}.pdf`);

	console.log(`\nEvaluating: ${target.name} (${target.runtime})...`);

	// Warm-up run
	const cmd = target.buildCmd(htmlFixturePath, outPdfPath);

	try {
		execSync(cmd, { stdio: "ignore" });
	} catch (err) {
		console.error(`  Warm-up run failed:`, err);
		continue;
	}

	// 3 measured runs
	const runsMs: number[] = [];
	let peakRssKb = 0;

	for (let r = 1; r <= 3; r++) {
		const t0 = performance.now();

		try {
			// Using /usr/bin/time if available for peak RSS
			try {
				const timeOut = execSync(`/usr/bin/time -v ${cmd} 2>&1`, { encoding: "utf-8" });
				const rssMatch = timeOut.match(/Maximum resident set size \(kbytes\):\s+(\d+)/);

				if (rssMatch) {
					peakRssKb = Math.max(peakRssKb, Number.parseInt(rssMatch[1], 10));
				}
			} catch {
				execSync(cmd, { stdio: "ignore" });
			}
		} catch (err) {
			console.error(`  Run ${r} failed:`, err);
			continue;
		}

		const elapsed = performance.now() - t0;
		runsMs.push(Math.round(elapsed));
		console.log(`  Run ${r}: ${Math.round(elapsed)} ms`);
	}

	const avgMs = Math.round(runsMs.reduce((sum, val) => sum + val, 0) / runsMs.length);
	const fileSizeBytes = existsSync(outPdfPath) ? statSync(outPdfPath).size : 0;
	const fileSizeKb = Math.round(fileSizeBytes / 1024);
	const pageCount = getPdfPageCount(outPdfPath);
	const peakRssMb = peakRssKb > 0 ? Math.round(peakRssKb / 1024) : 0;

	const verified = pageCount === 10;

	results.push({
		name: target.name,
		runtime: target.runtime,
		useCase: target.useCase,
		durationMs: avgMs,
		runsMs,
		peakRssMb,
		fileSizeBytes,
		fileSizeKb,
		pageCount,
		verified,
	});

	console.log(
		`  => Result: ${avgMs} ms avg | ${fileSizeKb} KB | ${pageCount} pages (Verified: ${verified})`,
	);
}

// Persist JSON summary
const resultsJsonPath = join(benchDir, "benchmark-results.json");

writeFileSync(resultsJsonPath, JSON.stringify(results, null, 2), "utf-8");

console.log(
	"\n================================================================================",
);

console.log("  Benchmark Results Summary");

console.log(
	"================================================================================\n",
);

console.log(
	"| Engine / Pipeline              | Underlying Runtime      | Execution Time | Peak RSS Memory | Output PDF Size | Pages | Verified |",
);

console.log(
	"| :----------------------------- | :---------------------- | :------------: | :-------------: | :-------------: | :---: | :------: |",
);

for (const r of results) {
	const rssStr = r.peakRssMb > 0 ? `~${r.peakRssMb} MB` : "N/A";

	const timeStr =
		r.durationMs > 1000
			? `~${(r.durationMs / 1000).toFixed(1)} s`
			: `~${r.durationMs} ms`;

	console.log(
		`| **${r.name}** | ${r.runtime} | **${timeStr}** | ${rssStr} | **${r.fileSizeKb} KB** | ${r.pageCount} | ${r.verified ? "✓ Yes" : "✗ No"} |`,
	);
}

console.log(`\nPersisted benchmark data to ${resultsJsonPath}`);
