import {
	stripPageRules,
	type PrintedjsPlugin,
	type PluginContext,
} from "@printedjs/core";
import { parsePageRules, type PageMargins, type PageRule } from "./parser.js";

function toLength(val: string): string {
	return val === "0" ? "0px" : val;
}

function addProp(
	lines: string[],
	name: string,
	val: string,
	pagedjsCompatible = false,
): void {
	lines.push(`\t--printedjs-${name}: ${val};`);

	if (pagedjsCompatible) {
		lines.push(`\t--pagedjs-${name}: ${val};`);
	}
}

function pageRuleSelector(
	kind: "" | "first" | "right" | "left",
	pagedjsCompatible = false,
): string {
	if (pagedjsCompatible) {
		if (!kind) return ".printedjs_page, .pagedjs_page";

		if (kind === "first") {
			return ".printedjs_page.printedjs_first_page, .pagedjs_page.pagedjs_first_page, .printedjs_page.printedjs_first_page.printedjs_right_page";
		}

		return `.printedjs_page.printedjs_${kind}_page, .pagedjs_page.pagedjs_${kind}_page`;
	}

	if (!kind) return ".printedjs_page";

	if (kind === "first") {
		return ".printedjs_page.printedjs_first_page, .printedjs_page.printedjs_first_page.printedjs_right_page";
	}

	return `.printedjs_page.printedjs_${kind}_page`;
}

function hasMirroredMargins(rule?: PageRule): boolean {
	if (!rule?.margin) return false;

	return (
		rule.margin.inside !== undefined ||
		rule.margin.outside !== undefined ||
		rule.margin.gutter !== undefined
	);
}

export interface ComputedSideMargins {
	readonly top?: string | undefined;
	readonly right?: string | undefined;
	readonly bottom?: string | undefined;
	readonly left?: string | undefined;
}

function computeSideMargins(
	ruleMargin: PageMargins | undefined,
	side: "right" | "left",
	baseMargin?: PageMargins,
): ComputedSideMargins {
	const m = ruleMargin ?? {};
	const b = baseMargin ?? {};

	const top = m.top;
	const bottom = m.bottom;

	const inside = m.inside ?? b.inside;
	const outside = m.outside ?? b.outside;
	const gutter = m.gutter ?? b.gutter;

	let left: string | undefined = m.left;
	let right: string | undefined = m.right;

	if (side === "right") {
		// Right page (odd): Inside is LEFT, Outside is RIGHT
		if (inside !== undefined) {
			left = gutter
				? `calc(${toLength(inside)} + ${toLength(gutter)})`
				: toLength(inside);
		} else if (gutter !== undefined) {
			const baseLeft = m.left ?? b.left;

			if (baseLeft !== undefined) {
				left = `calc(${toLength(baseLeft)} + ${toLength(gutter)})`;
			}
		}

		if (outside !== undefined) {
			right = toLength(outside);
		}
	} else {
		// Left page (even): Inside is RIGHT, Outside is LEFT
		if (inside !== undefined) {
			right = gutter
				? `calc(${toLength(inside)} + ${toLength(gutter)})`
				: toLength(inside);
		} else if (gutter !== undefined) {
			const baseRight = m.right ?? b.right;

			if (baseRight !== undefined) {
				right = `calc(${toLength(baseRight)} + ${toLength(gutter)})`;
			}
		}

		if (outside !== undefined) {
			left = toLength(outside);
		}
	}

	return { top, right, bottom, left };
}

