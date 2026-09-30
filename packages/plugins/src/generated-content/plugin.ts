import { parseCss, type PrintedjsPlugin, type PluginContext } from "@printedjs/core";
import { distributeMarginTracks } from "./margin-distribution.js";

const MARGIN_BOX_NAMES = new Set([
	"top-left-corner",
	"top-left",
	"top-center",
	"top-right",
	"top-right-corner",
	"bottom-left-corner",
	"bottom-left",
	"bottom-center",
	"bottom-right",
	"bottom-right-corner",
	"left-top",
	"left-middle",
	"left-bottom",
	"right-top",
	"right-middle",
	"right-bottom",
	"top",
	"bottom",
	"left",
	"right",
]);

function normalizeMarginBoxName(name: string): string {
	switch (name) {
		case "top":
			return "top-center";
		case "bottom":
			return "bottom-center";
		case "left":
			return "left-middle";
		case "right":
			return "right-middle";
		default:
			return name;
	}
}

function getPageScope(sel: string | undefined, pagedjsCompatible = false): string {
	const trimmed = sel?.trim();
	if (pagedjsCompatible) {
		if (trimmed === ":first")
			return ":is(.printedjs_page, .pagedjs_page):is(.printedjs_first_page, .pagedjs_first_page)";
		if (trimmed === ":left")
			return ":is(.printedjs_page, .pagedjs_page):is(.printedjs_left_page, .pagedjs_left_page)";
		if (trimmed === ":right")
			return ":is(.printedjs_page, .pagedjs_page):is(.printedjs_right_page, .pagedjs_right_page)";
		if (trimmed && !trimmed.startsWith(":"))
			return `:is(.printedjs_page, .pagedjs_page)[data-page="${trimmed}"]`;
		return ":is(.printedjs_page, .pagedjs_page)";
	}
	if (trimmed === ":first") return ".printedjs_page.printedjs_first_page";
	if (trimmed === ":left") return ".printedjs_page.printedjs_left_page";
	if (trimmed === ":right") return ".printedjs_page.printedjs_right_page";
	if (trimmed && !trimmed.startsWith(":"))
		return `.printedjs_page[data-page="${trimmed}"]`;
	return ".printedjs_page";
}

function getMarginBoxSel(boxName: string, pagedjsCompatible = false): string {
	if (boxName === "footnote") {
		return pagedjsCompatible
			? ":is(.printedjs_footnote_area, .pagedjs_footnote_area)"
			: ".printedjs_footnote_area";
	}
	if (pagedjsCompatible) {
		return `:is(.printedjs_margin-${boxName}, .pagedjs_margin-${boxName})`;
	}
	return `.printedjs_margin-${boxName}`;
}

function getMarginContentSel(pagedjsCompatible = false): string {
	if (pagedjsCompatible) {
		return `:is(.printedjs_margin-content, .pagedjs_margin-content)`;
	}
	return ".printedjs_margin-content";
}

export type RunningPolicy = "first" | "start" | "last" | "first-except";

export interface RunningAssignment {
	readonly pageScope: string;
	readonly pageSelector?: string | undefined;
	readonly boxName: string;
	readonly runningName: string;
	readonly policy?: RunningPolicy | undefined;
}

