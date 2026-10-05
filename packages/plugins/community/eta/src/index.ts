import type { PrintedjsPlugin } from "@printedjs/core";
import dayjs, { type Dayjs } from "dayjs";
import { Eta } from "eta";
import numeral from "numeral";

interface NumeralModule {
	readonly default?: typeof numeral | undefined;
}

// SAFETY: numeral CJS/ESM bundle interop
const numInstance = (numeral as NumeralModule).default ?? numeral;

try {
	if (!numInstance.locales?.["id"]) {
		numInstance.register("locale", "id", {
			delimiters: { thousands: ".", decimal: "," },
			abbreviations: { thousand: "rb", million: "jt", billion: "m", trillion: "t" },
			ordinal: () => ".",
			currency: { symbol: "Rp. " },
		});
	}

	numInstance.locale("id");
} catch {
	// Ignore if locale is already registered
}

export type TemplateScalar =
	| string
	| number
	| boolean
	| null
	| undefined
	| bigint
	| Date
	| Dayjs;

export interface TemplateDataMap {
	[key: string]: TemplateContextValue;
}

export type TemplateHelper = (
	...args: readonly TemplateContextValue[]
) => TemplateScalar | void;

export type TemplateContextValue =
	| TemplateScalar
	| readonly TemplateScalar[]
	| TemplateDataMap
	| TemplateHelper;

function isString(value: TemplateContextValue | symbol): value is string {
	return Object.prototype.toString.call(value) === "[object String]";
}

function isSymbol(value: TemplateContextValue | symbol): value is symbol {
	return Object.prototype.toString.call(value) === "[object Symbol]";
}

function isBigInt(value: TemplateContextValue): value is bigint {
	return Object.prototype.toString.call(value) === "[object BigInt]";
}

function isObject(value: TemplateContextValue): value is TemplateDataMap {
	return value !== null && Object.prototype.toString.call(value) === "[object Object]";
}

export const defaultTemplateHelpers = {
	dayjs: (d: TemplateContextValue) => {
		// SAFETY: argument to dayjs helper is expected to be date-compatible
		return dayjs(d as string | number | Date);
	},
	format: (v: TemplateContextValue) => numInstance(v).format(),
} satisfies Record<string, TemplateHelper>;

function convertBigInts(value: TemplateContextValue): TemplateContextValue {
	if (isBigInt(value)) {
		return Number(value);
	}

	if (Array.isArray(value)) {
		return value.map((item) => (isBigInt(item) ? Number(item) : item));
	}

	if (isObject(value)) {
		return deepToNumber(value);
	}

	return value;
}

/**
 * Recursively converts BigInt values to Numbers for template engine compatibility.
 */
export function deepToNumber(data: TemplateDataMap): TemplateDataMap {
	const result: TemplateDataMap = {};

	for (const key of Object.keys(data)) {
		const val = data[key];
		result[key] = convertBigInts(val);
	}

	return result;
}

export interface RenderTemplateOptions {
	readonly helpers?: Record<string, TemplateHelper> | undefined;
	readonly useWith?: boolean | undefined;
}

/**
 * Renders an EJS or Eta template string using context data and optional helper functions.
 */
export function renderTemplate(
	templateStr: string,
	context: TemplateDataMap = {},
	options?: RenderTemplateOptions,
): string {
	const eta = new Eta({
		useWith: options?.useWith ?? true,
	});

	const cleanContext = deepToNumber(context);

	const combinedContext = {
		...defaultTemplateHelpers,
		...options?.helpers,
		...cleanContext,
		it: cleanContext,
		locals: cleanContext,
	} satisfies TemplateDataMap;

	const safeContext = new Proxy(combinedContext, {
		has(t, p) {
			if (isString(p) && (p.startsWith("__") || p === "it" || p === "locals")) {
				return p in t;
			}

			if (isString(p) && p in globalThis) {
				return false;
			}

			if (p === Symbol.unscopables) {
				return false;
			}

			return true;
		},
		get(t, p) {
			if (p === Symbol.unscopables) {
				return undefined;
			}

			if (p in t) {
				// SAFETY: property exists on target combined context
				return (t as Record<string | symbol, TemplateContextValue>)[p];
			}

			if (isString(p) && (p.startsWith("__") || p.startsWith("Eta"))) {
				return undefined;
			}

			if (isString(p) && p in globalThis) {
				return undefined;
			}

			if (isSymbol(p)) {
				return undefined;
			}

			return "";
		},
	});

	return eta.renderString(templateStr, safeContext);
}

