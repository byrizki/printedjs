function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanTextSnippet(text: string | null | undefined): string | null {
	if (!text) {
		return null;
	}

	const cleaned = text.replace(/\s+/g, " ").trim();

	if (cleaned.length < 3) {
		return null;
	}

	return cleaned.slice(0, 40);
}

/**
 * Injects `data-source-line="N"` attributes into HTML opening tags in the template
 * while carefully preserving template code blocks (<% ... %>) and styles/scripts.
 */
export function injectSourceLineNumbers(templateContent: string): string {
	if (!templateContent) {
		return templateContent;
	}

	const lines = templateContent.split("\n");
	let inTemplateBlock = false;
	let inStyleOrScript = false;

	const processedLines = lines.map((line, idx) => {
		const lineNumber = idx + 1;
		let result = "";
		let i = 0;

		while (i < line.length) {
			// Check if we enter or exit a template block: <% ... %>
			if (!inTemplateBlock && line.startsWith("<%", i)) {
				inTemplateBlock = true;
				result += "<%";
				i += 2;

				continue;
			}

			if (inTemplateBlock) {
				if (line.startsWith("%>", i)) {
					inTemplateBlock = false;
					result += "%>";
					i += 2;
				} else {
					result += line[i];
					i++;
				}

				continue;
			}

			// Check for <style> or <script> tags
			const lowerRest = line.slice(i).toLowerCase();

			if (
				!inStyleOrScript &&
				(lowerRest.startsWith("<style") || lowerRest.startsWith("<script"))
			) {
				inStyleOrScript = true;
			} else if (
				inStyleOrScript &&
				(lowerRest.startsWith("</style>") || lowerRest.startsWith("</script>"))
			) {
				inStyleOrScript = false;
			}

			if (inStyleOrScript) {
				result += line[i];
				i++;

				continue;
			}

			// Look for HTML opening tag: <tag
			// Must start with < followed by a letter (not </, <!, <%, <?)
			if (line[i] === "<" && i + 1 < line.length && /[a-zA-Z]/.test(line[i + 1]!)) {
				const tagMatch = line.slice(i).match(/^<([a-zA-Z][a-zA-Z0-9-]*)/);

				if (tagMatch) {
					const tagName = tagMatch[1]!;
					const lowerTag = tagName.toLowerCase();

					// Skip non-body tags like style, script, html, head
					if (
						lowerTag !== "style" &&
						lowerTag !== "script" &&
						lowerTag !== "html" &&
						lowerTag !== "head"
					) {
						// Check if line already has data-source-line or data-line
						const restOfTag = line.slice(i + tagMatch[0]!.length);

						if (
							!restOfTag.includes("data-source-line") &&
							!restOfTag.includes("data-line")
						) {
							result += `<${tagName} data-source-line="${lineNumber}"`;
							i += tagMatch[0]!.length;

							continue;
						}
					}
				}
			}

			result += line[i];
			i++;
		}

		return result;
	});

	return processedLines.join("\n");
}

function findMarginBoxAtRule(
	element: HTMLElement,
	templateContent: string,
): number | null {
	if (!element.closest) {
		return null;
	}

	const marginHolder = element.closest<HTMLElement>(
		"[class*='margin-'], .printedjs_margin-content, .pagedjs_margin-content",
	);

	if (!marginHolder) {
		return null;
	}

	const classes: string[] = [];
	let curr: HTMLElement | null = element;

	while (
		curr &&
		!curr.classList.contains("printedjs_page") &&
		!curr.classList.contains("pagedjs_page")
	) {
		for (const c of Array.from(curr.classList)) {
			classes.push(c);
		}

		curr = curr.parentElement;
	}

	const marginRegex =
		/(?:printedjs|pagedjs)?_?margin-((?:top|bottom|left|right)(?:-(?:left|center|right|middle|top|bottom))?(?:-corner)?)/i;

	const marginClass = classes.find((c) => marginRegex.test(c));

	if (!marginClass) {
		return null;
	}

	const match = marginClass.match(marginRegex);
	const boxName = match?.[1]?.replace(/-holder$/, "");

	if (!boxName) {
		return null;
	}

	const atRule = `@${boxName}`;
	const lines = templateContent.split("\n");

	for (let i = 0; i < lines.length; i++) {
		if (lines[i]!.includes(atRule)) {
			return i + 1;
		}
	}

	for (let i = 0; i < lines.length; i++) {
		if (lines[i]!.includes("@page")) {
			return i + 1;
		}
	}

	return null;
}

