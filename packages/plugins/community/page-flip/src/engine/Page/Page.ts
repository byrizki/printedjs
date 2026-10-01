import type { Render } from "../Render/Render.js";
import type { Point } from "../BasicTypes.js";

/**
 * State of the page on the basis of which rendering
 */
export interface PageState {
	/** Page rotation angle */
	angle: number;

	/** Page scope */
	area: Point[];

	/** Page position */
	position: Point;

	/** Rotate angle for hard pages */
	hardAngle: number;

	/** Rotate angle for hard pages at rendering time */
	hardDrawingAngle: number;
}

export const enum PageOrientation {
	/** Left side page */
	LEFT,

	/** Right side page */
	RIGHT,
}

export const enum PageDensity {
	SOFT = "soft",
	HARD = "hard",
}

/**
 * Class representing a book page
 */
export abstract class Page {
	/** State of the page on the basis of which rendering */
	protected state: PageState;
	/** Render object */
	protected render: Render;

	/** Page Orientation */
	protected orientation: PageOrientation = PageOrientation.LEFT;

	/** Density at creation */
	protected createdDensity: PageDensity;
	/** Density at the time of rendering (Depends on neighboring pages) */
	protected nowDrawingDensity: PageDensity;

	protected constructor(render: Render, density: PageDensity) {
		this.state = {
			angle: 0,
			area: [],
			position: { x: 0, y: 0 },
			hardAngle: 0,
			hardDrawingAngle: 0,
		};

		this.createdDensity = density;
		this.nowDrawingDensity = this.createdDensity;

		this.render = render;
	}

	/**
	 * Render static page
	 */
	public abstract simpleDraw(orient: PageOrientation): void;

	/**
	 * Render dynamic page, using state
	 */
	public abstract draw(tempDensity?: PageDensity): void;

	/**
	 * Page loading
	 */
	public abstract load(): void;

	/**
	 * Set a constant page density
	 */
	public setDensity(density: PageDensity): void {
		this.createdDensity = density;
		this.nowDrawingDensity = density;
	}

	/**
	 * Set temp page density to next render
	 */
	public setDrawingDensity(density: PageDensity): void {
		this.nowDrawingDensity = density;
	}

	/**
	 * Set page position
	 */
	public setPosition(pagePos: Point): void {
		this.state.position = pagePos;
	}

	/**
	 * Set page angle
	 */
	public setAngle(angle: number): void {
		this.state.angle = angle;
	}

	/**
	 * Set page crop area
	 */
	public setArea(area: Point[]): void {
		this.state.area = area;
	}

	/**
	 * Rotate angle for hard pages to next render
	 */
	public setHardDrawingAngle(angle: number): void {
		this.state.hardDrawingAngle = angle;
	}

	/**
	 * Rotate angle for hard pages
	 */
	public setHardAngle(angle: number): void {
		this.state.hardAngle = angle;
		this.state.hardDrawingAngle = angle;
	}

	/**
	 * Set page orientation
	 */
	public setOrientation(orientation: PageOrientation): void {
		this.orientation = orientation;
	}

	/**
	 * Get temp page density
	 */
	public getDrawingDensity(): PageDensity {
		return this.nowDrawingDensity;
	}

	/**
	 * Get a constant page density
	 */
	public getDensity(): PageDensity {
		return this.createdDensity;
	}

	/**
	 * Get rotate angle for hard pages
	 */
	public getHardAngle(): number {
		return this.state.hardAngle;
	}

	public abstract newTemporaryCopy(): Page;
	public abstract getTemporaryCopy(): Page | null;
	public abstract hideTemporaryCopy(): void;
}
