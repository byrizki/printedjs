import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";

export interface FootnoteRule {
	readonly selector: string;
	readonly policy?: "auto" | "line" | "block" | undefined;
	readonly display?: "block" | "inline" | undefined;
}

const FOOTNOTES_KEY = "printedjs:footnoteRules";

function parsePolicy(raw: string | undefined): "auto" | "line" | "block" {
	const val = raw?.toLowerCase();

	if (val === "line" || val === "block") {
		return val;
	}

	return "auto";
}

function parseDisplay(raw: string | undefined): "block" | "inline" {
	const val = raw?.toLowerCase();

	if (val === "inline") {
		return val;
	}

	return "block";
}

export function footnotesPlugin(): PrintedjsPlugin {
	const footnoteRules: FootnoteRule[] = [];

	return {
		name: "footnotes",
		after: ["page-rules", "breaks", "strings", "generated-content"],
		setup(context: PluginContext) {
			footnoteRules.length = 0;
			context.metadata[FOOTNOTES_KEY] = footnoteRules;
		},
		transformStyles(css: string, context?: PluginContext): string {
			let transformed = css;
			const pagedjsCompatible = context?.pagedjsCompatible ?? false;

			// Extract @footnote inside @page and transform to footnote area
			transformed = transformed.replace(/@page\b[^{]*\{([\s\S]*?)\}/gi, (pageBlock) => {
				let newPageBlock = pageBlock;
				const footnoteMatch = pageBlock.match(/@footnote\s*\{([^}]*)\}/i);

				if (footnoteMatch) {
					newPageBlock = newPageBlock.replace(/@footnote\s*\{[^}]*\}/gi, "");

					const footnoteAreaSel = pagedjsCompatible
						? ".printedjs_footnote_area, .pagedjs_footnote_area"
						: ".printedjs_footnote_area";

					transformed += `\n${footnoteAreaSel} {\n${footnoteMatch[1]}\n}\n`;
				}

				return newPageBlock;
			});

			// Match rules with float: footnote, footnote-policy, or footnote-display
			transformed = transformed.replace(
				/([^{}@]+)\{([^{}]+)\}/g,
				(match, rawSel, rawBody) => {
					const body = rawBody;

					if (/float\s*:\s*footnote/i.test(body)) {
						const sel = rawSel.trim();
						const policyMatch = body.match(/footnote-policy\s*:\s*(auto|line|block)/i);
						const displayMatch = body.match(/footnote-display\s*:\s*(block|inline)/i);

						footnoteRules.push({
							selector: sel,
							policy: parsePolicy(policyMatch?.[1]),
							display: parseDisplay(displayMatch?.[1]),
						});

						let cleanedBody = body.replace(/float\s*:\s*footnote;?/gi, "");
						cleanedBody = cleanedBody.replace(/footnote-policy\s*:\s*[^;!}]+;?/gi, "");
						cleanedBody = cleanedBody.replace(/footnote-display\s*:\s*[^;!}]+;?/gi, "");

						return `${sel} {${cleanedBody}}`;
					}

					return match;
				},
			);

			// Transform ::footnote-call pseudo-element to [data-footnote-call]::after
			transformed = transformed.replace(
				/::footnote-call\b/gi,
				"[data-footnote-call]::after",
			);

			// Transform ::footnote-marker pseudo-element to [data-footnote-marker]::before
			transformed = transformed.replace(
				/::footnote-marker\b/gi,
				"[data-footnote-marker]::before",
			);

			return transformed;
		},
		beforeLayout(context: PluginContext) {
			// SAFETY: contentRoot is a DOM ParentNode during layout
			const contentRoot = context.metadata.contentRoot as ParentNode | undefined;

			if (!contentRoot || !("querySelectorAll" in contentRoot)) {
				return;
			}

			// Pre-tag elements with footnote policy and display
			for (const rule of footnoteRules) {
				try {
					const matched = contentRoot.querySelectorAll<HTMLElement>(rule.selector);
					matched.forEach((el) => {
						el.setAttribute("data-note", "footnote");
						el.setAttribute("data-note-policy", rule.policy ?? "auto");
						el.setAttribute("data-note-display", rule.display ?? "block");
					});
				} catch {
					// Ignore invalid selector
				}
			}
		},
		afterRender(context: PluginContext) {
			const doc = context.metadata.document;

			if (!doc || footnoteRules.length === 0) {
				return;
			}

			const pagedjsCompatible = context.pagedjsCompatible ?? false;
			const pages = doc.querySelectorAll(".printedjs_page, .pagedjs_page");
			let footnoteCounter = 0;

			const pendingNotes: {
				node: HTMLElement;
				noteId: string;
				isContinuation: boolean;
			}[] = [];

			pages.forEach((pageEl, pageIdx) => {
				// SAFETY: elements returned by querySelectorAll are HTMLElement nodes
				const page = pageEl as HTMLElement;

				const footnoteInner = page.querySelector<HTMLElement>(
					".printedjs_footnote_inner_content, .pagedjs_footnote_inner_content",
				);

				const footnoteArea = page.querySelector<HTMLElement>(
					".printedjs_footnote_area, .pagedjs_footnote_area",
				);

				const footnoteContent = page.querySelector<HTMLElement>(
					".printedjs_footnote_content, .pagedjs_footnote_content",
				);

				if (!footnoteInner || !footnoteArea) {
					return;
				}

				// Place any pending overflow notes from previous page
				while (pendingNotes.length > 0) {
					const pending = pendingNotes.shift()!;
					footnoteArea.style.display = "block";
					footnoteContent?.classList.remove(
						"printedjs_footnote_empty",
						"pagedjs_footnote_empty",
					);
					pending.node.setAttribute("data-footnote-continuation", "true");
					pending.node.classList.add("printedjs_footnote_continuation");

					if (pagedjsCompatible) {
						pending.node.classList.add("pagedjs_footnote_continuation");
					}

					footnoteInner.appendChild(pending.node);
				}

				const matchedNotes: HTMLElement[] = [];

				for (const rule of footnoteRules) {
					const elements = page.querySelectorAll<HTMLElement>(rule.selector);
					elements.forEach((el) => {
						if (!matchedNotes.includes(el) && !footnoteInner.contains(el)) {
							matchedNotes.push(el);
						}
					});
				}

				if (matchedNotes.length === 0 && footnoteInner.children.length === 0) {
					return;
				}

				footnoteArea.style.display = "block";
				footnoteContent?.classList.remove(
					"printedjs_footnote_empty",
					"pagedjs_footnote_empty",
				);

				matchedNotes.forEach((note) => {
					footnoteCounter++;
					const noteId = String(footnoteCounter);

					// Create inline call placeholder
					const callSpan = doc.createElement("span");
					callSpan.className = pagedjsCompatible
						? "printedjs_footnote_call pagedjs_footnote_call"
						: "printedjs_footnote_call";
					callSpan.setAttribute("data-footnote-call", noteId);
					callSpan.textContent = noteId;

					if (note.parentNode) {
						note.parentNode.insertBefore(callSpan, note);
					}

					// Set marker attributes
					note.setAttribute("data-footnote-marker", noteId);
					note.setAttribute("data-note", "footnote");

					// Check available height in footnote area
					const areaView =
						doc.defaultView ?? (typeof window !== "undefined" ? window : null);

					const maxHeight =
						parseFloat(areaView?.getComputedStyle(footnoteArea).maxHeight ?? "") || 250;

					const currentHeight = footnoteInner.offsetHeight;

					// If note exceeds space on current page and has multiple paragraphs or long text
					if (currentHeight > maxHeight && pageIdx < pages.length - 1) {
						note.setAttribute("data-footnote-continued", "true");
						note.classList.add("printedjs_footnote_continued");

						if (pagedjsCompatible) {
							note.classList.add("pagedjs_footnote_continued");
						}

						// Clone continuation fragment for next page
						// SAFETY: cloneNode(true) on HTMLElement note produces an HTMLElement
						const continuation = note.cloneNode(true) as HTMLElement;
						continuation.removeAttribute("data-footnote-continued");
						continuation.classList.remove(
							"printedjs_footnote_continued",
							"pagedjs_footnote_continued",
						);
						pendingNotes.push({ node: continuation, noteId, isContinuation: true });
					}

					footnoteInner.appendChild(note);
				});

				const areaView =
					doc.defaultView ?? (typeof window !== "undefined" ? window : null);

				const areaStyle = areaView?.getComputedStyle(footnoteArea);
				const borderTop = areaStyle ? parseFloat(areaStyle.borderTopWidth) || 0 : 0;
				const borderBottom = areaStyle ? parseFloat(areaStyle.borderBottomWidth) || 0 : 0;
				const paddingTop = areaStyle ? parseFloat(areaStyle.paddingTop) || 0 : 0;
				const paddingBottom = areaStyle ? parseFloat(areaStyle.paddingBottom) || 0 : 0;
				const frameHeight = borderTop + borderBottom + paddingTop + paddingBottom;

				const contentHeight = Math.ceil(
					Math.max(
						footnoteContent?.getBoundingClientRect().height ?? 0,
						footnoteContent?.scrollHeight ?? 0,
						footnoteInner.getBoundingClientRect().height,
						footnoteInner.scrollHeight,
					),
				);

				let totalHeight = contentHeight > 0 ? contentHeight + frameHeight : 0;

				if (totalHeight > 0) {
					page.style.setProperty("--printedjs-footnotes-height", `${totalHeight}px`);

					if (pagedjsCompatible) {
						page.style.setProperty("--pagedjs-footnotes-height", `${totalHeight}px`);
					}

					if (footnoteArea.scrollHeight > footnoteArea.clientHeight) {
						totalHeight += Math.ceil(
							footnoteArea.scrollHeight - footnoteArea.clientHeight,
						);
						page.style.setProperty("--printedjs-footnotes-height", `${totalHeight}px`);

						if (pagedjsCompatible) {
							page.style.setProperty("--pagedjs-footnotes-height", `${totalHeight}px`);
						}
					}
				}
			});
		},
	};
}
