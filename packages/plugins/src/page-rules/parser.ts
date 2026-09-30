import { parseCss } from "@printedjs/core";

export interface PageSize {
	readonly width: string;
	readonly height: string;
	readonly orientation?: "portrait" | "landscape" | undefined;
}

export interface PageMargins {
	readonly top?: string;
	readonly right?: string;
	readonly bottom?: string;
	readonly left?: string;
}

export interface PagePadding {
	readonly top?: string;
	readonly right?: string;
	readonly bottom?: string;
	readonly left?: string;
}

export interface PageBleed {
	readonly top: string;
	readonly right: string;
	readonly bottom: string;
	readonly left: string;
}

export interface PageRule {
	readonly selector: string;
	readonly size?: PageSize | undefined;
	readonly margin?: PageMargins | undefined;
	readonly padding?: PagePadding | undefined;
	readonly bleed?: PageBleed | undefined;
	readonly marks?: readonly string[] | undefined;
}

const STANDARD_PAGE_SIZES: Record<string, { width: string; height: string }> = {
	letter: { width: "8.5in", height: "11in" },
	legal: { width: "8.5in", height: "14in" },
	ledger: { width: "11in", height: "17in" },
	tabloid: { width: "11in", height: "17in" },
	a0: { width: "841mm", height: "1189mm" },
	a1: { width: "594mm", height: "841mm" },
	a2: { width: "420mm", height: "594mm" },
	a3: { width: "297mm", height: "420mm" },
	a4: { width: "210mm", height: "297mm" },
	a5: { width: "148mm", height: "210mm" },
	a6: { width: "105mm", height: "148mm" },
	b4: { width: "250mm", height: "353mm" },
	b5: { width: "176mm", height: "250mm" },
};

function normalizeLength(value: string): string {
	const trimmed = value.trim();
	if (trimmed === "0") {
		return "0px";
	}
	return trimmed;
}

function parseFourSides(
	value: string,
	fallback = "0mm",
): { top: string; right: string; bottom: string; left: string } {
	const parts = value.trim().split(/\s+/).map(normalizeLength);
	if (parts.length === 1) {
		const m = parts[0] ?? fallback;
		return { top: m, right: m, bottom: m, left: m };
	}
	if (parts.length === 2) {
		const topBottom = parts[0] ?? fallback;
		const leftRight = parts[1] ?? fallback;
		return { top: topBottom, right: leftRight, bottom: topBottom, left: leftRight };
	}
	if (parts.length === 3) {
		const top = parts[0] ?? fallback;
		const leftRight = parts[1] ?? fallback;
		const bottom = parts[2] ?? fallback;
		return { top, right: leftRight, bottom, left: leftRight };
	}
	return {
		top: parts[0] ?? fallback,
		right: parts[1] ?? fallback,
		bottom: parts[2] ?? fallback,
		left: parts[3] ?? fallback,
	};
}

function parseMargins(value: string): PageMargins {
	return parseFourSides(value, "1in");
}

function parsePadding(value: string): PagePadding {
	return parseFourSides(value, "0mm");
}

function parseSize(value: string): PageSize {
	const cleaned = value.replace(/['"]/g, "").trim();
	const tokens = cleaned.split(/\s+/);

	let orientation: "portrait" | "landscape" | undefined;
	const filtered: string[] = [];

	for (const token of tokens) {
		const lower = token.toLowerCase();
		if (lower === "landscape" || lower === "portrait") {
			orientation = lower;
		} else {
			filtered.push(token);
		}
	}

	let width = "8.5in";
	let height = "11in";

	if (filtered.length === 1) {
		const key = filtered[0]?.toLowerCase() ?? "letter";
		const standard = STANDARD_PAGE_SIZES[key];
		if (standard) {
			width = standard.width;
			height = standard.height;
		}
	} else if (filtered.length >= 2) {
		width = filtered[0] ?? "8.5in";
		height = filtered[1] ?? "11in";
	}

	if (orientation === "landscape") {
		return { width: height, height: width, orientation };
	}

	return orientation ? { width, height, orientation } : { width, height };
}

export function parsePageRules(css: string): PageRule[] {
	const ast = parseCss(css);
	const pageRules: PageRule[] = [];

	for (const rule of ast.pageRules) {
		const rawSelector = rule.selector?.trim() || "*";
		let size: PageSize | undefined;
		let margin: PageMargins | undefined;
		let padding: PagePadding | undefined;
		let bleed: PageBleed | undefined;
		let marks: string[] | undefined;

		for (const decl of rule.declarations) {
			const property = decl.property.toLowerCase();
			const val = decl.value;

			if (property === "size") {
				size = parseSize(val);
			} else if (property === "margin") {
				const m = parseMargins(val);
				margin = { ...margin, ...m };
			} else if (property === "margin-top") {
				margin = { ...margin, top: normalizeLength(val) };
			} else if (property === "margin-right") {
				margin = { ...margin, right: normalizeLength(val) };
			} else if (property === "margin-bottom") {
				margin = { ...margin, bottom: normalizeLength(val) };
			} else if (property === "margin-left") {
				margin = { ...margin, left: normalizeLength(val) };
			} else if (property === "padding") {
				const p = parsePadding(val);
				padding = { ...padding, ...p };
			} else if (property === "padding-top") {
				padding = { ...padding, top: normalizeLength(val) };
			} else if (property === "padding-right") {
				padding = { ...padding, right: normalizeLength(val) };
			} else if (property === "padding-bottom") {
				padding = { ...padding, bottom: normalizeLength(val) };
			} else if (property === "padding-left") {
				padding = { ...padding, left: normalizeLength(val) };
			} else if (property === "bleed") {
				const b = normalizeLength(val);
				bleed = { top: b, right: b, bottom: b, left: b };
			} else if (property === "marks") {
				marks = val.split(/\s+/).filter((m) => m === "crop" || m === "cross");
			}
		}

		if (marks && marks.length > 0 && !bleed) {
			bleed = { top: "6mm", right: "6mm", bottom: "6mm", left: "6mm" };
		}

		pageRules.push({
			selector: rawSelector,
			...(size ? { size } : {}),
			...(margin ? { margin } : {}),
			...(padding ? { padding } : {}),
			...(bleed ? { bleed } : {}),
			...(marks && marks.length > 0 ? { marks } : {}),
		});
	}

	return pageRules;
}
