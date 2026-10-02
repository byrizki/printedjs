import type { PageFlip } from "../PageFlip.js";
import type { Point } from "../BasicTypes.js";
import { SizeType, type FlipSetting } from "../Settings.js";
import { FlipCorner, FlippingState } from "../Flip/Flip.js";
import { Orientation } from "../Render/Render.js";

type SwipeData = {
	point: Point;
	time: number;
};

export const ST_PAGE_FLIP_CSS = `
.stf__parent {
	position: relative !important;
	display: block !important;
	box-sizing: border-box !important;
	transform: translateZ(0) !important;
	touch-action: pan-y !important;
	margin: 0 auto !important;
	box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.5);
}

.stf__wrapper {
	position: relative !important;
	width: 100% !important;
	height: 100% !important;
	padding-bottom: 0 !important;
	box-sizing: border-box !important;
	margin: 0 auto !important;
	overflow: visible !important;
}

.stf__parent canvas {
	position: absolute !important;
	width: 100% !important;
	height: 100% !important;
	left: 0 !important;
	top: 0 !important;
}

.stf__block {
	position: absolute !important;
	width: 100% !important;
	height: 100% !important;
	box-sizing: border-box !important;
	perspective: 2000px !important;
}

.stf__item {
	visibility: hidden;
	opacity: 0;
	pointer-events: none;
	position: absolute !important;
	transform-style: preserve-3d !important;
	box-sizing: border-box !important;
}

.stf__item,
.stf__parent :is(.printedjs_page, .pagedjs_page) {
	box-shadow: none !important;
	border-radius: 0 !important;
	border: none !important;
}

.stf__item.--left {
	box-shadow: inset -10px 0 16px -8px rgba(0, 0, 0, 0.15) !important;
}

.stf__item.--right {
	box-shadow: inset 10px 0 16px -8px rgba(0, 0, 0, 0.15) !important;
}

.stf__outerShadow,
.stf__innerShadow,
.stf__hardShadow,
.stf__hardInnerShadow {
	position: absolute !important;
	pointer-events: none !important;
}

.stf__item[data-flip-clone="true"],
.stf__item[data-flip-clone="true"] * {
	counter-increment: none !important;
	counter-reset: none !important;
}

@media print {
	.stf__parent {
		position: static !important;
	}
	.stf__wrapper,
	.stf__block {
		position: static !important;
		perspective: none !important;
	}
	.stf__item,
	:is(.printedjs_page, .pagedjs_page) {
		display: block !important;
		position: static !important;
		page-break-after: always !important;
		break-after: page !important;
	}
	:is(.printedjs_page, .pagedjs_page):last-child {
		page-break-after: avoid !important;
		break-after: avoid !important;
	}
}
`;

/**
 * UI Class, represents work with DOM
 */
export abstract class UI {
	protected readonly parentElement: HTMLElement;
	protected readonly app: PageFlip;
	protected readonly wrapper: HTMLElement;
	protected distElement: HTMLElement;

	private touchPoint: SwipeData | null = null;
	private readonly swipeTimeout = 250;
	private readonly swipeDistance: number;

	private readonly onResize = (): void => {
		this.update();
	};

	protected constructor(inBlock: HTMLElement, app: PageFlip, setting: FlipSetting) {
		this.parentElement = inBlock;
		this.app = app;

		// Ensure styles are present in document
		const doc =
			inBlock.ownerDocument ?? (typeof document !== "undefined" ? document : null);
		if (doc && !doc.getElementById("st-page-flip-styles")) {
			const style = doc.createElement("style");
			style.id = "st-page-flip-styles";
			style.textContent = ST_PAGE_FLIP_CSS;
			if (doc.head) {
				doc.head.appendChild(style);
			} else if (doc.documentElement) {
				doc.documentElement.appendChild(style);
			}
		}

		inBlock.classList.add("stf__parent");
		inBlock.insertAdjacentHTML("afterbegin", '<div class="stf__wrapper"></div>');

		this.wrapper = inBlock.querySelector(".stf__wrapper") as HTMLElement;
		this.distElement = this.wrapper;

		const k = this.app.getSettings().usePortrait ? 1 : 2;

		inBlock.style.minWidth = setting.minWidth * k + "px";
		inBlock.style.minHeight = setting.minHeight + "px";

		if (setting.size === SizeType.FIXED) {
			inBlock.style.minWidth = setting.width * k + "px";
			inBlock.style.minHeight = setting.height + "px";
		}

		if (setting.autoSize) {
			inBlock.style.width = "100%";
			inBlock.style.maxWidth = setting.maxWidth * 2 + "px";
		}

		inBlock.style.display = "block";

		if (typeof window !== "undefined") {
			window.addEventListener("resize", this.onResize, false);
		}
		this.swipeDistance = setting.swipeDistance;
	}

	public destroy(): void {
		this.removeHandlers();

		this.distElement?.remove();
		this.wrapper?.remove();
	}

	public abstract update(): void;

	public getDistElement(): HTMLElement {
		return this.distElement;
	}

	public getWrapper(): HTMLElement {
		return this.wrapper;
	}

