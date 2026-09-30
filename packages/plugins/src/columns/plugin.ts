import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";

export interface ColumnRule {
	readonly selector: string;
	readonly columnCount?: number | undefined;
	readonly columnGap?: string | undefined;
	readonly columnFill?: "auto" | "balance" | undefined;
}

export function columnsPlugin(): PrintedjsPlugin {
	const columnRules: ColumnRule[] = [];

	return {
		name: "columns",
		after: ["page-rules", "breaks"],
		setup() {
			columnRules.length = 0;
		},
		transformStyles(css: string): string {
			css.replace(/([^{}@]+)\{([^{}]+)\}/g, (match, rawSel, rawBody) => {
				const body = rawBody;
				const countMatch = body.match(/column-count\s*:\s*(\d+)/i);
				const gapMatch = body.match(/column-gap\s*:\s*([^;!}]+)/i);
				const fillMatch = body.match(/column-fill\s*:\s*(auto|balance)/i);

				if (countMatch || gapMatch || fillMatch) {
					columnRules.push({
						selector: rawSel.trim(),
						columnCount: countMatch ? parseInt(countMatch[1], 10) : undefined,
						columnGap: gapMatch ? gapMatch[1]?.trim() : undefined,
						columnFill: (fillMatch ? fillMatch[1]?.toLowerCase() : undefined) as
							"auto" | "balance" | undefined,
					});
				}
				return match;
			});

			return css;
		},
		beforeLayout(context: PluginContext) {
			const contentRoot = context.metadata["contentRoot"] as ParentNode | undefined;
			if (!contentRoot || typeof contentRoot.querySelectorAll !== "function") {
				return;
			}

			for (const rule of columnRules) {
				try {
					const matched = contentRoot.querySelectorAll<HTMLElement>(rule.selector);
					matched.forEach((el) => {
						if (rule.columnCount !== undefined) {
							el.setAttribute("data-column-count", String(rule.columnCount));
						}
						if (rule.columnGap !== undefined) {
							el.setAttribute("data-column-gap", rule.columnGap);
						}
						if (rule.columnFill !== undefined) {
							el.setAttribute("data-column-fill", rule.columnFill);
						}
					});
				} catch {
					// Ignore invalid selector
				}
			}

			// Handle column-span: all elements
			try {
				const spans = contentRoot.querySelectorAll<HTMLElement>("[style*='column-span']");
				spans.forEach((el) => {
					if (/column-span\s*:\s*all/i.test(el.getAttribute("style") ?? "")) {
						el.setAttribute("data-column-span", "all");
					}
				});
			} catch {
				// Ignore
			}
		},
	};
}