export function transformMarginBoxCss(
	css: string,
	pagedjsCompatible = false,
): {
	readonly css: string;
	readonly runningSelectors: Record<string, string>;
	readonly runningAssignments: readonly RunningAssignment[];
} {
	const ast = parseCss(css);
	const generatedRules: string[] = [];
	const runningSelectors: Record<string, string> = {};
	const runningAssignments: RunningAssignment[] = [];

	// Extract position: running(...) declarations
	for (const rule of ast.rules) {
		for (const decl of rule.declarations) {
			if (decl.property.toLowerCase() === "position") {
				const match = decl.value.match(/running\(\s*([^)]+)\s*\)/i);
				if (match && match[1]) {
					const name = match[1].trim();
					runningSelectors[name] = rule.selector;
					generatedRules.push(`${rule.selector} {\n  display: none !important;\n}`);
				}
			}
		}
	}

	for (const pageRule of ast.pageRules) {
		const pageScope = getPageScope(pageRule.selector, pagedjsCompatible);

		for (const box of pageRule.marginBoxes) {
			const boxName = normalizeMarginBoxName(box.marginBox);
			const marginBoxSel = getMarginBoxSel(boxName, pagedjsCompatible);
			const marginContentSel = getMarginContentSel(pagedjsCompatible);
			const contentDecl = box.declarations.find(
				(d) => d.property.toLowerCase() === "content",
			);
			const otherDecls = box.declarations.filter(
				(d) => d.property.toLowerCase() !== "content",
			);

			if (otherDecls.length > 0) {
				const body = otherDecls.map((d) => `  ${d.property}: ${d.value};`).join("\n");
				generatedRules.push(`${pageScope} ${marginBoxSel} {\n${body}\n}`);
				if (boxName !== "footnote") {
					generatedRules.push(
						`${pageScope} ${marginBoxSel} > ${marginContentSel} > * {\n  display: block !important;\n}`,
					);
				}
			}

			if (contentDecl) {
				const val = contentDecl.value.trim().toLowerCase();
				const elementMatch = contentDecl.value.match(
					/element\s*\(\s*([^,\s)]+)(?:\s*,\s*([a-zA-Z0-9_-]+))?\s*\)/i,
				);
				if (elementMatch && elementMatch[1]) {
					const runningName = elementMatch[1].trim();
					const rawPolicy = elementMatch[2]?.trim().toLowerCase();
					const policy: RunningPolicy =
						rawPolicy === "start" || rawPolicy === "last" || rawPolicy === "first-except"
							? rawPolicy
							: "first";
					runningAssignments.push({
						pageScope,
						pageSelector: pageRule.selector,
						boxName,
						runningName,
						policy,
					});
				} else if (val === "none" || val === "normal" || val === '""' || val === "''") {
					runningAssignments.push({
						pageScope,
						pageSelector: pageRule.selector,
						boxName,
						runningName: "none",
					});
					generatedRules.push(
						`${pageScope} ${marginBoxSel} > ${marginContentSel}::after {\n  content: none;\n}`,
					);
				} else {
					generatedRules.push(
						`${pageScope} ${marginBoxSel} > ${marginContentSel}::after {\n  content: ${contentDecl.value};\n}`,
					);
				}
			}
		}
	}

	// Remove margin box declarations from original CSS so browser doesn't see invalid nested at-rules
	const cleanedCss = css
		.replace(/@page\b[^{]*\{[\s\S]*?\}/gi, (pageBlock) => {
			for (const name of MARGIN_BOX_NAMES) {
				const re = new RegExp(`@${name}\\s*\\{[^}]*\\}`, "gi");
				pageBlock = pageBlock.replace(re, "");
			}
			pageBlock = pageBlock.replace(/@footnote\s*\{[^}]*\}/gi, "");
			return pageBlock;
		})
		.replace(/@page\b[^{]*\{\s*\}/gi, "");

	return {
		css: `${cleanedCss}\n\n${generatedRules.join("\n\n")}`,
		runningSelectors,
		runningAssignments,
	};
}

export interface ActiveMarginBox {
	readonly pageSelector?: string | undefined;
	readonly boxName: string;
}

export function extractActiveMarginBoxes(css: string): ActiveMarginBox[] {
	const ast = parseCss(css);
	const results: ActiveMarginBox[] = [];
	for (const pageRule of ast.pageRules) {
		for (const box of pageRule.marginBoxes) {
			const contentDecl = box.declarations.find(
				(d) => d.property.toLowerCase() === "content",
			);
			const val = contentDecl?.value.trim().toLowerCase();
			if (val === "none" || val === "normal") {
				continue;
			}
			if (box.declarations.length > 0) {
				results.push({
					pageSelector: pageRule.selector,
					boxName: normalizeMarginBoxName(box.marginBox),
				});
			}
		}
	}
	return results;
}

function getPageSelectorWeight(sel?: string): number {
	if (!sel || sel === "*") return 1;
	const trimmed = sel.trim();
	if (trimmed.includes(":") && !trimmed.startsWith(":")) return 7;
	if (trimmed.startsWith(":first")) return 4;
	if (trimmed.startsWith(":blank")) return 3;
	if (trimmed.startsWith(":left") || trimmed.startsWith(":right")) return 2;
	if (!trimmed.startsWith(":")) return 5;
	return 1;
}

