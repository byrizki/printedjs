import type { RenderSurface } from "./types.js";

export class IframeSurface implements RenderSurface {
	readonly isolation = "iframe" as const;
	readonly rootElement: HTMLElement;
	readonly document: Document;
	readonly window: Window;

	constructor(target: HTMLIFrameElement) {
		const doc = target.contentDocument;
		const win = target.contentWindow;

		if (!doc || !win) {
			throw new Error("Unable to access iframe content document or window");
		}

		if (!doc.body) {
			const body = doc.createElement("body");
			doc.documentElement.appendChild(body);
		}

		const root = doc.createElement("div");
		root.setAttribute("data-printedjs-root", "true");
		doc.body.appendChild(root);

		this.rootElement = root;
		this.document = doc;
		this.window = win;
	}

	clear(): void {
		this.rootElement.replaceChildren();
	}

	destroy(): void {
		this.clear();
		this.rootElement.remove();
	}
}
