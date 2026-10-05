export interface BreakStyleRule {
	readonly selector: string;
	readonly breakBefore?: string;
	readonly breakAfter?: string;
	readonly breakInside?: string;
	readonly isFixed?: boolean;
	readonly page?: string;
}

interface MutableBreakStyleRule {
	selector: string;
	breakBefore?: string;
	breakAfter?: string;
	breakInside?: string;
	isFixed?: boolean;
	page?: string;
}

export function parseBreakStyles(css: string): BreakStyleRule[] {
	const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, "");
	const rules: BreakStyleRule[] = [];

	// Match top-level blocks or rules inside media queries
	const ruleRegex = /([^{}@]+)\{([^{}]+)\}/g;
	let match: RegExpExecArray | null;

	while ((match = ruleRegex.exec(cleanCss)) !== null) {
		const rawSelector = match[1]?.trim();
		const body = match[2]?.trim();

		if (!rawSelector || !body) {
			continue;
		}

		// Skip @page or other at-rules
		if (rawSelector.startsWith("@")) {
			continue;
		}

		let breakBefore: string | undefined;
		let breakAfter: string | undefined;
		let breakInside: string | undefined;
		let isFixed: boolean | undefined;
		let page: string | undefined;

		const declRegex =
			/(break-before|page-break-before|break-after|page-break-after|break-inside|page-break-inside|position|page)\s*:\s*([^;!]+)/gi;

		let declMatch: RegExpExecArray | null;

		while ((declMatch = declRegex.exec(body)) !== null) {
			const prop = declMatch[1]?.toLowerCase().trim();
			const val = declMatch[2]?.toLowerCase().trim();

			if (!prop || !val) {
				continue;
			}

			if (prop === "break-before" || prop === "page-break-before") {
				breakBefore = val === "always" ? "page" : val;
			} else if (prop === "break-after" || prop === "page-break-after") {
				breakAfter = val === "always" ? "page" : val;
			} else if (prop === "break-inside" || prop === "page-break-inside") {
				breakInside = val;
			} else if (prop === "position" && val === "fixed") {
				isFixed = true;
			} else if (prop === "page") {
				const cleaned = val.replace(/['"]/g, "").trim();

				if (cleaned) {
					page = cleaned;
				}
			}
		}

		if (breakBefore || breakAfter || breakInside || isFixed || page) {
			const ruleItem: MutableBreakStyleRule = { selector: rawSelector };

			if (breakBefore) {
				ruleItem.breakBefore = breakBefore;
			}

			if (breakAfter) {
				ruleItem.breakAfter = breakAfter;
			}

			if (breakInside) {
				ruleItem.breakInside = breakInside;
			}

			if (isFixed) {
				ruleItem.isFixed = true;
			}

			if (page) {
				ruleItem.page = page;
			}

			rules.push(ruleItem);
		}
	}

	return rules;
}
