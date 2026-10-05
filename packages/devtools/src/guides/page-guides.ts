import { GUIDE_STYLES, GUIDE_STYLES_ID } from "./guide-styles.js";

export interface PageGuides {
	enable(): void;
	disable(): void;
	isEnabled(): boolean;
	destroy(): void;
}

export function createPageGuides(
	container: HTMLElement,
	initialEnabled = false,
): PageGuides {
	const rootDoc = container.ownerDocument ?? document;
	let enabled = initialEnabled;
	let observer: MutationObserver | null = null;

	function getTargetDocuments(): Document[] {
		const docs: Document[] = [rootDoc];

		if (container.tagName?.toLowerCase() === "iframe") {
			try {
				// SAFETY: tagName iframe check guarantees container is HTMLIFrameElement
				const iframeDoc = (container as HTMLIFrameElement).contentDocument;

				if (iframeDoc && !docs.includes(iframeDoc)) {
					docs.push(iframeDoc);
				}
			} catch {
				// Cross-origin fallback
			}
		}

		if (container.querySelectorAll) {
			const iframes = container.querySelectorAll("iframe");

			for (let i = 0; i < iframes.length; i++) {
				try {
					const iframeDoc = iframes[i]?.contentDocument;

					if (iframeDoc && !docs.includes(iframeDoc)) {
						docs.push(iframeDoc);
					}
				} catch {
					// Cross-origin fallback
				}
			}
		}

		return docs;
	}

	function ensureStyleInjected(doc: Document): void {
		if (doc.getElementById(GUIDE_STYLES_ID)) {
			return;
		}

		const styleEl = doc.createElement("style");
		styleEl.id = GUIDE_STYLES_ID;
		styleEl.textContent = GUIDE_STYLES;

		const head = doc.head ?? doc.documentElement;

		if (head) {
			head.appendChild(styleEl);
		}
	}

	function applyState(): void {
		const docs = getTargetDocuments();

		for (const doc of docs) {
			ensureStyleInjected(doc);

			if (enabled) {
				doc.documentElement?.setAttribute("data-printedjs-guides", "true");
			} else {
				doc.documentElement?.removeAttribute("data-printedjs-guides");
			}
		}

		if (enabled) {
			container.setAttribute("data-printedjs-guides", "true");
		} else {
			container.removeAttribute("data-printedjs-guides");
		}
	}

	function bindIframeListeners(): void {
		if (!container.querySelectorAll) {
			return;
		}

		const iframes = container.querySelectorAll("iframe");

		for (let i = 0; i < iframes.length; i++) {
			const iframe = iframes[i];

			if (iframe && !iframe.hasAttribute("data-printedjs-guides-bound")) {
				iframe.setAttribute("data-printedjs-guides-bound", "true");
				iframe.addEventListener("load", () => {
					applyState();
				});
			}
		}
	}

	if (typeof MutationObserver !== "undefined") {
		observer = new MutationObserver(() => {
			bindIframeListeners();
			applyState();
		});

		try {
			observer.observe(container, { childList: true, subtree: true });
		} catch {
			// Ignore if container is not observable
		}
	}

	bindIframeListeners();
	applyState();

	return {
		enable() {
			enabled = true;
			bindIframeListeners();
			applyState();
		},
		disable() {
			enabled = false;
			applyState();
		},
		isEnabled() {
			return enabled;
		},
		destroy() {
			enabled = false;
			applyState();

			if (observer) {
				observer.disconnect();
				observer = null;
			}

			const docs = getTargetDocuments();

			for (const doc of docs) {
				const existingStyle = doc.getElementById(GUIDE_STYLES_ID);

				if (existingStyle?.parentNode) {
					existingStyle.parentNode.removeChild(existingStyle);
				}

				doc.documentElement?.removeAttribute("data-printedjs-guides");
			}

			container.removeAttribute("data-printedjs-guides");
		},
	};
}
