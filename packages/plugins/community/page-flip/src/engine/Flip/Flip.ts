import { Orientation, Render } from "../Render/Render.js";
import type { PageFlip } from "../PageFlip.js";
import { Helper } from "../Helper.js";
import type { PageRect, Point } from "../BasicTypes.js";
import { FlipCalculation } from "./FlipCalculation.js";
import { Page, PageDensity } from "../Page/Page.js";

/**
 * Flipping direction
 */
export const enum FlipDirection {
	FORWARD,
	BACK,
}

/**
 * Active corner when flipping
 */
export const enum FlipCorner {
	TOP = "top",
	BOTTOM = "bottom",
}

/**
 * State of the book
 */
export const enum FlippingState {
	/** The user folding the page */
	USER_FOLD = "user_fold",

	/** Mouse over active corners */
	FOLD_CORNER = "fold_corner",

	/** During flipping animation */
	FLIPPING = "flipping",

	/** Base state */
	READ = "read",
}

/**
 * Class representing the flipping process
 */
export class Flip {
	private readonly render: Render;
	private readonly app: PageFlip;

	private flippingPage: Page | null = null;
	private bottomPage: Page | null = null;

	private calc: FlipCalculation | null = null;

	private state: FlippingState = FlippingState.READ;

	constructor(render: Render, app: PageFlip) {
		this.render = render;
		this.app = app;
	}

	public fold(globalPos: Point): void {
		this.setState(FlippingState.USER_FOLD);

		if (this.calc === null) this.start(globalPos);

		this.do(this.render.convertToPage(globalPos));
	}

	public flip(globalPos: Point): void {
		if (this.app.getSettings().disableFlipByClick && !this.isPointOnCorners(globalPos))
			return;

		if (this.calc !== null) this.render.finishAnimation();

		if (!this.start(globalPos)) return;

		const rect = this.getBoundsRect();

		this.setState(FlippingState.FLIPPING);

		const topMargins = rect.height / 10;

		const yStart =
			this.calc?.getCorner() === FlipCorner.BOTTOM
				? rect.height - topMargins
				: topMargins;

		const yDest = this.calc?.getCorner() === FlipCorner.BOTTOM ? rect.height : 0;

		this.calc?.calc({ x: rect.pageWidth - topMargins, y: yStart });

		this.animateFlippingTo(
			{ x: rect.pageWidth - topMargins, y: yStart },
			{ x: -rect.pageWidth, y: yDest },
			true,
		);
	}

	public start(globalPos: Point): boolean {
		this.reset();

		const bookPos = this.render.convertToBook(globalPos);
		const rect = this.getBoundsRect();

		const direction = this.getDirectionByPoint(bookPos);
		const flipCorner = bookPos.y >= rect.height / 2 ? FlipCorner.BOTTOM : FlipCorner.TOP;

		if (!this.checkDirection(direction)) return false;

		try {
			const collection = this.app.getPageCollection();

			if (!collection) return false;

			this.flippingPage = collection.getFlippingPage(direction);
			this.bottomPage = collection.getBottomPage(direction);

			if (!this.flippingPage || !this.bottomPage) return false;

			if (this.render.getOrientation() === Orientation.LANDSCAPE) {
				if (direction === FlipDirection.BACK) {
					const nextPage = collection.nextBy(this.flippingPage);

					if (nextPage !== null) {
						if (this.flippingPage.getDensity() !== nextPage.getDensity()) {
							this.flippingPage.setDrawingDensity(PageDensity.HARD);
							nextPage.setDrawingDensity(PageDensity.HARD);
						}
					}
				} else {
					const prevPage = collection.prevBy(this.flippingPage);

					if (prevPage !== null) {
						if (this.flippingPage.getDensity() !== prevPage.getDensity()) {
							this.flippingPage.setDrawingDensity(PageDensity.HARD);
							prevPage.setDrawingDensity(PageDensity.HARD);
						}
					}
				}
			}

			this.render.setDirection(direction);
			this.calc = new FlipCalculation(
				direction,
				flipCorner,
				rect.pageWidth.toString(10),
				rect.height.toString(10),
			);

			return true;
		} catch {
			return false;
		}
	}

	private do(pagePos: Point): void {
		if (this.calc === null || !this.bottomPage || !this.flippingPage) return;

		if (this.calc.calc(pagePos)) {
			const progress = this.calc.getFlippingProgress();

			this.bottomPage.setArea(this.calc.getBottomClipArea());
			this.bottomPage.setPosition(this.calc.getBottomPagePosition());
			this.bottomPage.setAngle(0);
			this.bottomPage.setHardAngle(0);

			this.flippingPage.setArea(this.calc.getFlippingClipArea());
			this.flippingPage.setPosition(this.calc.getActiveCorner());
			this.flippingPage.setAngle(this.calc.getAngle());

			if (this.calc.getDirection() === FlipDirection.FORWARD) {
				this.flippingPage.setHardAngle((90 * (200 - progress * 2)) / 100);
			} else {
				this.flippingPage.setHardAngle((-90 * (200 - progress * 2)) / 100);
			}

			this.render.setPageRect(this.calc.getRect());

			this.render.setBottomPage(this.bottomPage);
			this.render.setFlippingPage(this.flippingPage);

			this.render.setShadowData(
				this.calc.getShadowStartPoint(),
				this.calc.getShadowAngle(),
				progress,
				this.calc.getDirection(),
			);
		}
	}

