import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";

const MATH_SELECTORS = [
	".katex-display",
	".katex",
	"mjx-container",
	"math",
	"[data-math]",
	".math-display",
];

export function mathPlugin(): PrintedjsPlugin {
	return {
		name: "math-break-protection",
		after: ["page-rules", "breaks"],
		transformStyles(css: string): string {
			const mathRules = `
				${MATH_SELECTORS.join(", ")} {
					break-inside: avoid !important;
					page-break-inside: avoid !important;
				}
				.katex-display, mjx-container[display="true"], math[display="block"] {
					display: block;
					break-inside: avoid !important;
				}
			`;

			return `${css}\n${mathRules}`;
		},
		beforeLayout(context: PluginContext) {
			// SAFETY: contentRoot is a DOM node supporting querySelectorAll during layout
			const contentRoot = context.metadata.contentRoot as ParentNode | undefined;

			if (!contentRoot || !("querySelectorAll" in contentRoot)) {
				return;
			}

			// Pre-tag math containers with break-inside avoid
			for (const sel of MATH_SELECTORS) {
				try {
					const matched = contentRoot.querySelectorAll<HTMLElement>(sel);
					matched.forEach((el) => {
						el.setAttribute("data-break-inside", "avoid");
					});
				} catch {
					// Ignore invalid selector
				}
			}
		},
	};
}
