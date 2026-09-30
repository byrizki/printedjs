import { PrintedjsStylesheetError, type StylesheetSource } from "@printedjs/core";

export interface LoadedStylesheet {
	readonly type: "inline" | "url";
	readonly css: string;
	readonly url?: string;
}

export function unwrapPrintMedia(css: string): string {
	const regex = /@media\s+([^{]+)\{/gi;
	let match: RegExpExecArray | null;
	let lastIndex = 0;
	let result = "";

	while ((match = regex.exec(css)) !== null) {
		const matchStart = match.index;
		const prelude = match[1]?.trim().toLowerCase() ?? "";
		const openBraceIndex = regex.lastIndex - 1;

		let depth = 1;
		let i = openBraceIndex + 1;
		let inSingleQuote = false;
		let inDoubleQuote = false;
		let inComment = false;

		while (i < css.length && depth > 0) {
			const char = css[i];
			const nextChar = css[i + 1];

			if (inComment) {
				if (char === "*" && nextChar === "/") {
					inComment = false;
					i += 2;
					continue;
				}
			} else if (inSingleQuote) {
				if (char === "\\") {
					i += 2;
					continue;
				}
				if (char === "'") {
					inSingleQuote = false;
				}
			} else if (inDoubleQuote) {
				if (char === "\\") {
					i += 2;
					continue;
				}
				if (char === '"') {
					inDoubleQuote = false;
				}
			} else {
				if (char === "/" && nextChar === "*") {
					inComment = true;
					i += 2;
					continue;
				}
				if (char === "'") {
					inSingleQuote = true;
				} else if (char === '"') {
					inDoubleQuote = true;
				} else if (char === "{") {
					depth++;
				} else if (char === "}") {
					depth--;
				}
			}
			i++;
		}

		if (depth === 0) {
			const blockBody = css.slice(openBraceIndex + 1, i - 1);
			result += css.slice(lastIndex, matchStart);

			const isPrint = prelude.split(",").some((part) => part.trim().includes("print"));
			const isScreenOnly =
				!isPrint &&
				prelude.split(",").every((part) => {
					const p = part.trim();
					return p === "screen" || (p.startsWith("screen and") && !p.includes("print"));
				});

			if (isPrint) {
				result += `\n${blockBody}\n`;
			} else if (
				isScreenOnly &&
				!prelude.includes("printedjs-ignore") &&
				!prelude.includes("pagedjs-ignore")
			) {
				result += `\n/* @media ${prelude} stripped */\n`;
			} else {
				result += css.slice(matchStart, i);
			}

			lastIndex = i;
			regex.lastIndex = i;
		}
	}

	result += css.slice(lastIndex);
	return result;
}

export async function loadStylesheet(
	source: StylesheetSource,
	signal?: AbortSignal,
): Promise<LoadedStylesheet> {
	if (source.type === "inline") {
		return {
			type: "inline",
			css: unwrapPrintMedia(source.content),
		};
	}

	if (source.type === "url") {
		try {
			const response = await fetch(source.url, signal ? { signal } : undefined);
			if (!response.ok) {
				throw new PrintedjsStylesheetError(
					`Failed to fetch stylesheet from "${source.url}": HTTP ${response.status} ${response.statusText}`,
				);
			}
			const css = await response.text();
			return {
				type: "url",
				url: source.url,
				css: unwrapPrintMedia(css),
			};
		} catch (err) {
			if (err instanceof PrintedjsStylesheetError) {
				throw err;
			}
			throw new PrintedjsStylesheetError(
				`Failed to load stylesheet from "${source.url}": ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	throw new PrintedjsStylesheetError("Unknown stylesheet source type");
}

export async function loadStylesheets(
	sources?: readonly StylesheetSource[],
	signal?: AbortSignal,
): Promise<LoadedStylesheet[]> {
	if (!sources || sources.length === 0) {
		return [];
	}
	return Promise.all(sources.map((src) => loadStylesheet(src, signal)));
}
