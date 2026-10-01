import { UI } from "./UI.js";
import type { PageFlip } from "../PageFlip.js";
import type { FlipSetting } from "../Settings.js";

/**
 * UI for canvas mode
 */
export class CanvasUI extends UI {
	private readonly canvas: HTMLCanvasElement;

	constructor(inBlock: HTMLElement, app: PageFlip, setting: FlipSetting) {
		super(inBlock, app, setting);

		this.wrapper.innerHTML = '<canvas class="stf__canvas"></canvas>';
		this.canvas = inBlock.querySelectorAll("canvas")[0] as HTMLCanvasElement;
		this.distElement = this.canvas;

		this.resizeCanvas();
		this.setHandlers();
	}

	private resizeCanvas(): void {
		if (!this.canvas) return;
		const cs =
			typeof getComputedStyle !== "undefined" ? getComputedStyle(this.canvas) : null;
		const width = parseInt(cs?.getPropertyValue("width") || "0", 10) || 300;
		const height = parseInt(cs?.getPropertyValue("height") || "0", 10) || 150;

		this.canvas.width = width;
		this.canvas.height = height;
	}

	public getCanvas(): HTMLCanvasElement {
		return this.canvas;
	}

	public update(): void {
		this.resizeCanvas();
		this.app.getRender().update();
	}
}
