import { BrowserRenderer, type CreateRendererOptions } from "./browser-renderer.js";

export function createRenderer(options: CreateRendererOptions): BrowserRenderer {
	return new BrowserRenderer(options);
}
