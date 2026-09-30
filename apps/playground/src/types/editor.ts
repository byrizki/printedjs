export type EditorTabId = "template" | "data";

export type ViewMode = "single" | "spread";

export interface ZoomPreset {
	readonly label: string;
	readonly value: number;
}

export const ZOOM_PRESETS: readonly ZoomPreset[] = [
	{ label: "50%", value: 0.5 },
	{ label: "75%", value: 0.75 },
	{ label: "90%", value: 0.9 },
	{ label: "100%", value: 1.0 },
	{ label: "125%", value: 1.25 },
	{ label: "150%", value: 1.5 },
];
