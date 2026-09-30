import { describe, expect, test } from "vitest";
import {
	PrintedjsAbortError,
	PrintedjsError,
	PrintedjsInputError,
	PrintedjsLayoutLimitError,
	PrintedjsPluginError,
	PrintedjsPluginOrderError,
	PrintedjsStylesheetError,
} from "./errors.js";

describe("contracts/errors", () => {
	test("all errors inherit from PrintedjsError and Error", () => {
		const errors = [
			new PrintedjsInputError("invalid input"),
			new PrintedjsStylesheetError("failed to load stylesheet"),
			new PrintedjsAbortError("operation aborted"),
			new PrintedjsPluginError("plugin error", "plugin-name"),
			new PrintedjsPluginOrderError("dependency cycle detected"),
			new PrintedjsLayoutLimitError("max pages exceeded"),
		];

		for (const err of errors) {
			expect(err).toBeInstanceOf(Error);
			expect(err).toBeInstanceOf(PrintedjsError);
			expect(err.name).toBe(err.constructor.name);
			expect(err.message).toBeDefined();
		}
	});

	test("PrintedjsPluginError carries plugin name", () => {
		const err = new PrintedjsPluginError("crash in hook", "table-split");
		expect(err.pluginName).toBe("table-split");
		expect(err.message).toBe("crash in hook");
	});
});
