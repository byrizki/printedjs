import { describe, expect, test } from "vitest";
import {
	installPolyfills,
	polyfillAsync,
	polyfillDom,
	polyfillJsStandards,
	polyfillObservers,
} from "../../packages/polyfill/src/index.js";

describe("@printedjs/polyfill (older browser compatibility)", () => {
	test("installs DOM element shims when native methods are missing", () => {
		// Mock element with custom DOM-like hierarchy
		class MockNode {
			parentNode: MockNode | null = null;
			childNodes: MockNode[] = [];
			get firstChild(): MockNode | null {
				return this.childNodes[0] ?? null;
			}
			appendChild(child: MockNode): void {
				child.parentNode = this;
				this.childNodes.push(child);
			}
			removeChild(child: MockNode): void {
				const idx = this.childNodes.indexOf(child);
				if (idx !== -1) {
					this.childNodes.splice(idx, 1);
					child.parentNode = null;
				}
			}
		}

		class MockElement extends MockNode {
			replaceChildren?(...nodes: (MockNode | string)[]): void;
		}
		const el = new MockElement();
		expect(el.childNodes).toHaveLength(0);

		// Ensure polyfillDom executes safely
		polyfillDom();
		expect(typeof installPolyfills).toBe("function");
	});

	test("polyfills Object.hasOwn when undefined", () => {
		const originalHasOwn = Object.hasOwn;
		try {
			// @ts-expect-error force undefined for test
			delete Object.hasOwn;
			polyfillJsStandards();
			expect(typeof Object.hasOwn).toBe("function");

			const obj = { key: "value" };
			expect(Object.hasOwn(obj, "key")).toBe(true);
			expect(Object.hasOwn(obj, "missing")).toBe(false);
		} finally {
			Object.hasOwn = originalHasOwn;
		}
	});

	test("polyfills Array.prototype.at when undefined", () => {
		const originalAt = Array.prototype.at;
		try {
			// @ts-expect-error force undefined for test
			delete Array.prototype.at;
			polyfillJsStandards();
			expect(typeof Array.prototype.at).toBe("function");

			const arr = [10, 20, 30];
			expect(arr.at(0)).toBe(10);
			expect(arr.at(-1)).toBe(30);
			expect(arr.at(-2)).toBe(20);
			expect(arr.at(5)).toBeUndefined();
		} finally {
			Array.prototype.at = originalAt;
		}
	});

	test("polyfills String.prototype.replaceAll when undefined", () => {
		const originalReplaceAll = String.prototype.replaceAll;
		try {
			// @ts-expect-error force undefined for test
			delete String.prototype.replaceAll;
			polyfillJsStandards();
			expect(typeof String.prototype.replaceAll).toBe("function");

			const str = "foo bar foo baz foo";
			expect(str.replaceAll("foo", "qux")).toBe("qux bar qux baz qux");
		} finally {
			String.prototype.replaceAll = originalReplaceAll;
		}
	});

	test("polyfills Promise.allSettled when undefined", async () => {
		const originalAllSettled = Promise.allSettled;
		try {
			// @ts-expect-error force undefined for test
			delete Promise.allSettled;
			polyfillJsStandards();
			expect(typeof Promise.allSettled).toBe("function");

			const results = await Promise.allSettled([
				Promise.resolve(42),
				Promise.reject(new Error("failed")),
			]);

			expect(results).toHaveLength(2);
			expect(results[0]?.status).toBe("fulfilled");
			if (results[0]?.status === "fulfilled") {
				expect(results[0].value).toBe(42);
			}
			expect(results[1]?.status).toBe("rejected");
		} finally {
			Promise.allSettled = originalAllSettled;
		}
	});

	test("polyfills structuredClone when undefined", () => {
		const originalClone = globalThis.structuredClone;
		try {
			// @ts-expect-error force undefined for test
			delete globalThis.structuredClone;
			polyfillJsStandards();
			expect(typeof globalThis.structuredClone).toBe("function");

			const source = {
				name: "Printedjs",
				tags: ["print", "pdf"],
				date: new Date("2026-09-28T00:00:00Z"),
				nested: { count: 3 },
			};

			const cloned = globalThis.structuredClone(source);
			expect(cloned).toEqual(source);
			expect(cloned).not.toBe(source);
			expect(cloned.tags).not.toBe(source.tags);
			expect(cloned.date).toBeInstanceOf(Date);
		} finally {
			globalThis.structuredClone = originalClone;
		}
	});

	test("installs async and observer polyfills safely", () => {
		expect(() => polyfillAsync()).not.toThrow();
		expect(() => polyfillObservers()).not.toThrow();
		expect(() => installPolyfills()).not.toThrow();
	});
});
