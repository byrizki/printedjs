import { describe, expect, test } from "vitest";

const packageEntries = [
	"@printedjs/core",
	"@printedjs/browser",
	"@printedjs/plugins",
	"@printedjs/minimal",
	"@printedjs/polyfill",
];

describe("workspace", () => {
	test("resolves public package entry points", async () => {
		const entries = await Promise.all(
			packageEntries.map(async (entry) => {
				try {
					await import(entry);
					return true;
				} catch {
					return false;
				}
			}),
		);

		expect(entries).toEqual([true, true, true, true, true]);
	});
});
