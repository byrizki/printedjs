import { describe, expect, test } from "vitest";
import { PrintedjsPluginOrderError } from "../contracts/errors.js";
import type { PrintedjsPlugin } from "../contracts/plugin.js";
import { orderPlugins } from "./order.js";

describe("plugins/order", () => {
	test("orders plugins by declared dependencies", () => {
		const plugins: PrintedjsPlugin[] = [
			{ name: "counters", after: ["page-rules"] },
			{ name: "page-rules" },
		];

		expect(orderPlugins(plugins).map(({ name }) => name)).toEqual([
			"page-rules",
			"counters",
		]);
	});

	test("respects 'before' constraints", () => {
		const plugins: PrintedjsPlugin[] = [
			{ name: "footnotes" },
			{ name: "breaks", before: ["footnotes"] },
		];

		expect(orderPlugins(plugins).map(({ name }) => name)).toEqual([
			"breaks",
			"footnotes",
		]);
	});

	test("maintains stable relative ordering for unconstrained plugins", () => {
		const plugins: PrintedjsPlugin[] = [
			{ name: "plugin-a" },
			{ name: "plugin-b" },
			{ name: "plugin-c" },
		];

		expect(orderPlugins(plugins).map(({ name }) => name)).toEqual([
			"plugin-a",
			"plugin-b",
			"plugin-c",
		]);
	});

	test("rejects duplicate plugin names", () => {
		const plugins: PrintedjsPlugin[] = [{ name: "duplicate" }, { name: "duplicate" }];
		expect(() => orderPlugins(plugins)).toThrow(PrintedjsPluginOrderError);
	});

	test("rejects missing dependencies in 'after'", () => {
		const plugins: PrintedjsPlugin[] = [{ name: "orphan", after: ["missing-plugin"] }];
		expect(() => orderPlugins(plugins)).toThrow(PrintedjsPluginOrderError);
	});

	test("rejects missing dependencies in 'before'", () => {
		const plugins: PrintedjsPlugin[] = [{ name: "orphan", before: ["missing-plugin"] }];
		expect(() => orderPlugins(plugins)).toThrow(PrintedjsPluginOrderError);
	});

	test("rejects circular dependencies", () => {
		const plugins: PrintedjsPlugin[] = [
			{ name: "a", after: ["b"] },
			{ name: "b", after: ["a"] },
		];

		expect(() => orderPlugins(plugins)).toThrow(PrintedjsPluginOrderError);
	});
});
