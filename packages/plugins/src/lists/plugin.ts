import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";

/**
 * Handles ordered list (<ol>) continuity across paginated content.
 * Ensures lists broken across pages maintain sequential numbering.
 */
export function listsPlugin(): PrintedjsPlugin {
	return {
		name: "lists",
		after: ["breaks", "page-rules"],
		beforeLayout(context: PluginContext) {
			const contentRoot = context.metadata["contentRoot"] as ParentNode | undefined;
			if (!contentRoot || typeof contentRoot.querySelectorAll !== "function") {
				return;
			}

			const orderedLists = contentRoot.querySelectorAll<HTMLOListElement>("ol");
			orderedLists.forEach((list) => {
				let start = 1;
				if (list.hasAttribute("start")) {
					const parsed = parseInt(list.getAttribute("start") ?? "", 10);
					if (!isNaN(parsed)) {
						start = parsed;
					}
				}

				let itemIndex = 0;
				for (let i = 0; i < list.children.length; i++) {
					const child = list.children[i];
					if (child && child.tagName.toUpperCase() === "LI") {
						child.setAttribute("data-item-num", String(start + itemIndex));
						itemIndex++;
					}
				}
			});
		},
		afterRender(context: PluginContext) {
			const doc = context.metadata["document"] as Document | undefined;
			if (!doc) {
				return;
			}

			const pages = doc.querySelectorAll(".printedjs_page, .pagedjs_page");
			pages.forEach((page) => {
				const orderedLists = page.querySelectorAll<HTMLOListElement>("ol");
				orderedLists.forEach((list) => {
					const firstItem = list.querySelector<HTMLElement>(":scope > li");
					if (firstItem?.hasAttribute("data-item-num")) {
						const num = parseInt(firstItem.getAttribute("data-item-num")!, 10);
						if (!isNaN(num)) {
							list.setAttribute("start", String(num));
							list.start = num;
						}
					}
				});
			});
		},
	};
}
