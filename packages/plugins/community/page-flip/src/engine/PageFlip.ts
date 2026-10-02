import { PageCollection } from "./Collection/PageCollection.js";
import { ImagePageCollection } from "./Collection/ImagePageCollection.js";
import { HTMLPageCollection } from "./Collection/HTMLPageCollection.js";
import type { PageRect, Point } from "./BasicTypes.js";
import { Flip, FlipCorner, FlippingState } from "./Flip/Flip.js";
import { Orientation, Render } from "./Render/Render.js";
import { CanvasRender } from "./Render/CanvasRender.js";
import { HTMLUI } from "./UI/HTMLUI.js";
import { CanvasUI } from "./UI/CanvasUI.js";
import { Helper } from "./Helper.js";
import type { Page } from "./Page/Page.js";
import { EventObject } from "./Event/EventObject.js";
import { HTMLRender } from "./Render/HTMLRender.js";
import { Settings, type FlipSetting } from "./Settings.js";
import type { UI } from "./UI/UI.js";

/**
 * Class representing a main PageFlip object
 */
export class PageFlip extends EventObject {
	private mousePosition: Point = { x: 0, y: 0 };
	private isUserTouch = false;
	private isUserMove = false;

	private readonly setting: FlipSetting;
	private readonly block: HTMLElement;

	private pages: PageCollection | null = null;
	private flipController: Flip | null = null;
	private render: Render | null = null;
	private ui: UI | null = null;

	constructor(inBlock: HTMLElement, setting: Partial<FlipSetting>) {
		super();

		this.setting = new Settings().getSettings(setting);
		this.block = inBlock;
	}

	public destroy(): void {
		this.render?.destroy();
		this.ui?.destroy();
		this.pages?.destroy();
	}

	public update(): void {
		this.render?.update();
		this.pages?.show();
	}

	public loadFromImages(imagesHref: string[]): void {
		this.ui = new CanvasUI(this.block, this, this.setting);

		const canvas = (this.ui as CanvasUI).getCanvas();
		this.render = new CanvasRender(this, this.setting, canvas);

		this.flipController = new Flip(this.render, this);

		this.pages = new ImagePageCollection(this, this.render, imagesHref);
		this.pages.load();

		this.render.start();
		this.pages.show(this.setting.startPage);

		setTimeout(() => {
			this.ui?.update();
			this.trigger("init", this, {
				page: this.setting.startPage,
				mode: this.render?.getOrientation() ?? Orientation.LANDSCAPE,
			});
		}, 1);
	}

	public loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void {
		this.ui = new HTMLUI(this.block, this, this.setting, items);

		this.render = new HTMLRender(this, this.setting, this.ui.getDistElement());

		this.flipController = new Flip(this.render, this);

		this.pages = new HTMLPageCollection(
			this,
			this.render,
			this.ui.getDistElement(),
			items,
		);
		this.pages.load();

		this.render.start();
		this.pages.show(this.setting.startPage);

		setTimeout(() => {
			this.ui?.update();
			this.trigger("init", this, {
				page: this.setting.startPage,
				mode: this.render?.getOrientation() ?? Orientation.LANDSCAPE,
			});
		}, 1);
	}

	public updateFromImages(imagesHref: string[]): void {
		const current = this.pages?.getCurrentPageIndex() ?? 0;

		this.pages?.destroy();
		if (!this.render) return;

		this.pages = new ImagePageCollection(this, this.render, imagesHref);
		this.pages.load();

		this.pages.show(current);
		this.trigger("update", this, {
			page: current,
			mode: this.render.getOrientation() ?? Orientation.LANDSCAPE,
		});
	}

	public updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void {
		const current = this.pages?.getCurrentPageIndex() ?? 0;

		this.pages?.destroy();
		if (!this.render || !this.ui) return;

		this.pages = new HTMLPageCollection(
			this,
			this.render,
			this.ui.getDistElement(),
			items,
		);
		this.pages.load();
		(this.ui as HTMLUI).updateItems(items);
		this.render.reload();

		this.pages.show(current);
		this.trigger("update", this, {
			page: current,
			mode: this.render.getOrientation() ?? Orientation.LANDSCAPE,
		});
	}

	public clear(): void {
		this.pages?.destroy();
		if (this.ui && "clear" in this.ui) {
			(this.ui as HTMLUI).clear();
		}
	}

	public turnToPrevPage(): void {
		this.pages?.showPrev();
	}

	public turnToNextPage(): void {
		this.pages?.showNext();
	}

	public turnToPage(page: number): void {
		this.pages?.show(page);
	}

	public flipNext(corner: FlipCorner = FlipCorner.TOP): void {
		this.flipController?.flipNext(corner);
	}

	public flipPrev(corner: FlipCorner = FlipCorner.TOP): void {
		this.flipController?.flipPrev(corner);
	}

	public flip(page: number, corner: FlipCorner = FlipCorner.TOP): void {
		this.flipController?.flipToPage(page, corner);
	}

	public updateState(newState: FlippingState): void {
		this.trigger("changeState", this, newState);
	}

	public updatePageIndex(newPage: number): void {
		this.trigger("flip", this, newPage);
	}

	public updateOrientation(newOrientation: Orientation): void {
		this.ui?.setOrientationStyle(newOrientation);
		this.update();
		this.trigger("changeOrientation", this, newOrientation);
	}

	public getPageCount(): number {
		return this.pages ? this.pages.getPageCount() : 0;
	}

	public getCurrentPageIndex(): number {
		return this.pages ? this.pages.getCurrentPageIndex() : 0;
	}

	public getPage(pageIndex: number): Page {
		if (!this.pages) throw new Error("Pages not loaded");
		return this.pages.getPage(pageIndex);
	}

	public getRender(): Render {
		if (!this.render) throw new Error("Render not initialized");
		return this.render;
	}

	public getFlipController(): Flip | null {
		return this.flipController;
	}

	public getOrientation(): Orientation {
		return this.render?.getOrientation() ?? Orientation.LANDSCAPE;
	}

	public getBoundsRect(): PageRect {
		if (!this.render) throw new Error("Render not initialized");
		return this.render.getRect();
	}

	public getSettings(): FlipSetting {
		return this.setting;
	}

	public getUI(): UI {
		if (!this.ui) throw new Error("UI not initialized");
		return this.ui;
	}

	public getState(): FlippingState {
		return this.flipController?.getState() ?? FlippingState.READ;
	}

	public getPageCollection(): PageCollection | null {
		return this.pages;
	}

	public startUserTouch(pos: Point): void {
		this.mousePosition = pos;
		this.isUserTouch = true;
		this.isUserMove = false;
	}

	public userMove(pos: Point, isTouch: boolean): void {
		if (!this.isUserTouch && !isTouch && this.setting.showPageCorners) {
			this.flipController?.showCorner(pos);
		} else if (this.isUserTouch) {
			if (Helper.GetDistanceBetweenTwoPoint(this.mousePosition, pos) > 5) {
				this.isUserMove = true;
				this.flipController?.fold(pos);
			}
		}
	}

	public userStop(pos: Point, isSwipe = false): void {
		if (this.isUserTouch) {
			this.isUserTouch = false;

			if (!isSwipe) {
				if (!this.isUserMove) this.flipController?.flip(pos);
				else this.flipController?.stopMove();
			}
		}
	}
}
