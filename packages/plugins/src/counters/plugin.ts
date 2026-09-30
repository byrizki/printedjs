import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";

export function countersPlugin(): PrintedjsPlugin {
	return {
		name: "counters",
		after: ["page-rules", "breaks", "strings", "generated-content"],
		transformStyles(css: string): string {
			let transformed = css;

			// Replace target-counter(attr(href), page) with attr(data-target-page)
			transformed = transformed.replace(
				/target-counter\s*\(\s*attr\s*\(\s*href(?:\s+url)?\s*\)\s*,\s*page(?:\s*,\s*[a-zA-Z0-9_-]+)?\s*\)/gi,
				"attr(data-target-page)",
			);

			// Replace target-counter(#id, page) with attr(data-target-page)
			transformed = transformed.replace(
				/target-counter\s*\(\s*([#a-zA-Z0-9_-]+)\s*,\s*page(?:\s*,\s*[a-zA-Z0-9_-]+)?\s*\)/gi,
				"attr(data-target-page)",
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

			const pages = doc.querySelectorAll(".printedjs_page, .pagedjs_page");
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
					const pageNum = containingPage.getAttribute("data-page-number");
					if (pageNum) {
						link.setAttribute("data-target-page", pageNum);
					}
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
