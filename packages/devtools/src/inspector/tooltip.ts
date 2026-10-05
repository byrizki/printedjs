import type { ElementPrintMetrics } from "../types.js";

export interface InspectorTooltip {
	readonly element: HTMLElement;
	show(
		metrics: ElementPrintMetrics,
		targetElement: HTMLElement,
		isPinned?: boolean,
	): void;
	hide(): void;
	destroy(): void;
}

function getIsLightTheme(doc: Document): boolean {
	const rootTheme = doc.documentElement?.getAttribute("data-theme");

	if (rootTheme === "light" || rootTheme === "dark") return rootTheme === "light";

	const bodyTheme = doc.body?.getAttribute("data-theme");

	if (bodyTheme === "light" || bodyTheme === "dark") return bodyTheme === "light";

	return Boolean(doc.defaultView?.matchMedia?.("(prefers-color-scheme: light)")?.matches);
}

export function createInspectorTooltip(targetDoc: Document): InspectorTooltip {
	const tooltip = targetDoc.createElement("div");
	tooltip.setAttribute("data-printedjs-devtools-tooltip", "true");
	tooltip.style.position = "absolute";
	tooltip.style.pointerEvents = "none";
	tooltip.style.zIndex = "999995";
	tooltip.style.display = "none";
	tooltip.style.boxSizing = "border-box";
	tooltip.style.margin = "0";
	tooltip.style.letterSpacing = "normal";
	tooltip.style.textAlign = "left";
	tooltip.style.transform = "none";
	tooltip.style.textTransform = "none";
	tooltip.style.backgroundColor = "rgba(15, 23, 42, 0.94)";
	tooltip.style.color = "#f8fafc";
	tooltip.style.fontFamily =
		'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
	tooltip.style.fontSize = "11px";
	tooltip.style.lineHeight = "1.4";
	tooltip.style.padding = "8px 10px";
	tooltip.style.borderRadius = "6px";
	tooltip.style.boxShadow =
		"0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)";
	tooltip.style.border = "1px solid rgba(255, 255, 255, 0.12)";
	tooltip.style.maxWidth = "360px";
	tooltip.style.whiteSpace = "nowrap";

	const mountTarget = targetDoc.body ?? targetDoc.documentElement;
	mountTarget.appendChild(tooltip);

	return {
		element: tooltip,
		show(metrics: ElementPrintMetrics, targetElement: HTMLElement, isPinned?: boolean) {
			const doc = targetElement.ownerDocument ?? targetDoc;

			if (tooltip.ownerDocument !== doc) {
				try {
					doc.adoptNode(tooltip);
				} catch {
					// Fallback if adoptNode unsupported
				}
			}

			const mount = doc.body ?? doc.documentElement;

			if (tooltip.parentNode !== mount) {
				mount.appendChild(tooltip);
			}

			const isLight = getIsLightTheme(doc);
			tooltip.setAttribute("data-theme", isLight ? "light" : "dark");

			if (isLight) {
				tooltip.style.backgroundColor = "rgba(255, 255, 255, 0.96)";
				tooltip.style.color = "#0f172a";
				tooltip.style.border = "1px solid rgba(0, 0, 0, 0.12)";
				tooltip.style.boxShadow =
					"0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 4px 6px -4px rgba(0, 0, 0, 0.08)";
			} else {
				tooltip.style.backgroundColor = "rgba(15, 23, 42, 0.94)";
				tooltip.style.color = "#f8fafc";
				tooltip.style.border = "1px solid rgba(255, 255, 255, 0.12)";
				tooltip.style.boxShadow =
					"0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)";
			}

			const chips: string[] = [];

			if (isPinned) {
				chips.push(
					isLight
						? '<span style="background: rgba(2, 132, 199, 0.12); color: #0284c7; border: 1px solid rgba(2, 132, 199, 0.4); padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: 600;">Selected (Esc)</span>'
						: '<span style="background: rgba(56, 189, 248, 0.25); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.6); padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: 600;">Selected (Esc)</span>',
				);
			}

			if (metrics.breakRules.hasAvoidBreak) {
				chips.push(
					isLight
						? '<span style="background: rgba(245, 158, 11, 0.15); color: #b45309; border: 1px solid rgba(245, 158, 11, 0.4); padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: 600;">avoid-break</span>'
						: '<span style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: 600;">avoid-break</span>',
				);
			}

			if (metrics.breakRules.isSplitTo) {
				chips.push(
					isLight
						? '<span style="background: rgba(244, 63, 94, 0.15); color: #e11d48; border: 1px solid rgba(244, 63, 94, 0.4); padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: 600;">splits ➔</span>'
						: '<span style="background: rgba(244, 63, 94, 0.2); color: #fda4af; border: 1px solid rgba(244, 63, 94, 0.4); padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: 600;">splits ➔</span>',
				);
			}

			if (metrics.breakRules.isSplitFrom) {
				chips.push(
					isLight
						? '<span style="background: rgba(168, 85, 247, 0.15); color: #7e22ce; border: 1px solid rgba(168, 85, 247, 0.4); padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: 600;">➔ continued</span>'
						: '<span style="background: rgba(168, 85, 247, 0.2); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.4); padding: 1px 5px; border-radius: 3px; font-size: 10px; font-weight: 600;">➔ continued</span>',
				);
			}

			const chipsHtml =
				chips.length > 0
					? `<div style="margin-top: 4px; display: flex; gap: 4px;">${chips.join("")}</div>`
					: "";

			const primaryColor = isLight ? "#0284c7" : "#60a5fa";
			const secondaryColor = isLight ? "#334155" : "#cbd5e1";
			const mutedColor = isLight ? "#64748b" : "#94a3b8";
			const accentColor = isLight ? "#0284c7" : "#38bdf8";
			const badgeBg = isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.1)";

			const clearanceColor =
				metrics.remainingSpacePx < 20
					? isLight
						? "#dc2626"
						: "#f87171"
					: isLight
						? "#059669"
						: "#34d399";

			tooltip.innerHTML = `
				<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 4px;">
					<span style="font-weight: bold; color: ${primaryColor};">${metrics.selector}</span>
					<span style="background: ${badgeBg}; color: ${mutedColor}; padding: 1px 5px; border-radius: 3px; font-size: 10px;">Page ${metrics.pageNumber}/${metrics.totalPages}</span>
				</div>
				<div style="color: ${secondaryColor}; font-size: 11px;">
					<span style="color: ${accentColor};">${metrics.boxModel.clientRect.width} × ${metrics.boxModel.clientRect.height} px</span>
					<span style="color: ${mutedColor}; margin: 0 4px;">•</span>
					<span style="color: ${mutedColor};">${metrics.boxModel.content.widthMm} × ${metrics.boxModel.content.heightMm} mm</span>
				</div>
				<div style="color: ${mutedColor}; font-size: 10px; margin-top: 3px;">
					Clearance: <strong style="color: ${clearanceColor};">${metrics.remainingSpacePx}px (${metrics.remainingSpaceMm}mm)</strong>
				</div>
				${chipsHtml}
			`;

			tooltip.style.display = "block";

			const win = targetDoc.defaultView ?? window;
			const scrollX = win.scrollX ?? win.pageXOffset ?? 0;
			const scrollY = win.scrollY ?? win.pageYOffset ?? 0;

			const viewportWidth =
				win.innerWidth || targetDoc.documentElement.clientWidth || 800;

			const rect = targetElement.getBoundingClientRect();
			const tooltipRect = tooltip.getBoundingClientRect();

			let top = rect.top + scrollY - tooltipRect.height - 8;

			if (top < scrollY + 8) {
				top = rect.bottom + scrollY + 8;
			}

			let left = rect.left + scrollX;

			if (left + tooltipRect.width > scrollX + viewportWidth - 8) {
				left = Math.max(scrollX + 8, scrollX + viewportWidth - tooltipRect.width - 8);
			}

			tooltip.style.top = `${Math.round(top)}px`;
			tooltip.style.left = `${Math.round(left)}px`;
		},
		hide() {
			tooltip.style.display = "none";
		},
		destroy() {
			if (tooltip.parentNode) {
				tooltip.parentNode.removeChild(tooltip);
			}
		},
	};
}
