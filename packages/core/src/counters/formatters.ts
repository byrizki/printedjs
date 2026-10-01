const ROMAN_MAP: readonly [number, string][] = [
	[1000, "m"],
	[900, "cm"],
	[500, "d"],
	[400, "cd"],
	[100, "c"],
	[90, "xc"],
	[50, "l"],
	[40, "xl"],
	[10, "x"],
	[9, "ix"],
	[5, "v"],
	[4, "iv"],
	[1, "i"],
];

function toRoman(num: number, upper = false): string {
	if (num <= 0 || num >= 4000) {
		return String(num);
	}
	let result = "";
	let n = num;
	for (const [val, sym] of ROMAN_MAP) {
		while (n >= val) {
			result += sym;
			n -= val;
		}
	}
	return upper ? result.toUpperCase() : result;
}

function toAlpha(num: number, upper = false): string {
	if (num <= 0) {
		return String(num);
	}
	let result = "";
	let n = num;
	while (n > 0) {
		n--;
		result = String.fromCharCode((upper ? 65 : 97) + (n % 26)) + result;
		n = Math.floor(n / 26);
	}
	return result;
}

function toDecimalLeadingZero(num: number): string {
	if (num >= 0 && num < 10) {
		return `0${num}`;
	}
	return String(num);
}

export type PageCounterStyle =
	| "decimal"
	| "lower-roman"
	| "upper-roman"
	| "lower-alpha"
	| "lower-latin"
	| "upper-alpha"
	| "upper-latin"
	| "decimal-leading-zero";

export function formatPageNumber(value: number, style?: string | null): string {
	const s = (style ?? "decimal").toLowerCase().trim();
	switch (s) {
		case "lower-roman":
			return toRoman(value, false);
		case "upper-roman":
			return toRoman(value, true);
		case "lower-alpha":
		case "lower-latin":
			return toAlpha(value, false);
		case "upper-alpha":
		case "upper-latin":
			return toAlpha(value, true);
		case "decimal-leading-zero":
			return toDecimalLeadingZero(value);
		case "decimal":
		default:
			return String(value);
	}
}
