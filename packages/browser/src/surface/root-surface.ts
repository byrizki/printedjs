import type { RenderSurface } from "./types.js";

export class RootSurface implements RenderSurface {
	readonly isolation = "root" as const;
	readonly rootElement: HTMLElement;
	readonly document: Document;
	readonly window: Window;

	constructor(target: HTMLElement) {
		const doc = target.ownerDocument ?? document;
		const win = doc.defaultView ?? window;

		const root = doc.createElement("div");
		root.setAttribute("data-printedjs-root", "true");
		target.appendChild(root);

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
