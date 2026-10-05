import type { TraceReport } from "./trace.js";

export interface BoxOffsets {
	readonly top: number;
	readonly right: number;
	readonly bottom: number;
	readonly left: number;
}

export interface BoxDimensions {
	readonly widthPx: number;
	readonly heightPx: number;
	readonly widthMm: number;
	readonly heightMm: number;
}

export interface ElementBoxModel {
	readonly margin: BoxOffsets;
	readonly border: BoxOffsets;
	readonly padding: BoxOffsets;
	readonly content: BoxDimensions;
	readonly clientRect: {
		readonly top: number;
		readonly left: number;
		readonly width: number;
		readonly height: number;
	};
}

export interface BreakRules {
	readonly breakInside: string;
	readonly breakBefore: string;
	readonly breakAfter: string;
	readonly isSplitTo: boolean;
	readonly isSplitFrom: boolean;
	readonly hasAvoidBreak: boolean;
}

export interface ElementPrintMetrics {
	readonly element?: HTMLElement | undefined;
	readonly selector: string;
	readonly tagName: string;
	readonly id?: string | undefined;
	readonly classes: readonly string[];
	readonly pageNumber: number;
	readonly totalPages: number;
	readonly boxModel: ElementBoxModel;
	readonly breakRules: BreakRules;
	readonly remainingSpacePx: number;
	readonly remainingSpaceMm: number;
}

export interface DevtoolsOverlayOptions {
	readonly report?: TraceReport | undefined;
	readonly inspectEnabled?: boolean | undefined;
	readonly guidesEnabled?: boolean | undefined;
	readonly placement?:
		| "bottom-center"
		| "top-center"
		| "bottom-right"
		| "top-right"
		| "bottom-left"
		| "top-left"
		| "bottom-above-bar"
		| undefined;
	readonly mountTarget?: HTMLElement | undefined;
	readonly theme?: "dark" | "light" | "auto" | undefined;
	readonly onReport?: ((report: TraceReport) => void) | undefined;
	readonly onInspect?: ((metrics: ElementPrintMetrics | null) => void) | undefined;
	readonly onSelect?:
		| ((metrics: ElementPrintMetrics | null, element: HTMLElement | null) => void)
		| undefined;
	readonly extraControls?: HTMLElement | readonly HTMLElement[] | undefined;
	readonly onClose?: (() => void) | undefined;
}
