import {
	formatPageNumber,
	type PageCounterStyle,
	type PrintedjsPlugin,
	type PluginContext,
} from "@printedjs/core";

export { formatPageNumber, type PageCounterStyle };

export function countersPlugin(): PrintedjsPlugin {
	return {
		name: "counters",
		after: ["page-rules", "breaks", "strings", "generated-content"],
		transformStyles(css: string): string {
			let transformed = css;

			// Replace target-counter(attr(href), page[, <style>]) with attr(data-target-page[-style])
			transformed = transformed.replace(
				/target-counter\s*\(\s*attr\s*\(\s*href(?:\s+url)?\s*\)\s*,\s*page(?:\s*,\s*([a-zA-Z0-9_-]+))?\s*\)/gi,
				(_, rawStyle) => {
					const style = rawStyle?.trim().toLowerCase();
					return style ? `attr(data-target-page-${style})` : "attr(data-target-page)";
				},
			);

			// Replace target-counter(#id, page[, <style>]) with attr(data-target-page[-style])
			transformed = transformed.replace(
				/target-counter\s*\(\s*([#a-zA-Z0-9_-]+)\s*,\s*page(?:\s*,\s*([a-zA-Z0-9_-]+))?\s*\)/gi,
				(_, _target, rawStyle) => {
					const style = rawStyle?.trim().toLowerCase();
					return style ? `attr(data-target-page-${style})` : "attr(data-target-page)";
				},
			);

			// Replace target-text with attr(data-target-text[-style])
			transformed = transformed.replace(
				/target-text\s*\(\s*(?:attr\s*\(\s*href(?:\s+url)?\s*\)|[#a-zA-Z0-9_-]+)(?:\s*,\s*([^)]+))?\s*\)/gi,
				(_, rawStyle) => {
					const style = rawStyle?.trim().toLowerCase();
					if (style === "first-letter") {
						return "attr(data-target-text-first-letter)";
					}
					if (style === "before") {
						return "attr(data-target-text-before)";
					}
					if (style === "after") {
						return "attr(data-target-text-after)";
					}
					return "attr(data-target-text)";
				},
			);

			return transformed;
		},
		afterRender(context: PluginContext) {
			const doc = context.metadata["document"] as Document | undefined;
			if (!doc) {
				return;
			}

			const pages = doc.querySelectorAll<HTMLElement>(".printedjs_page, .pagedjs_page");
			const totalPages = pages.length;

			// Set total page count on root element and pages container for counter-reset: pages
			const totalStr = String(totalPages);
			const pagedjsCompatible = context.pagedjsCompatible ?? false;
			if (doc.documentElement) {
				doc.documentElement.style.setProperty("--printedjs-page-count", totalStr);
				if (pagedjsCompatible) {
					doc.documentElement.style.setProperty("--pagedjs-page-count", totalStr);
				}
			}
			const pagesContainer = doc.querySelector<HTMLElement>(
				".printedjs_pages, .pagedjs_pages",
			);
			if (pagesContainer) {
				pagesContainer.style.setProperty("--printedjs-page-count", totalStr);
				if (pagedjsCompatible) {
					pagesContainer.style.setProperty("--pagedjs-page-count", totalStr);
				}
			}

			// Group pages by section (e.g. data-page named page attribute)
			const sectionPageCounts = new Map<string, number>();
			pages.forEach((page) => {
				const pageName = page.getAttribute("data-page") || "default";
				sectionPageCounts.set(pageName, (sectionPageCounts.get(pageName) ?? 0) + 1);
			});

			pages.forEach((page) => {
				const pageName = page.getAttribute("data-page") || "default";
				const sectionCount = sectionPageCounts.get(pageName) ?? totalPages;
				const sectionCountStr = String(sectionCount);
				page.style.setProperty("--printedjs-section-page-count", sectionCountStr);
				page.setAttribute("data-section-page-count", sectionCountStr);
				if (pagedjsCompatible) {
					page.style.setProperty("--pagedjs-section-page-count", sectionCountStr);
				}
			});

			// Resolve target-counter and target-text references
			const links = doc.querySelectorAll<HTMLElement>("[href]");
			links.forEach((link) => {
				const href = link.getAttribute("href");
				if (!href || !href.startsWith("#")) {
					return;
				}

				const targetId = href.slice(1);
				if (!targetId) {
					return;
				}

				const targetEl =
					doc.getElementById?.(targetId) ||
					doc.querySelector?.(`[data-id="${targetId}"]`);
				if (!targetEl) {
					return;
				}

				const containingPage = targetEl.closest?.(
					".printedjs_page, .pagedjs_page",
				) as HTMLElement | null;
				if (containingPage) {
					const pageNumAttr = containingPage.getAttribute("data-page-number");
					const pageNum = pageNumAttr ? parseInt(pageNumAttr, 10) : 1;
					const pageFormatted =
						containingPage.getAttribute("data-page-formatted") || (pageNumAttr ?? "1");

					link.setAttribute("data-target-page", pageFormatted);
					link.setAttribute("data-target-page-formatted", pageFormatted);
					link.setAttribute("data-target-page-decimal", String(pageNum));
					link.setAttribute(
						"data-target-page-lower-roman",
						formatPageNumber(pageNum, "lower-roman"),
					);
					link.setAttribute(
						"data-target-page-upper-roman",
						formatPageNumber(pageNum, "upper-roman"),
					);
					link.setAttribute(
						"data-target-page-lower-alpha",
						formatPageNumber(pageNum, "lower-alpha"),
					);
					link.setAttribute(
						"data-target-page-lower-latin",
						formatPageNumber(pageNum, "lower-latin"),
					);
					link.setAttribute(
						"data-target-page-upper-alpha",
						formatPageNumber(pageNum, "upper-alpha"),
					);
					link.setAttribute(
						"data-target-page-upper-latin",
						formatPageNumber(pageNum, "upper-latin"),
					);
					link.setAttribute(
						"data-target-page-decimal-leading-zero",
						formatPageNumber(pageNum, "decimal-leading-zero"),
					);
				}

				// Resolve target-text
				const text = targetEl.textContent?.trim() ?? "";
				link.setAttribute("data-target-text", text);
				if (text.length > 0) {
					link.setAttribute("data-target-text-first-letter", text.charAt(0));
				}

				// Resolve before / after pseudo content if available
				const win = doc.defaultView;
				if (win && typeof win.getComputedStyle === "function") {
					try {
						const beforeVal = win
							.getComputedStyle(targetEl, "::before")
							.getPropertyValue("content");
						if (beforeVal && beforeVal !== "none" && beforeVal !== "normal") {
							link.setAttribute(
								"data-target-text-before",
								beforeVal.replace(/^["']|["']$/g, ""),
							);
						}
						const afterVal = win
							.getComputedStyle(targetEl, "::after")
							.getPropertyValue("content");
						if (afterVal && afterVal !== "none" && afterVal !== "normal") {
							link.setAttribute(
								"data-target-text-after",
								afterVal.replace(/^["']|["']$/g, ""),
							);
						}
					} catch {
						// Ignore if pseudo styles cannot be computed
					}
				}
			});
		},
	};
}
