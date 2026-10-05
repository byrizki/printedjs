import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";

export interface BookmarkItem {
	readonly title: string;
	readonly level: number;
	readonly targetId?: string | undefined;
	readonly pageNumber: number;
	readonly children: BookmarkItem[];
}

export function bookmarksPlugin(): PrintedjsPlugin {
	return {
		name: "bookmarks",
		after: ["page-rules", "breaks", "generated-content"],
		afterRender(context: PluginContext) {
			const doc = context.metadata.document;

			if (!doc) {
				return;
			}

			const pages = doc.querySelectorAll(".printedjs_page, .pagedjs_page");
			const rootBookmarks: BookmarkItem[] = [];
			const stack: BookmarkItem[] = [];

			pages.forEach((pageEl) => {
				// SAFETY: elements returned by querySelectorAll are HTMLElement nodes
				const page = pageEl as HTMLElement;
				const pageNum = parseInt(page.getAttribute("data-page-number") ?? "1", 10);

				// Find headings inside this page's content area
				const headings = page.querySelectorAll<HTMLElement>(
					"h1, h2, h3, h4, h5, h6, [data-bookmark-level]",
				);

				headings.forEach((heading) => {
					let level = 1;
					const tag = heading.tagName.toLowerCase();

					if (tag.startsWith("h") && tag.length === 2) {
						level = parseInt(tag[1] ?? "1", 10);
					} else {
						const customLevel = heading.getAttribute("data-bookmark-level");

						if (customLevel) {
							level = parseInt(customLevel, 10);
						}
					}

					const title = heading.textContent?.trim() ?? "Untitled";
					const targetId = heading.id || undefined;

					const item: BookmarkItem = {
						title,
						level,
						targetId,
						pageNumber: pageNum,
						children: [],
					};

					// Build tree hierarchy according to heading levels
					while (stack.length > 0 && stack[stack.length - 1]!.level >= level) {
						stack.pop();
					}

					if (stack.length === 0) {
						rootBookmarks.push(item);
					} else {
						stack[stack.length - 1]!.children.push(item);
					}

					stack.push(item);
				});
			});

			context.metadata.bookmarks = rootBookmarks;
		},
	};
}
