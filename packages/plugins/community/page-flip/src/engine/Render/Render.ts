import type { PageFlip } from "../PageFlip.js";
import type { Point, PageRect, RectPoints } from "../BasicTypes.js";
import { FlipDirection } from "../Flip/Flip.js";
import { Page, PageOrientation } from "../Page/Page.js";
import { SizeType, type FlipSetting } from "../Settings.js";

type FrameAction = () => void;
type AnimationSuccessAction = () => void;

/**
 * Type describing calculated values for drop shadows
 */
type Shadow = {
	/** Shadow Position Start Point */
	pos: Point;
	/** The angle of the shadows relative to the book */
	angle: number;
	/** Base width shadow */
	width: number;
	/** Base shadow opacity */
	opacity: number;
	/** Flipping Direction, the direction of the shadow gradients */
	direction: FlipDirection;
	/** Flipping progress in percent (0 - 100) */
	progress: number;
};

/**
 * Type describing the animation process
 * Only one animation process can be started at a same time
 */
type AnimationProcess = {
	/** List of frames in playback order. Each frame is a function. */
	frames: FrameAction[];
	/** Total animation duration */
	duration: number;
	/** Animation duration of one frame */
	durationFrame: number;
	/** Callback at the end of the animation */
	onAnimateEnd: AnimationSuccessAction;
	/** Animation start time (Global Timer) */
	startedAt: number;
};

/**
 * Book orientation
 */
export const enum Orientation {
	PORTRAIT = "portrait",
	LANDSCAPE = "landscape",
}

/**
 * Class responsible for rendering the book
 */
export abstract class Render {
	protected readonly setting: FlipSetting;
	protected readonly app: PageFlip;

	/** Left static book page */
	protected leftPage: Page | null = null;
	/** Right static book page */
	protected rightPage: Page | null = null;

	/** Page currently flipping */
	protected flippingPage: Page | null = null;
	/** Next page at the time of flipping */
	protected bottomPage: Page | null = null;

	/** Current flipping direction */
	protected direction: FlipDirection | null = null;
	/** Current book orientation */
	protected orientation: Orientation | null = null;
	/** Current state of the shadows */
	protected shadow: Shadow | null = null;
	/** Current animation process */
	protected animation: AnimationProcess | null = null;
	/** Page borders while flipping */
	protected pageRect: RectPoints | null = null;
	/** Current book area */
	private boundsRect: PageRect | null = null;

	/** Timer started from start of rendering */
	protected timer = 0;

	private safari = false;

	protected constructor(app: PageFlip, setting: FlipSetting) {
		this.setting = setting;
		this.app = app;

		// detect safari
		if (typeof window !== "undefined" && window.navigator) {
			const regex = new RegExp("Version\\/[\\d\\.]+.*Safari/");
			this.safari = regex.exec(window.navigator.userAgent) !== null;
		}
	}

	/**
	 * Rendering action on each requestAnimationFrame call. The entire rendering process is performed only in this method
	 */
	protected abstract drawFrame(): void;

	/**
	 * Reload the render area, after update pages
	 */
	public abstract reload(): void;

	/**
	 * Executed when requestAnimationFrame is called. Performs the current animation process and call drawFrame()
	 */
	private render(timer: number): void {
		if (this.animation !== null) {
			// Find current frame of animation
			const frameIndex = Math.round(
				(timer - this.animation.startedAt) / this.animation.durationFrame,
			);

			if (frameIndex < this.animation.frames.length) {
				this.animation.frames[frameIndex]?.();
			} else {
				this.animation.onAnimateEnd();
				this.animation = null;
			}
		}

		this.timer = timer;
		this.drawFrame();
	}

	/**
	 * Running requestAnimationFrame, and rendering process
	 */
	public start(): void {
		this.update();

		if (typeof requestAnimationFrame === "undefined") {
			this.render(0);
			return;
		}

		const loop = (timer: number): void => {
			this.render(timer);
			requestAnimationFrame(loop);
		};

		requestAnimationFrame(loop);
	}

	/**
	 * Start a new animation process
	 */
	public startAnimation(
		frames: FrameAction[],
		duration: number,
		onAnimateEnd: AnimationSuccessAction,
	): void {
		this.finishAnimation(); // finish the previous animation process

		this.animation = {
			frames,
			duration,
			durationFrame: duration / Math.max(1, frames.length),
			onAnimateEnd,
			startedAt: this.timer,
		};
	}

	/**
	 * End the current animation process and call the callback
	 */
	public finishAnimation(): void {
		if (this.animation !== null) {
			this.animation.frames[this.animation.frames.length - 1]?.();

			if (this.animation.onAnimateEnd !== null) {
				this.animation.onAnimateEnd();
			}
		}

		this.animation = null;
	}

	/**
	 * Recalculate the size of the displayed area, and update the page orientation
	 */
	public update(): void {
		this.boundsRect = null;
		const orientation = this.calculateBoundsRect();

		if (this.orientation !== orientation) {
			this.orientation = orientation;
			this.app.updateOrientation(orientation);
		}
	}

