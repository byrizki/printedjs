export type IsolationMode = "root" | "iframe";

export type SurfaceTarget = HTMLElement | HTMLIFrameElement;

export interface RenderSurface {
	readonly isolation: IsolationMode;
	readonly rootElement: HTMLElement;
	readonly document: Document;
	readonly window: Window;
	clear(): void;
	destroy(): void;
}