export function findSourceLine(
	templateContent: string,
	element: HTMLElement,
	maxDepth = 3,
): number | null {
	if (!templateContent || !element) {
		return null;
	}

	const lines = templateContent.split("\n");

	// Strategy 0: CSS Paged Media Margin Box rule detection (@top-left, @bottom-left, etc.)
	const marginLine = findMarginBoxAtRule(element, templateContent);

	if (marginLine !== null) {
		return marginLine;
	}

	// Strategy 1: Explicit data-line attribute or data-source-line attribute
	const explicitLine =
		element.getAttribute("data-line") ?? element.getAttribute("data-source-line");

	if (explicitLine) {
		const parsed = parseInt(explicitLine, 10);

		if (Number.isFinite(parsed) && parsed > 0 && parsed <= lines.length) {
			return parsed;
		}
	}

	// Strategy 2: Match by element ID
	if (element.id) {
		const idRegex = new RegExp(`id\\s*=\\s*["']${escapeRegex(element.id)}["']`, "i");

		for (let i = 0; i < lines.length; i++) {
			if (idRegex.test(lines[i]!)) {
				return i + 1;
			}
		}
	}

	const tag = element.tagName.toLowerCase();

	const validClasses = Array.from(element.classList).filter(
		(cls) => !cls.startsWith("printedjs") && !cls.startsWith("pagedjs"),
	);

	let textSnippet = cleanTextSnippet(element.textContent);

	if (!textSnippet && typeof window !== "undefined") {
		const win = element.ownerDocument?.defaultView ?? window;

		try {
			const afterContent = win.getComputedStyle(element, "::after").content;

			if (afterContent && afterContent !== "none" && afterContent !== "normal") {
				textSnippet = cleanTextSnippet(afterContent.replace(/^["']|["']$/g, ""));
			}
		} catch {
			// Ignore if getComputedStyle fails in mock/jsdom environments
		}
	}

	const textSnippetInTemplate = Boolean(
		textSnippet && templateContent.includes(textSnippet),
	);

	// Strategy 3: Match by tag + class
	if (validClasses.length > 0) {
		const classPattern = validClasses.map(escapeRegex).join(".*");

		const tagClassRegex = new RegExp(
			`<${tag}[^>]*class\\s*=\\s*["'][^"']*\\b${classPattern}\\b`,
			"i",
		);

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]!;

			if (tagClassRegex.test(line)) {
				return i + 1;
			}
		}

		// Fallback to any matching class on any tag
		for (const cls of validClasses) {
			const clsRegex = new RegExp(
				`class\\s*=\\s*["'][^"']*\\b${escapeRegex(cls)}\\b`,
				"i",
			);

			for (let i = 0; i < lines.length; i++) {
				if (clsRegex.test(lines[i]!)) {
					return i + 1;
				}
			}
		}
	}

	// Strategy 4: Match by static text snippet if it exists in the template
	if (textSnippetInTemplate && textSnippet && textSnippet.length >= 4) {
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i]!;

			if (line.includes(textSnippet)) {
				return i + 1;
			}
		}
	}

	// Strategy 5: Match by opening tag + attributes or template interpolation markers
	const tagOpenRegex = new RegExp(`<${tag}[\\s>]`, "i");

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;

		if (tagOpenRegex.test(line)) {
			if (textSnippetInTemplate && textSnippet) {
				if (lines.slice(i, i + 3).some((l) => l.includes(textSnippet))) {
					return i + 1;
				}
			} else if (!textSnippetInTemplate && textSnippet) {
				// Text is dynamic (rendered from template variable)
				// Check if this tag has template interpolation or matching attributes
				if (line.includes("<%") || line.includes("style=") || line.includes("{{")) {
					return i + 1;
				}
			}
		}
	}

	// Strategy 6: Parent-scoped search (use parent line to find the child tag within parent's block)
	if (
		maxDepth > 0 &&
		element.parentElement &&
		!element.parentElement.classList.contains("printedjs_pages") &&
		!element.parentElement.classList.contains("pagedjs_pages")
	) {
		const parentLine = findSourceLine(
			templateContent,
			element.parentElement,
			maxDepth - 1,
		);

		if (parentLine !== null) {
			const startIdx = Math.max(0, parentLine - 1);
			const endIdx = Math.min(lines.length, startIdx + 30);

			for (let i = startIdx; i < endIdx; i++) {
				const line = lines[i]!;

				if (tagOpenRegex.test(line)) {
					return i + 1;
				}
			}

			return parentLine;
		}
	}

	return null;
}
