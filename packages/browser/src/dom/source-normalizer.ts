import { PrintedjsInputError, type ContentSource } from "@printedjs/core";

export interface NormalizedContent {
	readonly root: Node;
	readonly inlineStyles: readonly string[];
	readonly externalStylesheets?: readonly string[] | undefined;
	readonly documentBaseUrl?: string | undefined;
}

interface MutableNormalizedContent {
	root: Node;
	inlineStyles: readonly string[];
	externalStylesheets?: readonly string[];
	documentBaseUrl?: string;
}

export function normalizeSource(
	content: ContentSource,
	doc: Document,
): NormalizedContent {
	if (!content) {
		throw new PrintedjsInputError("Invalid content source provided");
	}

	const inlineStyles: string[] = [];
	const externalStylesheets: string[] = [];
	let documentBaseUrl: string | undefined;
	let root: Node;

	if ("html" in content) {
		if (Object.prototype.toString.call(content.html) !== "[object String]") {
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

			if ("querySelectorAll" in root) {
				// SAFETY: root implements ParentNode when querySelectorAll is present
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
		// SAFETY: content.node is expected to be a DOM Node
		const candidateNode = content.node as Node;

		if (!candidateNode || !Number.isFinite(candidateNode.nodeType)) {
			throw new PrintedjsInputError("Content node must be a valid DOM Node");
		}

		root = doc.importNode(candidateNode, true);

		if ("querySelectorAll" in root) {
			// SAFETY: root implements ParentNode when querySelectorAll is present
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

	const result: MutableNormalizedContent = {
		root,
		inlineStyles,
	};

	if (externalStylesheets.length > 0) {
		result.externalStylesheets = externalStylesheets;
	}

	if (documentBaseUrl) {
		result.documentBaseUrl = documentBaseUrl;
	}

	return result;
}
