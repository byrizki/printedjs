import { PrintedjsInputError, type ContentSource } from "@printedjs/core";

export interface NormalizedContent {
	readonly root: Node;
	readonly inlineStyles: readonly string[];
	readonly externalStylesheets?: readonly string[] | undefined;
	readonly documentBaseUrl?: string | undefined;
}

export function normalizeSource(
	content: ContentSource,
	doc: Document,
): NormalizedContent {
	if (!content || typeof content !== "object") {
		throw new PrintedjsInputError("Invalid content source provided");
	}

	const inlineStyles: string[] = [];
	const externalStylesheets: string[] = [];
	let documentBaseUrl: string | undefined;
	let root: Node;

	if ("html" in content) {
		if (typeof content.html !== "string") {
			throw new PrintedjsInputError("Content html must be a string");
		}

		const win = doc.defaultView ?? (typeof window !== "undefined" ? window : null);
		if (win && typeof win.DOMParser !== "undefined") {
			const parser = new win.DOMParser();
			const parsedDoc = parser.parseFromString(content.html, "text/html");

			const baseEl = parsedDoc.querySelector("base[href]");
			if (baseEl) {
				documentBaseUrl = baseEl.getAttribute("href") ?? undefined;
			}

			const links = parsedDoc.querySelectorAll("link[rel='stylesheet']");
			links.forEach((l) => {
				const href = l.getAttribute("href");
				if (href) {
					externalStylesheets.push(href);
				}
				l.remove();
			});

			const styles = parsedDoc.querySelectorAll("style");
			styles.forEach((s) => {
				if (s.textContent) {
					inlineStyles.push(s.textContent);
				}
				s.remove();
			});

			const scripts = parsedDoc.querySelectorAll("script");
			scripts.forEach((s) => s.remove());

			const frag = doc.createDocumentFragment();
			if (parsedDoc.body) {
				for (const child of Array.from(parsedDoc.body.childNodes)) {
					frag.appendChild(doc.importNode(child, true));
				}
			}
			root = frag;
		} else {
			const template = doc.createElement("template");
			template.innerHTML = content.html;
			root = doc.importNode(template.content, true);

			if (
				"querySelectorAll" in root &&
				typeof (root as ParentNode).querySelectorAll === "function"
			) {
				const parent = root as ParentNode;
				const baseEl = parent.querySelector("base[href]");
				if (baseEl) {
					documentBaseUrl = baseEl.getAttribute("href") ?? undefined;
				}

				const links = parent.querySelectorAll("link[rel='stylesheet']");
				links.forEach((l) => {
					const href = l.getAttribute("href");
					if (href) {
						externalStylesheets.push(href);
					}
					l.remove();
				});

				const styles = parent.querySelectorAll("style");
				styles.forEach((s) => {
					if (s.textContent) {
						inlineStyles.push(s.textContent);
					}
					s.remove();
				});
				const scripts = parent.querySelectorAll("script");
				scripts.forEach((s) => s.remove());
			}
		}
	} else if ("node" in content) {
		if (!content.node || typeof (content.node as Node).nodeType !== "number") {
			throw new PrintedjsInputError("Content node must be a valid DOM Node");
		}
		root = doc.importNode(content.node, true);

		if (
			"querySelectorAll" in root &&
			typeof (root as ParentNode).querySelectorAll === "function"
		) {
			const parent = root as ParentNode;
			const links = parent.querySelectorAll("link[rel='stylesheet']");
			links.forEach((l) => {
				const href = l.getAttribute("href");
				if (href) {
					externalStylesheets.push(href);
				}
				l.remove();
			});

			const styles = parent.querySelectorAll("style");
			styles.forEach((s) => {
				if (s.textContent) {
					inlineStyles.push(s.textContent);
				}
				s.remove();
			});
			const scripts = parent.querySelectorAll("script");
			scripts.forEach((s) => s.remove());
		}
	} else {
		throw new PrintedjsInputError("Content source must specify either 'html' or 'node'");
	}

	return {
		root,
		inlineStyles,
		...(externalStylesheets.length > 0 ? { externalStylesheets } : {}),
		...(documentBaseUrl ? { documentBaseUrl } : {}),
	};
}