export interface TemplateCompileResult {
	readonly html: string;
	readonly durationMs: number;
	readonly error: string | null;
}

export interface JsonParseResult {
	readonly data: TemplateDataMap;
	readonly error: string | null;
}

export interface FormattedJsonResult {
	readonly formatted: string;
	readonly error: string | null;
}

export function formatCurrencyValue(
	value: TemplateContextValue,
	currency: string = "USD",
): string {
	const numeric = Number(value);

	if (!Number.isFinite(numeric)) {
		return String(value ?? "");
	}

	try {
		if (currency === "IDR") {
			return `Rp ${Math.round(numeric).toLocaleString("id-ID")}`;
		}

		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency,
			minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
			maximumFractionDigits: 2,
		}).format(numeric);
	} catch {
		return `${currency} ${numeric.toLocaleString()}`;
	}
}

export const playgroundTemplateHelpers = {
	...defaultTemplateHelpers,
	currency: (value, currency) =>
		formatCurrencyValue(value, isString(currency) ? currency : "USD"),
	uppercase: (value) => String(value ?? "").toUpperCase(),
	lowercase: (value) => String(value ?? "").toLowerCase(),
	date: (value, formatStr) => {
		// SAFETY: value passed to date helper is string, number, or Date
		return dayjs(value as string | number | Date).format(
			isString(formatStr) ? formatStr : "YYYY-MM-DD",
		);
	},
	sum: (array, key) => {
		if (!Array.isArray(array)) {
			return 0;
		}

		return array.reduce((acc: number, item) => {
			if (isString(key) && isObject(item)) {
				const val = item[key];
				const num = Number(val);

				return acc + (Number.isFinite(num) ? num : 0);
			}

			const num = Number(item);

			return acc + (Number.isFinite(num) ? num : 0);
		}, 0);
	},
} satisfies Record<string, TemplateHelper>;

export function parseJsonData(jsonString: string): JsonParseResult {
	const trimmed = jsonString.trim();

	if (!trimmed) {
		return { data: {}, error: null };
	}

	try {
		const parsed = JSON.parse(trimmed);

		if (!isObject(parsed) || Array.isArray(parsed)) {
			return {
				data: {},
				error: "Dynamic data root must be a JSON object (e.g. { ... }).",
			};
		}

		return { data: deepToNumber(parsed), error: null };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);

		return { data: {}, error: message };
	}
}

export function formatJsonString(jsonString: string): FormattedJsonResult {
	const parsed = parseJsonData(jsonString);

	if (parsed.error) {
		return { formatted: jsonString, error: parsed.error };
	}

	try {
		return {
			formatted: JSON.stringify(parsed.data, null, 2),
			error: null,
		};
	} catch (err) {
		return { formatted: jsonString, error: String(err) };
	}
}

export function compileTemplate(
	templateStr: string,
	data: TemplateDataMap,
): TemplateCompileResult {
	const startTime = performance.now();

	try {
		const rendered = renderTemplate(templateStr, data, {
			helpers: playgroundTemplateHelpers,
			useWith: true,
		});

		const durationMs = performance.now() - startTime;

		return {
			html: rendered,
			durationMs,
			error: null,
		};
	} catch (err) {
		const durationMs = performance.now() - startTime;
		const message = err instanceof Error ? err.message : String(err);

		return {
			html: templateStr,
			durationMs,
			error: `Template compilation error: ${message}`,
		};
	}
}

export interface EtaPluginOptions {
	readonly data?: TemplateDataMap | undefined;
	readonly helpers?: Record<string, TemplateHelper> | undefined;
	readonly useWith?: boolean | undefined;
}

/**
 * Printedjs plugin providing pre-pagination Eta template compilation.
 */
export function etaPlugin(options: EtaPluginOptions = {}): PrintedjsPlugin {
	return {
		name: "eta-template",
		setup(context) {
			context.metadata["eta"] = {
				render: (tpl: string, data?: TemplateDataMap) =>
					renderTemplate(tpl, data ?? options.data, {
						helpers: options.helpers,
						useWith: options.useWith,
					}),
				helpers: options.helpers ?? defaultTemplateHelpers,
			};
		},
	};
}
