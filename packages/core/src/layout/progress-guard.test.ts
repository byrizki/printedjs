import { describe, expect, test } from "vitest";
import { PrintedjsLayoutLimitError } from "../contracts/errors.js";
import { LayoutProgressGuard } from "./progress-guard.js";

describe("layout/progress-guard", () => {
	test("rejects a repeated break state", () => {
		const guard = new LayoutProgressGuard({
			maxPages: 10,
			maxLayoutPasses: 10,
		});

		guard.record({ page: 1, cursor: "chapter:0" });
		expect(() => guard.record({ page: 1, cursor: "chapter:0" })).toThrow(
			PrintedjsLayoutLimitError,
		);
	});

	test("allows progressing break states across pages", () => {
		const guard = new LayoutProgressGuard({
			maxPages: 10,
			maxLayoutPasses: 10,
		});

		guard.record({ page: 1, cursor: "table-row:0" });
		guard.record({ page: 2, cursor: "table-row:5" });
		guard.record({ page: 3, cursor: "table-row:10" });
		expect(guard.pageCount).toBe(3);
	});

	test("enforces maxPages limit", () => {
		const guard = new LayoutProgressGuard({ maxPages: 2 });
		guard.record({ page: 1, cursor: "c:1" });
		guard.record({ page: 2, cursor: "c:2" });
		expect(() => guard.record({ page: 3, cursor: "c:3" })).toThrow(
			PrintedjsLayoutLimitError,
		);
	});

	test("enforces maxLayoutPasses limit", () => {
		const guard = new LayoutProgressGuard({ maxLayoutPasses: 2 });
		guard.record({ page: 1, cursor: "c:1" });
		guard.record({ page: 2, cursor: "c:2" });
		expect(() => guard.record({ page: 3, cursor: "c:3" })).toThrow(
			PrintedjsLayoutLimitError,
		);
	});

	test("rejects repeated cursor across consecutive pages", () => {
		const guard = new LayoutProgressGuard();
		guard.record({ page: 1, cursor: "item:4" });
		expect(() => guard.record({ page: 2, cursor: "item:4" })).toThrow(
			PrintedjsLayoutLimitError,
		);
	});
});