export function generatePageCss(
	rules: readonly PageRule[],
	pagedjsCompatible = false,
): string {
	const baseRule = rules.find((r) => r.selector === "*" || !r.selector) ?? rules[0];
	const firstRule = rules.find((r) => r.selector.includes(":first"));
	const rightRule = rules.find((r) => r.selector.includes(":right"));
	const leftRule = rules.find((r) => r.selector.includes(":left"));

	const lines: string[] = [];

	lines.push(":root {");

	if (baseRule?.size) {
		addProp(lines, "pagebox-width", baseRule.size.width, pagedjsCompatible);
		addProp(lines, "pagebox-height", baseRule.size.height, pagedjsCompatible);
		lines.push(
			"\t--printedjs-width: calc(var(--printedjs-pagebox-width) + var(--printedjs-bleed-left) + var(--printedjs-bleed-right));",
		);
		lines.push(
			"\t--printedjs-height: calc(var(--printedjs-pagebox-height) + var(--printedjs-bleed-top) + var(--printedjs-bleed-bottom));",
		);

		if (pagedjsCompatible) {
			lines.push(
				"\t--pagedjs-width: calc(var(--pagedjs-pagebox-width) + var(--pagedjs-bleed-left) + var(--pagedjs-bleed-right));",
			);
			lines.push(
				"\t--pagedjs-height: calc(var(--pagedjs-pagebox-height) + var(--pagedjs-bleed-top) + var(--pagedjs-bleed-bottom));",
			);
		}

		const fallbackWidth = pagedjsCompatible
			? "var(--printedjs-width, var(--pagedjs-width))"
			: "var(--printedjs-width)";

		const fallbackHeight = pagedjsCompatible
			? "var(--printedjs-height, var(--pagedjs-height))"
			: "var(--printedjs-height)";

		addProp(lines, "width-right", fallbackWidth, pagedjsCompatible);
		addProp(lines, "height-right", fallbackHeight, pagedjsCompatible);
		addProp(lines, "width-left", fallbackWidth, pagedjsCompatible);
		addProp(lines, "height-left", fallbackHeight, pagedjsCompatible);
	}

	if (baseRule?.margin?.top)
		addProp(lines, "margin-top", toLength(baseRule.margin.top), pagedjsCompatible);

	if (baseRule?.margin?.right)
		addProp(lines, "margin-right", toLength(baseRule.margin.right), pagedjsCompatible);
	else if (baseRule?.margin?.inside)
		addProp(lines, "margin-right", toLength(baseRule.margin.inside), pagedjsCompatible);
	else if (baseRule?.margin?.outside)
		addProp(lines, "margin-right", toLength(baseRule.margin.outside), pagedjsCompatible);

	if (baseRule?.margin?.bottom)
		addProp(lines, "margin-bottom", toLength(baseRule.margin.bottom), pagedjsCompatible);

	if (baseRule?.margin?.left)
		addProp(lines, "margin-left", toLength(baseRule.margin.left), pagedjsCompatible);
	else if (baseRule?.margin?.outside)
		addProp(lines, "margin-left", toLength(baseRule.margin.outside), pagedjsCompatible);
	else if (baseRule?.margin?.inside)
		addProp(lines, "margin-left", toLength(baseRule.margin.inside), pagedjsCompatible);

	if (baseRule?.margin?.inside)
		addProp(lines, "margin-inside", toLength(baseRule.margin.inside), pagedjsCompatible);

	if (baseRule?.margin?.outside)
		addProp(
			lines,
			"margin-outside",
			toLength(baseRule.margin.outside),
			pagedjsCompatible,
		);

	if (baseRule?.margin?.gutter)
		addProp(lines, "gutter", toLength(baseRule.margin.gutter), pagedjsCompatible);

	if (baseRule?.padding?.top)
		addProp(lines, "padding-top", toLength(baseRule.padding.top), pagedjsCompatible);

	if (baseRule?.padding?.right)
		addProp(lines, "padding-right", toLength(baseRule.padding.right), pagedjsCompatible);

	if (baseRule?.padding?.bottom)
		addProp(
			lines,
			"padding-bottom",
			toLength(baseRule.padding.bottom),
			pagedjsCompatible,
		);

	if (baseRule?.padding?.left)
		addProp(lines, "padding-left", toLength(baseRule.padding.left), pagedjsCompatible);

	if (baseRule?.bleed) {
		addProp(lines, "bleed-top", toLength(baseRule.bleed.top), pagedjsCompatible);
		addProp(lines, "bleed-right", toLength(baseRule.bleed.right), pagedjsCompatible);
		addProp(lines, "bleed-bottom", toLength(baseRule.bleed.bottom), pagedjsCompatible);
		addProp(lines, "bleed-left", toLength(baseRule.bleed.left), pagedjsCompatible);
	}

	if (baseRule?.marks) {
		const hasCrop = baseRule.marks.includes("crop");
		const hasCross = baseRule.marks.includes("cross");
		addProp(lines, "mark-crop-display", hasCrop ? "block" : "none", pagedjsCompatible);
		addProp(lines, "mark-cross-display", hasCross ? "block" : "none", pagedjsCompatible);
	}

	lines.push("}");

	if (baseRule?.size) {
		lines.push(
			`@page { size: ${baseRule.size.width} ${baseRule.size.height}; margin: 0; }`,
		);
	}

	lines.push(`${pageRuleSelector("", pagedjsCompatible)} {`);

	if (baseRule?.size) {
		addProp(lines, "pagebox-width", baseRule.size.width, pagedjsCompatible);
		addProp(lines, "pagebox-height", baseRule.size.height, pagedjsCompatible);
	}

	if (baseRule?.margin?.top)
		addProp(lines, "margin-top", toLength(baseRule.margin.top), pagedjsCompatible);

	if (baseRule?.margin?.right)
		addProp(lines, "margin-right", toLength(baseRule.margin.right), pagedjsCompatible);
	else if (baseRule?.margin?.inside)
		addProp(lines, "margin-right", toLength(baseRule.margin.inside), pagedjsCompatible);
	else if (baseRule?.margin?.outside)
		addProp(lines, "margin-right", toLength(baseRule.margin.outside), pagedjsCompatible);

	if (baseRule?.margin?.bottom)
		addProp(lines, "margin-bottom", toLength(baseRule.margin.bottom), pagedjsCompatible);

	if (baseRule?.margin?.left)
		addProp(lines, "margin-left", toLength(baseRule.margin.left), pagedjsCompatible);
	else if (baseRule?.margin?.outside)
		addProp(lines, "margin-left", toLength(baseRule.margin.outside), pagedjsCompatible);
	else if (baseRule?.margin?.inside)
		addProp(lines, "margin-left", toLength(baseRule.margin.inside), pagedjsCompatible);

	if (baseRule?.margin?.inside)
		addProp(lines, "margin-inside", toLength(baseRule.margin.inside), pagedjsCompatible);

	if (baseRule?.margin?.outside)
		addProp(
			lines,
			"margin-outside",
			toLength(baseRule.margin.outside),
			pagedjsCompatible,
		);

	if (baseRule?.margin?.gutter)
		addProp(lines, "gutter", toLength(baseRule.margin.gutter), pagedjsCompatible);

	if (baseRule?.padding?.top)
		addProp(lines, "padding-top", toLength(baseRule.padding.top), pagedjsCompatible);

	if (baseRule?.padding?.right)
		addProp(lines, "padding-right", toLength(baseRule.padding.right), pagedjsCompatible);

	if (baseRule?.padding?.bottom)
		addProp(
			lines,
			"padding-bottom",
			toLength(baseRule.padding.bottom),
			pagedjsCompatible,
		);

	if (baseRule?.padding?.left)
		addProp(lines, "padding-left", toLength(baseRule.padding.left), pagedjsCompatible);
	lines.push("}");

	const hasMirrored = hasMirroredMargins(baseRule);
	const rightMargins = computeSideMargins(rightRule?.margin, "right", baseRule?.margin);
	const leftMargins = computeSideMargins(leftRule?.margin, "left", baseRule?.margin);

	if (rightRule || hasMirrored) {
		lines.push(`${pageRuleSelector("right", pagedjsCompatible)} {`);

		if (rightRule?.size) {
			addProp(lines, "width-right", rightRule.size.width, pagedjsCompatible);
			addProp(lines, "height-right", rightRule.size.height, pagedjsCompatible);
		}

		if (rightMargins.top)
			addProp(lines, "margin-top", toLength(rightMargins.top), pagedjsCompatible);

		if (rightMargins.right)
			addProp(lines, "margin-right", toLength(rightMargins.right), pagedjsCompatible);

		if (rightMargins.bottom)
			addProp(lines, "margin-bottom", toLength(rightMargins.bottom), pagedjsCompatible);

		if (rightMargins.left)
			addProp(lines, "margin-left", toLength(rightMargins.left), pagedjsCompatible);

		if (rightRule?.padding?.top)
			addProp(lines, "padding-top", toLength(rightRule.padding.top), pagedjsCompatible);

		if (rightRule?.padding?.right)
			addProp(
				lines,
				"padding-right",
				toLength(rightRule.padding.right),
				pagedjsCompatible,
			);

		if (rightRule?.padding?.bottom)
			addProp(
				lines,
				"padding-bottom",
				toLength(rightRule.padding.bottom),
				pagedjsCompatible,
			);

		if (rightRule?.padding?.left)
			addProp(lines, "padding-left", toLength(rightRule.padding.left), pagedjsCompatible);
		lines.push("}");
	}

	if (leftRule || hasMirrored) {
		lines.push(`${pageRuleSelector("left", pagedjsCompatible)} {`);

		if (leftRule?.size) {
			addProp(lines, "width-left", leftRule.size.width, pagedjsCompatible);
			addProp(lines, "height-left", leftRule.size.height, pagedjsCompatible);
		}

		if (leftMargins.top)
			addProp(lines, "margin-top", toLength(leftMargins.top), pagedjsCompatible);

		if (leftMargins.right)
			addProp(lines, "margin-right", toLength(leftMargins.right), pagedjsCompatible);

		if (leftMargins.bottom)
			addProp(lines, "margin-bottom", toLength(leftMargins.bottom), pagedjsCompatible);

		if (leftMargins.left)
			addProp(lines, "margin-left", toLength(leftMargins.left), pagedjsCompatible);

		if (leftRule?.padding?.top)
			addProp(lines, "padding-top", toLength(leftRule.padding.top), pagedjsCompatible);

		if (leftRule?.padding?.right)
			addProp(
				lines,
				"padding-right",
				toLength(leftRule.padding.right),
				pagedjsCompatible,
			);

		if (leftRule?.padding?.bottom)
			addProp(
				lines,
				"padding-bottom",
				toLength(leftRule.padding.bottom),
				pagedjsCompatible,
			);

		if (leftRule?.padding?.left)
			addProp(lines, "padding-left", toLength(leftRule.padding.left), pagedjsCompatible);
		lines.push("}");
	}

	if (firstRule) {
		lines.push(`${pageRuleSelector("first", pagedjsCompatible)} {`);

		if (firstRule.size) {
			addProp(lines, "pagebox-width", firstRule.size.width, pagedjsCompatible);
			addProp(lines, "pagebox-height", firstRule.size.height, pagedjsCompatible);
		}

		if (firstRule.margin?.top)
			addProp(lines, "margin-top", toLength(firstRule.margin.top), pagedjsCompatible);

		if (firstRule.margin?.right)
			addProp(lines, "margin-right", toLength(firstRule.margin.right), pagedjsCompatible);

		if (firstRule.margin?.bottom)
			addProp(
				lines,
				"margin-bottom",
				toLength(firstRule.margin.bottom),
				pagedjsCompatible,
			);

		if (firstRule.margin?.left)
			addProp(lines, "margin-left", toLength(firstRule.margin.left), pagedjsCompatible);

		if (firstRule.padding?.top)
			addProp(lines, "padding-top", toLength(firstRule.padding.top), pagedjsCompatible);

		if (firstRule.padding?.right)
			addProp(
				lines,
				"padding-right",
				toLength(firstRule.padding.right),
				pagedjsCompatible,
			);

		if (firstRule.padding?.bottom)
			addProp(
				lines,
				"padding-bottom",
				toLength(firstRule.padding.bottom),
				pagedjsCompatible,
			);

		if (firstRule.padding?.left)
			addProp(lines, "padding-left", toLength(firstRule.padding.left), pagedjsCompatible);
		lines.push("}");
	}

	for (const rule of rules) {
		const rawName = rule.selector.trim();

		if (!rawName || rawName === "*" || rawName.startsWith(":")) {
			continue;
		}

		const pageSel = pagedjsCompatible
			? `:is(.printedjs_page, .pagedjs_page)[data-page="${rawName}"], :is(.printedjs_page, .pagedjs_page).printedjs_${rawName}_page, :is(.printedjs_page, .pagedjs_page).pagedjs_${rawName}_page`
			: `.printedjs_page[data-page="${rawName}"], .printedjs_page.printedjs_${rawName}_page`;

		lines.push(`${pageSel} {`);

		if (rule.size) {
			addProp(lines, "pagebox-width", rule.size.width, pagedjsCompatible);
			addProp(lines, "pagebox-height", rule.size.height, pagedjsCompatible);
			lines.push(
				"\t--printedjs-width: calc(var(--printedjs-pagebox-width) + var(--printedjs-bleed-left) + var(--printedjs-bleed-right));",
			);
			lines.push(
				"\t--printedjs-height: calc(var(--printedjs-pagebox-height) + var(--printedjs-bleed-top) + var(--printedjs-bleed-bottom));",
			);

			if (pagedjsCompatible) {
				lines.push(
					"\t--pagedjs-width: calc(var(--pagedjs-pagebox-width) + var(--pagedjs-bleed-left) + var(--pagedjs-bleed-right));",
				);
				lines.push(
					"\t--pagedjs-height: calc(var(--pagedjs-pagebox-height) + var(--pagedjs-bleed-top) + var(--pagedjs-bleed-bottom));",
				);
			}

			const fallbackW = pagedjsCompatible
				? "var(--printedjs-width, var(--pagedjs-width))"
				: "var(--printedjs-width)";

			const fallbackH = pagedjsCompatible
				? "var(--printedjs-height, var(--pagedjs-height))"
				: "var(--printedjs-height)";

			addProp(lines, "width-right", fallbackW, pagedjsCompatible);
			addProp(lines, "height-right", fallbackH, pagedjsCompatible);
			addProp(lines, "width-left", fallbackW, pagedjsCompatible);
			addProp(lines, "height-left", fallbackH, pagedjsCompatible);
			lines.push(`\twidth: ${fallbackW} !important;`);
			lines.push(`\theight: ${fallbackH} !important;`);
		}

		if (rule.margin?.top)
			addProp(lines, "margin-top", toLength(rule.margin.top), pagedjsCompatible);

		if (rule.margin?.right)
			addProp(lines, "margin-right", toLength(rule.margin.right), pagedjsCompatible);
		else if (rule.margin?.inside)
			addProp(lines, "margin-right", toLength(rule.margin.inside), pagedjsCompatible);
		else if (rule.margin?.outside)
			addProp(lines, "margin-right", toLength(rule.margin.outside), pagedjsCompatible);

		if (rule.margin?.bottom)
			addProp(lines, "margin-bottom", toLength(rule.margin.bottom), pagedjsCompatible);

		if (rule.margin?.left)
			addProp(lines, "margin-left", toLength(rule.margin.left), pagedjsCompatible);
		else if (rule.margin?.outside)
			addProp(lines, "margin-left", toLength(rule.margin.outside), pagedjsCompatible);
		else if (rule.margin?.inside)
			addProp(lines, "margin-left", toLength(rule.margin.inside), pagedjsCompatible);

		if (rule.margin?.inside)
			addProp(lines, "margin-inside", toLength(rule.margin.inside), pagedjsCompatible);

		if (rule.margin?.outside)
			addProp(lines, "margin-outside", toLength(rule.margin.outside), pagedjsCompatible);

		if (rule.margin?.gutter)
			addProp(lines, "gutter", toLength(rule.margin.gutter), pagedjsCompatible);

		if (rule.padding?.top)
			addProp(lines, "padding-top", toLength(rule.padding.top), pagedjsCompatible);

		if (rule.padding?.right)
			addProp(lines, "padding-right", toLength(rule.padding.right), pagedjsCompatible);

		if (rule.padding?.bottom)
			addProp(lines, "padding-bottom", toLength(rule.padding.bottom), pagedjsCompatible);

		if (rule.padding?.left)
			addProp(lines, "padding-left", toLength(rule.padding.left), pagedjsCompatible);

		if (rule.bleed) {
			addProp(lines, "bleed-top", toLength(rule.bleed.top), pagedjsCompatible);
			addProp(lines, "bleed-right", toLength(rule.bleed.right), pagedjsCompatible);
			addProp(lines, "bleed-bottom", toLength(rule.bleed.bottom), pagedjsCompatible);
			addProp(lines, "bleed-left", toLength(rule.bleed.left), pagedjsCompatible);
		}

		lines.push(`\tpage: ${rawName};`);
		lines.push("}");

		if (hasMirroredMargins(rule)) {
			const namedRight = computeSideMargins(rule.margin, "right", baseRule?.margin);
			const namedLeft = computeSideMargins(rule.margin, "left", baseRule?.margin);

			lines.push(`${pageSel}.printedjs_right_page {`);

			if (namedRight.left)
				addProp(lines, "margin-left", toLength(namedRight.left), pagedjsCompatible);

			if (namedRight.right)
				addProp(lines, "margin-right", toLength(namedRight.right), pagedjsCompatible);
			lines.push("}");

			lines.push(`${pageSel}.printedjs_left_page {`);

			if (namedLeft.left)
				addProp(lines, "margin-left", toLength(namedLeft.left), pagedjsCompatible);

			if (namedLeft.right)
				addProp(lines, "margin-right", toLength(namedLeft.right), pagedjsCompatible);
			lines.push("}");
		}

		if (rule.size) {
			lines.push(
				`@page ${rawName} { size: ${rule.size.width} ${rule.size.height}; margin: 0; }`,
			);
		}
	}

	return lines.join("\n");
}

export function pageRulesPlugin(): PrintedjsPlugin {
	return {
		name: "page-rules",
		transformStyles(css: string, context?: PluginContext) {
			const rules = parsePageRules(css);

			if (rules.length === 0) {
				return css;
			}

			const cleanedCss = stripPageRules(css);
			const generated = generatePageCss(rules, context?.pagedjsCompatible ?? false);

			return `${cleanedCss}\n${generated}`;
		},
	};
}
