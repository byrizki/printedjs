import { Orientation, Render } from "../Render/Render.js";
import { Page, PageDensity } from "../Page/Page.js";
import type { PageFlip } from "../PageFlip.js";
import { FlipDirection } from "../Flip/Flip.js";

type NumberArray = number[];

/**
 * Class representing a collection of pages
 */
export abstract class PageCollection {
	protected readonly app: PageFlip;
	protected readonly render: Render;
	protected readonly isShowCover: boolean;

	/** Pages List */
	protected pages: Page[] = [];
	/** Index of the current page in list */
	protected currentPageIndex = 0;

	/** Number of the current spread in book */
	protected currentSpreadIndex = 0;
	/** Two-page spread in landscape mode */
	protected landscapeSpread: NumberArray[] = [];
	/** One-page spread in portrait mode */
	protected portraitSpread: NumberArray[] = [];

	protected constructor(app: PageFlip, render: Render) {
		this.render = render;
		this.app = app;

		this.currentPageIndex = 0;
		this.isShowCover = this.app.getSettings().showCover;
	}

	public abstract load(): void;

	public destroy(): void {
		this.pages = [];
	}

	protected createSpread(): void {
		this.landscapeSpread = [];
		this.portraitSpread = [];

		for (let i = 0; i < this.pages.length; i++) {
			this.portraitSpread.push([i]);
		}

		let start = 0;

		if (this.isShowCover) {
			this.pages[0]?.setDensity(PageDensity.HARD);
			this.landscapeSpread.push([start]);
			start++;
		}

		for (let i = start; i < this.pages.length; i += 2) {
			if (i < this.pages.length - 1) {
				this.landscapeSpread.push([i, i + 1]);
			} else {
				this.landscapeSpread.push([i]);
				this.pages[i]?.setDensity(PageDensity.HARD);
			}
		}
	}

	public getSpread(): NumberArray[] {
		return this.render.getOrientation() === Orientation.LANDSCAPE
			? this.landscapeSpread
			: this.portraitSpread;
	}

	public getSpreadIndexByPage(pageNum: number): number | null {
		const spread = this.getSpread();

		for (let i = 0; i < spread.length; i++) {
			const s = spread[i];

			if (s && (pageNum === s[0] || pageNum === s[1])) return i;
		}

		return null;
	}

	public getPageCount(): number {
		return this.pages.length;
	}

	public getPages(): Page[] {
		return this.pages;
	}

	public getPage(pageIndex: number): Page {
		if (pageIndex >= 0 && pageIndex < this.pages.length) {
			const page = this.pages[pageIndex];

			if (page) return page;
		}

		throw new Error("Invalid page number");
	}

	public nextBy(current: Page): Page | null {
		const idx = this.pages.indexOf(current);

		if (idx < this.pages.length - 1) return this.pages[idx + 1] ?? null;

		return null;
	}

	public prevBy(current: Page): Page | null {
		const idx = this.pages.indexOf(current);

		if (idx > 0) return this.pages[idx - 1] ?? null;

		return null;
	}

	public getFlippingPage(direction: FlipDirection): Page | null {
		const current = this.currentSpreadIndex;

		if (this.render.getOrientation() === Orientation.PORTRAIT) {
			if (direction === FlipDirection.FORWARD) {
				const page = this.pages[current];

				return page ? page.newTemporaryCopy() : null;
			}

			return this.pages[current - 1] ?? null;
		}

		const spreads = this.getSpread();

		const spread =
			direction === FlipDirection.FORWARD ? spreads[current + 1] : spreads[current - 1];

		if (!spread) return null;

		if (spread.length === 1) {
			return this.pages[spread[0]!] ?? null;
		}

		return direction === FlipDirection.FORWARD
			? (this.pages[spread[0]!] ?? null)
			: (this.pages[spread[1]!] ?? null);
	}

	public getBottomPage(direction: FlipDirection): Page | null {
		const current = this.currentSpreadIndex;

		if (this.render.getOrientation() === Orientation.PORTRAIT) {
			if (direction === FlipDirection.FORWARD) return this.pages[current + 1] ?? null;
			const page = this.pages[current];

			return page ? page.newTemporaryCopy() : null;
		}

		const spreads = this.getSpread();

		const spread =
			direction === FlipDirection.FORWARD ? spreads[current + 1] : spreads[current - 1];

		if (!spread) return null;

		if (spread.length === 1) return this.pages[spread[0]!] ?? null;

		return direction === FlipDirection.FORWARD
			? (this.pages[spread[1]!] ?? null)
			: (this.pages[spread[0]!] ?? null);
	}

	public showNext(): void {
		if (this.currentSpreadIndex < this.getSpread().length - 1) {
			this.currentSpreadIndex++;
			this.showSpread();
		}
	}

	public showPrev(): void {
		if (this.currentSpreadIndex > 0) {
			this.currentSpreadIndex--;
			this.showSpread();
		}
	}

	public getCurrentPageIndex(): number {
		return this.currentPageIndex;
	}

	public show(pageNum = 0): void {
		if (pageNum < 0 || pageNum >= this.pages.length) return;

		const spreadIndex = this.getSpreadIndexByPage(pageNum);

		if (spreadIndex !== null) {
			this.currentSpreadIndex = spreadIndex;
			this.showSpread();
		}
	}

	public getCurrentSpreadIndex(): number {
		return this.currentSpreadIndex;
	}

	public setCurrentSpreadIndex(newIndex: number): void {
		if (newIndex >= 0 && newIndex < this.getSpread().length) {
			this.currentSpreadIndex = newIndex;
		} else {
			throw new Error("Invalid page");
		}
	}

	public currentPage(): Page | null {
		return this.pages[this.currentPageIndex] ?? null;
	}

	public showSpread(): void {
		const spread = this.getSpread()[this.currentSpreadIndex];

		if (!spread) return;

		if (spread.length === 2) {
			this.render.setLeftPage(this.pages[spread[0]!] ?? null);
			this.render.setRightPage(this.pages[spread[1]!] ?? null);
		} else {
			if (this.render.getOrientation() === Orientation.LANDSCAPE) {
				if (spread[0] === this.pages.length - 1 && this.pages.length > 1) {
					this.render.setLeftPage(this.pages[spread[0]!] ?? null);
					this.render.setRightPage(null);
				} else {
					this.render.setLeftPage(null);
					this.render.setRightPage(this.pages[spread[0]!] ?? null);
				}
			} else {
				this.render.setLeftPage(null);
				this.render.setRightPage(this.pages[spread[0]!] ?? null);
			}
		}

		this.currentPageIndex = spread[0]!;
		this.app.updatePageIndex(this.currentPageIndex);
	}
}
