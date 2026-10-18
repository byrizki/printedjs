import { watch } from "node:fs";
import process from "node:process";
import { parseArgs } from "node:util";
import { renderPdf, type CliRenderOptions } from "./render.js";

interface MutableCliRenderOptions extends Omit<CliRenderOptions, "bleed"> {
	bleed?: string;
	waitFor?: string;
	waitPrintedjs?: boolean;
	waitPagedjs?: boolean;
}

const HELP_TEXT = `
Printedjs CLI — Headless PDF generation for paginated documents

USAGE:
  printedjs render <input> [options]

COMMANDS:
  render <input>          Render HTML document to PDF

OPTIONS:
  -o, --output <path>     Output PDF file path (default: output.pdf)
  -f, --format <format>   Page format override, e.g. A4, Letter (default: A4)
  -b, --bleed <size>      Bleed box size, e.g. 3mm, 0.125in
  -e, --engine <engine>   Browser engine: webview | playwright | puppeteer (default: webview)
  --wait-for <expr>       Wait for custom JS expression to be truthy before rendering PDF
  --wait-printedjs        Wait for Printed.js pagination to finish before rendering PDF
  --wait-pagedjs          Wait for Paged.js pagination to finish before rendering PDF
  --pagedjs-compatible    Enable Paged.js backwards compatibility (default: false)
  --no-pagedjs-compatible Disable Paged.js backwards compatibility
  -w, --watch             Watch input file for changes and re-render
  -h, --help              Show this help message
  -v, --version           Show version

EXAMPLES:
  printedjs render document.html -o output.pdf
  printedjs render document.html -o book.pdf --format A4 --bleed 3mm
  printedjs render document.html -o doc.pdf --engine webview
  printedjs render document.html -o doc.pdf --wait-printedjs
  printedjs render document.html -o doc.pdf --wait-for "window.isReady === true"
  printedjs render document.html -o legacy.pdf --wait-pagedjs --pagedjs-compatible
  printedjs render document.html -o live.pdf --watch
`;

export async function runCli(args: string[] = process.argv.slice(2)): Promise<void> {
	const { values, positionals } = parseArgs({
		args,
		options: {
			output: {
				type: "string",
				short: "o",
				default: "output.pdf",
			},
			format: {
				type: "string",
				short: "f",
				default: "A4",
			},
			bleed: {
				type: "string",
				short: "b",
			},
			engine: {
				type: "string",
				short: "e",
				default: "webview",
			},
			"wait-for": {
				type: "string",
			},
			"wait-printedjs": {
				type: "boolean",
				default: false,
			},
			"wait-pagedjs": {
				type: "boolean",
				default: false,
			},
			"pagedjs-compatible": {
				type: "boolean",
				default: false,
			},
			"no-pagedjs-compatible": {
				type: "boolean",
				default: false,
			},
			watch: {
				type: "boolean",
				short: "w",
				default: false,
			},
			help: {
				type: "boolean",
				short: "h",
				default: false,
			},
			version: {
				type: "boolean",
				short: "v",
				default: false,
			},
		},
		allowPositionals: true,
	});

	if (values.help) {
		console.log(HELP_TEXT);

		return;
	}

	if (values.version) {
		console.log("printedjs 0.2.1");

		return;
	}

	const command = positionals[0];
	const input = positionals[1];

	if (!command || command !== "render" || !input) {
		console.error("Error: Missing required argument. Use 'printedjs render <input>'.\n");
		console.log(HELP_TEXT);
		process.exit(1);
	}

	const output = values.output ?? "output.pdf";
	const format = values.format ?? "A4";
	const bleed = values.bleed;

	// SAFETY: "wait-for" CLI argument is configured as string type in parseArgs options schema above
	const waitFor = values["wait-for"] as string | undefined;

	const engine =
		values.engine === "puppeteer"
			? "puppeteer"
			: values.engine === "playwright"
				? "playwright"
				: "webview";

	const isWatch = values.watch ?? false;

	const pagedjsCompatible = values["no-pagedjs-compatible"]
		? false
		: (values["pagedjs-compatible"] ?? false);

	const doRender = async () => {
		try {
			console.log(
				`[printedjs] Rendering "${input}" -> "${output}" (${engine}, pagedjsCompatible: ${pagedjsCompatible})...`,
			);

			const renderOptions: MutableCliRenderOptions = {
				input,
				output,
				format,
				engine,
				pagedjsCompatible,
			};

			if (bleed) {
				renderOptions.bleed = bleed;
			}

			if (waitFor) {
				renderOptions.waitFor = waitFor;
			}

			if (values["wait-printedjs"]) {
				renderOptions.waitPrintedjs = true;
			}

			if (values["wait-pagedjs"]) {
				renderOptions.waitPagedjs = true;
			}

			const result = await renderPdf(renderOptions);

			console.log(
				`[printedjs] Successfully generated ${result.pageCount} pages in ${result.durationMs.toFixed(0)}ms: ${result.outputPath}`,
			);
		} catch (err) {
			console.error(
				"[printedjs] Render failed:",
				err instanceof Error ? err.message : err,
			);
		}
	};

	await doRender();

	if (isWatch) {
		console.log(
			`[printedjs] Watching for changes on "${input}" (press Ctrl+C to exit)...`,
		);
		let timeoutId: ReturnType<typeof setTimeout> | null = null;
		watch(input, () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			timeoutId = setTimeout(() => {
				void doRender();
			}, 300);
		});
	}
}
