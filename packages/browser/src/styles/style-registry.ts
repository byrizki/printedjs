import type { LoadedStylesheet } from "./stylesheet-loader.js";

export class StyleRegistry {
	private readonly doc: Document;
	private readonly styleElements: HTMLStyleElement[] = [];

	constructor(doc: Document) {
		this.doc = doc;
	}

	apply(sheets: readonly LoadedStylesheet[]): void {
		const target = this.doc.head ?? this.doc.documentElement;

		for (const sheet of sheets) {
			const style = this.doc.createElement("style");
			style.setAttribute("data-printedjs-style", "true");
			if (sheet.url) {
				style.setAttribute("data-source-url", sheet.url);
			}
			style.textContent = sheet.css;
			target.appendChild(style);
			this.styleElements.push(style);
		}
	}

	clear(): void {
		while (this.styleElements.length > 0) {
			const style = this.styleElements.pop()!;
			style.remove();
		}
	}

	destroy(): void {
		this.clear();
	}
}
