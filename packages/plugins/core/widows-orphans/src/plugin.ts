import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";

export interface WidowOrphanRule {
	readonly selector: string;
	readonly widows?: number | undefined;
	readonly orphans?: number | undefined;
}

export function widowsOrphansPlugin(): PrintedjsPlugin {
	const rules: WidowOrphanRule[] = [];

	return {
		name: "widows-orphans",
		after: ["page-rules", "breaks"],
		setup() {
			rules.length = 0;
		},
		transformStyles(css: string): string {
			// Extract widows and orphans properties and tag elements
			css.replace(/([^{}@]+)\{([^{}]+)\}/g, (match, rawSel, rawBody) => {
				const widowsMatch = rawBody.match(/\bwidows\s*:\s*(\d+)/i);
				const orphansMatch = rawBody.match(/\borphans\s*:\s*(\d+)/i);

				if (widowsMatch || orphansMatch) {
					rules.push({
						selector: rawSel.trim(),
						widows: widowsMatch ? parseInt(widowsMatch[1], 10) : undefined,
						orphans: orphansMatch ? parseInt(orphansMatch[1], 10) : undefined,
					});
				}

				return match;
			});

			return css;
		},
		beforeLayout(context: PluginContext) {
			// SAFETY: contentRoot is a DOM node supporting querySelectorAll during layout
			const contentRoot = context.metadata.contentRoot as ParentNode | undefined;

			if (!contentRoot || !("querySelectorAll" in contentRoot)) {
				return;
			}

			for (const rule of rules) {
				try {
					const matched = contentRoot.querySelectorAll<HTMLElement>(rule.selector);
					matched.forEach((el) => {
						if (rule.widows !== undefined) {
							el.setAttribute("data-widows", String(rule.widows));
						}

						if (rule.orphans !== undefined) {
							el.setAttribute("data-orphans", String(rule.orphans));
						}
					});
				} catch {
					// Ignore invalid selector
				}
			}
		},
	};
}
