export interface VirtualizeOptions {
	/**
	 * Margin around viewport in pixels to pre-mount pages before they scroll into view.
	 * Default: 400px.
	 */
	readonly rootMargin?: string | undefined;
}

export interface Virtualizer {
	destroy(): void;
}

/**
 * Attaches an IntersectionObserver to a pages container to virtualize offscreen
 * page content. Preserves exact page shell dimensions so document scroll height
 * remains stable.
 */
export function virtualizePages(
	container: HTMLElement,
	options?: VirtualizeOptions,
): Virtualizer {
	if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
		return { destroy: () => {} };
	}

	const pages = container.querySelectorAll<HTMLElement>(".printedjs_page, .pagedjs_page");
	const hiddenContents = new WeakMap<HTMLElement, DocumentFragment>();

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				const page = entry.target as HTMLElement;
				const sheet = page.querySelector<HTMLElement>(".printedjs_sheet, .pagedjs_sheet");

				if (entry.isIntersecting) {
					// Restore page content
					const saved = hiddenContents.get(page);
					if (saved) {
						page.appendChild(saved);
						hiddenContents.delete(page);
					}
				} else {
					// Unmount offscreen page content if not already hidden
					if (sheet && !hiddenContents.has(page)) {
						const fragment = document.createDocumentFragment();
						while (page.firstChild) {
							fragment.appendChild(page.firstChild);
						}
						hiddenContents.set(page, fragment);
					}
				}
			});
		},
		{
			root: null,
			rootMargin: options?.rootMargin ?? "400px 0px 400px 0px",
		},
	);

	pages.forEach((page) => observer.observe(page));

	return {
		destroy() {
			observer.disconnect();
			pages.forEach((page) => {
				const saved = hiddenContents.get(page);
				if (saved) {
					page.appendChild(saved);
					hiddenContents.delete(page);
				}
			});
		},
	};
}
