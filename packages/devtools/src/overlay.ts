import type { TraceReport } from "./trace.js";

export interface DevtoolsOverlay {
	readonly element: HTMLElement;
	destroy(): void;
}

export function createDevtoolsOverlay(
	container: HTMLElement,
	report?: TraceReport,
): DevtoolsOverlay {
	const overlayEl = document.createElement("div");
	overlayEl.setAttribute("data-printedjs-devtools-overlay", "true");
	overlayEl.style.position = "fixed";
	overlayEl.style.bottom = "16px";
	overlayEl.style.right = "16px";
	overlayEl.style.zIndex = "999999";
	overlayEl.style.backgroundColor = "rgba(20, 24, 39, 0.9)";
	overlayEl.style.color = "#f3f4f6";
	overlayEl.style.fontFamily = "monospace";
	overlayEl.style.fontSize = "12px";
	overlayEl.style.padding = "8px 12px";
	overlayEl.style.borderRadius = "6px";
	overlayEl.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.3)";
	overlayEl.style.pointerEvents = "auto";

	const pages = container.querySelectorAll(".pagedjs_page").length;
	const duration = report ? `${Math.round(report.totalDurationMs)}ms` : "N/A";

	overlayEl.innerHTML = `
		<div style="font-weight: bold; margin-bottom: 4px; color: #60a5fa;">Printedjs Devtools</div>
		<div>Pages: <span>${pages}</span></div>
		<div>Render time: <span>${duration}</span></div>
	`;

	container.appendChild(overlayEl);

	return {
		element: overlayEl,
		destroy() {
			if (overlayEl.parentNode) {
				overlayEl.parentNode.removeChild(overlayEl);
			}
		},
	};
}
