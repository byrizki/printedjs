import { Page, PageDensity, PageOrientation } from "./Page.js";
import type { Render } from "../Render/Render.js";
import { Helper } from "../Helper.js";
import { FlipDirection } from "../Flip/Flip.js";
import type { Point } from "../BasicTypes.js";

/**
 * Class representing a book page as a HTML Element
 */
export class HTMLPage extends Page {
	private readonly element: HTMLElement;
	private copiedElement: HTMLElement | null = null;
	private temporaryCopy: Page | null = null;
	private isLoad = false;

	constructor(render: Render, element: HTMLElement, density: PageDensity) {
		super(render, density);

		this.element = element;
		this.element.classList.add("stf__item");
		this.element.classList.add("--" + density);
	}

	public newTemporaryCopy(): Page {
		if (this.nowDrawingDensity === PageDensity.HARD) {
			return this;
		}

		if (this.temporaryCopy === null) {
			this.copiedElement = this.element.cloneNode(true) as HTMLElement;
			this.copiedElement.setAttribute("data-flip-clone", "true");
			if (this.element.parentElement) {
				this.element.parentElement.appendChild(this.copiedElement);
			}

			this.temporaryCopy = new HTMLPage(
				this.render,
				this.copiedElement,
				this.nowDrawingDensity,
			);
		}

		return this.getTemporaryCopy()!;
	}

	public getTemporaryCopy(): Page | null {
		return this.temporaryCopy;
	}

	public hideTemporaryCopy(): void {
		if (this.temporaryCopy !== null) {
			this.copiedElement?.remove();
			this.copiedElement = null;
			this.temporaryCopy = null;
		}
	}

	public draw(tempDensity?: PageDensity): void {
		const density = tempDensity ? tempDensity : this.nowDrawingDensity;

		const pagePos = this.render.convertToGlobal(this.state.position);
		const pageWidth = this.render.getRect().pageWidth;
		const pageHeight = this.render.getRect().height;

		this.element.classList.remove("--simple");

		if (density === PageDensity.HARD) {
			this.drawHard(pageWidth, pageHeight);
		} else {
			this.drawSoft(pagePos, pageWidth, pageHeight);
		}
	}

	private applyCommonStyle(pageWidth: number, pageHeight: number): void {
		const s = this.element.style;
		s.position = "absolute";
		s.display = "block";
		s.left = "0px";
		s.top = "0px";
		s.width = `${pageWidth}px`;
		s.height = `${pageHeight}px`;
	}

	private drawHard(pageWidth: number, pageHeight: number): void {
		const pos = this.render.getRect().left + this.render.getRect().width / 2;
		const angle = this.state.hardDrawingAngle;

		this.applyCommonStyle(pageWidth, pageHeight);
		const s = this.element.style;
		s.backfaceVisibility = "hidden";
		s.setProperty("-webkit-backface-visibility", "hidden");
		s.clipPath = "none";
		s.setProperty("-webkit-clip-path", "none");

		if (this.orientation === PageOrientation.LEFT) {
			s.transformOrigin = `${this.render.getRect().pageWidth}px 0`;
			s.transform = `translate3d(0, 0, 0) rotateY(${angle}deg)`;
		} else {
			s.transformOrigin = "0 0";
			s.transform = `translate3d(${pos}px, 0, 0) rotateY(${angle}deg)`;
		}
	}

	private drawSoft(position: Point, pageWidth: number, pageHeight: number): void {
		let polygon = "polygon( ";
		for (const p of this.state.area) {
			if (p !== null) {
				let g =
					this.render.getDirection() === FlipDirection.BACK
						? {
								x: -p.x + this.state.position.x,
								y: p.y - this.state.position.y,
							}
						: {
								x: p.x - this.state.position.x,
								y: p.y - this.state.position.y,
							};

				g = Helper.GetRotatedPoint(g, { x: 0, y: 0 }, this.state.angle);
				polygon += g.x + "px " + g.y + "px, ";
			}
		}
		polygon = polygon.slice(0, -2);
		polygon += ")";

		this.applyCommonStyle(pageWidth, pageHeight);
		const s = this.element.style;
		s.transformOrigin = "0 0";
		s.clipPath = polygon;
		s.setProperty("-webkit-clip-path", polygon);

		if (this.render.isSafari() && this.state.angle === 0) {
			s.transform = `translate(${position.x}px, ${position.y}px)`;
		} else {
			s.transform = `translate3d(${position.x}px, ${position.y}px, 0) rotate(${this.state.angle}rad)`;
		}
	}

	public simpleDraw(orient: PageOrientation): void {
		const rect = this.render.getRect();
		const pageWidth = rect.pageWidth;
		const pageHeight = rect.height;
		const x = orient === PageOrientation.RIGHT ? rect.left + rect.pageWidth : rect.left;
		const y = rect.top;

		this.element.classList.add("--simple");
		const s = this.element.style;
		s.position = "absolute";
		s.display = "block";
		s.height = `${pageHeight}px`;
		s.left = `${x}px`;
		s.top = `${y}px`;
		s.width = `${pageWidth}px`;
		s.zIndex = String(this.render.getSettings().startZIndex + 1);
		s.transform = "";
		s.clipPath = "";
		s.removeProperty("-webkit-clip-path");
		s.removeProperty("-webkit-transform");
	}

	public getElement(): HTMLElement {
		return this.element;
	}

	public load(): void {
		this.isLoad = true;
	}

	public override setOrientation(orientation: PageOrientation): void {
		super.setOrientation(orientation);
		this.element.classList.remove("--left", "--right");
		this.element.classList.add(
			orientation === PageOrientation.RIGHT ? "--right" : "--left",
		);
	}

	public override setDrawingDensity(density: PageDensity): void {
		this.element.classList.remove("--soft", "--hard");
		this.element.classList.add("--" + density);
		super.setDrawingDensity(density);
	}
}
