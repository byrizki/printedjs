import dayjs from "dayjs";
import { Eta } from "eta";
import numeral from "numeral";

const numInstance =
	(numeral as unknown as { default?: typeof numeral }).default ?? numeral;

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TemplateHelper = (...args: any[]) => unknown;

export const defaultTemplateHelpers: Record<string, TemplateHelper> = {
	dayjs: (d: unknown) => dayjs(d as string | number | Date),
	format: (v: unknown) => numInstance(v).format(),
};

/**
 * Recursively converts BigInt values to Numbers for template engine compatibility.
 */
export function deepToNumber(obj: unknown): unknown {
	if (obj === null || typeof obj !== "object") {
		return typeof obj === "bigint" ? Number(obj) : obj;
	}
	if (Array.isArray(obj)) {
		return obj.map((v) => deepToNumber(v));
	}
	const result: Record<string, unknown> = {};
	for (const key of Object.keys(obj as Record<string, unknown>)) {
		result[key] = deepToNumber((obj as Record<string, unknown>)[key]);
	}
	return result;
}

/**
 * Renders an EJS or Eta template string using context data and optional helper functions.
 */
export function renderTemplate(
	templateStr: string,
	context: Record<string, unknown> = {},
	options?: {
		readonly helpers?: Record<string, TemplateHelper> | undefined;
		readonly useWith?: boolean | undefined;
	},
): string {
	const eta = new Eta({
		useWith: options?.useWith ?? true,
	});

	const cleanContext = (deepToNumber(context) as Record<string, unknown>) ?? {};
	const combinedContext: Record<string, unknown> = {
		...defaultTemplateHelpers,
		...(options?.helpers ?? {}),
		...cleanContext,
		it: cleanContext,
		locals: cleanContext,
	};

	return eta.renderString(templateStr, combinedContext);
}

export interface TemplateCompileResult {
	readonly html: string;
	readonly durationMs: number;
	readonly error: string | null;
}

export interface JsonParseResult {
	readonly data: Record<string, unknown>;
	readonly error: string | null;
}

export function formatCurrencyValue(value: unknown, currency: string = "USD"): string {
	const numeric = typeof value === "number" ? value : Number(value);
	if (isNaN(numeric)) {
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

export const playgroundTemplateHelpers: Record<string, TemplateHelper> = {
	...defaultTemplateHelpers,
	currency: (value: unknown, currency?: unknown) =>
		formatCurrencyValue(value, typeof currency === "string" ? currency : "USD"),
	uppercase: (value: unknown) => String(value ?? "").toUpperCase(),
	lowercase: (value: unknown) => String(value ?? "").toLowerCase(),
	date: (value: unknown, formatStr?: unknown) =>
		dayjs(value as string | number | Date).format(
			typeof formatStr === "string" ? formatStr : "YYYY-MM-DD",
		),
	sum: (array: unknown, key?: unknown) => {
		if (!Array.isArray(array)) return 0;
		return array.reduce((acc: number, item: unknown) => {
			if (typeof key === "string" && item && typeof item === "object") {
				const val = (item as Record<string, unknown>)[key];
				return acc + (typeof val === "number" ? val : Number(val) || 0);
			}
			return acc + (typeof item === "number" ? item : Number(item) || 0);
		}, 0);
	},
};

export function parseJsonData(jsonString: string): JsonParseResult {
	const trimmed = jsonString.trim();
	if (!trimmed) {
		return { data: {}, error: null };
	}

	try {
		const parsed = JSON.parse(trimmed);
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
			return {
				data: {},
				error: "Dynamic data root must be a JSON object (e.g. { ... }).",
			};
		}
		return { data: deepToNumber(parsed) as Record<string, unknown>, error: null };
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		return { data: {}, error: message };
	}
}

export function formatJsonString(jsonString: string): {
	formatted: string;
	error: string | null;
} {
	const parsed = parseJsonData(jsonString);
	if (parsed.error) {
		return { formatted: jsonString, error: parsed.error };
	}
	try {
		return {
			formatted: JSON.stringify(parsed.data, null, 2),
			error: null,
		};
	} catch (err: unknown) {
		return { formatted: jsonString, error: String(err) };
	}
}

export function compileTemplate(
	templateStr: string,
	data: Record<string, unknown>,
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
	} catch (err: unknown) {
		const durationMs = performance.now() - startTime;
		const message = err instanceof Error ? err.message : String(err);
		return {
			html: templateStr,
			durationMs,
			error: `Template compilation error: ${message}`,
		};
	}
}