	public setOrientationStyle(orientation: Orientation): void {
		this.wrapper.classList.remove("--portrait", "--landscape");

		if (orientation === Orientation.PORTRAIT) {
			if (this.app.getSettings().autoSize) {
				this.wrapper.style.paddingBottom =
					(this.app.getSettings().height / this.app.getSettings().width) * 100 + "%";
			}
			this.wrapper.classList.add("--portrait");
		} else {
			if (this.app.getSettings().autoSize) {
				this.wrapper.style.paddingBottom =
					(this.app.getSettings().height / (this.app.getSettings().width * 2)) * 100 +
					"%";
			}
			this.wrapper.classList.add("--landscape");
		}

		this.update();
	}

	protected removeHandlers(): void {
		if (typeof window !== "undefined") {
			window.removeEventListener("resize", this.onResize);
		}

		if (this.distElement) {
			this.distElement.removeEventListener("mousedown", this.onMouseDown);
			this.distElement.removeEventListener("touchstart", this.onTouchStart);
		}
		if (typeof window !== "undefined") {
			window.removeEventListener("mousemove", this.onMouseMove);
			window.removeEventListener("touchmove", this.onTouchMove);
			window.removeEventListener("mouseup", this.onMouseUp);
			window.removeEventListener("touchend", this.onTouchEnd);
		}
	}

	protected setHandlers(): void {
		if (typeof window !== "undefined") {
			window.addEventListener("resize", this.onResize, false);
		}
		if (!this.app.getSettings().useMouseEvents) return;

		if (this.distElement) {
			this.distElement.addEventListener("mousedown", this.onMouseDown);
			this.distElement.addEventListener("touchstart", this.onTouchStart);
		}
		if (typeof window !== "undefined") {
			window.addEventListener("mousemove", this.onMouseMove);
			window.addEventListener("touchmove", this.onTouchMove, {
				passive: !this.app.getSettings().mobileScrollSupport,
			});
			window.addEventListener("mouseup", this.onMouseUp);
			window.addEventListener("touchend", this.onTouchEnd);
		}
	}

	private getMousePos(x: number, y: number): Point {
		const rect = this.distElement.getBoundingClientRect();

		return {
			x: x - rect.left,
			y: y - rect.top,
		};
	}

	private checkTarget(target: EventTarget | null): boolean {
		if (!target) return false;
		if (!this.app.getSettings().clickEventForward) return true;

		if (["a", "button"].includes((target as HTMLElement).tagName?.toLowerCase() ?? "")) {
			return false;
		}

		return true;
	}

	private readonly onMouseDown = (e: MouseEvent): void => {
		if (this.checkTarget(e.target)) {
			const pos = this.getMousePos(e.clientX, e.clientY);
			this.app.startUserTouch(pos);
			e.preventDefault();
		}
	};

	private readonly onTouchStart = (e: TouchEvent): void => {
		if (this.checkTarget(e.target)) {
			if (e.changedTouches.length > 0) {
				const t = e.changedTouches[0];
				if (!t) return;
				const pos = this.getMousePos(t.clientX, t.clientY);

				this.touchPoint = {
					point: pos,
					time: Date.now(),
				};

				setTimeout(() => {
					if (this.touchPoint !== null) {
						this.app.startUserTouch(pos);
					}
				}, this.swipeTimeout);

				if (!this.app.getSettings().mobileScrollSupport) e.preventDefault();
			}
		}
	};

	private readonly onMouseUp = (e: MouseEvent): void => {
		const pos = this.getMousePos(e.clientX, e.clientY);
		this.app.userStop(pos);
	};

	private readonly onMouseMove = (e: MouseEvent): void => {
		const pos = this.getMousePos(e.clientX, e.clientY);
		this.app.userMove(pos, false);
	};

	private readonly onTouchMove = (e: TouchEvent): void => {
		if (e.changedTouches.length > 0) {
			const t = e.changedTouches[0];
			if (!t) return;
			const pos = this.getMousePos(t.clientX, t.clientY);

			if (this.app.getSettings().mobileScrollSupport) {
				if (this.touchPoint !== null) {
					if (
						Math.abs(this.touchPoint.point.x - pos.x) > 10 ||
						this.app.getState() !== FlippingState.READ
					) {
						if (e.cancelable) this.app.userMove(pos, true);
					}
				}

				if (this.app.getState() !== FlippingState.READ) {
					e.preventDefault();
				}
			} else {
				this.app.userMove(pos, true);
			}
		}
	};

	private readonly onTouchEnd = (e: TouchEvent): void => {
		if (e.changedTouches.length > 0) {
			const t = e.changedTouches[0];
			if (!t) return;
			const pos = this.getMousePos(t.clientX, t.clientY);
			let isSwipe = false;

			if (this.touchPoint !== null) {
				const dx = pos.x - this.touchPoint.point.x;
				const distY = Math.abs(pos.y - this.touchPoint.point.y);

				if (
					Math.abs(dx) > this.swipeDistance &&
					distY < this.swipeDistance * 2 &&
					Date.now() - this.touchPoint.time < this.swipeTimeout
				) {
					const halfH = this.app.getRender().getRect().height / 2;
					if (dx > 0) {
						this.app.flipPrev(
							this.touchPoint.point.y < halfH ? FlipCorner.TOP : FlipCorner.BOTTOM,
						);
					} else {
						this.app.flipNext(
							this.touchPoint.point.y < halfH ? FlipCorner.TOP : FlipCorner.BOTTOM,
						);
					}
					isSwipe = true;
				}

				this.touchPoint = null;
			}

			this.app.userStop(pos, isSwipe);
		}
	};
}
