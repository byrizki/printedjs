import { describe, expect, it } from "vitest";
import { formatPageNumber } from "./formatters.js";

describe("formatPageNumber", () => {
	it("formats decimal by default or explicitly", () => {
		expect(formatPageNumber(1)).toBe("1");
		expect(formatPageNumber(42, "decimal")).toBe("42");
	});

	it("formats lower-roman correctly", () => {
		expect(formatPageNumber(1, "lower-roman")).toBe("i");
		expect(formatPageNumber(2, "lower-roman")).toBe("ii");
		expect(formatPageNumber(3, "lower-roman")).toBe("iii");
		expect(formatPageNumber(4, "lower-roman")).toBe("iv");
		expect(formatPageNumber(9, "lower-roman")).toBe("ix");
		expect(formatPageNumber(14, "lower-roman")).toBe("xiv");
		expect(formatPageNumber(40, "lower-roman")).toBe("xl");
		expect(formatPageNumber(99, "lower-roman")).toBe("xcix");
		expect(formatPageNumber(2024, "lower-roman")).toBe("mmxxiv");
	});

	it("formats upper-roman correctly", () => {
		expect(formatPageNumber(1, "upper-roman")).toBe("I");
		expect(formatPageNumber(4, "upper-roman")).toBe("IV");
		expect(formatPageNumber(58, "upper-roman")).toBe("LVIII");
	});

	it("formats lower-alpha and lower-latin correctly", () => {
		expect(formatPageNumber(1, "lower-alpha")).toBe("a");
		expect(formatPageNumber(26, "lower-alpha")).toBe("z");
		expect(formatPageNumber(27, "lower-latin")).toBe("aa");
		expect(formatPageNumber(28, "lower-alpha")).toBe("ab");
	});

	it("formats upper-alpha and upper-latin correctly", () => {
		expect(formatPageNumber(1, "upper-alpha")).toBe("A");
		expect(formatPageNumber(26, "upper-alpha")).toBe("Z");
		expect(formatPageNumber(27, "upper-latin")).toBe("AA");
	});

	it("formats decimal-leading-zero correctly", () => {
		expect(formatPageNumber(1, "decimal-leading-zero")).toBe("01");
		expect(formatPageNumber(9, "decimal-leading-zero")).toBe("09");
		expect(formatPageNumber(10, "decimal-leading-zero")).toBe("10");
		expect(formatPageNumber(125, "decimal-leading-zero")).toBe("125");
	});

	it("handles non-positive values gracefully", () => {
		expect(formatPageNumber(0, "lower-roman")).toBe("0");
		expect(formatPageNumber(-5, "upper-alpha")).toBe("-5");
	});
});
