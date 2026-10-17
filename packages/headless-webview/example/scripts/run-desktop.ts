import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import {
	enableDesktopBridge,
	HeadlessWebView,
	isDesktopSupported,
	registerNativeModule,
	resolveDesktopBinary,
} from "../../src/index.js";

const main = async () => {
	console.log(
		"================================================================================",
	);
	console.log(
		"  PrintedJS Headless WebView: React Native Desktop (Wry Bridge) Execution       ",
	);
	console.log(
		"================================================================================",
	);

	const start = Date.now();

	// Step 1: Detect and verify desktop binary availability
	process.stdout.write("\n⏳ [1/5] Detecting native desktop Wry engine binary...\n");

	if (!isDesktopSupported()) {
		throw new Error(
			"Desktop native headless webview binary is not available. Run `bash scripts/bundle-cli-prebuilts.sh` first.",
		);
	}

	const binaryPath = resolveDesktopBinary();

	process.stdout.write(`✅ [PASS] Found native desktop binary: ${binaryPath}\n`);

	// Step 2: Register desktop bridge native module
	process.stdout.write("\n⏳ [2/5] Initializing React Native Desktop Bridge...\n");
	enableDesktopBridge();

	process.stdout.write("✅ [PASS] Desktop bridge successfully registered.\n");

	// Step 3: Create HeadlessWebView instance and load document
	process.stdout.write("\n⏳ [3/5] Instantiating HeadlessWebView and loading HTML...\n");

	const sampleHtml = `
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="utf-8" />
			<title>React Native Desktop PDF Report</title>
			<style>
				@page { size: A4 portrait; margin: 20mm; }
				body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; }
				header { border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 24px; }
				h1 { margin: 0; font-size: 24px; color: #1e3a8a; }
				.badge { display: inline-block; padding: 4px 10px; background: #dbeafe; color: #1e40af; border-radius: 6px; font-size: 12px; font-weight: 600; }
				table { width: 100%; border-collapse: collapse; margin-top: 16px; }
				th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
				th { background: #f8fafc; font-weight: 600; }
			</style>
		</head>
		<body>
			<header>
				<span class="badge">React Native Desktop • Wry Headless</span>
				<h1 id="title">PrintedJS Document Pipeline</h1>
			</header>
			<p>Direct headless PDF generation without browser emulators on React Native Desktop.</p>
			<table>
				<thead>
					<tr><th>Platform Target</th><th>Engine</th><th>Status</th></tr>
				</thead>
				<tbody>
					<tr><td>macOS Desktop</td><td>Wry / WebKit</td><td>Active</td></tr>
					<tr><td>Windows Desktop</td><td>Wry / WebView2</td><td>Active</td></tr>
					<tr><td>Linux Desktop</td><td>Wry / WebKitGTK</td><td>Active</td></tr>
				</tbody>
			</table>
		</body>
		</html>
	`;

	const webview = await HeadlessWebView.create({
		html: sampleHtml,
	});

	process.stdout.write(`✅ [PASS] Instance created: ${webview.id}\n`);

	// Step 4: Evaluate JavaScript
	process.stdout.write("\n⏳ [4/5] Evaluating DOM script via desktop bridge...\n");

	const evaluatedTitle = await webview.evaluateJavascript(
		"document.getElementById('title').textContent",
	);

	if (evaluatedTitle !== "PrintedJS Document Pipeline") {
		throw new Error(`Unexpected evaluated title: "${evaluatedTitle}"`);
	}

	process.stdout.write(`✅ [PASS] Script evaluation matched: "${evaluatedTitle}"\n`);

	// Step 5: Generate and verify real vector PDF
	process.stdout.write("\n⏳ [5/5] Generating vector PDF via Wry print engine...\n");

	const pdfBytes = await webview.printToPdf({
		landscape: false,
		printBackground: true,
	});

	if (pdfBytes.byteLength < 50000) {
		throw new Error(
			`Suspiciously small PDF produced (${pdfBytes.byteLength} bytes). Expected >50KB.`,
		);
	}

	const header = Buffer.from(pdfBytes.subarray(0, 8)).toString("utf-8");

	if (!header.startsWith("%PDF")) {
		throw new Error(`Invalid PDF header: ${header}`);
	}

	// Write output sample for inspection
	const outputDir = resolve(process.cwd(), "output-samples");

	if (!existsSync(outputDir)) {
		mkdirSync(outputDir, { recursive: true });
	}

	const outputPath = resolve(outputDir, "rn-desktop-example.pdf");

	writeFileSync(outputPath, pdfBytes);

	process.stdout.write(
		`✅ [PASS] Generated ${pdfBytes.byteLength} bytes vector PDF (${header.trim()})\n`,
	);
	process.stdout.write(`         Output saved to: ${outputPath}\n`);

	// Teardown
	await webview.destroy();
	registerNativeModule(null);

	const totalDuration = Date.now() - start;

	console.log(
		"\n================================================================================",
	);
	console.log(`  React Native Desktop Verification Complete (${totalDuration}ms)`);
	console.log(
		"================================================================================\n",
	);
};

main().catch((err) => {
	console.error("\n❌ Fatal error in React Native Desktop runner:", err);
	registerNativeModule(null);
	process.exit(1);
});