	public flipToPage(page: number, corner: FlipCorner): void {
		const collection = this.app.getPageCollection();

		if (!collection) return;

		const current = collection.getCurrentSpreadIndex();
		const next = collection.getSpreadIndexByPage(page);

		try {
			if (next !== null && next > current) {
				collection.setCurrentSpreadIndex(next - 1);
				this.flipNext(corner);
			}

			if (next !== null && next < current) {
				collection.setCurrentSpreadIndex(next + 1);
				this.flipPrev(corner);
			}
		} catch {
			// Ignore navigation error
		}
	}

	public flipNext(corner: FlipCorner): void {
		this.flip({
			x: this.render.getRect().left + this.render.getRect().pageWidth * 2 - 10,
			y: corner === FlipCorner.TOP ? 1 : this.render.getRect().height - 2,
		});
	}

	public flipPrev(corner: FlipCorner): void {
		this.flip({
			x: this.render.getRect().left + 10,
			y: corner === FlipCorner.TOP ? 1 : this.render.getRect().height - 2,
		});
	}

	public stopMove(): void {
		if (this.calc === null) return;

		const pos = this.calc.getPosition();
		const rect = this.getBoundsRect();

		const y = this.calc.getCorner() === FlipCorner.BOTTOM ? rect.height : 0;

		if (pos.x <= 0) this.animateFlippingTo(pos, { x: -rect.pageWidth, y }, true);
		else this.animateFlippingTo(pos, { x: rect.pageWidth, y }, false);
	}

	public showCorner(globalPos: Point): void {
		if (!this.checkState(FlippingState.READ, FlippingState.FOLD_CORNER)) return;

		const rect = this.getBoundsRect();
		const pageWidth = rect.pageWidth;

		if (this.isPointOnCorners(globalPos)) {
			let calc = this.calc;

			if (calc === null) {
				if (!this.start(globalPos)) return;
				calc = this.calc;

				if (!calc) return;

				this.setState(FlippingState.FOLD_CORNER);

				calc.calc({ x: pageWidth - 1, y: 1 });

				const fixedCornerSize = 50;
				const yStart = calc.getCorner() === FlipCorner.BOTTOM ? rect.height - 1 : 1;

				const yDest =
					calc.getCorner() === FlipCorner.BOTTOM
						? rect.height - fixedCornerSize
						: fixedCornerSize;

				this.animateFlippingTo(
					{ x: pageWidth - 1, y: yStart },
					{ x: pageWidth - fixedCornerSize, y: yDest },
					false,
					false,
				);
			} else {
				this.do(this.render.convertToPage(globalPos));
			}
		} else {
			this.setState(FlippingState.READ);
			this.render.finishAnimation();

			this.stopMove();
		}
	}

	private animateFlippingTo(
		start: Point,
		dest: Point,
		isTurned: boolean,
		needReset = true,
	): void {
		const points = Helper.GetCordsFromTwoPoint(start, dest);

		const frames: (() => void)[] = [];

		for (const p of points) frames.push(() => this.do(p));

		const duration = this.getAnimationDuration(points.length);

		this.render.startAnimation(frames, duration, () => {
			if (!this.calc) return;

			if (isTurned) {
				if (this.calc.getDirection() === FlipDirection.BACK) this.app.turnToPrevPage();
				else this.app.turnToNextPage();
			}

			if (needReset) {
				this.render.setBottomPage(null);
				this.render.setFlippingPage(null);
				this.render.clearShadow();

				this.setState(FlippingState.READ);
				this.reset();
			}
		});
	}

	public getCalculation(): FlipCalculation | null {
		return this.calc;
	}

	public getState(): FlippingState {
		return this.state;
	}

	private setState(newState: FlippingState): void {
		if (this.state !== newState) {
			this.app.updateState(newState);
			this.state = newState;
		}
	}

	private getDirectionByPoint(touchPos: Point): FlipDirection {
		const rect = this.getBoundsRect();

		if (this.render.getOrientation() === Orientation.PORTRAIT) {
			if (touchPos.x - rect.pageWidth <= rect.width / 5) {
				return FlipDirection.BACK;
			}
		} else if (touchPos.x < rect.width / 2) {
			return FlipDirection.BACK;
		}

		return FlipDirection.FORWARD;
	}

	private getAnimationDuration(size: number): number {
		const defaultTime = this.app.getSettings().flippingTime;

		if (size >= 1000) return defaultTime;

		return (size / 1000) * defaultTime;
	}

	private checkDirection(direction: FlipDirection): boolean {
		if (direction === FlipDirection.FORWARD) {
			return this.app.getCurrentPageIndex() < this.app.getPageCount() - 1;
		}

		return this.app.getCurrentPageIndex() >= 1;
	}

	private reset(): void {
		this.calc = null;
		this.flippingPage = null;
		this.bottomPage = null;
	}

	private getBoundsRect(): PageRect {
		return this.render.getRect();
	}

	private checkState(...states: FlippingState[]): boolean {
		for (const state of states) {
			if (this.state === state) return true;
		}

		return false;
	}

	private isPointOnCorners(globalPos: Point): boolean {
		const rect = this.getBoundsRect();
		const pageWidth = rect.pageWidth;

		const operatingDistance =
			Math.sqrt(Math.pow(pageWidth, 2) + Math.pow(rect.height, 2)) / 5;

		const bookPos = this.render.convertToBook(globalPos);

		return (
			bookPos.x > 0 &&
			bookPos.y > 0 &&
			bookPos.x < rect.width &&
			bookPos.y < rect.height &&
			(bookPos.x < operatingDistance || bookPos.x > rect.width - operatingDistance) &&
			(bookPos.y < operatingDistance || bookPos.y > rect.height - operatingDistance)
		);
	}
}