function isElementAtStart(el: HTMLElement, page: HTMLElement): boolean {
	const contentArea = page.querySelector<HTMLElement>(
		":is(.printedjs_page_content, .pagedjs_page_content) > div",
	);
	if (!contentArea) return false;
	let curr: Element | null = el;
	while (curr && curr !== contentArea) {
		if (curr.previousElementSibling) {
			return false;
		}
		curr = curr.parentElement;
	}
	return true;
}

export function generatedContentPlugin(): PrintedjsPlugin {
	const followingRules: { id: string; selector: string; decls: string }[] = [];
	const nthOfTypeRules: { id: string; selector: string; decls: string }[] = [];
	const activeMarginBoxes: ActiveMarginBox[] = [];
	const runningSelectors: Record<string, string> = {};
	const runningAssignments: RunningAssignment[] = [];
	const savedRunningElements = new Map<string, HTMLElement>();
	let counterId = 0;

	return {
		name: "generated-content",
		after: ["page-rules", "breaks", "strings"],
		setup() {
			followingRules.length = 0;
			nthOfTypeRules.length = 0;
			activeMarginBoxes.length = 0;
			runningAssignments.length = 0;
			savedRunningElements.clear();
			for (const key of Object.keys(runningSelectors)) {
				delete runningSelectors[key];
			}
			counterId = 0;
		},
		transformStyles(css: string, context?: PluginContext): string {
			activeMarginBoxes.push(...extractActiveMarginBoxes(css));
			const pagedjsCompatible = context?.pagedjsCompatible ?? false;
			const transformed = transformMarginBoxCss(css, pagedjsCompatible);
			Object.assign(runningSelectors, transformed.runningSelectors);
			runningAssignments.push(...transformed.runningAssignments);

			let resultCss = transformed.css;

			// Transform sibling '+' and nth-of-type selectors to preserve styles across page breaks
			resultCss = resultCss.replace(
				/([^{}@]+)\{([^{}]+)\}/g,
				(match, rawSel, rawBody) => {
					const sel = rawSel.trim();
					if (sel.startsWith("@")) {
						return match;
					}
					const parts = sel.split(",").map((s: string) => s.trim());
					let modified = false;

					const transformedParts = parts.map((part: string) => {
						if (part.includes("+")) {
							counterId++;
							const id = `following-${counterId}`;
							followingRules.push({ id, selector: part, decls: rawBody });
							modified = true;
							return `*[data-following*="${id}"]`;
						}
						if (
							part.includes(":nth-of-type") ||
							part.includes(":first-of-type") ||
							part.includes(":last-of-type")
						) {
							counterId++;
							const id = `nth-${counterId}`;
							nthOfTypeRules.push({ id, selector: part, decls: rawBody });
							modified = true;
							return `*[data-nth-of-type*="${id}"]`;
						}
						return part;
					});

					if (modified) {
						return `${transformedParts.join(", ")} {${rawBody}}`;
					}
					return match;
				},
			);

			return resultCss;
		},
		beforeLayout(context: PluginContext) {
			const contentRoot = context.metadata["contentRoot"] as ParentNode | undefined;
			if (!contentRoot || typeof contentRoot.querySelectorAll !== "function") {
				return;
			}

			// Capture running elements and hide them from layout flow
			for (const [name, selector] of Object.entries(runningSelectors)) {
				try {
					const matched = contentRoot.querySelectorAll(selector);
					for (let i = 0; i < matched.length; i++) {
						const el = matched[i] as HTMLElement | undefined;
						if (el && el.nodeType === 1) {
							el.setAttribute("data-printedjs-running", name);
							el.style.display = "none";
							if (!savedRunningElements.has(name)) {
								savedRunningElements.set(name, el.cloneNode(true) as HTMLElement);
							}
						}
					}
				} catch {
					// Ignore invalid selectors
				}
			}

			// Tag following-selector elements in original document
			for (const item of followingRules) {
				try {
					const matched = contentRoot.querySelectorAll(item.selector);
					for (let i = 0; i < matched.length; i++) {
						const el = matched[i];
						if (el && el.nodeType === 1) {
							const existing = el.getAttribute("data-following") || "";
							el.setAttribute(
								"data-following",
								existing ? `${existing} ${item.id}` : item.id,
							);
						}
					}
				} catch {
					// Ignore invalid selectors
				}
			}

			// Tag nth-of-type elements in original document
			for (const item of nthOfTypeRules) {
				try {
					const matched = contentRoot.querySelectorAll(item.selector);
					for (let i = 0; i < matched.length; i++) {
						const el = matched[i];
						if (el && el.nodeType === 1) {
							const existing = el.getAttribute("data-nth-of-type") || "";
							el.setAttribute(
								"data-nth-of-type",
								existing ? `${existing} ${item.id}` : item.id,
							);
						}
					}
				} catch {
					// Ignore invalid selectors
				}
			}
		},
		afterRender(context: PluginContext) {
			const doc = context.metadata["document"] as Document | undefined;
			if (!doc) {
				return;
			}
			const pages = doc.querySelectorAll(".printedjs_page, .pagedjs_page");
			const totalPages = pages.length;

			// Populate running elements into margin boxes
			const activeRunningElements = new Map<string, HTMLElement>();

			pages.forEach((pageEl) => {
				const page = pageEl as HTMLElement;
				const isFirst =
					page.classList.contains("printedjs_first_page") ||
					page.classList.contains("pagedjs_first_page");
				const isLeft =
					page.classList.contains("printedjs_left_page") ||
					page.classList.contains("pagedjs_left_page");
				const isRight =
					page.classList.contains("printedjs_right_page") ||
					page.classList.contains("pagedjs_right_page");
				const isBlank =
					page.classList.contains("printedjs_blank_page") ||
					page.classList.contains("pagedjs_blank_page");
				const namedPage = page.getAttribute("data-page");

				// Check which running elements exist on this page
				const pageRunningMap = new Map<string, HTMLElement[]>();
				for (const [name, selector] of Object.entries(runningSelectors)) {
					const els = Array.from(
						page.querySelectorAll<HTMLElement>(
							`[data-printedjs-running="${name}"], ${selector}`,
						),
					);
					if (els.length > 0) {
						pageRunningMap.set(name, els);
					}
				}

				for (const boxName of MARGIN_BOX_NAMES) {
					const normBox = normalizeMarginBoxName(boxName);
					const applicable = runningAssignments.filter((a) => {
						if (a.boxName !== normBox) return false;
						const sel = a.pageSelector?.trim();
						if (sel === ":first") return isFirst;
						if (sel === ":left") return isLeft;
						if (sel === ":right") return isRight;
						if (sel === ":blank") return isBlank;
						if (sel && !sel.startsWith(":")) {
							if (sel.includes(":")) {
								const [np, pseudo] = sel.split(":");
								if (np !== namedPage) return false;
								if (pseudo === "first") return isFirst;
								if (pseudo === "left") return isLeft;
								if (pseudo === "right") return isRight;
								return true;
							}
							return sel === namedPage;
						}
						return !sel || sel === "*";
					});

					if (applicable.length === 0) continue;

					applicable.sort(
						(a, b) =>
							getPageSelectorWeight(b.pageSelector) -
							getPageSelectorWeight(a.pageSelector),
					);

					let elToDisplay: HTMLElement | null = null;
					let hasTargetAssignment = false;

					for (const cand of applicable) {
						if (!cand || cand.runningName === "none") {
							hasTargetAssignment = true;
							elToDisplay = null;
							break;
						}

						const name = cand.runningName;
						const pageEls = pageRunningMap.get(name) ?? [];
						const hasAny =
							pageEls.length > 0 ||
							activeRunningElements.has(name) ||
							savedRunningElements.has(name);
						if (!hasAny) {
							continue;
						}

						hasTargetAssignment = true;
						const policy = cand.policy ?? "first";

						if (policy === "first-except") {
							if (pageEls.length === 0) {
								elToDisplay =
									activeRunningElements.get(name) ??
									savedRunningElements.get(name) ??
									null;
							} else {
								elToDisplay = null;
							}
						} else if (policy === "last") {
							elToDisplay =
								pageEls.length > 0
									? pageEls[pageEls.length - 1]!
									: (activeRunningElements.get(name) ??
										savedRunningElements.get(name) ??
										null);
						} else if (policy === "start") {
							const first = pageEls[0];
							if (first && isElementAtStart(first, page)) {
								elToDisplay = first;
							} else {
								elToDisplay =
									activeRunningElements.get(name) ??
									first ??
									savedRunningElements.get(name) ??
									null;
							}
						} else {
							// "first" policy
							elToDisplay =
								pageEls[0] ??
								activeRunningElements.get(name) ??
								savedRunningElements.get(name) ??
								null;
						}
						break;
					}

					if (!hasTargetAssignment) continue;

					const marginEl = page.querySelector<HTMLElement>(
						`:is(.printedjs_margin-${normBox}, .pagedjs_margin-${normBox})`,
					);
					const contentEl = marginEl?.querySelector<HTMLElement>(
						".printedjs_margin-content, .pagedjs_margin-content",
					);
					if (marginEl && contentEl) {
						if (elToDisplay) {
							const clone = elToDisplay.cloneNode(true) as HTMLElement;
							clone.style.removeProperty("display");
							if (clone.style.display === "none") {
								clone.style.display = "";
							}
							clone.style.setProperty("display", "block", "important");
							contentEl.replaceChildren(clone);
							marginEl.classList.add("hasContent");
						} else {
							contentEl.replaceChildren();
							marginEl.classList.remove("hasContent");
						}
					}
				}

				// Update activeRunningElements with the last element seen on this page
				for (const [name, els] of pageRunningMap.entries()) {
					if (els.length > 0) {
						activeRunningElements.set(name, els[els.length - 1]!);
					}
				}
			});

			// Mark active margin boxes with 'hasContent'
			pages.forEach((pageEl) => {
				const page = pageEl as HTMLElement;
				const isFirst =
					page.classList.contains("printedjs_first_page") ||
					page.classList.contains("pagedjs_first_page");
				const isLeft =
					page.classList.contains("printedjs_left_page") ||
					page.classList.contains("pagedjs_left_page");
				const isRight =
					page.classList.contains("printedjs_right_page") ||
					page.classList.contains("pagedjs_right_page");
				const namedPage = page.getAttribute("data-page");

				for (const active of activeMarginBoxes) {
					let matches = false;
					const sel = active.pageSelector?.trim();
					if (!sel || sel === "*") {
						matches = true;
					} else if (sel === ":first") {
						matches = isFirst;
					} else if (sel === ":left") {
						matches = isLeft;
					} else if (sel === ":right") {
						matches = isRight;
					} else if (sel === namedPage) {
						matches = true;
					}

					if (matches) {
						const normBox = active.boxName;
						const applicable = runningAssignments.filter((a) => {
							if (a.boxName !== normBox) return false;
							const s = a.pageSelector?.trim();
							if (s === ":first") return isFirst;
							if (s === ":left") return isLeft;
							if (s === ":right") return isRight;
							if (s && !s.startsWith(":")) return s === namedPage;
							return !s || s === "*";
						});
						applicable.sort((a, b) => {
							const aSpecific = a.pageSelector && a.pageSelector !== "*";
							const bSpecific = b.pageSelector && b.pageSelector !== "*";
							if (aSpecific && !bSpecific) return -1;
							if (!aSpecific && bSpecific) return 1;
							return 0;
						});
						if (applicable[0]?.runningName === "none") {
							continue;
						}

						const marginBoxEl = page.querySelector<HTMLElement>(
							`:is(.printedjs_margin-${active.boxName}, .pagedjs_margin-${active.boxName})`,
						);
						if (marginBoxEl) {
							marginBoxEl.classList.add("hasContent");
						}
					}
				}
			});

			const win = doc.defaultView || (typeof window !== "undefined" ? window : undefined);
			if (win) {
				pages.forEach((pageEl) => {
					distributeMarginTracks(pageEl as HTMLElement, win);
				});
			}

			// Update CSS custom property for total page count on root and pages container
			const totalStr = String(totalPages);
			const root = doc.documentElement;
			const pagedjsCompatible = context.pagedjsCompatible ?? false;
			if (root) {
				root.style.setProperty("--printedjs-page-count", totalStr);
				if (pagedjsCompatible) {
					root.style.setProperty("--pagedjs-page-count", totalStr);
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
		},
	};
}
