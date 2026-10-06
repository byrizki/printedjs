import { describe, expect, it } from "vitest";
import { countersPlugin } from "./plugin.js";
import { groupPagesIntoSections, withPagesCounterReset } from "./sections.js";

function mockPage(attrs: Record<string, string> = {}) {
	const props: Record<string, string> = {};

	return {
		props,
		getAttribute: (k: string) => attrs[k] ?? null,
		setAttribute: (k: string, v: string) => {
			attrs[k] = v;
		},
		style: {
			counterReset: "",
			setProperty: (k: string, v: string) => {
				props[k] = v;
			},
		},
	};
}

describe("groupPagesIntoSections", () => {
	it("splits on counter resets and named page changes", () => {
		const cover = mockPage();
		const front1 = mockPage({ "data-page": "frontmatter", "data-counter-reset": "1" });
		const front2 = mockPage({ "data-page": "frontmatter" });
		const body1 = mockPage({ "data-counter-reset": "1" });
		const body2 = mockPage();
		const body3 = mockPage();

		const sections = groupPagesIntoSections([cover, front1, front2, body1, body2, body3]);

		expect(sections.map((s) => s.length)).toEqual([1, 2, 3]);
	});

	it("keeps a single section when there are no resets", () => {
		const sections = groupPagesIntoSections([mockPage(), mockPage(), mockPage()]);

		expect(sections.map((s) => s.length)).toEqual([3]);
	});

	it("ignores named page changes when splitOnNameChange is false", () => {
		const front1 = mockPage({ "data-page": "frontmatter", "data-counter-reset": "1" });
		const front2 = mockPage({ "data-page": "frontmatter" });
		const body1 = mockPage();
		const body2 = mockPage();

		const sections = groupPagesIntoSections([front1, front2, body1, body2], false);

		expect(sections.map((s) => s.length)).toEqual([4]);
	});
});

describe("withPagesCounterReset", () => {
	it("appends the pages counter to an existing reset", () => {
		expect(withPagesCounterReset("page 0", 9)).toBe("page 0 pages 9");
	});

	it("replaces a previous pages value and ignores none", () => {
		expect(withPagesCounterReset("page 0 pages 3", 9)).toBe("page 0 pages 9");
		expect(withPagesCounterReset("none", 4)).toBe("pages 4");
		expect(withPagesCounterReset(undefined, 4)).toBe("pages 4");
	});
});

describe("countersPlugin counter(pages) for continued numbering", () => {
	it("keeps one total when numbering continues across a style change", () => {
		const plugin = countersPlugin();

		const cover = mockPage();
		const front = mockPage({ "data-page": "frontmatter", "data-counter-reset": "1" });
		const body = Array.from({ length: 3 }, () => mockPage());
		const all = [cover, front, ...body];

		const fakeDoc = {
			querySelectorAll: (sel: string) => (sel.includes("printedjs_page") ? all : []),
			querySelector: () => null,
			documentElement: { style: { setProperty: () => {} } },
		};

		plugin.afterRender?.({
			metadata: { document: fakeDoc as unknown as Document },
			pagedjsCompatible: false,
		});

		expect(front.style.counterReset).toBe("pages 4");
		expect(body[2]?.style.counterReset).toBe("pages 4");
	});
});

describe("countersPlugin counter(pages) for mixed numbering", () => {
	it("scopes the pages counter to each numbering section", () => {
		const plugin = countersPlugin();

		const cover = mockPage();
		const front = mockPage({ "data-page": "frontmatter", "data-counter-reset": "1" });

		const body = Array.from({ length: 9 }, (_, i) =>
			mockPage(i === 0 ? { "data-counter-reset": "1" } : {}),
		);

		const all = [cover, front, ...body];

		const fakeDoc = {
			querySelectorAll: (sel: string) => (sel.includes("printedjs_page") ? all : []),
			querySelector: () => null,
			documentElement: { style: { setProperty: () => {} } },
		};

		plugin.afterRender?.({
			metadata: { document: fakeDoc as unknown as Document },
			pagedjsCompatible: false,
		});

		expect(all).toHaveLength(11);
		expect(cover.style.counterReset).toBe("pages 1");
		expect(front.style.counterReset).toBe("pages 1");
		expect(body[0]?.style.counterReset).toBe("pages 9");
		expect(body[0]?.props["--printedjs-section-page-count"]).toBe("9");
		expect(body[8]?.props["--printedjs-section-page-count"]).toBe("9");
		expect(body[8]?.style.counterReset).toBe("pages 9");
	});
});
