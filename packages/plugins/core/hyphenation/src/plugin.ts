import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";

export function hyphenationPlugin(): PrintedjsPlugin {
	return {
		name: "hyphenation",
		after: ["page-rules"],
		transformStyles(css: string): string {
			// Ensure browser hyphenation is preserved across vendor prefixes
			return css.replace(
				/\bhyphens\s*:\s*auto\b/gi,
				"-webkit-hyphens: auto; -ms-hyphens: auto; hyphens: auto;",
			);
		},
		beforeLayout(context: PluginContext) {
			// SAFETY: contentRoot is a DOM ParentNode during layout
			const contentRoot = context.metadata.contentRoot as ParentNode | undefined;

			if (!contentRoot || !("querySelectorAll" in contentRoot)) {
				return;
			}

			// Tag elements that contain soft hyphens for measurement preservation
			// SAFETY: ParentNode is a Node in the DOM hierarchy
			const walker = document.createTreeWalker(
				contentRoot as Node,
				NodeFilter.SHOW_TEXT,
				null,
			);

			let node: Node | null;

			while ((node = walker.nextNode())) {
				if (node.textContent && node.textContent.includes("\u00AD")) {
					const parent = node.parentElement;

					if (parent) {
						parent.setAttribute("data-has-shy", "true");
					}
				}
			}
		},
	};
}
