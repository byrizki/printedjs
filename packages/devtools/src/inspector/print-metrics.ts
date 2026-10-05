import type { BoxOffsets, ElementBoxModel, ElementPrintMetrics } from "../types.js";

const MM_PER_INCH = 25.4;

const CSS_DPI = 96;

export function pxToMm(px: number): number {
	if (!Number.isFinite(px) || px === 0) {
		return 0;
	}

	return Math.round(((px * MM_PER_INCH) / CSS_DPI) * 10) / 10;
}

export function generateElementSelector(element: HTMLElement): string {
	const tag = element.tagName.toLowerCase();

	if (element.id) {
		return `${tag}#${element.id}`;
	}

	const classList = Array.from(element.classList).filter(
		(cls) => !cls.startsWith("printedjs-") && !cls.startsWith("pagedjs-"),
	);

	if (classList.length > 0) {
		return `${tag}.${classList.slice(0, 3).join(".")}`;
	}

	return tag;
}

function parseBoxOffsets(
	style: CSSStyleDeclaration | null,
	prefix: "margin" | "padding" | "border",
	suffix: "" | "Width",
): BoxOffsets {
	if (!style) {
		return { top: 0, right: 0, bottom: 0, left: 0 };
	}

	const top = parseFloat(style.getPropertyValue(`${prefix}-top${suffix}`)) || 0;
	const right = parseFloat(style.getPropertyValue(`${prefix}-right${suffix}`)) || 0;
	const bottom = parseFloat(style.getPropertyValue(`${prefix}-bottom${suffix}`)) || 0;
	const left = parseFloat(style.getPropertyValue(`${prefix}-left${suffix}`)) || 0;

	return { top, right, bottom, left };
}

export function extractPrintMetrics(element: HTMLElement): ElementPrintMetrics | null {
	if (
		!element ||
		element.hasAttribute("data-printedjs-devtools-overlay") ||
		element.hasAttribute("data-printedjs-devtools-guide") ||
		element.closest("[data-printedjs-devtools-overlay]")
	) {
		return null;
	}

	const page = element.closest<HTMLElement>(".printedjs_page, .pagedjs_page");

	if (!page) {
		return null;
	}

	const doc = element.ownerDocument;
	const win = doc?.defaultView ?? (typeof window !== "undefined" ? window : null);
	const style = win ? win.getComputedStyle(element) : null;

	const rawPageNum =
		page.getAttribute("data-page-number") ?? page.getAttribute("data-page");

	const allPages = Array.from(
		doc?.querySelectorAll(".printedjs_page, .pagedjs_page") ?? [],
	);

	const pageIndex = allPages.indexOf(page);

	const pageNumber = rawPageNum
		? parseInt(rawPageNum, 10)
		: pageIndex !== -1
			? pageIndex + 1
			: 1;

	const totalPages = allPages.length > 0 ? allPages.length : 1;

	const rect = element.getBoundingClientRect
		? element.getBoundingClientRect()
		: {
				top: 0,
				left: 0,
				width: element.offsetWidth || 0,
				height: element.offsetHeight || 0,
				bottom: element.offsetHeight || 0,
				right: element.offsetWidth || 0,
			};

	const margin = parseBoxOffsets(style, "margin", "");
	const border = parseBoxOffsets(style, "border", "Width");
	const padding = parseBoxOffsets(style, "padding", "");

	const contentWidthPx = Math.max(
		0,
		rect.width - (border.left + border.right + padding.left + padding.right),
	);

	const contentHeightPx = Math.max(
		0,
		rect.height - (border.top + border.bottom + padding.top + padding.bottom),
	);

	const boxModel: ElementBoxModel = {
		margin,
		border,
		padding,
		content: {
			widthPx: Math.round(contentWidthPx * 10) / 10,
			heightPx: Math.round(contentHeightPx * 10) / 10,
			widthMm: pxToMm(contentWidthPx),
			heightMm: pxToMm(contentHeightPx),
		},
		clientRect: {
			top: Math.round(rect.top),
			left: Math.round(rect.left),
			width: Math.round(rect.width),
			height: Math.round(rect.height),
		},
	};

	const breakInside =
		style?.getPropertyValue("break-inside") ||
		element.getAttribute("data-break-inside") ||
		"auto";

	const breakBefore =
		style?.getPropertyValue("break-before") ||
		element.getAttribute("data-break-before") ||
		"auto";

	const breakAfter =
		style?.getPropertyValue("break-after") ||
		element.getAttribute("data-break-after") ||
		"auto";

	const isSplitTo = element.hasAttribute("data-split-to");
	const isSplitFrom = element.hasAttribute("data-split-from");
	const hasAvoidBreak = breakInside.includes("avoid");

	const pageContent =
		page.querySelector<HTMLElement>(".printedjs_page_content, .pagedjs_page_content") ??
		page;

	const pageContentRect = pageContent.getBoundingClientRect
		? pageContent.getBoundingClientRect()
		: {
				bottom: rect.bottom,
			};

	const remainingSpacePx = Math.max(0, Math.round(pageContentRect.bottom - rect.bottom));

	return {
		element,
		selector: generateElementSelector(element),
		tagName: element.tagName.toLowerCase(),
		id: element.id || undefined,
		classes: Array.from(element.classList),
		pageNumber,
		totalPages,
		boxModel,
		breakRules: {
			breakInside,
			breakBefore,
			breakAfter,
			isSplitTo,
			isSplitFrom,
			hasAvoidBreak,
		},
		remainingSpacePx,
		remainingSpaceMm: pxToMm(remainingSpacePx),
	};
}
