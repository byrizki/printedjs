/**
 * A section is a run of consecutive pages sharing one numbering sequence.
 * A new section starts at an explicit page counter reset and, unless disabled,
 * when the named page changes.
 */
export function groupPagesIntoSections<T extends Pick<HTMLElement, "getAttribute">>(
	pages: readonly T[],
	splitOnNameChange = true,
): T[][] {
	const sections: T[][] = [];
	let currentName: string | null = null;

	for (const page of pages) {
		const name = page.getAttribute("data-page") || "default";
		const startsSection = page.getAttribute("data-counter-reset") !== null;
		const nameChanged = splitOnNameChange && name !== currentName;

		if (sections.length === 0 || startsSection || nameChanged) {
			sections.push([]);
		}

		currentName = name;
		sections[sections.length - 1]?.push(page);
	}

	return sections;
}

/**
 * Overrides the `pages` counter in a `counter-reset` value so that
 * `counter(pages)` reflects the page total of the current section.
 */
export function withPagesCounterReset(
	existing: string | undefined,
	count: number,
): string {
	const kept = (existing ?? "")
		.replace(/\bpages\s+-?\d+/gi, "")
		.replace(/\bnone\b/gi, "")
		.trim();

	return `${kept} pages ${count}`.trim();
}
