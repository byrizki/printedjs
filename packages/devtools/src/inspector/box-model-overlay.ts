import type { ElementPrintMetrics } from "../types.js";

export interface BoxModelOverlay {
	readonly element: HTMLElement;
	update(
		metrics: ElementPrintMetrics,
		targetElement: HTMLElement,
		isPinned?: boolean,
	): void;
	hide(): void;
	destroy(): void;
}

export function createBoxModelOverlay(targetDoc: Document): BoxModelOverlay {
	const overlay = targetDoc.createElement("div");
	overlay.setAttribute("data-printedjs-devtools-highlight", "true");
	overlay.style.position = "absolute";
	overlay.style.pointerEvents = "none";
	overlay.style.zIndex = "999990";
	overlay.style.display = "none";
	overlay.style.boxSizing = "border-box";
	overlay.style.margin = "0";
	overlay.style.padding = "0";
	overlay.style.border = "none";
	overlay.style.transform = "none";

	const marginBox = targetDoc.createElement("div");
	marginBox.style.position = "absolute";
	marginBox.style.pointerEvents = "none";
	marginBox.style.backgroundColor = "rgba(249, 115, 22, 0.18)";
	marginBox.style.border = "1px dashed rgba(249, 115, 22, 0.7)";
	marginBox.style.boxSizing = "border-box";
	marginBox.style.margin = "0";
	marginBox.style.padding = "0";
	marginBox.style.borderRadius = "0";
	marginBox.style.transform = "none";

	const borderBox = targetDoc.createElement("div");
	borderBox.style.position = "absolute";
	borderBox.style.pointerEvents = "none";
	borderBox.style.backgroundColor = "rgba(234, 179, 8, 0.25)";
	borderBox.style.border = "1px solid rgba(234, 179, 8, 0.8)";
	borderBox.style.boxSizing = "border-box";
	borderBox.style.margin = "0";
	borderBox.style.padding = "0";
	borderBox.style.borderRadius = "0";
	borderBox.style.transform = "none";
	borderBox.style.transition = "outline 0.15s ease";

	const paddingBox = targetDoc.createElement("div");
	paddingBox.style.position = "absolute";
	paddingBox.style.pointerEvents = "none";
	paddingBox.style.backgroundColor = "rgba(34, 197, 94, 0.25)";
	paddingBox.style.boxSizing = "border-box";
	paddingBox.style.margin = "0";
	paddingBox.style.padding = "0";
	paddingBox.style.borderRadius = "0";
	paddingBox.style.transform = "none";

	const contentBox = targetDoc.createElement("div");
	contentBox.style.position = "absolute";
	contentBox.style.pointerEvents = "none";
	contentBox.style.backgroundColor = "rgba(59, 130, 246, 0.35)";
	contentBox.style.boxSizing = "border-box";
	contentBox.style.margin = "0";
	contentBox.style.padding = "0";
	contentBox.style.borderRadius = "0";
	contentBox.style.transform = "none";

	overlay.appendChild(marginBox);
	overlay.appendChild(borderBox);
	overlay.appendChild(paddingBox);
	overlay.appendChild(contentBox);

	const mountTarget = targetDoc.body ?? targetDoc.documentElement;
	mountTarget.appendChild(overlay);

	return {
		element: overlay,
		update(metrics: ElementPrintMetrics, targetElement: HTMLElement, isPinned?: boolean) {
			const doc = targetElement.ownerDocument ?? targetDoc;

			if (overlay.ownerDocument !== doc) {
				try {
					doc.adoptNode(overlay);
				} catch {
					// Fallback if adoptNode unsupported
				}
			}

			const mount = doc.body ?? doc.documentElement;

			if (overlay.parentNode !== mount) {
				mount.appendChild(overlay);
			}

			const win = doc.defaultView ?? window;
			const scrollX = win.scrollX ?? win.pageXOffset ?? 0;
			const scrollY = win.scrollY ?? win.pageYOffset ?? 0;

			const rect = targetElement.getBoundingClientRect();
			const { margin, border, padding } = metrics.boxModel;

			const outerLeft = rect.left + scrollX - margin.left;
			const outerTop = rect.top + scrollY - margin.top;
			const outerWidth = rect.width + margin.left + margin.right;
			const outerHeight = rect.height + margin.top + margin.bottom;

			overlay.style.left = `${outerLeft}px`;
			overlay.style.top = `${outerTop}px`;
			overlay.style.width = `${outerWidth}px`;
			overlay.style.height = `${outerHeight}px`;
			overlay.style.display = "block";

			// Margin zone fills outer
			marginBox.style.left = "0px";
			marginBox.style.top = "0px";
			marginBox.style.width = `${outerWidth}px`;
			marginBox.style.height = `${outerHeight}px`;

			// Border zone
			const borderLeft = margin.left;
			const borderTop = margin.top;
			const borderWidth = rect.width;
			const borderHeight = rect.height;

			borderBox.style.left = `${borderLeft}px`;
			borderBox.style.top = `${borderTop}px`;
			borderBox.style.width = `${borderWidth}px`;
			borderBox.style.height = `${borderHeight}px`;

			if (isPinned) {
				borderBox.style.outline = "2px solid #38bdf8";
				borderBox.style.outlineOffset = "1px";
			} else {
				borderBox.style.outline = "none";
				borderBox.style.outlineOffset = "0px";
			}

			// Padding zone
			const paddingLeft = borderLeft + border.left;
			const paddingTop = borderTop + border.top;
			const paddingWidth = Math.max(0, borderWidth - (border.left + border.right));
			const paddingHeight = Math.max(0, borderHeight - (border.top + border.bottom));

			paddingBox.style.left = `${paddingLeft}px`;
			paddingBox.style.top = `${paddingTop}px`;
			paddingBox.style.width = `${paddingWidth}px`;
			paddingBox.style.height = `${paddingHeight}px`;

			// Content zone
			const contentLeft = paddingLeft + padding.left;
			const contentTop = paddingTop + padding.top;
			const contentWidth = Math.max(0, paddingWidth - (padding.left + padding.right));
			const contentHeight = Math.max(0, paddingHeight - (padding.top + padding.bottom));

			contentBox.style.left = `${contentLeft}px`;
			contentBox.style.top = `${contentTop}px`;
			contentBox.style.width = `${contentWidth}px`;
			contentBox.style.height = `${contentHeight}px`;
		},
		hide() {
			overlay.style.display = "none";
		},
		destroy() {
			if (overlay.parentNode) {
				overlay.parentNode.removeChild(overlay);
			}
		},
	};
}
