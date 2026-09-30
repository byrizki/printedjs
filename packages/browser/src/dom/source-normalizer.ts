import { PrintedjsInputError, type ContentSource } from "@printedjs/core";

export interface NormalizedContent {
	readonly root: Node;
	readonly inlineStyles: readonly string[];
}

export function normalizeSource(
	content: ContentSource,
	doc: Document,
): NormalizedContent {
	if (!content || typeof content !== "object") {
		throw new PrintedjsInputError("Invalid content source provided");
	}

	const inlineStyles: string[] = [];
	let root: Node;

	if ("html" in content) {
		if (typeof content.html !== "string") {
			throw new PrintedjsInputError("Content html must be a string");
		}

		const win = doc.defaultView ?? (typeof window !== "undefined" ? window : null);
		if (win && typeof win.DOMParser !== "undefined") {
			const parser = new win.DOMParser();
			const parsedDoc = parser.parseFromString(content.html, "text/html");

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

	return { root, inlineStyles };
}
