import { describe, expect, it } from "vitest";
import { listsPlugin } from "./plugin.js";

describe("listsPlugin", () => {
	it("stamps data-item-num on ordered list items during beforeLayout", () => {
		const plugin = listsPlugin();

		const makeItem = (tag: string, text: string) => {
			const attrs: Record<string, string> = {};

			return {
				tagName: tag.toUpperCase(),
				textContent: text,
				setAttribute: (k: string, v: string) => {
					attrs[k] = v;
				},
				getAttribute: (k: string) => attrs[k] ?? null,
				hasAttribute: (k: string) => k in attrs,
			};
		};

		const item1 = makeItem("li", "Item 1");
		const item2 = makeItem("li", "Item 2");
		const item3 = makeItem("li", "Item 3");

		const ol = {
			tagName: "OL",
			hasAttribute: () => false,
			getAttribute: () => null,
			children: [item1, item2, item3],
		};

		const contentRoot = {
			querySelectorAll: (sel: string) => (sel === "ol" ? [ol] : []),
		};

		plugin.beforeLayout?.({
			metadata: { contentRoot: contentRoot as unknown as HTMLElement },
			pagedjsCompatible: false,
		});

		expect(item1.getAttribute("data-item-num")).toBe("1");
		expect(item2.getAttribute("data-item-num")).toBe("2");
		expect(item3.getAttribute("data-item-num")).toBe("3");
	});

	it("updates ol start attribute on split page continuation during afterRender", () => {
		const plugin = listsPlugin();

		const makeItem = (itemNum: string) => ({
			hasAttribute: (k: string) => k === "data-item-num",
			getAttribute: (k: string) => (k === "data-item-num" ? itemNum : null),
		});

		const splitOlAttrs: Record<string, string> = {};

		const splitOl = {
			tagName: "OL",
			start: 1,
			setAttribute: (k: string, v: string) => {
				splitOlAttrs[k] = v;
			},
			querySelector: () => makeItem("6"),
		};

		const page2 = {
			querySelectorAll: (sel: string) => (sel === "ol" ? [splitOl] : []),
		};

		const fakeDoc = {
			querySelectorAll: (sel: string) => (sel.includes("printedjs_page") ? [page2] : []),
		};

		plugin.afterRender?.({
			metadata: { document: fakeDoc as unknown as Document },
			pagedjsCompatible: false,
		});

		expect(splitOl.start).toBe(6);
		expect(splitOlAttrs["start"]).toBe("6");
	});
});
