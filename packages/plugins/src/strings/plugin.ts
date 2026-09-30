import type { PrintedjsPlugin, PluginContext } from "@printedjs/core";

export interface StringSetRule {
	readonly identifier: string;
	readonly func: "content" | "attr";
	readonly attrName?: string | undefined;
	readonly selector: string;
}

const STRINGS_RULES_KEY = "printedjs:stringRules";

export function parseStringSets(
	css: string,
	pagedjsCompatible = false,
): {
	rules: StringSetRule[];
	transformedCss: string;
} {
	const rules: StringSetRule[] = [];

	// Match rule blocks: selector { declarations }
	let transformed = css.replace(/([^{}@]+)\{([^{}]+)\}/g, (match, rawSel, rawBody) => {
		const selector = rawSel.trim();
		let body = rawBody;

		// Match string-set: name content(text) or name attr(...)
		const stringSetRegex = /string-set\s*:\s*([^;!}]+)/gi;
		let sm: RegExpExecArray | null;

		while ((sm = stringSetRegex.exec(body)) !== null) {
			const declVal = sm[1]?.trim() ?? "";
			// e.g. "alphabet content(text)" or "author attr(data-author)"
			const parts = declVal.split(/\s+/);
			const identifier = parts[0]?.trim();
			const fnPart = parts.slice(1).join(" ");

			if (identifier) {
				const attrMatch = fnPart.match(/attr\(([^)]+)\)/i);
				if (attrMatch) {
					rules.push({
						identifier,
						func: "attr",
						attrName: attrMatch[1]?.trim(),
						selector,
					});
				} else {
					rules.push({
						identifier,
						func: "content",
						selector,
					});
				}
			}
		}

		// Remove string-set declarations from CSS
		body = body.replace(/string-set\s*:\s*[^;!}]+;?/gi, "");
		return `${selector} {${body}}`;
	});

	// Transform string(identifier, type?) in content: property
	transformed = transformed.replace(
		/string\(\s*([a-zA-Z0-9_-]+)(?:\s*,\s*([a-zA-Z0-9_-]+))?\s*\)/gi,
		(_, id, type) => {
			const stringType = (type || "first").toLowerCase();
			if (pagedjsCompatible) {
				return `var(--printedjs-string-${stringType}-${id}, var(--pagedjs-string-${stringType}-${id}))`;
			}
			return `var(--printedjs-string-${stringType}-${id})`;
		},
	);

	return { rules, transformedCss: transformed };
}

export function stringsPlugin(): PrintedjsPlugin {
	return {
		name: "strings",
		after: ["page-rules", "breaks"],
		setup(context: PluginContext) {
			context.metadata[STRINGS_RULES_KEY] = [];
		},
		transformStyles(css: string, context: PluginContext): string {
			const pagedjsCompatible = context.pagedjsCompatible ?? false;
			const { rules, transformedCss } = parseStringSets(css, pagedjsCompatible);
			const existing = (context.metadata[STRINGS_RULES_KEY] ?? []) as StringSetRule[];
			context.metadata[STRINGS_RULES_KEY] = [...existing, ...rules];
			return transformedCss;
		},
		afterRender(context: PluginContext) {
			const doc = context.metadata["document"] as Document | undefined;
			if (!doc) {
				return;
			}

			const rules = (context.metadata[STRINGS_RULES_KEY] ?? []) as StringSetRule[];
			if (rules.length === 0) {
				return;
			}

			const pagedjsCompatible = context.pagedjsCompatible ?? false;
			const pages = doc.querySelectorAll(".printedjs_page, .pagedjs_page");
			const lastSeenValues: Record<string, string> = {};

			pages.forEach((pageEl) => {
				const page = pageEl as HTMLElement;

				for (const rule of rules) {
					const matched = page.querySelectorAll(rule.selector);
					const prevVal = lastSeenValues[rule.identifier] ?? "";

					let firstVal = prevVal;
					let lastVal = prevVal;
					let startVal = prevVal;
					let firstExceptVal = prevVal;

					if (matched.length > 0) {
						const getVal = (el: Element): string => {
							if (rule.func === "attr" && rule.attrName) {
								return el.getAttribute(rule.attrName) ?? "";
							}
							return el.textContent?.trim() ?? "";
						};

						const firstMatch = matched[0];
						const lastMatch = matched[matched.length - 1];

						if (firstMatch) {
							firstVal = getVal(firstMatch);
						}
						if (lastMatch) {
							lastVal = getVal(lastMatch);
							lastSeenValues[rule.identifier] = lastVal;
						}

						startVal = firstVal;
						firstExceptVal = "";
					}

					const cleanForCss = (v: string) => `"${v.replace(/["\\]/g, "\\$&")}"`;

					const setStringProp = (type: string, val: string) => {
						const cssVal = cleanForCss(val);
						page.style.setProperty(
							`--printedjs-string-${type}-${rule.identifier}`,
							cssVal,
						);
						if (pagedjsCompatible) {
							page.style.setProperty(
								`--pagedjs-string-${type}-${rule.identifier}`,
								cssVal,
							);
						}
					};

					setStringProp("first", firstVal);
					setStringProp("last", lastVal);
					setStringProp("start", startVal);
					setStringProp("first-except", firstExceptVal);
				}
			});
		},
	};
}
