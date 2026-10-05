import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";
import { parseBreakStyles, type BreakStyleRule } from "./parser.js";

const BREAK_RULES_KEY = "printedjs:breakRules";

export function breaksPlugin(): PrintedjsPlugin {
	return {
		name: "breaks",
		after: ["page-rules"],
		setup(context: PluginContext) {
			if (!context.metadata[BREAK_RULES_KEY]) {
				context.metadata[BREAK_RULES_KEY] = [];
			}
		},
		transformStyles(css: string, context: PluginContext): string {
			const parsed = parseBreakStyles(css);
			// SAFETY: break rules array populated during transformStyles
			const currentRules = (context.metadata[BREAK_RULES_KEY] ?? []) as BreakStyleRule[];
			context.metadata[BREAK_RULES_KEY] = [...currentRules, ...parsed];

			return css;
		},
		beforeLayout(context: PluginContext) {
			// SAFETY: contentRoot is a DOM node supporting querySelectorAll during layout
			const contentRoot = context.metadata.contentRoot as ParentNode | undefined;

			if (!contentRoot || !("querySelectorAll" in contentRoot)) {
				return;
			}

			// SAFETY: break rules stored as BreakStyleRule array in metadata
			const rules = (context.metadata[BREAK_RULES_KEY] ?? []) as BreakStyleRule[];

			for (const rule of rules) {
				try {
					const matched = contentRoot.querySelectorAll(rule.selector);

					for (let i = 0; i < matched.length; i++) {
						const el = matched[i];

						if (!el || el.nodeType !== 1) {
							continue;
						}

						// SAFETY: nodeType 1 guarantees el is an Element/HTMLElement
						const element = el as HTMLElement;

						if (rule.breakBefore && !element.hasAttribute("data-break-before")) {
							element.setAttribute("data-break-before", rule.breakBefore);
						}

						if (rule.breakAfter && !element.hasAttribute("data-break-after")) {
							element.setAttribute("data-break-after", rule.breakAfter);
						}

						if (rule.breakInside && !element.hasAttribute("data-break-inside")) {
							element.setAttribute("data-break-inside", rule.breakInside);
						}

						if (rule.isFixed && !element.hasAttribute("data-position-fixed")) {
							element.setAttribute("data-position-fixed", "true");
						}

						if (rule.page && !element.hasAttribute("data-page")) {
							element.setAttribute("data-page", rule.page);
						}
					}
				} catch {
					// Ignore invalid selectors that cannot be queried
				}
			}
		},
	};
}
