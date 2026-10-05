import type { ExportPdfOptions, PrintDocumentOptions } from "./types.js";

export type { ExportPdfOptions, PrintDocumentOptions };

interface ResolvedTarget {
	readonly win: Window;
	readonly doc: Document;
}

function resolveTarget(
	target?: Window | Document | HTMLElement | HTMLIFrameElement | undefined,
): ResolvedTarget {
	if (typeof window === "undefined" && !target) {
		throw new Error("printDocument requires a browser window environment");
	}

	if (!target) {
		return { win: window, doc: document };
	}

	// HTMLIFrameElement
	if ("contentWindow" in target && target.contentWindow) {
		const iframeWin = target.contentWindow;
		const iframeDoc = target.contentDocument ?? iframeWin.document;

		return { win: iframeWin, doc: iframeDoc };
	}

	// Window
	if ("document" in target && "print" in target) {
		// SAFETY: verified presence of document and print properties characteristic of Window
		const targetWin = target as Window;

		return { win: targetWin, doc: targetWin.document };
	}

	// Document
	if ("defaultView" in target && "documentElement" in target) {
		// SAFETY: verified presence of defaultView and documentElement characteristic of Document
		const targetDoc = target as Document;
		const targetWin = targetDoc.defaultView ?? window;

		return { win: targetWin, doc: targetDoc };
	}

	// HTMLElement
	if ("ownerDocument" in target && target.ownerDocument) {
		const targetDoc = target.ownerDocument;
		const targetWin = targetDoc.defaultView ?? window;

		return { win: targetWin, doc: targetDoc };
	}

	return { win: window, doc: document };
}

export function preparePrint(
	target?: Window | Document | HTMLElement | HTMLIFrameElement | undefined,
): () => void {
	const { doc } = resolveTarget(target);
	const root = doc.documentElement;
	const previousPrintingAttr = root.getAttribute("data-printedjs-printing");

	root.setAttribute("data-printedjs-printing", "true");

	return () => {
		if (previousPrintingAttr === null) {
			root.removeAttribute("data-printedjs-printing");
		} else {
			root.setAttribute("data-printedjs-printing", previousPrintingAttr);
		}
	};
}

export async function printDocument(options: PrintDocumentOptions = {}): Promise<void> {
	const { win, doc } = resolveTarget(options.target);

	let originalTitle: string | undefined;

	if (options.pageTitle) {
		originalTitle = doc.title;
		doc.title = options.pageTitle;
	}

	const cleanupPrepare =
		options.cleanChrome !== false ? preparePrint(options.target) : () => {};

	try {
		if (options.beforePrint) {
			await options.beforePrint();
		}

		await new Promise<void>((resolve) => {
			let cleanedUp = false;

			const onAfterPrint = () => {
				if (cleanedUp) return;
				cleanedUp = true;
				win.removeEventListener("afterprint", onAfterPrint);
				resolve();
			};

			win.addEventListener("afterprint", onAfterPrint, { once: true });

			try {
				win.focus();
				win.print();
			} catch (err) {
				onAfterPrint();
				throw err;
			}

			// Fallback timer in case afterprint does not fire in headless/mock environments
			setTimeout(() => {
				onAfterPrint();
			}, 500);
		});
	} finally {
		if (originalTitle !== undefined) {
			doc.title = originalTitle;
		}

		cleanupPrepare();

		if (options.afterPrint) {
			await options.afterPrint();
		}
	}
}

export async function exportToPdf(options: ExportPdfOptions = {}): Promise<void> {
	let pageTitle = options.pageTitle;

	if (!pageTitle && options.filename) {
		pageTitle = options.filename.replace(/\.pdf$/i, "");
	}

	await printDocument({
		...options,
		pageTitle,
		cleanChrome: options.cleanChrome ?? true,
	});
}
