import { createBoxModelOverlay, type BoxModelOverlay } from "./box-model-overlay.js";
import { extractPrintMetrics } from "./print-metrics.js";
import { createInspectorTooltip, type InspectorTooltip } from "./tooltip.js";
import type { ElementPrintMetrics } from "../types.js";

export interface HoverInspectorOptions {
	readonly enabled?: boolean | undefined;
	readonly onInspect?: ((metrics: ElementPrintMetrics | null) => void) | undefined;
	readonly onSelect?:
		| ((metrics: ElementPrintMetrics | null, element: HTMLElement | null) => void)
		| undefined;
}

export interface HoverInspector {
	enable(): void;
	disable(): void;
	isEnabled(): boolean;
	isPinned(): boolean;
	unpin(): void;
	select(element: HTMLElement | null): void;
	destroy(): void;
}

function isHtmlElement(node: EventTarget | Node | null | undefined): node is HTMLElement {
	// SAFETY: DOM nodes have numeric nodeType property where 1 represents Element
	const candidate = node as Node | null | undefined;

	return Boolean(candidate && candidate.nodeType === 1 && "style" in candidate);
}

export function createHoverInspector(
	container: HTMLElement,
	options?: HoverInspectorOptions,
): HoverInspector {
	let enabled = options?.enabled ?? false;
	let currentTarget: HTMLElement | null = null;
	let isPinned = false;
	let pinnedTarget: HTMLElement | null = null;
	let rafId: number | null = null;
	let observer: MutationObserver | null = null;

	const targetDoc = container.ownerDocument ?? document;
	const overlay: BoxModelOverlay = createBoxModelOverlay(targetDoc);
	const tooltip: InspectorTooltip = createInspectorTooltip(targetDoc);

	function updateInspection(element: HTMLElement | null, pinnedState = isPinned): void {
		if (!element || !enabled) {
			if (currentTarget) {
				currentTarget = null;
				overlay.hide();
				tooltip.hide();
				options?.onInspect?.(null);
			}

			return;
		}

		const metrics = extractPrintMetrics(element);

		if (!metrics) {
			if (currentTarget) {
				currentTarget = null;
				overlay.hide();
				tooltip.hide();
				options?.onInspect?.(null);
			}

			return;
		}

		currentTarget = element;
		overlay.update(metrics, element, pinnedState);
		tooltip.show(metrics, element, pinnedState);
		options?.onInspect?.(metrics);

		if (pinnedState) {
			options?.onSelect?.(metrics, element);
		}
	}

	function unpin(): void {
		isPinned = false;
		pinnedTarget = null;

		if (currentTarget) {
			const metrics = extractPrintMetrics(currentTarget);

			if (metrics) {
				overlay.update(metrics, currentTarget, false);
				tooltip.show(metrics, currentTarget, false);
			}
		}
	}

	function onClick(event: MouseEvent): void {
		if (!enabled) {
			return;
		}

		const rawTarget = event.target;
		const target = isHtmlElement(rawTarget) ? rawTarget : null;

		if (!target) {
			return;
		}

		// Don't intercept clicks on devtools HUD or its buttons
		if (
			target.hasAttribute("data-printedjs-devtools-overlay") ||
			target.closest("[data-printedjs-devtools-overlay]")
		) {
			return;
		}

		// Must be inside a page
		if (!target.closest(".printedjs_page, .pagedjs_page")) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();

		if (isPinned && pinnedTarget === target) {
			unpin();

			return;
		}

		isPinned = true;
		pinnedTarget = target;
		updateInspection(target, true);
	}

	function onKeyDown(event: KeyboardEvent): void {
		if (event.key === "Escape" && enabled && isPinned) {
			event.preventDefault();
			event.stopPropagation();
			unpin();
		}
	}

	function onPointerMove(event: PointerEvent): void {
		if (!enabled || isPinned) {
			return;
		}

		if (rafId !== null) {
			cancelAnimationFrame(rafId);
		}

		rafId = requestAnimationFrame(() => {
			rafId = null;
			const rawTarget = event.target;
			const target = isHtmlElement(rawTarget) ? rawTarget : null;

			if (!target) {
				updateInspection(null);

				return;
			}

			// Don't inspect HUD or guides
			if (
				target.hasAttribute("data-printedjs-devtools-overlay") ||
				target.hasAttribute("data-printedjs-devtools-highlight") ||
				target.hasAttribute("data-printedjs-devtools-tooltip") ||
				target.closest("[data-printedjs-devtools-overlay]")
			) {
				return;
			}

			// Must be inside a page
			if (!target.closest(".printedjs_page, .pagedjs_page")) {
				updateInspection(null);

				return;
			}

			updateInspection(target, false);
		});
	}

	function onPointerLeave(): void {
		if (isPinned) {
			return;
		}

		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}

		updateInspection(null);
	}

	function onScroll(): void {
		if (enabled && currentTarget) {
			const metrics = extractPrintMetrics(currentTarget);

			if (metrics) {
				overlay.update(metrics, currentTarget, isPinned);
				tooltip.show(metrics, currentTarget, isPinned);
			}
		}
	}

	// SAFETY: pointermove event delivers PointerEvent matching onPointerMove signature
	const pointerMoveListener = (e: Event): void => onPointerMove(e as PointerEvent);

	// SAFETY: click event delivers MouseEvent matching onClick signature
	const clickListener = (e: Event): void => onClick(e as MouseEvent);

	// SAFETY: keydown event delivers KeyboardEvent matching onKeyDown signature
	const keyDownListener = (e: Event): void => onKeyDown(e as KeyboardEvent);

	function bindIframe(iframe: HTMLIFrameElement): void {
		try {
			const iframeDoc = iframe.contentDocument;

			if (
				iframeDoc?.documentElement &&
				!iframeDoc.documentElement.hasAttribute("data-printedjs-devtools-inspected")
			) {
				iframeDoc.documentElement.setAttribute(
					"data-printedjs-devtools-inspected",
					"true",
				);
				iframeDoc.addEventListener("pointermove", pointerMoveListener, {
					passive: true,
				});
				iframeDoc.addEventListener("pointerleave", onPointerLeave, { passive: true });
				iframeDoc.addEventListener("click", clickListener, { capture: true });
				iframeDoc.addEventListener("keydown", keyDownListener);
			}
		} catch {
			// Cross-origin iframe fallback
		}
	}

	function bindIframeTargets(): void {
		if (container.tagName?.toLowerCase() === "iframe") {
			// SAFETY: tagName iframe check guarantees container is HTMLIFrameElement
			bindIframe(container as HTMLIFrameElement);
		}

		if (container.querySelectorAll) {
			const iframes = container.querySelectorAll("iframe");

			for (let i = 0; i < iframes.length; i++) {
				const iframe = iframes[i];

				if (iframe) {
					bindIframe(iframe);

					if (!iframe.hasAttribute("data-printedjs-inspector-bound")) {
						iframe.setAttribute("data-printedjs-inspector-bound", "true");
						iframe.addEventListener("load", () => {
							bindIframe(iframe);
						});
					}
				}
			}
		}
	}

	if (typeof MutationObserver !== "undefined") {
		observer = new MutationObserver(() => {
			bindIframeTargets();
		});

		try {
			observer.observe(container, { childList: true, subtree: true });
		} catch {
			// Ignore if container is not observable
		}
	}

	container.addEventListener("pointermove", pointerMoveListener, {
		passive: true,
	});
	container.addEventListener("pointerleave", onPointerLeave, { passive: true });
	container.addEventListener("click", clickListener, { capture: true });

	const win = targetDoc.defaultView ?? window;
	win.addEventListener("keydown", keyDownListener);
	win.addEventListener("scroll", onScroll, { passive: true });

	bindIframeTargets();

	return {
		enable() {
			enabled = true;
			bindIframeTargets();
		},
		disable() {
			enabled = false;
			unpin();
			updateInspection(null);
		},
		isEnabled() {
			return enabled;
		},
		isPinned() {
			return isPinned;
		},
		unpin() {
			unpin();
		},
		select(element: HTMLElement | null) {
			if (!element) {
				unpin();
				updateInspection(null);

				return;
			}

			isPinned = true;
			pinnedTarget = element;
			updateInspection(element, true);
		},
		destroy() {
			enabled = false;
			unpin();

			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}

			if (observer) {
				observer.disconnect();
				observer = null;
			}

			container.removeEventListener("pointermove", pointerMoveListener);
			container.removeEventListener("pointerleave", onPointerLeave);
			container.removeEventListener("click", clickListener, { capture: true });
			win.removeEventListener("keydown", keyDownListener);
			win.removeEventListener("scroll", onScroll);

			if (container.querySelectorAll) {
				const iframes = container.querySelectorAll("iframe");

				for (let i = 0; i < iframes.length; i++) {
					try {
						const iframeDoc = iframes[i]?.contentDocument;

						if (iframeDoc) {
							iframeDoc.documentElement?.removeAttribute(
								"data-printedjs-devtools-inspected",
							);
							iframeDoc.removeEventListener("pointermove", pointerMoveListener);
							iframeDoc.removeEventListener("pointerleave", onPointerLeave);
							iframeDoc.removeEventListener("click", clickListener, {
								capture: true,
							});
							iframeDoc.removeEventListener("keydown", keyDownListener);
						}
					} catch {
						// Cross-origin fallback
					}
				}
			}

			overlay.destroy();
			tooltip.destroy();
			currentTarget = null;
		},
	};
}
