import { createPageGuides, type PageGuides } from "./guides/page-guides.js";
import {
	createHoverInspector,
	type HoverInspector,
} from "./inspector/hover-inspector.js";
import type { TraceReport } from "./trace.js";
import type { DevtoolsOverlayOptions } from "./types.js";

export interface DevtoolsOverlay {
	readonly element: HTMLElement;
	readonly hoverInspector: HoverInspector;
	readonly pageGuides: PageGuides;
	setInspectEnabled(enabled: boolean): void;
	setGuidesEnabled(enabled: boolean): void;
	setTheme(theme: "dark" | "light" | "auto"): void;
	updateReport(report: TraceReport): void;
	destroy(): void;
}

function isTraceReport(
	arg: TraceReport | DevtoolsOverlayOptions | undefined,
): arg is TraceReport {
	return Boolean(arg && "totalDurationMs" in arg && "events" in arg);
}

export function createDevtoolsOverlay(
	container: HTMLElement,
	reportOrOptions?: TraceReport | DevtoolsOverlayOptions,
): DevtoolsOverlay {
	let report: TraceReport | undefined;
	let options: DevtoolsOverlayOptions | undefined;

	if (isTraceReport(reportOrOptions)) {
		report = reportOrOptions;
	} else if (reportOrOptions) {
		options = reportOrOptions;
		report = reportOrOptions.report;
	}

	const targetDoc =
		options?.mountTarget?.ownerDocument ?? container.ownerDocument ?? document;

	const hoverInspector = createHoverInspector(container, {
		enabled: options?.inspectEnabled ?? false,
		onInspect: (metrics) => {
			options?.onInspect?.(metrics);
			updateButtonStyles();
		},
		onSelect: (metrics, element) => {
			options?.onSelect?.(metrics, element);
			updateButtonStyles();
		},
	});

	const pageGuides = createPageGuides(container, options?.guidesEnabled ?? false);

	const overlayEl = targetDoc.createElement("div");
	overlayEl.setAttribute("data-printedjs-devtools-overlay", "true");
	overlayEl.className = "printedjs-devtools-overlay";
	overlayEl.style.position = options?.mountTarget ? "absolute" : "fixed";
	overlayEl.style.zIndex = "999999";
	overlayEl.style.boxSizing = "border-box";
	overlayEl.style.margin = "0";
	overlayEl.style.lineHeight = "normal";
	overlayEl.style.letterSpacing = "normal";
	overlayEl.style.textAlign = "left";
	overlayEl.style.whiteSpace = "nowrap";

	const placement = options?.placement ?? "bottom-center";

	if (placement === "bottom-center") {
		overlayEl.style.bottom = "24px";
		overlayEl.style.left = "50%";
		overlayEl.style.transform = "translateX(-50%)";
		overlayEl.style.right = "auto";
	} else if (placement === "bottom-above-bar") {
		overlayEl.style.bottom = "84px";
		overlayEl.style.right = "20px";
		overlayEl.style.left = "auto";
		overlayEl.style.transform = "none";
	} else if (placement === "top-center") {
		overlayEl.style.top = "64px";
		overlayEl.style.left = "50%";
		overlayEl.style.transform = "translateX(-50%)";
		overlayEl.style.right = "auto";
	} else if (placement === "top-right") {
		overlayEl.style.top = "64px";
		overlayEl.style.right = "20px";
		overlayEl.style.left = "auto";
		overlayEl.style.transform = "none";
	} else if (placement === "top-left") {
		overlayEl.style.top = "64px";
		overlayEl.style.left = "16px";
		overlayEl.style.right = "auto";
		overlayEl.style.transform = "none";
	} else if (placement === "bottom-left") {
		overlayEl.style.bottom = "16px";
		overlayEl.style.left = "16px";
		overlayEl.style.right = "auto";
		overlayEl.style.transform = "none";
	} else {
		overlayEl.style.bottom = "16px";
		overlayEl.style.right = "16px";
		overlayEl.style.left = "auto";
		overlayEl.style.transform = "none";
	}

	overlayEl.style.display = "flex";
	overlayEl.style.alignItems = "center";
	overlayEl.style.gap = "10px";
	overlayEl.style.fontFamily =
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
	overlayEl.style.fontSize = "12px";
	overlayEl.style.padding = "6px 10px";
	overlayEl.style.borderRadius = "9999px";
	overlayEl.style.backdropFilter = "blur(12px)";
	overlayEl.style.pointerEvents = "auto";
	overlayEl.style.userSelect = "none";

	let currentTheme = options?.theme ?? "auto";

	function getEffectiveTheme(): "dark" | "light" {
		if (currentTheme === "light" || currentTheme === "dark") {
			return currentTheme;
		}

		const mount = options?.mountTarget ?? container;
		const themedAncestor = mount.closest?.("[data-theme]");

		if (themedAncestor) {
			const val = themedAncestor.getAttribute("data-theme");

			if (val === "light" || val === "dark") return val;
		}

		const rootVal = targetDoc.documentElement?.getAttribute("data-theme");

		if (rootVal === "light" || rootVal === "dark") return rootVal;

		const bodyVal = targetDoc.body?.getAttribute("data-theme");

		if (bodyVal === "light" || bodyVal === "dark") return bodyVal;

		if (targetDoc.defaultView?.matchMedia?.("(prefers-color-scheme: light)")?.matches) {
			return "light";
		}

		return "dark";
	}

	const brandEl = targetDoc.createElement("div");
	brandEl.style.display = "flex";
	brandEl.style.alignItems = "center";
	brandEl.style.gap = "6px";
	brandEl.style.fontWeight = "600";
	brandEl.style.color = "#60a5fa";
	brandEl.innerHTML = `
		<span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background-color: #38bdf8; box-shadow: 0 0 6px #38bdf8;"></span>
		<span>Printedjs</span>
	`;

	const statsEl = targetDoc.createElement("div");
	statsEl.style.display = "flex";
	statsEl.style.alignItems = "center";
	statsEl.style.gap = "6px";
	statsEl.style.color = "#94a3b8";
	statsEl.style.fontSize = "11px";
	statsEl.style.fontFamily =
		"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";

	function refreshStats(): void {
		let pages = container.querySelectorAll(".printedjs_page, .pagedjs_page").length;

		if (pages === 0 && container.querySelectorAll) {
			const iframes = container.querySelectorAll("iframe");

			for (let i = 0; i < iframes.length; i++) {
				try {
					const iframeDoc = iframes[i]?.contentDocument;

					if (iframeDoc) {
						const iframePages = iframeDoc.querySelectorAll(
							".printedjs_page, .pagedjs_page",
						).length;

						if (iframePages > 0) {
							pages = iframePages;
							break;
						}
					}
				} catch {
					// Cross-origin fallback
				}
			}
		}

		const duration = report ? `${Math.round(report.totalDurationMs)}ms` : "";
		const dotColor = getEffectiveTheme() === "light" ? "#94a3b8" : "#64748b";

		statsEl.innerHTML = `
			<span>${pages}p</span>
			${duration ? `<span style="color: ${dotColor};">•</span><span>${duration}</span>` : ""}
		`;
	}

	const inspectBtn = targetDoc.createElement("button");
	inspectBtn.setAttribute("type", "button");
	inspectBtn.title =
		"Toggle Hover Bounding Box Inspector (Click element to select/pin, Esc to resume)";
	inspectBtn.style.boxSizing = "border-box";
	inspectBtn.style.margin = "0";
	inspectBtn.style.lineHeight = "1.2";
	inspectBtn.style.letterSpacing = "normal";
	inspectBtn.style.textTransform = "none";
	inspectBtn.style.outline = "none";
	inspectBtn.style.fontFamily =
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
	inspectBtn.style.webkitAppearance = "none";
	inspectBtn.style.appearance = "none";
	inspectBtn.style.padding = "3px 8px";
	inspectBtn.style.borderRadius = "9999px";
	inspectBtn.style.fontSize = "11px";
	inspectBtn.style.fontWeight = "500";
	inspectBtn.style.cursor = "pointer";
	inspectBtn.style.display = "flex";
	inspectBtn.style.alignItems = "center";
	inspectBtn.style.gap = "4px";
	inspectBtn.style.transition = "all 0.15s ease";

	const guidesBtn = targetDoc.createElement("button");
	guidesBtn.setAttribute("type", "button");
	guidesBtn.title = "Toggle CSS Paged Media Margin & Bleed Guides";
	guidesBtn.style.boxSizing = "border-box";
	guidesBtn.style.margin = "0";
	guidesBtn.style.lineHeight = "1.2";
	guidesBtn.style.letterSpacing = "normal";
	guidesBtn.style.textTransform = "none";
	guidesBtn.style.outline = "none";
	guidesBtn.style.fontFamily =
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
	guidesBtn.style.webkitAppearance = "none";
	guidesBtn.style.appearance = "none";
	guidesBtn.style.padding = "3px 8px";
	guidesBtn.style.borderRadius = "9999px";
	guidesBtn.style.fontSize = "11px";
	guidesBtn.style.fontWeight = "500";
	guidesBtn.style.cursor = "pointer";
	guidesBtn.style.display = "flex";
	guidesBtn.style.alignItems = "center";
	guidesBtn.style.gap = "4px";
	guidesBtn.style.transition = "all 0.15s ease";

	let navDivider: HTMLElement | null = null;
	let closeDivider: HTMLElement | null = null;
	let closeBtn: HTMLButtonElement | null = null;

	const actionsDivider = targetDoc.createElement("div");
	actionsDivider.style.width = "1px";
	actionsDivider.style.height = "16px";
	actionsDivider.style.margin = "0 2px";

	function updateButtonStyles(): void {
		const isLight = getEffectiveTheme() === "light";
		const isInspect = hoverInspector.isEnabled();
		const isPinned = hoverInspector.isPinned();

		if (isPinned) {
			inspectBtn.style.backgroundColor = isLight ? "#0284c7" : "rgba(56, 189, 248, 0.35)";
			inspectBtn.style.color = "#ffffff";
			inspectBtn.style.border = isLight
				? "1px solid #0284c7"
				: "1px solid rgba(56, 189, 248, 0.9)";
			inspectBtn.innerHTML = `<span>📌</span><span>Selected</span>`;
		} else if (isInspect) {
			inspectBtn.style.backgroundColor = isLight
				? "rgba(2, 132, 199, 0.12)"
				: "rgba(56, 189, 248, 0.2)";
			inspectBtn.style.color = isLight ? "#0284c7" : "#38bdf8";
			inspectBtn.style.border = isLight
				? "1px solid rgba(2, 132, 199, 0.4)"
				: "1px solid rgba(56, 189, 248, 0.6)";
			inspectBtn.innerHTML = `<span>🔍</span><span>Inspect</span>`;
		} else {
			inspectBtn.style.backgroundColor = isLight
				? "rgba(0, 0, 0, 0.05)"
				: "rgba(255, 255, 255, 0.08)";
			inspectBtn.style.color = isLight ? "#334155" : "#cbd5e1";
			inspectBtn.style.border = isLight
				? "1px solid rgba(0, 0, 0, 0.12)"
				: "1px solid rgba(255, 255, 255, 0.15)";
			inspectBtn.innerHTML = `<span>🔍</span><span>Inspect</span>`;
		}

		const isGuides = pageGuides.isEnabled();
		guidesBtn.style.backgroundColor = isGuides
			? isLight
				? "rgba(16, 185, 129, 0.12)"
				: "rgba(52, 211, 153, 0.2)"
			: isLight
				? "rgba(0, 0, 0, 0.05)"
				: "rgba(255, 255, 255, 0.08)";
		guidesBtn.style.color = isGuides
			? isLight
				? "#059669"
				: "#34d399"
			: isLight
				? "#334155"
				: "#cbd5e1";
		guidesBtn.style.border = isGuides
			? isLight
				? "1px solid rgba(16, 185, 129, 0.4)"
				: "1px solid rgba(52, 211, 153, 0.6)"
			: isLight
				? "1px solid rgba(0, 0, 0, 0.12)"
				: "1px solid rgba(255, 255, 255, 0.15)";
		guidesBtn.innerHTML = `<span>📐</span><span>Guides</span>`;
	}

	function applyTheme(): void {
		const isLight = getEffectiveTheme() === "light";
		overlayEl.setAttribute("data-theme", isLight ? "light" : "dark");

		if (isLight) {
			overlayEl.style.backgroundColor = "rgba(255, 255, 255, 0.94)";
			overlayEl.style.color = "#0f172a";
			overlayEl.style.border = "1px solid rgba(0, 0, 0, 0.12)";
			overlayEl.style.boxShadow =
				"0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05)";

			brandEl.style.color = "#0284c7";
			const brandDot = brandEl.querySelector<HTMLElement>("span");

			if (brandDot) {
				brandDot.style.backgroundColor = "#0284c7";
				brandDot.style.boxShadow = "0 0 6px rgba(2, 132, 199, 0.4)";
			}

			statsEl.style.color = "#64748b";

			if (navDivider) navDivider.style.backgroundColor = "rgba(0, 0, 0, 0.12)";
			actionsDivider.style.backgroundColor = "rgba(0, 0, 0, 0.12)";

			if (closeDivider) closeDivider.style.backgroundColor = "rgba(0, 0, 0, 0.12)";

			if (closeBtn) {
				closeBtn.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
				closeBtn.style.color = "#64748b";
				closeBtn.style.border = "1px solid rgba(0, 0, 0, 0.12)";
			}
		} else {
			overlayEl.style.backgroundColor = "rgba(15, 23, 42, 0.88)";
			overlayEl.style.color = "#f8fafc";
			overlayEl.style.border = "1px solid rgba(255, 255, 255, 0.12)";
			overlayEl.style.boxShadow =
				"0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)";

			brandEl.style.color = "#60a5fa";
			const brandDot = brandEl.querySelector<HTMLElement>("span");

			if (brandDot) {
				brandDot.style.backgroundColor = "#38bdf8";
				brandDot.style.boxShadow = "0 0 6px #38bdf8";
			}

			statsEl.style.color = "#94a3b8";

			if (navDivider) navDivider.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
			actionsDivider.style.backgroundColor = "rgba(255, 255, 255, 0.15)";

			if (closeDivider) closeDivider.style.backgroundColor = "rgba(255, 255, 255, 0.15)";

			if (closeBtn) {
				closeBtn.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
				closeBtn.style.color = "#94a3b8";
				closeBtn.style.border = "1px solid rgba(255, 255, 255, 0.15)";
			}
		}

		updateButtonStyles();
	}

	inspectBtn.addEventListener("click", () => {
		if (hoverInspector.isEnabled()) {
			if (hoverInspector.isPinned()) {
				hoverInspector.unpin();
			} else {
				hoverInspector.disable();
			}
		} else {
			hoverInspector.enable();
		}

		updateButtonStyles();
	});

	guidesBtn.addEventListener("click", () => {
		if (pageGuides.isEnabled()) {
			pageGuides.disable();
		} else {
			pageGuides.enable();
		}

		updateButtonStyles();
	});

	refreshStats();
	updateButtonStyles();

	overlayEl.appendChild(brandEl);
	overlayEl.appendChild(statsEl);

	if (options?.extraControls) {
		navDivider = targetDoc.createElement("div");
		navDivider.style.width = "1px";
		navDivider.style.height = "16px";
		navDivider.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
		navDivider.style.margin = "0 2px";
		overlayEl.appendChild(navDivider);

		const extra = options.extraControls;

		if (Array.isArray(extra)) {
			for (const ctrl of extra) {
				overlayEl.appendChild(ctrl);
			}
		} else {
			// SAFETY: non-array extraControls option is typed as HTMLElement
			overlayEl.appendChild(extra as HTMLElement);
		}
	}

	overlayEl.appendChild(actionsDivider);
	overlayEl.appendChild(inspectBtn);
	overlayEl.appendChild(guidesBtn);

	if (options?.onClose) {
		closeDivider = targetDoc.createElement("div");
		closeDivider.style.width = "1px";
		closeDivider.style.height = "16px";
		closeDivider.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
		closeDivider.style.margin = "0 2px";
		overlayEl.appendChild(closeDivider);

		closeBtn = targetDoc.createElement("button");
		closeBtn.setAttribute("type", "button");
		closeBtn.title = "Exit DevTools & return to preview toolbar";
		closeBtn.style.boxSizing = "border-box";
		closeBtn.style.margin = "0";
		closeBtn.style.padding = "3px 8px";
		closeBtn.style.borderRadius = "9999px";
		closeBtn.style.fontSize = "11px";
		closeBtn.style.fontWeight = "500";
		closeBtn.style.cursor = "pointer";
		closeBtn.style.display = "flex";
		closeBtn.style.alignItems = "center";
		closeBtn.style.gap = "4px";
		closeBtn.style.outline = "none";
		closeBtn.style.fontFamily =
			'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
		closeBtn.style.webkitAppearance = "none";
		closeBtn.style.appearance = "none";
		closeBtn.style.transition = "all 0.15s ease";
		closeBtn.innerHTML = `<span>✕</span><span>Close</span>`;
		closeBtn.addEventListener("click", () => {
			options.onClose?.();
		});
		overlayEl.appendChild(closeBtn);
	}

	refreshStats();
	applyTheme();

	let themeObserver: MutationObserver | null = null;

	if (typeof MutationObserver !== "undefined") {
		themeObserver = new MutationObserver(() => {
			applyTheme();
		});

		try {
			if (targetDoc.documentElement) {
				themeObserver.observe(targetDoc.documentElement, {
					attributes: true,
					attributeFilter: ["data-theme"],
				});
			}

			const mount = options?.mountTarget ?? container;

			if (mount && mount !== targetDoc.documentElement) {
				themeObserver.observe(mount, {
					attributes: true,
					attributeFilter: ["data-theme"],
				});
			}
		} catch {
			// MutationObserver not supported in virtual or test env
		}
	}

	const mountTarget = options?.mountTarget ?? targetDoc.body ?? container;
	mountTarget.appendChild(overlayEl);

	return {
		element: overlayEl,
		hoverInspector,
		pageGuides,
		setInspectEnabled(enabled: boolean) {
			if (enabled) {
				hoverInspector.enable();
			} else {
				hoverInspector.disable();
			}

			updateButtonStyles();
		},
		setGuidesEnabled(enabled: boolean) {
			if (enabled) {
				pageGuides.enable();
			} else {
				pageGuides.disable();
			}

			updateButtonStyles();
		},
		updateReport(newReport: TraceReport) {
			report = newReport;
			refreshStats();
		},
		setTheme(theme: "dark" | "light" | "auto") {
			currentTheme = theme;
			applyTheme();
		},
		destroy() {
			hoverInspector.destroy();
			pageGuides.destroy();

			if (themeObserver) {
				themeObserver.disconnect();
				themeObserver = null;
			}

			if (overlayEl.parentNode) {
				overlayEl.parentNode.removeChild(overlayEl);
			}
		},
	};
}