	/**
	 * Calculate the size and position of the book depending on the parent element and configuration parameters
	 */
	private calculateBoundsRect(): Orientation {
		let orientation = Orientation.LANDSCAPE;

		const blockWidth = this.getBlockWidth();
		const middlePoint: Point = {
			x: blockWidth / 2,
			y: this.getBlockHeight() / 2,
		};

		const ratio = this.setting.width / Math.max(1, this.setting.height);

		let pageWidth = this.setting.width;
		let pageHeight = this.setting.height;

		let left = middlePoint.x - pageWidth;

		if (this.setting.size === SizeType.STRETCH) {
			if (blockWidth < this.setting.minWidth * 2 && this.app.getSettings().usePortrait) {
				orientation = Orientation.PORTRAIT;
			}

			pageWidth =
				orientation === Orientation.PORTRAIT
					? this.getBlockWidth()
					: this.getBlockWidth() / 2;

			if (pageWidth > this.setting.maxWidth) pageWidth = this.setting.maxWidth;

			pageHeight = pageWidth / ratio;
			if (pageHeight > this.getBlockHeight()) {
				pageHeight = this.getBlockHeight();
				pageWidth = pageHeight * ratio;
			}

			left =
				orientation === Orientation.PORTRAIT
					? middlePoint.x - pageWidth / 2 - pageWidth
					: middlePoint.x - pageWidth;
		} else {
			if (blockWidth < pageWidth * 2) {
				if (this.app.getSettings().usePortrait) {
					orientation = Orientation.PORTRAIT;
					left = middlePoint.x - pageWidth / 2 - pageWidth;
				}
			}
		}

		this.boundsRect = {
			left,
			top: middlePoint.y - pageHeight / 2,
			width: pageWidth * 2,
			height: pageHeight,
			pageWidth: pageWidth,
		};

		return orientation;
	}

	public setShadowData(
		pos: Point,
		angle: number,
		progress: number,
		direction: FlipDirection,
	): void {
		if (!this.app.getSettings().drawShadow) return;

		const maxShadowOpacity = 100 * this.getSettings().maxShadowOpacity;

		this.shadow = {
			pos,
			angle,
			width: (((this.getRect().pageWidth * 3) / 4) * progress) / 100,
			opacity: ((100 - progress) * maxShadowOpacity) / 100 / 100,
			direction,
			progress: progress * 2,
		};
	}

	public clearShadow(): void {
		this.shadow = null;
	}

	public getBlockWidth(): number {
		const ui = this.app.getUI();
		return ui ? ui.getDistElement().offsetWidth : this.setting.width * 2;
	}

	public getBlockHeight(): number {
		const ui = this.app.getUI();
		return ui ? ui.getDistElement().offsetHeight : this.setting.height;
	}

	public getDirection(): FlipDirection | null {
		return this.direction;
	}

	public getRect(): PageRect {
		if (this.boundsRect === null) this.calculateBoundsRect();
		return this.boundsRect!;
	}

	public getSettings(): FlipSetting {
		return this.app.getSettings();
	}

	public getOrientation(): Orientation | null {
		return this.orientation;
	}

	public setPageRect(pageRect: RectPoints): void {
		this.pageRect = pageRect;
	}

	public setDirection(direction: FlipDirection): void {
		this.direction = direction;
	}

	public setRightPage(page: Page | null): void {
		if (page !== null) page.setOrientation(PageOrientation.RIGHT);
		this.rightPage = page;
	}

	public setLeftPage(page: Page | null): void {
		if (page !== null) page.setOrientation(PageOrientation.LEFT);
		this.leftPage = page;
	}

	public getLeftPage(): Page | null {
		return this.leftPage;
	}

	public getRightPage(): Page | null {
		return this.rightPage;
	}

	public setBottomPage(page: Page | null): void {
		if (page !== null) {
			page.setOrientation(
				this.direction === FlipDirection.BACK
					? PageOrientation.LEFT
					: PageOrientation.RIGHT,
			);
		}
		this.bottomPage = page;
	}

	public setFlippingPage(page: Page | null): void {
		if (page !== null) {
			page.setOrientation(
				this.direction === FlipDirection.FORWARD &&
					this.orientation !== Orientation.PORTRAIT
					? PageOrientation.LEFT
					: PageOrientation.RIGHT,
			);
		}
		this.flippingPage = page;
	}

	public convertToBook(pos: Point): Point {
		const rect = this.getRect();
		return {
			x: pos.x - rect.left,
			y: pos.y - rect.top,
		};
	}

	public isSafari(): boolean {
		return this.safari;
	}

	public convertToPage(pos: Point, direction?: FlipDirection): Point {
		const dir = direction ?? this.direction;
		const rect = this.getRect();
		const x =
			dir === FlipDirection.FORWARD
				? pos.x - rect.left - rect.width / 2
				: rect.width / 2 - pos.x + rect.left;

		return {
			x,
			y: pos.y - rect.top,
		};
	}

	public convertToGlobal(pos: Point, direction?: FlipDirection): Point {
		const dir = direction ?? this.direction;
		if (pos == null) return { x: 0, y: 0 };

		const rect = this.getRect();
		const x =
			dir === FlipDirection.FORWARD
				? pos.x + rect.left + rect.width / 2
				: rect.width / 2 - pos.x + rect.left;

		return {
			x,
			y: pos.y + rect.top,
		};
	}

	public convertRectToGlobal(rect: RectPoints, direction?: FlipDirection): RectPoints {
		const dir = direction ?? this.direction ?? undefined;

		return {
			topLeft: this.convertToGlobal(rect.topLeft, dir),
			topRight: this.convertToGlobal(rect.topRight, dir),
			bottomLeft: this.convertToGlobal(rect.bottomLeft, dir),
			bottomRight: this.convertToGlobal(rect.bottomRight, dir),
		};
	}
}
